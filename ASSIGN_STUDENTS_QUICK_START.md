# Assign Student → Bus → Route - QUICK START

**⚡ Fast Deploy in 5 Minutes**

---

## Prerequisites

- ✅ Supabase project set up
- ✅ Students table with enrolled students
- ✅ Buses table with capacity values
- ✅ Routes table with route names
- ✅ Admin authenticated and has auth_id in public.admins

---

## Deploy in 3 Steps

### Step 1: Create Database Table (1 min)

Copy entire content of this file and run in Supabase SQL Editor:

**File:** [scripts/CREATE_STUDENT_BUS_ASSIGNMENTS_TABLE.sql](scripts/CREATE_STUDENT_BUS_ASSIGNMENTS_TABLE.sql)

```sql
-- Copy from file and paste into Supabase SQL Editor
-- Click "Run"
-- Should see: "success - table student_bus_assignments created"
```

**What it does:**
- Creates student_bus_assignments table
- Adds indexes for performance
- Sets up constraints
- Enables RLS

---

### Step 2: Create RLS Policies (1 min)

Copy entire content of this file and run in Supabase SQL Editor:

**File:** [scripts/RLS_POLICIES_ASSIGNMENTS.sql](scripts/RLS_POLICIES_ASSIGNMENTS.sql)

```sql
-- Copy from file and paste into Supabase SQL Editor
-- Click "Run"
-- Should see 3 policies created
```

**What it does:**
- Admin full access
- Student read-only self
- Public access denied

---

### Step 3: Verify Code is Ready (2 min)

These files are **already created** in your workspace:

✅ [src/lib/assignments.ts](src/lib/assignments.ts) - Data layer (350+ lines)
✅ [src/app/admin/assignments/page.tsx](src/app/admin/assignments/page.tsx) - Admin UI (800+ lines)

**Verify compilation:**
```bash
# Terminal
npm run build
# Should complete with NO ERRORS
```

**Start dev server:**
```bash
npm run dev
```

**Access admin panel:**
```
http://localhost:3000/admin/assignments
```

---

## First-Time Use (2 min)

### 1. Navigate to Assignments Page
```
http://localhost:3000/admin/assignments
```

### 2. Click "Assign Student"
Modal opens with dropdowns:
- Student (filtered to unassigned, enrolled)
- Bus (shows capacity: "3/5")
- Route

### 3. Select and Confirm
- Choose unassigned enrolled student
- Choose bus with available capacity
- Choose route
- Click "Assign Student"

### 4. See Result
- Student appears in list
- Shows bus number, route, assignment date
- Status badge shows "Active"

### 5. Test Reassign
- Click "Reassign" on active assignment
- Choose different bus/route
- Verify update succeeds

### 6. Test Unassign
- Click "Unassign"
- Confirm action
- Student disappears from active list

---

## Verify Success

After deployment, check:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.student_bus_assignments;
-- Should show your test assignments
```

```
// In Admin UI
- List shows assignments
- Search works
- Dropdowns filter correctly
- Notifications appear
- Capacity info shows
```

---

## Troubleshooting

### "Bus capacity exceeded"
**Fix:** Choose bus with available capacity (shows in dropdown)

### "Student already assigned"
**Fix:** Unassign student from current bus first

### "Student not in dropdown"
**Fix:** Ensure student status = 'enrolled' in students table

### "Can't see assignments in list"
**Fix:** Make sure RLS policies created (Step 2)

### "Capacity shows wrong count"
**Fix:** Unassign old assignments (don't delete records)

---

## What's Deployed

| Component | Location | Status |
|-----------|----------|--------|
| Database | Supabase | ✅ Created by Step 1-2 |
| Data Layer | src/lib/assignments.ts | ✅ Ready (no build needed) |
| Admin UI | src/app/admin/assignments/page.tsx | ✅ Ready (no build needed) |

---

## Next Steps

1. **Test more assignments** - Create 10+ test records
2. **Test capacity limits** - Try assigning more than bus capacity
3. **Check audit trail** - Query assigned_at and unassigned_at timestamps
4. **Integrate with student profile** - Show assignment read-only on student dashboard
5. **Monitor performance** - Check query times with large datasets

---

## API Reference

All functions in [src/lib/assignments.ts](src/lib/assignments.ts):

```typescript
// Get all assignments
getAssignments()

// Get active only
getActiveAssignments()

// Create assignment (validates capacity)
assignStudentToBus({ student_id, bus_id, route_id })

// Unassign (soft delete)
unassignStudent(assignmentId)

// Reassign (unassign old, assign new)
reassignStudent({ assignment_id, bus_id, route_id })

// Check capacity
canAssignToBus(busId)

// Get single student's assignment
getStudentAssignment(studentId)
```

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- To delete all assignments (keep table)
DELETE FROM public.student_bus_assignments;

-- To drop entire table (full rollback)
DROP TABLE IF EXISTS public.student_bus_assignments CASCADE;
```

Then re-run Step 1 and Step 2.

---

## Support

- Full documentation: [ASSIGN_STUDENTS_COMPLETE.md](ASSIGN_STUDENTS_COMPLETE.md)
- Database schema: [scripts/CREATE_STUDENT_BUS_ASSIGNMENTS_TABLE.sql](scripts/CREATE_STUDENT_BUS_ASSIGNMENTS_TABLE.sql)
- RLS policies: [scripts/RLS_POLICIES_ASSIGNMENTS.sql](scripts/RLS_POLICIES_ASSIGNMENTS.sql)
- Data layer code: [src/lib/assignments.ts](src/lib/assignments.ts)
- Admin UI code: [src/app/admin/assignments/page.tsx](src/app/admin/assignments/page.tsx)
