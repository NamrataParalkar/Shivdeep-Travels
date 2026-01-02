-- Production-ready RLS policies for School Bus Management System
-- Run this file in Supabase SQL Editor AFTER creating tables (review before running in production).

-- Ensure RLS is enabled on listed tables (no-op if already enabled)
ALTER TABLE IF EXISTS public.complaints_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.other_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;


-- ==================================================================
-- Table: public.complaints_feedback
-- Columns used: user_id (TEXT), user_role, entry_type, category, priority, status, admin_response
-- Goals: enforce ownership for users; admins (public.admins.auth_id) have full management rights
-- ==================================================================
DROP POLICY IF EXISTS "prod_complaints_insert_owners_only" ON public.complaints_feedback;
DROP POLICY IF EXISTS "prod_complaints_select_owner_or_admin" ON public.complaints_feedback;
DROP POLICY IF EXISTS "prod_complaints_update_owner_no_ownership_change" ON public.complaints_feedback;
DROP POLICY IF EXISTS "prod_complaints_admin_update" ON public.complaints_feedback;
DROP POLICY IF EXISTS "prod_complaints_admin_delete" ON public.complaints_feedback;

-- Users may INSERT only when the inserted row's user_id equals auth.uid()
CREATE POLICY "prod_complaints_insert_owners_only"
  ON public.complaints_feedback
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Users may SELECT only their own rows; admins may SELECT all rows
CREATE POLICY "prod_complaints_select_owner_or_admin"
  ON public.complaints_feedback
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid())
  );

-- Users may UPDATE only their own rows and cannot change user_id (ownership)
CREATE POLICY "prod_complaints_update_owner_no_ownership_change"
  ON public.complaints_feedback
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Admins may UPDATE any row (manage status, admin_response, priority, etc.)
CREATE POLICY "prod_complaints_admin_update"
  ON public.complaints_feedback
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));

-- Admins may DELETE complaints
CREATE POLICY "prod_complaints_admin_delete"
  ON public.complaints_feedback
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.contact_info
-- Columns: id, name, phone, email, created_at (no user_id ownership column)
-- Goals: site-level reference data; admins manage; authenticated users can view
-- ==================================================================
DROP POLICY IF EXISTS "prod_contact_select_authenticated" ON public.contact_info;
DROP POLICY IF EXISTS "prod_contact_admin_manage" ON public.contact_info;

CREATE POLICY "prod_contact_select_authenticated"
  ON public.contact_info
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prod_contact_admin_manage"
  ON public.contact_info
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.other_bookings
-- Columns used: student_id (TEXT) linking to auth.uid()::text
-- Goals: student users can manage their bookings only; admins full access
-- ==================================================================
DROP POLICY IF EXISTS "prod_bookings_insert_owners_only" ON public.other_bookings;
DROP POLICY IF EXISTS "prod_bookings_select_owner_or_admin" ON public.other_bookings;
DROP POLICY IF EXISTS "prod_bookings_update_owner_no_reassign" ON public.other_bookings;
DROP POLICY IF EXISTS "prod_bookings_admin_manage" ON public.other_bookings;

CREATE POLICY "prod_bookings_insert_owners_only"
  ON public.other_bookings
  FOR INSERT
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "prod_bookings_select_owner_or_admin"
  ON public.other_bookings
  FOR SELECT
  USING (
    student_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid())
  );

CREATE POLICY "prod_bookings_update_owner_no_reassign"
  ON public.other_bookings
  FOR UPDATE
  USING (student_id = auth.uid()::text)
  WITH CHECK (student_id = auth.uid()::text);

CREATE POLICY "prod_bookings_admin_manage"
  ON public.other_bookings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.students
-- Columns: prefer `auth_id` referencing auth.users.id; fall back to `id` if your schema uses that
-- Goals: student can view/update their record; admins manage all
-- ==================================================================
DROP POLICY IF EXISTS "prod_students_select_own_or_admin" ON public.students;
DROP POLICY IF EXISTS "prod_students_update_own_no_ownership_change" ON public.students;
DROP POLICY IF EXISTS "prod_students_admin_manage" ON public.students;

-- SELECT: student may select their row by matching auth_id or id; admins may select all
CREATE POLICY "prod_students_select_own_or_admin"
  ON public.students
  FOR SELECT
  USING (
    auth.uid()::text = COALESCE(auth_id::text, id::text)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid())
  );

-- UPDATE: student may update their own record but cannot change auth link
CREATE POLICY "prod_students_update_own_no_ownership_change"
  ON public.students
  FOR UPDATE
  USING (auth.uid()::text = COALESCE(auth_id::text, id::text))
  WITH CHECK (auth.uid()::text = COALESCE(auth_id::text, id::text));

-- Admins: full management of student records
CREATE POLICY "prod_students_admin_manage"
  ON public.students
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.drivers
-- Similar pattern as students
-- ==================================================================
DROP POLICY IF EXISTS "prod_drivers_select_own_or_admin" ON public.drivers;
DROP POLICY IF EXISTS "prod_drivers_update_own_no_ownership_change" ON public.drivers;
DROP POLICY IF EXISTS "prod_drivers_admin_manage" ON public.drivers;

CREATE POLICY "prod_drivers_select_own_or_admin"
  ON public.drivers
  FOR SELECT
  USING (
    auth.uid()::text = COALESCE(auth_id::text, id::text)
    OR EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid())
  );

CREATE POLICY "prod_drivers_update_own_no_ownership_change"
  ON public.drivers
  FOR UPDATE
  USING (auth.uid()::text = COALESCE(auth_id::text, id::text))
  WITH CHECK (auth.uid()::text = COALESCE(auth_id::text, id::text));

CREATE POLICY "prod_drivers_admin_manage"
  ON public.drivers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Table: public.admins
-- Admin records are privileged. Only the admin themselves may view/update their record
-- Admin creation/deletion must be performed by a trusted operator via SQL or a secure server-side process
-- ==================================================================
DROP POLICY IF EXISTS "prod_admins_select_own" ON public.admins;
DROP POLICY IF EXISTS "prod_admins_update_own_no_authid_change" ON public.admins;

CREATE POLICY "prod_admins_select_own"
  ON public.admins
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "prod_admins_update_own_no_authid_change"
  ON public.admins
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);


-- ==================================================================
-- Table: public.notifications
-- Columns: id, message_text, timestamp, sender_role (no user_id ownership column)
-- Goals: broadcast notifications for authenticated users; admins only may create/delete
-- ==================================================================
DROP POLICY IF EXISTS "prod_notifications_select_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "prod_notifications_admin_insert" ON public.notifications;
DROP POLICY IF EXISTS "prod_notifications_admin_delete" ON public.notifications;

CREATE POLICY "prod_notifications_select_authenticated"
  ON public.notifications
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prod_notifications_admin_insert"
  ON public.notifications
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));

CREATE POLICY "prod_notifications_admin_delete"
  ON public.notifications
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.auth_id = auth.uid()));


-- ==================================================================
-- Final notes and recommended test steps
-- 1) These policies enforce ownership via explicit equality to auth.uid() and use admin existence
--    checks against `public.admins.auth_id`. They avoid relying on `auth.role()` for ownership.
-- 2) After applying, test with:
--    - Student account: should only SELECT/INSERT/UPDATE their own rows (no access to others).
--    - Admin account: must have an entry in `public.admins` with `auth_id` = auth.users.id; then admin can
--      SELECT/UPDATE/DELETE across the tables per the policies above.
-- 3) If any table column names differ (for example students.auth_id is named differently), update
--    the relevant policy and rerun.
-- 4) For administrative server-side actions (create admin rows, bulk operations), use a secure server
--    function or the Supabase SQL editor with the service_role key (never expose service_role to clients).
--
-- End of RLS_POLICIES.sql
