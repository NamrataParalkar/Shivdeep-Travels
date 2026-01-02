-- Row Level Security Policies for Students Table
-- Ensures students can only access their own data, admins have full access

-- Enable RLS on students table
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "students_self_select" ON public.students;
DROP POLICY IF EXISTS "students_self_update" ON public.students;
DROP POLICY IF EXISTS "students_admin_full_access" ON public.students;

-- ===================================================================
-- Student Policies (self-access only)
-- ===================================================================

-- Students can view their own profile
CREATE POLICY "students_self_select"
  ON public.students
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (auth.uid() = students.auth_id OR EXISTS (
      SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()
    ))
  );

-- Students can update their own profile
CREATE POLICY "students_self_update"
  ON public.students
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND (auth.uid() = students.auth_id OR EXISTS (
      SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()
    ))
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (auth.uid() = students.auth_id OR EXISTS (
      SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()
    ))
  );

-- ===================================================================
-- Admin Policies (full access)
-- ===================================================================

-- Admins can do all operations on students table
CREATE POLICY "students_admin_full_access"
  ON public.students
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE public.admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE public.admins.auth_id = auth.uid()));
