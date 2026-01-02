# Admin Dashboard - Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN DASHBOARD                           │
│                                                                 │
│  User (Admin) ──→ Authentication Check ──→ Role Validation    │
│                            ↓                                   │
│                      Not Admin/Not Logged?                     │
│                            ↓                                   │
│                    Redirect to /login                          │
└─────────────────────────────────────────────────────────────────┘
                             ↓ (If Admin)
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN DASHBOARD PAGE                          │
│                    (/admin/page.tsx)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Header: Welcome Back, [Admin Name]                      │  │
│  │ Controls: Profile | Settings | Logout                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 1. USER MANAGEMENT (Purple)                             │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  [Manage Students]         [Manage Drivers]            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 2. FLEET MANAGEMENT (Green)                             │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  [Manage Buses]            [Manage Routes]             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 3. OPERATIONS (Orange)                                  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  [Assign Bus to Students]  [View Payments]             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 4. COMMUNICATION & SUPPORT (Violet)                     │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  [Send Notifications]      [Complaints & Feedback]     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 5. ANALYTICS & SETTINGS (Indigo & Slate)               │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  [Reports & Analytics]     [Admin Settings]            │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Flow Diagrams

### 1. Students Module Flow
```
┌──────────────────┐
│  Manage Students │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    ↓         ↓          ↓         ↓
  VIEW      SEARCH     FILTER   ACTION
    │         │          │      ┌──┴──┐
    │         │          │      ↓     ↓
    ↓         ↓          ↓    ADD   EDIT
 [List]   [Results] [By Type] │    │
    │         │          │      ↓    ↓
    └─────┬───┴──────────┘    [Form] [Update]
          ↓                      │      │
      ┌──────────────────────────┘      │
      ↓                                 │
  [Delete] ◄──────────────────────────┘
```

### 2. Buses Module Flow
```
┌──────────────────┐
│   Manage Buses   │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ↓         ↓          ↓          ↓
  VIEW      SEARCH    OCCUPANCY   DRIVER
    │         │          │        INFO
    │         │          │         │
    ↓         ↓          ↓         ↓
 [List]   [Results] [Calculate] [Display]
    │                    │
    └──────┬─────────────┘
           ↓
    [Status: Active]
           │
       ┌───┴────┐
       ↓        ↓
    EDIT     DELETE
```

### 3. Payments Module Flow
```
┌──────────────────────┐
│  View Payments       │
└────────┬─────────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    ↓         ↓          ↓         ↓
  VIEW      SEARCH    FILTER    EXPORT
    │         │          │        │
    │         │      ┌───┴─┐      ↓
    ↓         ↓      ↓     ↓   [CSV]
 [List]   [Results] Paid Pending
    │                 │     │
    └────┬────────────┴─────┘
         ↓
    [Status Display]
```

### 4. Analytics Module Flow
```
┌──────────────────────────┐
│  Reports & Analytics     │
└────────┬─────────────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓
 STATS    CHARTS      REPORTS       EXPORT
    │         │           │            │
    ↓         ↓           ↓            ↓
 [6 Cards] [3 Charts] [Data] [CSV/PDF]
    │         │
    ├─────┬───┤
    ↓     ↓   ↓
  Students  Occupancy
  Drivers   Payments
  Buses     Routes
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                      │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
   Local Storage              Supabase Database
   (User Data)                (All Resources)
        │                             │
   ┌────┴──────────────┐    ┌────────┴─────────────┐
   │                   │    │                      │
   ↓                   ↓    ↓                      ↓
[Auth Check]    [Session]  Tables:        Queries:
                           - students     - SELECT
                           - drivers      - INSERT
                           - buses        - UPDATE
                           - routes       - DELETE
                           - assignments
                           - payments
                           - notifications
                           - complaints
```

## Component Hierarchy

```
AdminDashboard (Main Page)
├── Header
│   ├── Title
│   ├── User Name
│   ├── Profile Button
│   ├── Settings Button
│   └── Logout Button
│
├── Module Categories
│   ├── User Management
│   │   ├── StudentCard
│   │   └── DriverCard
│   │
│   ├── Fleet Management
│   │   ├── BusCard
│   │   └── RouteCard
│   │
│   ├── Operations
│   │   ├── AssignmentCard
│   │   └── PaymentCard
│   │
│   ├── Communication & Support
│   │   ├── NotificationCard
│   │   └── FeedbackCard
│   │
│   └── Analytics & Settings
│       ├── ReportsCard
│       └── SettingsCard
│
└── Footer (Optional)
```

## Module Page Structure (All Similar)

```
ModulePage
├── Auth Check
├── Background & Decorations
├── Header
│   ├── Back Button
│   ├── Title
│   ├── Search Input
│   └── Action Buttons
│
├── Content
│   ├── LoadingState
│   │   └── Spinner
│   │
│   ├── EmptyState
│   │   ├── Message
│   │   └── Add Button
│   │
│   └── DataTable
│       ├── Table Header
│       ├── Table Rows (Mapped)
│       │   ├── Edit Button
│       │   ├── Delete Button
│       │   └── Other Actions
│       └── Pagination (if needed)
│
└── Footer
```

## State Management Pattern

```
Component State:
├── adminName (String)
│   └── Set from localStorage on mount
│
├── data (Array)
│   └── Fetched from Supabase
│
├── loading (Boolean)
│   ├── true: Initial load
│   └── false: Data loaded
│
├── searchTerm (String)
│   └── Used for filtering
│
├── filterStatus (String)
│   └── Payment status, complaint status, etc.
│
├── pagination (Object)
│   ├── currentPage
│   └── itemsPerPage
│
└── error (String|null)
    └── Error messages from API
```

## Color Scheme Map

```
┌─────────────────────────────────────────┐
│         DASHBOARD CATEGORIES            │
├─────────────────────────────────────────┤
│ Purple    → User Management             │
│ Pink      → Drivers / Payments          │
│ Yellow    → Buses                       │
│ Green     → Routes                      │
│ Orange    → Assignments                 │
│ Rose/Red  → Notifications               │
│ Violet    → Feedback/Complaints         │
│ Indigo    → Reports & Analytics         │
│ Slate     → Settings                    │
└─────────────────────────────────────────┘
```

## Database Relationship Diagram

```
                     ┌─────────────┐
                     │  students   │
                     ├─────────────┤
                     │ id (PK)     │
                     │ full_name   │
                     │ email       │
                     │ phone       │
                     │ address     │
                     └────────┬────┘
                              │ (1:N)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
   ┌─────────┐          ┌──────────────┐    ┌──────────┐
   │payments │          │  assignments │    │complaints│
   ├─────────┤          ├──────────────┤    ├──────────┤
   │ id      │          │ id           │    │ id       │
   │ student │          │ student_id   │    │ user_id  │
   │ amount  │          │ bus_id       │    │ title    │
   │ status  │          │ route_id     │    │ message  │
   └─────────┘          │ status       │    │ status   │
                        └──────────────┘    └──────────┘
                             │
                    ┌────────┼────────┐
                    ↓                 ↓
              ┌────────────┐    ┌──────────┐
              │   buses    │    │  routes  │
              ├────────────┤    ├──────────┤
              │ id (PK)    │    │ id (PK)  │
              │ number     │    │ name     │
              │ capacity   │    │ start    │
              │ driver_id  │    │ end      │
              │ status     │    │ distance │
              └────┬───────┘    └────┬─────┘
                   │                 │
              ┌────┴────┐       ┌────┴────┐
              ↓         ↓       ↓         ↓
         ┌─────────┐  ┌───────────────┐
         │ drivers │  │    stops      │
         ├─────────┤  ├───────────────┤
         │ id      │  │ id            │
         │ name    │  │ route_id (FK) │
         │ license │  │ name          │
         │ phone   │  │ lat/lon       │
         └─────────┘  └───────────────┘
```

## User Journey

```
1. Admin Login
   ↓
2. Dashboard Loads
   ├── Check Role
   ├── Fetch Greeting
   └── Display Categories
   ↓
3. Choose Module
   ├── Manage Students
   ├── Manage Drivers
   ├── Manage Buses
   ├── Manage Routes
   ├── Assign Bus to Students
   ├── View Payments
   ├── Send Notifications
   ├── View Complaints
   ├── Reports & Analytics
   └── Admin Settings
   ↓
4. Module Actions
   ├── View Data (List)
   ├── Search/Filter
   ├── Add New
   ├── Edit Existing
   └── Delete
   ↓
5. Complete Action
   ├── Show Success Toast
   ├── Refresh List
   └── Navigate Back
```

## Error Handling Flow

```
Action Triggered
      ↓
Try Supabase Operation
      ↓
    ┌─ Success ─┐      ┌─ Error ─┐
    ↓           ↓      ↓         ↓
  Update    Toast   Log Error  Show Alert
  State     Message  Handling
```

---

This architecture ensures:
✅ Scalability
✅ Maintainability
✅ Consistency
✅ User-friendly navigation
✅ Clean data flow
✅ Proper error handling
✅ Role-based access control
