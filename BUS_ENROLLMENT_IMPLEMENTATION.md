# Bus Enrollment Flow - Implementation Summary

## Overview
Complete end-to-end bus enrollment flow with student enrollment requests, route requests, and admin approval workflow.

## Database Tables Created

### 1. route_requests
- **Purpose**: Students can request new stops or routes that aren't currently available
- **Fields**:
  - `id` (BIGSERIAL PRIMARY KEY)
  - `student_id` (INT, references students)
  - `requested_stop` (TEXT) - Name of preferred stop
  - `area` (TEXT) - Area/locality
  - `description` (TEXT) - Additional details
  - `status` (TEXT) - pending/approved/rejected
  - `created_at`, `updated_at` (TIMESTAMPTZ)

- **RLS Policies**:
  - Students: Can insert/view own requests
  - Admin: Can view all and update status

### 2. bus_enrollments
- **Purpose**: Manage student enrollment in bus routes with approval workflow
- **Fields**:
  - `id` (BIGSERIAL PRIMARY KEY)
  - `student_id` (INT, references students)
  - `route_id` (BIGINT, references routes)
  - `remarks` (TEXT) - Optional remarks from student
  - `status` (TEXT) - pending/approved/rejected
  - `created_at`, `approved_at`, `updated_at` (TIMESTAMPTZ)

- **RLS Policies**:
  - Students: Can insert/view own enrollments
  - Admin: Can view all and update status

## New Files Created

### 1. `/src/lib/enrollments.ts`
TypeScript library with functions for:
- `getStudentEnrollments()` - Fetch enrollments for a student
- `getEnrollments()` - Admin: fetch all enrollments by status
- `createEnrollment()` - Student creates enrollment request
- `approveEnrollment()` - Admin approves
- `rejectEnrollment()` - Admin rejects
- `getStudentRouteRequests()` - Fetch route requests for student
- `getRouteRequests()` - Admin: fetch all route requests by status
- `createRouteRequest()` - Student creates route request
- `approveRouteRequest()` - Admin approves
- `rejectRouteRequest()` - Admin rejects

### 2. `/src/app/bus/enroll/page.tsx`
Student enrollment page with:
- **Route Selection Tab**: 
  - Display all active routes with stops
  - Select route and add optional remarks
  - Submit enrollment request (status: pending)
  
- **Request New Stop/Route Tab**:
  - Enter preferred stop name
  - Specify area/locality
  - Optional description
  - Submit route request (status: pending)

## Modified Files

### 1. `/src/app/profile/page.tsx`
- Fixed: Changed `student_class` → `class` to match database schema
- Student now correctly displays class field

### 2. `/src/lib/registerUser.js`
- Fixed: Changed `student_class` → `class` in registration payload
- Ensures new registrations use correct database column name

### 3. `/src/app/admin/routes/page.tsx`
**Added Route Requests Tab**:
- View pending student route requests
- Display: Student name, class, phone, requested stop, area, description
- Actions: Approve or Reject with immediate status update
- Badge showing count of pending requests

### 4. `/src/app/admin/students/page.tsx`
**Added Bus Enrollments Tab**:
- View pending bus enrollment requests from students
- Display: Student name, class, phone, selected route, remarks, status
- Actions: Approve or Reject with immediate status update
- Badge showing count of pending enrollments
- Only shows pending requests initially; can be filtered if needed

## SQL Files Created

### 1. `/scripts/CREATE_ROUTE_REQUESTS_TABLE.sql`
- Creates route_requests table
- Adds RLS policies
- Creates indexes for performance

### 2. `/scripts/CREATE_BUS_ENROLLMENTS_TABLE.sql`
- Creates bus_enrollments table
- Adds RLS policies
- Creates indexes for performance

## User Flows

### Student Side
1. **Enroll in Existing Route**:
   - Student clicks "Enroll for Bus Service" button on profile
   - Navigates to `/bus/enroll`
   - Selects a route from available active routes
   - Optionally adds remarks
   - Submits → enrollment created with status `pending`
   - Waits for admin approval

2. **Request New Route/Stop**:
   - If suitable route not found, switches to "Request New Stop/Route" tab
   - Enters preferred stop name, area, description
   - Submits → route_request created with status `pending`
   - Waits for admin decision

### Admin Side
1. **Approve/Reject Route Requests**:
   - Goes to Admin Dashboard → Manage Routes
   - Clicks "Route Requests" tab
   - Views pending student requests with full details
   - Clicks ✓ (approve) or ✗ (reject)
   - Status updated immediately

2. **Approve/Reject Enrollments**:
   - Goes to Admin Dashboard → Manage Students
   - Clicks "Bus Enrollments" tab
   - Views pending enrollment requests
   - Clicks ✓ (approve) or ✗ (reject)
   - Status updated immediately

## Features

✅ **Student Enrollment**
- Select from available routes
- Route displays: Route name, start/end points, all stops
- Optional remarks field
- Pending status until admin approval

✅ **Route Requests**
- Request new stops/routes
- Area/locality specification
- Description for context
- Pending status until admin decision

✅ **Admin Approval Workflow**
- Route requests tab in Manage Routes
- Enrollments tab in Manage Students
- Quick approve/reject actions
- Badge indicators for pending items
- Immediate status updates

✅ **RLS Security**
- Students can only see/edit their own enrollments and requests
- Admins have full access
- Database-level security

✅ **UI/UX**
- Consistent with existing design
- Mobile-friendly responsive design
- Gradient backgrounds and modern styling
- Badges showing pending counts
- Clear status indicators

✅ **No Breaking Changes**
- Existing student/driver/admin profiles unaffected
- Manage Students still works for basic CRUD
- Manage Routes still works for route management
- Only added new tabs and functionality

## Testing Checklist

- [ ] Run SQL migration for `route_requests` table
- [ ] Run SQL migration for `bus_enrollments` table
- [ ] Student can navigate to `/bus/enroll` from profile
- [ ] Student can select a route and submit enrollment request
- [ ] Student can request a new route/stop
- [ ] Admin sees pending route requests in Manage Routes
- [ ] Admin can approve/reject route requests
- [ ] Admin sees pending enrollments in Manage Students
- [ ] Admin can approve/reject enrollments
- [ ] Existing Manage Students functionality still works
- [ ] Existing Manage Routes functionality still works
- [ ] Student profile displays class correctly
- [ ] RLS policies enforce access control

## Integration Points

1. **Routes Library**: Uses `getActiveRoutes()` from `/src/lib/routes.ts`
2. **Students Library**: Uses `getStudents()` from `/src/lib/students.ts`
3. **Supabase**: RLS policies enforce database-level security
4. **Auth**: Uses existing auth_id from student/admin auth

## Future Enhancements

- Email notifications when enrollment/request status changes
- History view for past enrollment requests
- Admin comments/notes on approvals/rejections
- Route assignment automation based on requests
- Student dashboard showing enrollment status
