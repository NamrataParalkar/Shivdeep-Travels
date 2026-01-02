-- Create route_requests table for student requests to add new stops/routes
CREATE TABLE IF NOT EXISTS route_requests (
  id BIGSERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  requested_stop TEXT NOT NULL,
  area TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for route_requests
ALTER TABLE route_requests ENABLE ROW LEVEL SECURITY;

-- Students can insert their own route requests
CREATE POLICY route_requests_student_insert ON route_requests
  FOR INSERT WITH CHECK (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Students can view their own route requests
CREATE POLICY route_requests_student_select ON route_requests
  FOR SELECT USING (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can view all route requests
CREATE POLICY route_requests_admin_select ON route_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can update route request status
CREATE POLICY route_requests_admin_update ON route_requests
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

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS idx_route_requests_student_id ON route_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_route_requests_status ON route_requests(status);
