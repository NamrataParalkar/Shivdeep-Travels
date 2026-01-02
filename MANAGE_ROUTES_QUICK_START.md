# Manage Routes - Quick Start for Developers

## 🚀 5-Minute Setup

### Step 1: Deploy SQL (2 min)

Open Supabase SQL Editor and paste these **in order**:

**1️⃣ CREATE TABLE:**
```sql
CREATE TABLE IF NOT EXISTS public.route_stops (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  stop_order INT NOT NULL CHECK (stop_order > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_route_stops_unique_order ON public.route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON public.route_stops(route_id);
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
```

**2️⃣ CREATE FUNCTIONS:**
- Copy full content from `scripts/ROUTES_FUNCTIONS.sql`
- Paste into Supabase SQL Editor
- Execute

**3️⃣ APPLY RLS:**
- Copy full content from `scripts/RLS_POLICIES_BUSES_ROUTES.sql`
- Paste into Supabase SQL Editor
- Execute

### Step 2: Test the App (3 min)

**As Admin:**
1. Go to Admin Dashboard
2. Click "Manage Routes"
3. Click "+ Add Route"
4. Enter: Route Name = "Test Route"
5. Click "+ Add Stop"
6. Enter: Stop 1 = "Stop A"
7. Click "+ Add Stop"
8. Enter: Stop 2 = "Stop B"
9. Click "Create"
10. ✅ Route appears in table

**As User:**
1. Go to "Bus Routes" from nav
2. ✅ See route with ordered stops: "Stop A → Stop B"

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/lib/routes.ts` | Data access (getRoutes, createRoute, etc.) |
| `src/app/admin/routes/page.tsx` | Admin UI (create/edit/delete/reorder) |
| `src/app/bus_routes/page.tsx` | Client UI (display active routes) |
| `scripts/CREATE_ROUTE_STOPS_TABLE.sql` | DB schema |
| `scripts/ROUTES_FUNCTIONS.sql` | RPC functions |
| `scripts/RLS_POLICIES_BUSES_ROUTES.sql` | Security policies |

---

## 🛠️ API Reference

### Data Types

```typescript
type Stop = {
  id?: number;
  route_id?: number;
  stop_name: string;
  stop_order: number;
  created_at?: string;
}

type RouteWithStops = Route & { stops: Stop[] }
```

### Functions

```typescript
// Get all routes with stops
getRoutes() → Promise<{ data: RouteWithStops[], error }>

// Get only active routes
getActiveRoutes() → Promise<{ data: RouteWithStops[], error }>

// Create route with stops
createRoute({
  route_name: string,
  is_active?: boolean,
  stops?: { stop_name: string, stop_order: number }[]
}) → Promise<{ data: RouteWithStops, error }>

// Update route with stops
updateRoute(id: number, {
  route_name?: string,
  is_active?: boolean,
  stops?: { stop_name: string, stop_order: number }[]
}) → Promise<{ data: RouteWithStops, error }>

// Toggle status
toggleRouteStatus(id: number, isActive: boolean) → Promise<{ data: Route, error }>

// Delete route (cascades stops)
deleteRoute(id: number) → Promise<{ success: boolean, error }>
```

---

## 🧪 Quick Test

### Test Create Route
```typescript
import { createRoute } from '@/lib/routes';

const result = await createRoute({
  route_name: 'Morning Route',
  is_active: true,
  stops: [
    { stop_name: 'Stop A', stop_order: 1 },
    { stop_name: 'Stop B', stop_order: 2 },
    { stop_name: 'Stop C', stop_order: 3 }
  ]
});

if (result.error) console.error('Error:', result.error);
if (result.data) console.log('Created:', result.data);
```

### Test Get Routes
```typescript
import { getRoutes } from '@/lib/routes';

const result = await getRoutes();

if (result.data) {
  result.data.forEach(route => {
    console.log(`${route.route_name}`);
    route.stops.forEach(stop => {
      console.log(`  - ${stop.stop_order}. ${stop.stop_name}`);
    });
  });
}
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Table route_stops does not exist" | Run Step 1 SQL (CREATE TABLE) |
| "Function create_route_with_stops does not exist" | Run Step 2 SQL (CREATE FUNCTIONS) |
| "Permission denied" | Check RLS policies (Step 3) |
| Stops not showing in list | Verify batch loading in getRoutes() |
| Edit modal empty | Check stops are being loaded correctly |
| "Foreign key constraint" | Ensure routes table exists first |

---

## 📱 UI Component Quick Reference

### Admin Page Structure

```tsx
// Header with search & add button
<header>
  <Search routes... />
  <Button>+ Add Route</Button>
</header>

// Routes table
<table>
  <th>Route ID | Route Name | Stops | Status | Actions</th>
  {routes.map(route => (
    <tr>
      <td>#{route.id}</td>
      <td>{route.route_name}</td>
      <td>{route.stops.map(s => s.stop_name).join(' → ')}</td>
      <td><ToggleButton /></td>
      <td><EditBtn /> <DeleteBtn /></td>
    </tr>
  ))}
</table>

// Modal for create/edit
<Modal>
  <Input placeholder="Route name" />
  <div>
    <Button>+ Add Stop</Button>
    {stops.map((stop, idx) => (
      <div key={idx}>
        <Input value={stop.stop_name} />
        <Button onClick={moveUp}>↑</Button>
        <Button onClick={moveDown}>↓</Button>
        <Button onClick={remove}>✕</Button>
      </div>
    ))}
  </div>
  <Button>Create/Update</Button>
</Modal>
```

### Client Page Structure

```tsx
// Routes grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {routes.map(route => (
    <Card>
      <Badge>Route #{route.id}</Badge>
      <h3>{route.route_name}</h3>
      <div>
        {route.stops.map((stop, idx) => (
          <div key={idx}>
            <Circle>{idx + 1}</Circle>
            <span>{stop.stop_name}</span>
            {idx < route.stops.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
      <span>{route.stops.length} Stops</span>
    </Card>
  ))}
</div>
```

---

## 🔑 Form Validation Rules

### Route Name
- ✅ Required
- ✅ Non-empty string
- ❌ Empty or whitespace

### Stops Array
- ✅ Minimum 1 stop
- ✅ Each stop must have non-empty stop_name
- ✅ stop_order auto-set by position (1, 2, 3...)
- ❌ Empty stops array not allowed

### Stop Reordering
- ✅ Up button moves stop up (swap with previous)
- ✅ Down button moves stop down (swap with next)
- ✅ stop_order recalculated after each swap
- ❌ First stop cannot move up
- ❌ Last stop cannot move down

---

## 🔐 Security Checklist

- [x] Admin page checks user.role === 'admin'
- [x] Client page filters to is_active = TRUE
- [x] RLS prevents non-admins from seeing inactive routes
- [x] RLS prevents non-admins from seeing stops of inactive routes
- [x] Transactional operations prevent partial updates
- [x] Cascading delete removes orphaned stops
- [x] Input validation on client and database

---

## 📊 Database Schema Summary

```sql
-- Routes (existing, unchanged)
routes (
  id, route_name, start_point, end_point,
  is_active, created_at, updated_at
)

-- New: Ordered stops
route_stops (
  id, route_id, stop_name, stop_order, created_at
  FOREIGN KEY (route_id) → routes(id) ON DELETE CASCADE
  UNIQUE (route_id, stop_order)
)

-- RPC Functions
create_route_with_stops(
  p_route_name, p_start_point, p_end_point,
  p_is_active, p_stops: jsonb
)

update_route_with_stops(
  p_route_id, p_route_name, p_start_point, p_end_point,
  p_is_active, p_stops: jsonb
)
```

---

## 🎯 Feature Matrix

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Route Name | ✅ | ✅ | ✅ | — |
| Route Status | ✅ | ✅ | ✅ | — |
| Add Stops | ✅ | ✅ | ✅ | — |
| Remove Stops | — | — | ✅ | — |
| Reorder Stops | ✅ | ✅ | ✅ | — |
| View Route | — | ✅ | — | — |
| Delete Route | — | — | — | ✅ |
| Delete Stops (cascade) | — | — | — | ✅ |

---

## 🚀 Deployment Checklist

- [ ] SQL scripts executed in Supabase (all 3 steps)
- [ ] Tables exist: routes, route_stops
- [ ] Functions exist: create_route_with_stops, update_route_with_stops
- [ ] RLS policies applied
- [ ] Admin page accessible at /admin/routes
- [ ] Client page accessible at /bus_routes
- [ ] Create route: works end-to-end
- [ ] Edit route: works end-to-end
- [ ] Delete route: cascades to stops
- [ ] Mobile responsive: tested
- [ ] Error handling: verified

---

## 📚 Related Documentation

- **Full Setup Guide:** `MANAGE_ROUTES_SETUP.md`
- **UI Walkthrough:** `MANAGE_ROUTES_UI_WALKTHROUGH.md`
- **Deployment Steps:** `SQL_DEPLOYMENT_GUIDE.md`
- **Complete Overview:** `MANAGE_ROUTES_COMPLETE.md`

---

**Version:** 1.0 (Production)  
**Last Updated:** December 20, 2025  
**Status:** ✅ Ready to Use
