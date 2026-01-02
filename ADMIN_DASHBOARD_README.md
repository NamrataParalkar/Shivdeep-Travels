# Admin Dashboard - Structure & Implementation Guide

## Overview
The Admin Dashboard is a comprehensive management system for the School Bus Management application. It provides full CRUD operations for all system entities and advanced features like analytics, notifications, and complaint management.

## Project Structure

```
/src/app/admin/
├── page.tsx                          # Main dashboard home page
├── students/
│   └── page.tsx                      # Manage Students module
├── drivers/
│   └── page.tsx                      # Manage Drivers module
├── buses/
│   └── page.tsx                      # Manage Buses module
├── routes/
│   └── page.tsx                      # Manage Routes module
├── assignments/
│   └── page.tsx                      # Assign Bus to Students module
├── payments/
│   └── page.tsx                      # View Payments module
├── notifications/
│   └── page.tsx                      # Send Notifications module
├── feedback/
│   └── page.tsx                      # View Complaints & Feedback module
├── reports/
│   └── page.tsx                      # Reports & Analytics module
└── settings/
    └── page.tsx                      # Admin Profile & Settings module

/src/components/admin/
├── AdminLayout.tsx                   # Reusable layout wrapper
├── AdminPageHeader.tsx               # Reusable header component
├── AdminStatCard.tsx                 # Statistics card component
├── AdminTable.tsx                    # Reusable table component
└── EmptyState.tsx                    # Empty state message component
```

## Module Descriptions

### 1. **Manage Students** (`/admin/students`)
- **Features:**
  - View all students with pagination
  - Search and filter students
  - Add new student
  - Edit student information
  - Delete student
  - Display student stats (name, email, phone, etc.)

### 2. **Manage Drivers** (`/admin/drivers`)
- **Features:**
  - View all drivers with assigned buses
  - Search drivers
  - Add new driver
  - Edit driver details
  - Delete driver
  - Assign/reassign bus to driver

### 3. **Manage Buses** (`/admin/buses`)
- **Features:**
  - View all buses
  - Search buses
  - Add new bus
  - Edit bus details
  - Delete bus
  - Show capacity and occupancy
  - Display assigned driver

### 4. **Manage Routes** (`/admin/routes`)
- **Features:**
  - View all routes
  - Search routes
  - Add new route with stops
  - Edit route
  - Delete route
  - Show distance and number of stops

### 5. **Assign Bus to Students** (`/admin/assignments`)
- **Features:**
  - View all student-bus assignments
  - Search assignments
  - Create new assignment
  - Modify assignments
  - View assignment status
  - Show route information

### 6. **View Payments** (`/admin/payments`)
- **Features:**
  - View all payment records
  - Filter by status (paid/pending)
  - Search payments
  - Export as CSV
  - Show payment date and method
  - Manage payment status

### 7. **Send Notifications** (`/admin/notifications`)
- **Features:**
  - Send notifications to students
  - Send notifications to drivers
  - Send notifications to specific bus
  - Broadcast to all users
  - View notification history
  - Track delivery status

### 8. **View Complaints & Feedback** (`/admin/feedback`)
- **Features:**
  - View all complaints/feedback
  - Filter by status (pending/resolved)
  - Search complaints
  - Mark complaint as resolved
  - View user and timestamp info
  - Detailed message display

### 9. **Reports & Analytics** (`/admin/reports`)
- **Features:**
  - Display key statistics:
    - Total students
    - Total drivers
    - Total buses
    - Total routes
    - Active bookings
    - Total payments
  - Charts (using Recharts):
    - Bus occupancy chart
    - Payment status distribution
    - Route usage analytics
  - Export reports

### 10. **Admin Profile & Settings** (`/admin/settings`)
- **Features:**
  - Edit profile (name, email, phone)
  - Upload profile image
  - Change password
  - Security settings
  - Session management

## Reusable Components

### AdminPageHeader
Provides a consistent header with back button and gradient title.
```tsx
<AdminPageHeader
  title="Manage Students"
  onBack={() => router.back()}
  accentColor="purple"
/>
```

### AdminStatCard
Displays statistics in a formatted card.
```tsx
<AdminStatCard
  label="Total Students"
  value={42}
  color="purple"
/>
```

### AdminTable
Renders a consistent styled table.
```tsx
<AdminTable
  headers={["Name", "Email", "Phone"]}
  rows={[[...], [...]]}
  accentColor="purple"
/>
```

### EmptyState
Shows a message when no data is available.
```tsx
<EmptyState
  message="No students found"
  actionLabel="Add Student"
  onAction={handleAdd}
  accentColor="purple"
/>
```

## Color Scheme

Each module uses a unique color from the project's theme:
- **Students** → Purple
- **Drivers** → Pink
- **Buses** → Yellow
- **Routes** → Green
- **Assignments** → Orange
- **Payments** → Pink/Rose
- **Notifications** → Rose/Red
- **Feedback** → Violet
- **Reports** → Indigo
- **Settings** → Slate

## Authentication & Authorization

All admin pages check for:
1. User authentication (localStorage)
2. Admin role verification
3. Redirect to login if unauthorized

```tsx
useEffect(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    const parsed = JSON.parse(userData);
    if (parsed.role === "admin") {
      setAdminName(parsed.full_name);
    } else {
      router.push("/login");
    }
  } else {
    router.push("/login");
  }
}, []);
```

## Supabase Integration (TODO)

Each page has TODO comments for Supabase integration:
- Fetch data from respective tables
- Create/Update/Delete operations
- Real-time updates
- Error handling

**Tables to use:**
- `students` - Student records
- `drivers` - Driver records
- `buses` - Bus records
- `routes` - Route information
- `stops` - Route stops
- `assignments` - Student-bus assignments
- `payments` - Payment records
- `notifications` - Notification history
- `complaints` - User complaints/feedback
- `users` (admin) - Admin profile data

## UI/UX Standards

### Layout
- Gradient background (purple → pink → yellow)
- Decorative glowing circles
- Responsive grid layout
- Z-index management for overlays

### Components
- Rounded corners (border-radius)
- Shadow effects for depth
- Glassmorphism (backdrop-blur)
- Smooth transitions
- Hover effects

### Typography
- Bold titles with gradient text
- Clear section headers
- Readable body text
- Consistent font sizes

### Spacing
- Consistent padding (8px base unit)
- Gap between elements
- Margin for sections
- Aligned grids

## Next Steps for Development

1. **Connect to Supabase:**
   - Replace TODO comments with actual API calls
   - Implement error handling
   - Add loading states

2. **Add Forms:**
   - Create add/edit pages for each module
   - Implement form validation
   - Use react-hook-form or similar

3. **Implement Charts:**
   - Install Recharts
   - Create chart components
   - Add analytics calculations

4. **Add Export Features:**
   - CSV export for payments
   - PDF reports
   - Data filtering

5. **Notifications:**
   - Implement real-time notifications
   - Email/SMS integration
   - Notification preferences

6. **Animations:**
   - Page transitions
   - Loading skeletons
   - Success/error toasts

## Coding Standards

- **TypeScript:** All files use `.tsx` or `.ts`
- **Components:** Use "use client" for client-side functionality
- **Styling:** TailwindCSS utilities
- **Icons:** lucide-react
- **Structure:** Keep code modular and reusable
- **Comments:** Add TODO for Supabase integration points

## Testing Checklist

- [ ] Authentication works correctly
- [ ] All module pages render
- [ ] Navigation between modules works
- [ ] Back button functionality
- [ ] Search/filter functionality
- [ ] Responsive design on mobile
- [ ] Hover effects and transitions
- [ ] Color consistency across modules
