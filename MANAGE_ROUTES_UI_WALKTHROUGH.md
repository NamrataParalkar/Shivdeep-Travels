# Manage Routes - UI Walkthrough & Examples

## 🎯 User Interface Overview

### Admin Dashboard → Manage Routes

#### Page Header
```
[← Back Button]  [Manage Routes] (green gradient title)

[Search Routes...     ] [+ Add Route]
```

---

## 📝 Creating a New Route

### Step 1: Click "Add Route" button
Opens modal: **"Add New Route"**

### Step 2: Fill in Route Details

```
┌─────────────────────────────────────┐
│ Add New Route                    [X] │
├─────────────────────────────────────┤
│                                     │
│ Route Name *                        │
│ ┌─────────────────────────────────┐ │
│ │ Morning Route A                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Route Stops *               [+ Add Stop] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 1. [Bus Stop 1       ] [↑][↓][✕]│ │
│ ├─────────────────────────────────┤ │
│ │ 2. [City Center      ] [↑][↓][✕]│ │
│ ├─────────────────────────────────┤ │
│ │ 3. [MITAOE Campus    ] [↑][↓][✕]│ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│ [Cancel]                   [Create] │
└─────────────────────────────────────┘
```

### Step 3: Add Stops

**Click "+ Add Stop"** to add another stop

Each stop shows:
- **Number:** 1., 2., 3., etc. (auto-numbered)
- **Stop Name:** Text input for stop name
- **↑ Button:** Move up (disabled for first stop)
- **↓ Button:** Move down (disabled for last stop)
- **✕ Button:** Remove this stop

### Step 4: Reorder Stops (Optional)

Click **↑** or **↓** buttons to change stop order:
```
Before:
1. Bus Stop 1
2. City Center      ← Click ↑
3. MITAOE Campus

After:
1. Bus Stop 1
2. MITAOE Campus    (moved up)
3. City Center
```

### Step 5: Submit

**Click "Create" button**

**Expected Result:**
✅ Modal closes
✅ Success message: "Route created successfully!"
✅ Routes table updates with new route
✅ All stops appear in correct order

---

## ✏️ Editing an Existing Route

### Step 1: Click Edit Icon (Pencil)

On any route row, click the **pencil icon**

Modal opens: **"Edit Route"** (same as create, but pre-filled)

### Step 2: Modify Route Details

```
├─────────────────────────────────────────────────────┐
│ Edit Route                                       [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Route Name *                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Morning Route A                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Route Stops *                    [+ Add Stop]       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. [Bus Stop 1       ] [↑][↓][✕]                │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 2. [City Center      ] [↑][↓][✕]                │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 3. [MITAOE Campus    ] [↑][↓][✕]                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Status      [Active / Inactive]                     │
│                                                     │
│ [Cancel]                              [Update]     │
└─────────────────────────────────────────────────────┘
```

### Step 3: Changes Allowed

You can:
- ✅ Change route name
- ✅ Add new stops: Click "+ Add Stop"
- ✅ Remove stops: Click **✕** on any stop
- ✅ Reorder stops: Click **↑** or **↓**
- ✅ Toggle status: Click "Active" or "Inactive"

### Step 4: Submit

**Click "Update" button**

**Expected Result:**
✅ Modal closes
✅ Success message: "Route updated successfully!"
✅ Routes table reflects all changes
✅ Stops are in new order (if reordered)

---

## 🗑️ Deleting a Route

### Step 1: Click Delete Icon (Trash)

On any route row, click the **trash icon**

### Step 2: Confirm Deletion

Confirmation dialog appears:
```
"Are you sure you want to delete this route?"
```

### Step 3: Confirm or Cancel

- **OK:** Deletes route AND all its stops
- **Cancel:** Aborts deletion

**Expected Result:**
✅ Modal closes
✅ Success message: "Route deleted successfully!"
✅ Routes table refreshes
✅ Route is removed from list
✅ All associated stops are deleted (CASCADE)

---

## 📊 Routes Table Display

```
┌────────────────────────────────────────────────────────────────┐
│ Route ID | Route Name        | Stops                | Status    │
├────────────────────────────────────────────────────────────────┤
│ #1       | Morning Route A   | Stop A → Stop B →   │ [Active]  │
│          |                   | Stop C              │           │
├────────────────────────────────────────────────────────────────┤
│ #2       | Evening Route     | Point 1 → Point 2   │ [Inactive]│
├────────────────────────────────────────────────────────────────┤
│ #3       | School Run        | School → Area A →   │ [Active]  │
│          |                   | Area B → Area C     │           │
└────────────────────────────────────────────────────────────────┘

[Edit] [Delete]        [Edit] [Delete]        [Edit] [Delete]
```

### Table Columns:

1. **Route ID:** #1, #2, #3, etc. (from database)
2. **Route Name:** Name of the route
3. **Stops:** All stops shown in order with "→" separator
   - Example: "Stop A → Stop B → Stop C"
   - Shows "No stops" if empty
4. **Status:** Active/Inactive toggle button
5. **Actions:** Edit & Delete buttons

### Table Features:

- ✅ Responsive: Scrolls horizontally on mobile
- ✅ Hover effects: Row highlights on hover
- ✅ Sortable: Can sort by column (future feature)
- ✅ Searchable: Filter routes by name via search box
- ✅ Paginated: Shows all routes (pagination future feature)

---

## 🚌 Client Bus Routes Page

### Page Layout

```
Bus Routes
Explore all available bus routes and plan your journey.

┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
│ Route #1               │ │ Route #2               │ │ Route #3               │
│ Morning Route A        │ │ Evening Route          │ │ School Run             │
│                        │ │                        │ │                        │
│ 1. Stop A              │ │ 1. Point 1             │ │ 1. School              │
│ ↓                      │ │ ↓                      │ │ ↓                      │
│ 2. Stop B              │ │ 2. Point 2             │ │ 2. Area A              │
│ ↓                      │ │                        │ │ ↓                      │
│ 3. Stop C              │ │                        │ │ 3. Area B              │
│                        │ │                        │ │ ↓                      │
│ [3 Stops] [Date]       │ │ [2 Stops] [Date]       │ │ 4. Area C              │
└────────────────────────┘ └────────────────────────┘ └────────────────────────┘

3 Routes Available
All routes are currently active and operational...
```

### Card Features:

Each route card shows:
1. **Route ID Badge:** Top-left "Route #1", "Route #2", etc.
2. **Route Name:** Bold, large green text
3. **Numbered Stops:** Each stop in order with number circle
   - Example:
     ```
     ① Stop A
     → (arrow)
     ② Stop B
     → (arrow)
     ③ Stop C
     ```
4. **Stop Count:** Bottom - "[3 Stops]"
5. **Date Created:** Bottom - "[Date in locale format]"

### Card Effects:

- ✅ Hover: Scale up slightly, shadow increases
- ✅ Responsive: 1 col mobile, 2 col tablet, 3 col desktop
- ✅ Mobile-friendly: All text readable on small screens

---

## 🔍 Search & Filter

### Search Routes (Admin Page)

**Search box at top:**
```
[Search Routes...     ]
```

**Searches by:**
- Route name (exact match, case-insensitive)

**Example:**
```
All routes:
- Morning Route A
- Evening Route
- School Run

User types: "morning"

Results:
- Morning Route A
```

---

## ⚠️ Error Handling

### Validation Errors

**Missing Route Name:**
```
Route Name *
[                      ]
❌ Route name is required
```

**Missing Stops:**
```
Route Stops *
┌──────────────────────┐
│ No stops added yet   │
└──────────────────────┘
[+ Add Stop]
❌ At least one stop is required
```

**Empty Stop Name:**
```
┌──────────────────────┐
│ 1. [              ] [↑][↓][✕]
└──────────────────────┘
❌ Stop name is required
```

### API Errors

**Failed to load:**
```
⚠️ Failed to load routes. Please refresh.
```

**Creation failed:**
```
❌ Failed to create route
```

**Update failed:**
```
❌ Failed to update route
```

### Success Messages

**Route created:**
```
✅ Route created successfully!
(auto-dismisses after 3 seconds)
```

**Route updated:**
```
✅ Route updated successfully!
```

**Route deleted:**
```
✅ Route deleted successfully!
```

---

## 💡 Usage Examples

### Example 1: Simple 2-Stop Route

**Name:** "Downtown Express"

**Stops:**
1. Main Station
2. City Mall

**Result:** Morning Route: Main Station → City Mall

---

### Example 2: Multi-Stop Route

**Name:** "Campus Shuttle"

**Stops:**
1. Gate Entrance
2. Auditorium
3. Library
4. Sports Complex
5. Main Gate

**Result:** Campus Shuttle: Gate → Auditorium → Library → Sports → Main Gate

---

### Example 3: Editing a Route

**Original Route #5:**
- Name: "School Run"
- Stops: School → Stop A → Stop B

**Edit Actions:**
1. Add new stop: "Stop C"
2. Reorder: Move "Stop B" up
3. Rename: "School Run - Morning"

**New Route #5:**
- Name: "School Run - Morning"
- Stops: School → Stop B → Stop A → Stop C

---

## 🎨 Color Scheme

**Admin Page:**
- 🟢 Green: Primary (buttons, active badges)
- ⚪ White: Cards, modal background
- 🔵 Blue: Edit button
- 🔴 Red: Delete button, errors
- 🟡 Yellow: Warnings (if applicable)

**Client Page:**
- 🟢 Green: Primary (route cards, borders)
- ⚪ White: Card background
- 🟡 Yellow: Gradients and accents

---

## 📱 Mobile Responsive

### Admin Page (Mobile)

```
[← ]  Manage Routes

[Search...]        [+ Add]

┌──────────────────────────────┐
│ #1 Morning Route A           │
│ Stop A→Stop B→Stop C          │
│ [Active]  [✏️][🗑️]              │
├──────────────────────────────┤
│ #2 Evening Route             │
│ Point 1→Point 2              │
│ [Inactive] [✏️][🗑️]             │
└──────────────────────────────┘
```

### Client Page (Mobile)

```
┌──────────────────────┐
│ Route #1             │
│ Morning Route A      │
│                      │
│ ① Stop A             │
│ ② Stop B             │
│ ③ Stop C             │
│                      │
│ [3 Stops]  [Date]    │
└──────────────────────┘

┌──────────────────────┐
│ Route #2             │
│ Evening Route        │
│                      │
│ ① Point 1            │
│ ② Point 2            │
│                      │
│ [2 Stops]  [Date]    │
└──────────────────────┘
```

---

## 🔐 Permissions

### Admin User
- ✅ View all routes (active & inactive)
- ✅ Create routes
- ✅ Edit routes & stops
- ✅ Toggle active/inactive
- ✅ Delete routes

### Regular User (Student/Driver)
- ✅ View active routes only (via Bus Routes page)
- ✅ View ordered stops
- ❌ Cannot create/edit/delete routes

### Public User
- ❌ Cannot access Bus Routes or Admin pages without login

---

## 🚀 Performance Tips

1. **Batch Loading:** Stops are fetched in single query (no N+1)
2. **Search Optimization:** Filter happens on client-side
3. **Caching:** React state caches routes until user action
4. **Database Indexes:** Indexes on route_id and stop_order for fast queries

---

**Last Updated:** December 20, 2025
**Version:** 1.0 - Production Ready
