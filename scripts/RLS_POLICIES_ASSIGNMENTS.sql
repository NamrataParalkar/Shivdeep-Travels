-- RLS Policies for student_bus_assignments table

-- Policy: Admin full access
CREATE POLICY IF NOT EXISTS assignments_admin_full_access
ON public.student_bus_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE public.admins.auth_id = auth.uid()
  )
);

-- Policy: Student can view their own assignment (read-only)
CREATE POLICY IF NOT EXISTS assignments_student_self_select
ON public.student_bus_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.id = public.student_bus_assignments.student_id
    AND public.students.auth_id = auth.uid()
  )
);

-- Explicit deny for public access
CREATE POLICY IF NOT EXISTS assignments_deny_public
ON public.student_bus_assignments
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
