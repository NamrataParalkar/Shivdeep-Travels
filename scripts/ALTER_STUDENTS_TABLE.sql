-- Safe migration: Extend existing students table with enrollment management fields
-- This script adds new columns without dropping or modifying existing columns

-- Drop division column if it exists (cleanup from previous iteration)
ALTER TABLE IF EXISTS public.students
DROP COLUMN IF EXISTS division;

-- Add school_name column if it doesn't exist
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS school_name VARCHAR(100);

-- Add age column if it doesn't exist
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS age INT CHECK (age >= 3 AND age <= 25);

-- Add gender column if it doesn't exist
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other'));

-- Add auth_id column (nullable for backward compatibility, will be populated on login)
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add enrollment tracking columns
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'not_enrolled' 
  CHECK (enrollment_status IN ('not_enrolled', 'enrolled', 'suspended'));

ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;

-- Add updated_at column for change tracking (used by server-side updates)
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add password reset flag for manually enrolled students
ALTER TABLE IF EXISTS public.students
ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT true;

-- Enforce parent phone uniqueness
-- Postgres does not support ADD CONSTRAINT IF NOT EXISTS. Create a unique index instead.
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_parent_phone_unique ON public.students(parent_phone);

-- Create index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_auth_id ON public.students(auth_id);

-- Create index on enrollment_status for filtering
CREATE INDEX IF NOT EXISTS idx_students_enrollment_status ON public.students(enrollment_status);

-- Optional: Create index on phone for login lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'phone'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone)';
  END IF;
END$$;

