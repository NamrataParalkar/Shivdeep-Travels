# Supabase Auth & Security Setup Guide

## Overview
This guide explains how to set up Supabase Authentication and Row Level Security (RLS) for the School Bus Management System.

## Prerequisites
- Supabase project created
- Supabase URL and Anon Key added to `.env.local`
- Access to Supabase dashboard

## Step 1: Environment Variables

Create `.env.local` in project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Run Security Setup SQL

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy all SQL from `scripts/SECURITY_SETUP.sql`
4. Execute it

This will:
- Create/update `admins`, `students`, `drivers` tables with `auth_id` links
- Enable RLS on all tables
- Create RLS policies for role-based access
- Create necessary indexes

## Step 3: Create Admin Users

After running the SQL setup, create admin users:

```sql
-- Get UUID of user from auth.users table
-- Then insert into admins table:

INSERT INTO public.admins (auth_id, full_name, email, phone)
VALUES (
  'uuid-here-from-auth-users',
  'Admin Name',
  'admin@example.com',
  '+1234567890'
);
```

## Step 4: Authentication Flow

### Login Process
1. User enters email and password
2. `supabase.auth.signInWithPassword()` authenticates
3. Auth returns JWT session (stored in secure httpOnly cookie by Supabase)
4. Fetch user profile from `students`, `drivers`, or `admins` table using `auth_id`
5. Store profile in localStorage for UI state only (not security)
6. Redirect to dashboard

### Logout Process
1. Call `supabase.auth.signOut()`
2. Clear localStorage
3. JWT is invalidated
4. Redirect to login

### Session Persistence
- Supabase automatically manages JWT in cookies
- On page refresh, `supabase.auth.getSession()` retrieves session from cookies
- No localStorage refresh tokens needed

## Step 5: RLS Policies Explained

### Students Table
- **Students can view**: Only their own record
- **Students can update**: Only their own record
- **Admins can view**: All students
- **Admins can update**: All students

### Drivers Table
- **Drivers can view**: Only their own record
- **Drivers can update**: Only their own record
- **Admins can view**: All drivers
- **Admins can update**: All drivers
- **Admins can delete**: Drivers

### Complaints & Feedback Table
- **Students can view**: Only their own complaints
- **Students can insert**: New complaints
- **Admins can view**: All complaints
- **Admins can update**: Status and admin response
- **Admins can delete**: Complaints

### Notifications Table
- **All users can view**: All notifications
- **Only admins can insert**: New notifications
- **Only admins can delete**: Notifications

## Step 6: Admin Authorization

Admin access is enforced at the database level through RLS policies.

To check if a user is admin:
```typescript
// In your app
const { data: admin } = await supabase
  .from('admins')
  .select('id')
  .eq('auth_id', session.user.id)
  .single();

if (admin) {
  // User is admin - can access admin routes
}
```

## Step 7: Frontend Session Management

Use `supabase.auth.onAuthStateChange()` to listen for auth changes:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    // User logged in
  } else {
    // User logged out
  }
});
```

For quick UI checks, use localStorage (but verify with auth on sensitive operations):

```typescript
const user = localStorage.getItem('user');
if (!user) {
  router.push('/login');
}
```

## Step 8: Protecting Routes

Create a protected route wrapper:

```typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children, requiredRole }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      if (requiredRole === 'admin') {
        const { data } = await supabase
          .from('admins')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();
        
        if (!data) {
          router.push('/');
          return;
        }
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, []);

  if (!isAuthorized) return <div>Loading...</div>;
  return children;
}
```

## Step 9: Security Best Practices

### ✅ DO:
- Use Supabase Auth for all authentication
- Enforce RLS policies on all sensitive tables
- Check `auth.uid()` in RLS policies
- Use `supabase.auth.getSession()` to get current user
- Store JWT in secure cookies (Supabase does this automatically)
- Verify role on backend before sensitive operations

### ❌ DON'T:
- Store passwords in plain text (use `auth.users` instead)
- Store JWTs in localStorage (use secure cookies)
- Trust frontend role checks for security decisions
- Disable RLS policies
- Use admin key on frontend (only use Anon key)

## Step 10: Testing

### Test Student Access
1. Create student account via registration
2. Login as student
3. Verify they can only see their own data
4. Verify they cannot see other students' data

### Test Admin Access
1. Create admin user in SQL (add to `admins` table)
2. Login with admin credentials
3. Verify they can see all students/drivers/complaints
4. Verify they can manage records

### Test RLS Policies
In Supabase SQL Editor:

```sql
-- As authenticated user (student)
SELECT * FROM students;  -- Should return only their record

-- As admin
SELECT * FROM students;  -- Should return all records
```

## Troubleshooting

### "User not found" error
- Verify user exists in `auth.users` (Supabase Auth section)
- Verify user profile exists in correct table (students/drivers/admins)
- Verify `auth_id` matches between `auth.users` and profile table

### RLS policy not working
- Verify table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Verify policy exists: `SELECT * FROM pg_policies WHERE tablename = 'table_name'`
- Check policy logic with: `EXPLAIN (ANALYZE, BUFFERS) SELECT ...`

### JWT token expired
- Supabase automatically refreshes tokens
- If issues persist, clear localStorage and re-login

### Admin not seeing all records
- Verify admin user is in `admins` table with correct `auth_id`
- Verify RLS policy for admin includes admin check
- Test with: `SELECT * FROM admins WHERE auth_id = current_user_id;`

## Migration from Old System

If migrating from custom auth:

1. Create Supabase Auth accounts for all users
2. Add `auth_id` to existing profile tables
3. Enable RLS policies
4. Update frontend to use `supabase.auth` instead of localStorage
5. Test thoroughly before deploying to production

## Resources
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/self-hosting/security)
