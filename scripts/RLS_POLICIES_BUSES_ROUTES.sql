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
      SELECT 1 FROM public.routes WHERE public.routes.id = public.route_stops.route_id AND public.routes.is_active = TRUE
    )
  );

-- Admins can do all operations on route_stops
CREATE POLICY "prod_route_stops_admin_manage"
  ON public.route_stops
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));
