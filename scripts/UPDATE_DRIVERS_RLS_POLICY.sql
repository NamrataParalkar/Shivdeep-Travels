-- Update RLS Policies for Drivers Table to Allow Students to View All Drivers
-- Run this in Supabase SQL Editor to fix the drivers visibility issue

-- Drop old policies
DROP POLICY IF EXISTS "prod_drivers_select_own_or_admin" ON public.drivers;

-- Create new policy to allow all authenticated users to view drivers
CREATE POLICY "prod_drivers_select_authenticated"
  ON public.drivers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Existing update policy for drivers to update their own record (keep unchanged)
-- Existing admin manage policy (keep unchanged)

-- Test: You should now be able to fetch all drivers as an authenticated user
-- SELECT * FROM public.drivers;
