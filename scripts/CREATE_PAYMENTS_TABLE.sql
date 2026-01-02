-- Create payments table for all transactions (online and offline)
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT, -- 'upi', 'card', 'netbanking', 'cash', 'manual_upi', etc.
  payment_type TEXT NOT NULL CHECK (payment_type IN ('online', 'offline')),
  gateway_order_id TEXT UNIQUE, -- Razorpay order ID
  gateway_payment_id TEXT UNIQUE, -- Razorpay payment ID
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, route_id, month, year)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_route_id ON payments(route_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
CREATE INDEX IF NOT EXISTS idx_payments_student_status ON payments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON payments(gateway_order_id);

-- Add RLS policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Students can view ONLY their own payments
CREATE POLICY payments_student_select ON payments
  FOR SELECT USING (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Students can insert their own pending payments (online)
CREATE POLICY payments_student_insert ON payments
  FOR INSERT WITH CHECK (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
    AND payment_type = 'online'
  );

-- Students can update their own payments (status only via webhook)
CREATE POLICY payments_student_update ON payments
  FOR UPDATE USING (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id = (
      SELECT id FROM students
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can view all payments
CREATE POLICY payments_admin_select ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can insert offline payments
CREATE POLICY payments_admin_insert ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

-- Admin can update any payment (for marking offline payments as paid)
CREATE POLICY payments_admin_update ON payments
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

-- Service role can update payments (for webhook processing)
CREATE POLICY payments_service_update ON payments
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
