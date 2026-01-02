# Manage Students - Quick Start Deployment Guide

**PRODUCTION READY - Deploy Now**

---

## 1. Database Setup (5 minutes)

### Step 1: Extend Students Table

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Copy the entire content of scripts/ALTER_STUDENTS_TABLE.sql
```

**What it does:**
- ✅ Adds auth_id column (links to auth.users)
- ✅ Adds enrollment_status column (not_enrolled, enrolled, suspended)
- ✅ Adds enrolled_at timestamp
- ✅ Adds must_reset_password flag
- ✅ Makes parent_phone UNIQUE
- ✅ Creates performance indexes

**Verification:**
After running, verify in Supabase Dashboard:
- Table: `students`
- New columns visible: auth_id, enrollment_status, enrolled_at, must_reset_password
- Constraints visible in column definitions

---

### Step 2: Enable Row Level Security

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Copy the entire content of scripts/RLS_POLICIES_STUDENTS.sql
```

**What it does:**
- ✅ Enables RLS on students table
- ✅ Students can only SELECT/UPDATE their own record
- ✅ Admins have full access
- ✅ No public access allowed

**Verification:**
- Go to Supabase Dashboard → students table → RLS
- Should see three policies enabled:
  1. `students_self_select`
  2. `students_self_update`
  3. `students_admin_full_access`

---

## 2. Code Deployment (Already Done!)

All code files are ready:

✅ **src/lib/students.ts** - Data layer (220+ lines)
✅ **src/app/admin/students/page.tsx** - Admin UI (680+ lines)

No additional deployment needed. The code is production-ready.

---

## 3. Admin Dashboard Access

1. Navigate to: `http://localhost:3000/admin`
2. Click **"Manage Students"** in sidebar
3. You're ready to go!

---

## 4. First Time Use

### Add Your First Student

1. Click **"Add Student"** button
2. Fill in form:
   - Full Name: `John Doe`
   - Class: `10`
   - Division: `A`
   - Parent Phone: `9876543210`
   - Student Phone: `9123456789` (optional)
   - Email: `john@example.com` (optional)
3. Click **"Create"**
4. Success! Student is now enrolled with `must_reset_password=true`

### Test Search & Filter

1. Type name or phone in search box
2. Use filter buttons (All, Enrolled, Not Enrolled, Suspended)
3. Verify results update in real-time

### Test Enrollment Actions

1. Click **"Suspend"** on enrolled student → Status changes to red
2. Click **"Re-enroll"** on suspended student → Status back to green
3. Verify enrollment_status changes in database

### Test Edit

1. Click **"Edit"** on any student
2. Change name or class
3. Click **"Update"**
4. Verify changes saved

### Test Delete

1. Click **"Delete"** on any student
2. Confirm deletion
3. Verify student removed from list

---

## 5. Integration Checklist

### For Student Login (Next Phase)

When implementing student login:

```typescript
// 1. Lookup student by phone or email
const student = await getStudentByPhone(phone);

// 2. If student found
if (student) {
  // 3. Check if must reset password
  if (student.must_reset_password) {
    // Show force password reset modal
  }
  
  // 4. After password reset, clear flag
  await clearPasswordResetFlag(student.id);
  
  // 5. Link auth account
  await updateStudent(student.id, {
    auth_id: authUser.id
  });
}
```

### For Bus Assignment (Next Phase)

```typescript
// Get all available students (only enrolled)
const availableStudents = await getEnrolledStudents();

// Use in bus assignment form
// This prevents assigning suspended or non-enrolled students
```

### For Route Assignment (Next Phase)

Same as bus assignment - use `getEnrolledStudents()`

---

## 6. Important Notes

### Parent Phone is UNIQUE

Each student must have a **different** parent_phone.

If you try to add a duplicate:
- ❌ You'll get error: "duplicate key value violates unique constraint"
- ✅ Update existing student instead of creating new one

### must_reset_password Flag

- ✅ Auto-set to `true` when admin adds student
- ✅ Set to `false` after student resets password on first login
- ✅ Can be manually changed in edit modal

### Enrollment Status

Three states:
- **not_enrolled** (yellow) - Not yet part of system
- **enrolled** (green) - Active, can be assigned bus/route
- **suspended** (red) - Inactive, cannot be assigned

### Phone vs Parent Phone

- **phone** - Student's personal phone (optional)
- **parent_phone** - Parent's phone (required, must be unique)

This allows login via either phone OR email.

---

## 7. Troubleshooting

### "Column already exists" error
- The migration is safe and idempotent
- If you run it twice, it skips existing columns
- No data loss

### "Permission denied" error
- Check RLS policies are enabled
- Verify admin user exists in `public.admins` table
- Ensure auth.uid() matches admin.auth_id

### Student not appearing in list
- Check enrollment_status (might be filtered)
- Try "All" filter
- Clear search box
- Refresh page

### Form validation failing
- Full Name, Class, Division, Parent Phone are required
- Parent Phone must be unique (not used before)
- All fields trimmed of whitespace

---

## 8. Files Reference

| File | Purpose |
|------|---------|
| `scripts/ALTER_STUDENTS_TABLE.sql` | Database migration - run first |
| `scripts/RLS_POLICIES_STUDENTS.sql` | Security policies - run second |
| `src/lib/students.ts` | Data layer - 20 functions |
| `src/app/admin/students/page.tsx` | Admin UI - complete feature |
| `MANAGE_STUDENTS_COMPLETE.md` | Full documentation |
| `MANAGE_STUDENTS_QUICK_START.md` | This file |

---

## 9. Success Indicators

You'll know it's working when:

✅ Admin Dashboard loads without errors  
✅ Can add a new student  
✅ Student appears in list immediately  
✅ Status badges show correct colors  
✅ Search works by name and phone  
✅ Filters (All/Enrolled/Not Enrolled/Suspended) work  
✅ Can edit student details  
✅ Can enroll/suspend/re-enroll students  
✅ Can delete students with confirmation  
✅ Toast notifications show success/error messages  

---

## 10. Next Steps

1. **Deploy:** Run the two SQL scripts in Supabase
2. **Test:** Add a test student, verify functionality
3. **Integrate:** Link to student login system (future)
4. **Extend:** Add bulk import, parent portal, etc.

---

**Status: READY FOR PRODUCTION**

All code tested, documented, and production-ready.
Deploy now and start managing students!
