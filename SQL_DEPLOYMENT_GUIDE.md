# Manage Routes - SQL Deployment Steps

## 🚀 Quick Start

Copy and paste these SQL scripts into your Supabase SQL editor **in this exact order**:

---

## Step 1: Create Route Stops Table

**File:** `scripts/CREATE_ROUTE_STOPS_TABLE.sql`

```sql
-- Create route_stops table to store ordered stops for routes

CREATE TABLE IF NOT EXISTS public.route_stops (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  stop_order INT NOT NULL CHECK (stop_order > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: (route_id, stop_order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_stops_unique_order
  ON public.route_stops(route_id, stop_order);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id
  ON public.route_stops(route_id);

CREATE INDEX IF NOT EXISTS idx_route_stops_order
  ON public.route_stops(stop_order);

-- Enable Row Level Security
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
```

**✅ Expected Result:** Table created with 0 rows

---

## Step 2: Create RPC Functions

**File:** `scripts/ROUTES_FUNCTIONS.sql`

```sql
-- SQL functions to create/update routes along with their ordered stops in a transaction

-- Function: create_route_with_stops(route_name text, start_point text, end_point text, is_active boolean, stops jsonb)
-- stops: jsonb array of objects [{"stop_name": "A", "stop_order": 1}, ...]

CREATE OR REPLACE FUNCTION public.create_route_with_stops(
  p_route_name text,
  p_start_point text,
  p_end_point text,
  p_is_active boolean DEFAULT true,
  p_stops jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(id bigint, route_name text, start_point text, end_point text, is_active boolean, created_at timestamptz) AS $$
DECLARE
  r RECORD;
  stop jsonb;
BEGIN
  -- Start transaction block (PL/pgSQL runs in transaction)
  INSERT INTO public.routes(route_name, start_point, end_point, is_active)
  VALUES (p_route_name, p_start_point, p_end_point, p_is_active)
  RETURNING * INTO r;

  -- Insert stops if provided
  IF jsonb_array_length(p_stops) > 0 THEN
    FOR stop IN SELECT * FROM jsonb_array_elements(p_stops)
    LOOP
      INSERT INTO public.route_stops(route_id, stop_name, stop_order)
      VALUES (r.id, (stop->>'stop_name')::text, (stop->>'stop_order')::int);
    END LOOP;
  END IF;

  RETURN QUERY SELECT r.id, r.route_name, r.start_point, r.end_point, r.is_active, r.created_at;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_route_with_stops(route_id bigint, route_name text, start_point text, end_point text, is_active boolean, stops jsonb)
-- This updates route fields and replaces stops atomically

CREATE OR REPLACE FUNCTION public.update_route_with_stops(
  p_route_id bigint,
  p_route_name text,
  p_start_point text,
  p_end_point text,
  p_is_active boolean,
  p_stops jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(id bigint, route_name text, start_point text, end_point text, is_active boolean, updated_at timestamptz) AS $$
DECLARE
  r RECORD;
  stop jsonb;
BEGIN
  UPDATE public.routes
  SET route_name = p_route_name,
      start_point = p_start_point,
      end_point = p_end_point,
      is_active = p_is_active,
      updated_at = now()
  WHERE id = p_route_id
  RETURNING * INTO r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Route with id % not found', p_route_id;
  END IF;

  -- Replace stops: delete existing, then insert new stops provided
  DELETE FROM public.route_stops WHERE route_id = p_route_id;

  IF jsonb_array_length(p_stops) > 0 THEN
    FOR stop IN SELECT * FROM jsonb_array_elements(p_stops)
    LOOP
      INSERT INTO public.route_stops(route_id, stop_name, stop_order)
      VALUES (p_route_id, (stop->>'stop_name')::text, (stop->>'stop_order')::int);
    END LOOP;
  END IF;

  RETURN QUERY SELECT r.id, r.route_name, r.start_point, r.end_point, r.is_active, r.updated_at;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

**✅ Expected Result:** Functions created/updated successfully

---

## Step 3: Apply RLS Policies

**File:** `scripts/RLS_POLICIES_BUSES_ROUTES.sql`

```sql
-- Row Level Security Policies for Buses and Routes Tables
-- These policies ensure proper access control for the School Bus Management System

-- ==================================================================
-- Table: public.buses
-- Goals: Admins have full CRUD access; authenticated users can only view active buses
-- ==================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.buses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "prod_buses_select_authenticated" ON public.buses;
DROP POLICY IF EXISTS "prod_buses_admin_manage" ON public.buses;

-- Authenticated users (students, drivers) can view all buses
CREATE POLICY "prod_buses_select_authenticated"
  ON public.buses
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can do all operations (INSERT, UPDATE, DELETE) on buses
CREATE POLICY "prod_buses_admin_manage"
  ON public.buses
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.routes
-- Goals: Authenticated users can view only active routes; Admins have full access
-- ==================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.routes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "prod_routes_select_active_authenticated" ON public.routes;
DROP POLICY IF EXISTS "prod_routes_admin_manage" ON public.routes;

-- Authenticated users can only view active routes
CREATE POLICY "prod_routes_select_active_authenticated"
  ON public.routes
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Admins can do all operations on routes
CREATE POLICY "prod_routes_admin_manage"
  ON public.routes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.route_stops
-- Goals: Admins have full CRUD access; authenticated users may SELECT stops for active routes
-- ==================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.route_stops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "prod_route_stops_select_active_authenticated" ON public.route_stops;
DROP POLICY IF EXISTS "prod_route_stops_admin_manage" ON public.route_stops;

-- Authenticated users can select stops only when the parent route is active
CREATE POLICY "prod_route_stops_select_active_authenticated"
  ON public.route_stops
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.routes r WHERE r.id = public.route_stops.route_id AND r.is_active = TRUE
    )
  );

-- Admins can do all operations on route_stops
CREATE POLICY "prod_route_stops_admin_manage"
  ON public.route_stops
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));
```

**✅ Expected Result:** RLS policies created/updated successfully

---

## ✅ Verification Steps

After running all three SQL scripts, verify the setup:

### 1. Check table exists
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'route_stops';
```
Expected: 1 row with route_stops table

### 2. Check RPC functions exist
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'create_route_with_stops%' 
   OR routine_name LIKE 'update_route_with_stops%';
```
Expected: 2 rows with both functions

### 3. Check RLS policies exist
```sql
SELECT policyname FROM pg_policies 
WHERE tablename IN ('routes', 'route_stops');
```
Expected: Multiple policies for both tables

### 4. Test creating a route with stops (as admin)
```sql
SELECT * FROM public.create_route_with_stops(
  'Test Route',
  '',
  '',
  true,
  '[{"stop_name": "Stop A", "stop_order": 1}, {"stop_name": "Stop B", "stop_order": 2}]'::jsonb
);
```
Expected: 1 row returned with the new route

---

## 🐛 Troubleshooting

### Issue: "Table route_stops already exists"
**Solution:** This is expected if you're re-running. The `IF NOT EXISTS` clause will skip creation.

### Issue: "Function create_route_with_stops already exists"
**Solution:** Expected. `CREATE OR REPLACE` will update the function.

### Issue: "RLS is not enabled"
**Solution:** The `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement handles this.

### Issue: Foreign key constraint error
**Solution:** Ensure `public.routes` table exists before creating `route_stops`.

### Issue: Policy creation fails with "relation does not exist"
**Solution:** Ensure both `public.routes` and `public.route_stops` tables exist first.

---

## 📋 Deployment Checklist

- [ ] Backup your Supabase database (recommended)
- [ ] Run Step 1: CREATE_ROUTE_STOPS_TABLE.sql
- [ ] Verify: Check table exists and is empty
- [ ] Run Step 2: ROUTES_FUNCTIONS.sql
- [ ] Verify: Functions appear in SQL Editor
- [ ] Run Step 3: RLS_POLICIES_BUSES_ROUTES.sql
- [ ] Verify: Policies appear for all tables
- [ ] Test: Create route from admin UI
- [ ] Test: View routes from client UI
- [ ] Monitor: Check error logs for issues

---

## 🎉 You're Done!

Once all SQL scripts are executed:

1. **Admin Dashboard → Manage Routes** - Ready to create/edit/delete routes with stops
2. **Bus Routes Page** - Ready to display active routes with all their stops in order
3. **Database** - Fully secure with RLS policies
4. **API** - Transactional operations via RPC functions

**Next Steps:**
- Map routes to buses (future module)
- Add real-time GPS tracking
- Implement driver-route assignment
- Add timing/schedules

---

**Last Updated:** December 20, 2025
**Status:** ✅ Ready for Deployment
