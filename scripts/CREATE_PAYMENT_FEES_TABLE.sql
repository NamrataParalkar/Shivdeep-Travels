-- Create payment_fees table for managing monthly fees by route
CREATE TABLE IF NOT EXISTS payment_fees (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(10,2) NOT NULL CHECK (monthly_amount > 0),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint to prevent duplicate fees for same route and effective date
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_fees_route_date 
  ON payment_fees(route_id, effective_from);

-- Add RLS policies for payment_fees
ALTER TABLE payment_fees ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage fees
CREATE POLICY payment_fees_admin_select ON payment_fees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY payment_fees_admin_insert ON payment_fees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY payment_fees_admin_update ON payment_fees
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

-- Students can view fees (but not modify)
CREATE POLICY payment_fees_student_select ON payment_fees
  FOR SELECT USING (true);
