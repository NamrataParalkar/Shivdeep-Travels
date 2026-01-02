-- Create bus_enrollments table for managing student bus enrollment requests and approvals
CREATE TABLE IF NOT EXISTS bus_enrollments (
  id BIGSERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  remarks TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for bus_enrollments
ALTER TABLE bus_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can insert their own enrollment requests
CREATE POLICY bus_enrollments_student_insert ON bus_enrollments
  FOR INSERT WITH CHECK (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Students can view their own enrollments
CREATE POLICY bus_enrollments_student_select ON bus_enrollments
  FOR SELECT USING (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can view all enrollments
CREATE POLICY bus_enrollments_admin_select ON bus_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can update enrollment status
CREATE POLICY bus_enrollments_admin_update ON bus_enrollments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bus_enrollments_student_id ON bus_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_bus_enrollments_route_id ON bus_enrollments(route_id);
CREATE INDEX IF NOT EXISTS idx_bus_enrollments_status ON bus_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_bus_enrollments_student_status ON bus_enrollments(student_id, status);
