# QUICK START GUIDE - Buses & Routes Implementation

## 🚀 How to Use

### 1️⃣ CREATE TABLES IN SUPABASE

**Copy and paste into Supabase SQL Editor** (run in this order):

#### Step 1: Create Buses Table
- Open file: `scripts/CREATE_BUSES_TABLE.sql`
- Copy entire content
- Paste into Supabase SQL Editor
- Click "Run"

#### Step 2: Create Routes Table
- Open file: `scripts/CREATE_ROUTES_TABLE.sql`
- Copy entire content
- Paste into Supabase SQL Editor
- Click "Run"

#### Step 3: Apply RLS Policies
- Open file: `scripts/RLS_POLICIES_BUSES_ROUTES.sql`
- Copy entire content
- Paste into Supabase SQL Editor
- Click "Run"

---

## 📱 ADMIN FEATURES

### Manage Buses (`/admin/buses`)
1. **View All Buses**: Table with bus number, capacity, driver, status
2. **Add Bus**: Click "Add Bus" → Fill form (bus number, capacity, optional driver)
3. **Edit Bus**: Click edit icon → Update details
4. **Change Status**: Click status dropdown → Select (Active/Maintenance/Inactive)
5. **Remove Bus**: Click delete icon → Marks as inactive
6. **Search**: Filter buses by bus number

### Manage Routes (`/admin/routes`)
1. **View All Routes**: Table with route name, start point, end point, status
2. **Add Route**: Click "Add Route" → Fill form (route name, start/end points)
3. **Edit Route**: Click edit icon → Update details
4. **Toggle Status**: Click status button → Activate/Deactivate
5. **Delete Route**: Click delete icon → Removes route
6. **Search**: Filter routes by name or location

---

## 👥 CLIENT-SIDE FEATURES

### Bus Routes Page (`/bus_routes`)
- Shows only ACTIVE routes
- Card-based layout with start → end points
- Mobile responsive
- No admin controls visible
- Real-time data from Supabase

---

## 🔐 SECURITY RULES

### Buses Table
- ✓ Admins: Can create, read, update, delete
- ✓ Users: Can read all buses
- ✓ Status-based soft delete (no hard delete)

### Routes Table
- ✓ Admins: Can create, read, update, delete all routes
- ✓ Users: Can read ONLY active routes (is_active = TRUE)
- ✓ Users cannot see inactive routes

---

## 📁 FILE STRUCTURE

```
src/
  lib/
    buses.ts          ← Bus CRUD functions
    routes.ts         ← Route CRUD functions
  app/
    admin/
      buses/
        page.tsx      ← Admin bus management
      routes/
        page.tsx      ← Admin route management
    bus_routes/
      page.tsx        ← Client bus routes display

scripts/
  CREATE_BUSES_TABLE.sql          ← Create buses table
  CREATE_ROUTES_TABLE.sql         ← Create routes table
  RLS_POLICIES_BUSES_ROUTES.sql   ← Security policies
```

---

## ✨ FEATURES AT A GLANCE

### Buses Module
- ✓ CRUD operations
- ✓ Driver assignment
- ✓ Status management (Active/Maintenance/Inactive)
- ✓ Search functionality
- ✓ Modal forms
- ✓ Error handling
- ✓ Real-time updates

### Routes Module
- ✓ CRUD operations
- ✓ Route management
- ✓ Status toggle (Active/Inactive)
- ✓ Search functionality
- ✓ Modal forms
- ✓ Error handling
- ✓ Real-time updates

### Client-Side Routes
- ✓ Fetch active routes only
- ✓ Card grid layout
- ✓ Route visualization (start → end)
- ✓ Mobile responsive
- ✓ Loading states
- ✓ Error handling
- ✓ No admin controls

---

## 🐛 TESTING CHECKLIST

- [ ] Tables created in Supabase
- [ ] RLS policies applied
- [ ] Admin can add a bus
- [ ] Admin can edit a bus
- [ ] Admin can change bus status
- [ ] Admin can add a route
- [ ] Admin can edit a route
- [ ] Admin can toggle route status
- [ ] Client sees only active routes
- [ ] Client cannot edit routes
- [ ] Search filters work correctly
- [ ] Mobile layout is responsive

---

## 🔗 API ENDPOINTS (Library Functions)

### Buses (`src/lib/buses.ts`)
- `getBuses()` → Get all buses
- `getDriversForAssignment()` → Get drivers for dropdown
- `createBus(payload)` → Create new bus
- `updateBus(id, payload)` → Update bus
- `changeBusStatus(id, status)` → Change status
- `deleteBus(id)` → Soft delete bus

### Routes (`src/lib/routes.ts`)
- `getRoutes()` → Get all routes (admin)
- `getActiveRoutes()` → Get active routes only (client)
- `createRoute(payload)` → Create new route
- `updateRoute(id, payload)` → Update route
- `toggleRouteStatus(id, isActive)` → Toggle active/inactive
- `deleteRoute(id)` → Delete route

---

## 📞 SUPPORT

If you encounter issues:
1. Verify all SQL scripts were run in Supabase
2. Check RLS policies are enabled
3. Verify auth_id field exists in drivers table
4. Check browser console for errors
5. Verify Supabase URL and API key are correct

---

**Ready to deploy! 🎉**
