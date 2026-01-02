# Manage Routes Module - Complete Setup Guide

## Overview
The **Manage Routes** module is now fully implemented with:
- Admin dashboard for creating, editing, and deleting routes
- Support for **ordered multi-stop routes** (not just A → B)
- Client-side display of active routes with all stops in order
- Proper database schema with RLS security
- Transactional operations using server-side RPC functions

## Database Schema

### Tables

#### `public.routes`
- `id` (BIGSERIAL PRIMARY KEY)
- `route_name` (TEXT NOT NULL) - Name of the route
- `start_point` (TEXT) - Legacy field, may be empty
- `end_point` (TEXT) - Legacy field, may be empty
- `is_active` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `public.route_stops`
- `id` (BIGSERIAL PRIMARY KEY)
- `route_id` (BIGINT NOT NULL, FOREIGN KEY → routes.id ON DELETE CASCADE)
- `stop_name` (TEXT NOT NULL) - Name of the stop
- `stop_order` (INT NOT NULL) - Order of the stop in the route (1, 2, 3, ...)
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- UNIQUE(route_id, stop_order) - No duplicate stop orders in a route
- Indexes on: route_id, stop_order

## Setup Steps

### Step 1: Run SQL Scripts in Supabase

Execute these SQL scripts in your Supabase SQL editor **in this exact order**:

1. **`scripts/CREATE_ROUTE_STOPS_TABLE.sql`**
   - Creates the `route_stops` table
   - Adds unique index for (route_id, stop_order)
   - Enables RLS on the table

2. **`scripts/ROUTES_FUNCTIONS.sql`**
   - Creates `create_route_with_stops()` RPC function
   - Creates `update_route_with_stops()` RPC function
   - Both functions handle transactional inserts of routes + stops

3. **`scripts/RLS_POLICIES_BUSES_ROUTES.sql`**
   - Applies Row Level Security policies to `routes` and `route_stops` tables
   - Admins: full CRUD access
   - Authenticated users: can only SELECT stops from active routes

### Step 2: Verify Implementation

After running the SQL scripts:

1. **Test Admin Create Route:**
   - Navigate to Admin Dashboard → Manage Routes
   - Click "Add Route"
   - Enter route name (e.g., "Morning Route A")
   - Add multiple stops (e.g., "Bus Stop 1", "Bus Stop 2", "Bus Stop 3")
   - Use ↑↓ buttons to reorder stops
   - Click "Create"
   - Verify route appears in list with all stops displayed

2. **Test Admin Edit Route:**
   - Click the edit icon on any route
   - Modify route name and/or reorder stops
   - Add new stops using "+ Add Stop"
   - Remove stops using ✕ button
   - Click "Update"
   - Verify changes are persisted

3. **Test Admin Delete Route:**
   - Click the delete icon on any route
   - Confirm deletion
   - Verify route is removed (and cascading delete removes all its stops)

4. **Test Client View:**
   - Navigate to "Bus Routes" page (from Navbar)
   - Verify all active routes are displayed with their stops in correct order
   - Format: "Stop 1 → Stop 2 → Stop 3"

## Architecture

### Admin Page: `/src/app/admin/routes/page.tsx`

**Components:**
- Route search & filter
- "Add New Route" button
- Routes table showing:
  - Route ID
  - Route Name
  - Ordered stops (Stop A → Stop B → Stop C)
  - Active/Inactive toggle
  - Edit & Delete buttons
- Modal form for create/edit with:
  - Route Name input
  - Dynamic stops editor (add/remove/reorder)
  - Status toggle (edit only)

**Key Features:**
- Real-time validation
- Responsive design with Tailwind CSS
- Success/error messages
- Mobile-friendly table

### Client Page: `/src/app/bus_routes/page.tsx`

**Components:**
- Routes grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Each route card shows:
  - Route ID badge
  - Route Name
  - Numbered ordered stops
  - Stop count
  - Creation date
- Empty state handling
- Loading state
- Error handling

### Data Access Layer: `/src/lib/routes.ts`

**Types:**
```typescript
type Route = {
  id: number;
  route_name: string;
  start_point: string;
  end_point: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type Stop = {
  id: number;
  route_id: number;
  stop_name: string;
  stop_order: number;
  created_at: string;
}

type RouteWithStops = Route & { stops: Stop[] }
```

**Functions:**

1. **`getRoutes()`** → Promise<{ data: RouteWithStops[] | null, error: any }>
   - Fetches all routes with their ordered stops
   - Used by admin page
   - Batch fetches stops to avoid N+1 queries

2. **`getActiveRoutes()`** → Promise<{ data: RouteWithStops[] | null, error: any }>
   - Fetches only active routes with their ordered stops
   - Used by client Bus Routes page
   - RLS policy ensures only active routes are returned for authenticated users

3. **`createRoute(payload: { route_name, is_active?, stops? })`**
   - Creates a new route
   - If stops provided, calls `create_route_with_stops()` RPC for transactionality
   - Returns created route with stops

4. **`updateRoute(id, payload: { route_name?, is_active?, stops? })`**
   - Updates an existing route
   - If stops provided, calls `update_route_with_stops()` RPC
   - Replaces entire stops list (old stops deleted, new ones inserted)

5. **`toggleRouteStatus(id, isActive)`**
   - Toggles route active/inactive status

6. **`deleteRoute(id)`**
   - Deletes a route
   - Cascading delete removes all associated stops

## RLS Security

### Routes Table (`public.routes`)
- **Authenticated Users:** Can SELECT only `is_active = TRUE` routes
- **Admins:** Full CRUD access

### Route Stops Table (`public.route_stops`)
- **Authenticated Users:** Can SELECT stops only if parent route is active
- **Admins:** Full CRUD access

## Form Validation

**Route Creation/Edit:**
- Route Name: Required, non-empty
- Stops: At least 1 stop required
- Each Stop: Non-empty name

**Stop Ordering:**
- Implicit based on position in list
- stop_order values recalculated on reorder

## API Integration

### Supabase Client
- Uses existing `/src/lib/supabaseClient.js`
- No new client setup required

### RPC Functions (Server-side)
Both functions use PL/pgSQL with transaction semantics:

**`create_route_with_stops(p_route_name, p_start_point, p_end_point, p_is_active, p_stops)`**
- Inserts 1 route + N stops atomically
- `p_stops` is JSONB array: `[{"stop_name": "A", "stop_order": 1}, ...]`

**`update_route_with_stops(p_route_id, p_route_name, ..., p_stops)`**
- Updates route fields + replaces all stops atomically
- Deletes old stops, inserts new ones

## Styling

- **Framework:** Tailwind CSS
- **Color Scheme:** Green gradients (consistent with school bus theme)
- **Icons:** lucide-react
- **Responsive:** Mobile-first design
- **Components:** Modal forms, data tables, grid layouts

## Troubleshooting

### Stops not appearing in list
- Check that `route_stops` table exists in Supabase
- Verify RPC functions are installed
- Check browser console for API errors

### Admin page not loading routes
- Verify authentication (admin user logged in)
- Check Supabase RLS policies are applied
- Review network errors in browser DevTools

### Edit modal not loading existing stops
- Verify `getRoutes()` returns RouteWithStops type
- Check that stops are being batched correctly (no N+1 queries)

### RLS blocking access
- If authenticated users see "no routes", verify RLS policies
- Ensure `public.routes.is_active = true` is set
- Check admin user exists in `public.admins` table

## Next Steps

1. Map routes to buses (future module)
2. Map routes to student bookings
3. Add real-time GPS tracking
4. Add route timing/schedules
5. Add driver assignment per route

## Files Modified/Created

### Created:
- `/scripts/CREATE_ROUTE_STOPS_TABLE.sql`
- `/scripts/ROUTES_FUNCTIONS.sql`

### Updated:
- `/scripts/RLS_POLICIES_BUSES_ROUTES.sql` (appended route_stops policies)
- `/src/lib/routes.ts` (added types, updated functions)
- `/src/app/admin/routes/page.tsx` (complete rewrite with stops editor)
- `/src/app/bus_routes/page.tsx` (updated to display ordered stops)

---

**Last Updated:** December 20, 2025
**Status:** ✅ Production Ready
