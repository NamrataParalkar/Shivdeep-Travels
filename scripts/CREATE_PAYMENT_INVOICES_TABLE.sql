-- Create payment_invoices table for receipts and invoices
CREATE TABLE IF NOT EXISTS payment_invoices (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_invoices_payment_id ON payment_invoices(payment_id);

-- Add RLS policies for payment_invoices
ALTER TABLE payment_invoices ENABLE ROW LEVEL SECURITY;

-- Students can view invoices for their own payments
CREATE POLICY payment_invoices_student_select ON payment_invoices
  FOR SELECT USING (
    payment_id IN (
      SELECT id FROM payments
      WHERE student_id = (
        SELECT id FROM students
        WHERE auth_id = auth.uid()
      )
    )
  );

-- Service role can insert invoices (for payment verification webhook)
CREATE POLICY payment_invoices_service_insert ON payment_invoices
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admin can view all invoices
CREATE POLICY payment_invoices_admin_select ON payment_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE auth_id = auth.uid()
    )
  );
