-- Create student_bus_assignments table
-- This table tracks which student is assigned to which bus and route

CREATE TABLE IF NOT EXISTS public.student_bus_assignments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  bus_id BIGINT NOT NULL REFERENCES public.buses(id),
  route_id BIGINT NOT NULL REFERENCES public.routes(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  unassigned_at TIMESTAMPTZ
);

-- Constraint: Only one active assignment per student
-- A student can only be assigned to one bus at a time
-- Active assignment = where unassigned_at IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_single_active_assignment
ON public.student_bus_assignments(student_id)
WHERE unassigned_at IS NULL;

-- Index for fast lookups by student
CREATE INDEX IF NOT EXISTS idx_assignments_student_id
ON public.student_bus_assignments(student_id);

-- Index for fast lookups by bus (to count assigned students)
CREATE INDEX IF NOT EXISTS idx_assignments_bus_id
ON public.student_bus_assignments(bus_id)
WHERE unassigned_at IS NULL;

-- Index for fast lookups by route
CREATE INDEX IF NOT EXISTS idx_assignments_route_id
ON public.student_bus_assignments(route_id)
WHERE unassigned_at IS NULL;

-- Index for audit trail
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at
ON public.student_bus_assignments(assigned_at DESC);

-- Enable RLS
ALTER TABLE public.student_bus_assignments ENABLE ROW LEVEL SECURITY;
