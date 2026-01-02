import { supabase } from "./supabaseClient";

export type PaymentFee = {
  id: number;
  route_id: number;
  monthly_amount: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: number;
  student_id: number;
  route_id: number;
  month: number;
  year: number;
  amount: number;
  payment_method?: string;
  payment_type: "online" | "offline";
  gateway_order_id?: string;
  gateway_payment_id?: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
  updated_at: string;
};

export type PaymentInvoice = {
  id: number;
  payment_id: number;
  invoice_number: string;
  generated_at: string;
};

// ===== PAYMENT FEES =====

// Get current fee for a route
export async function getRouteFee(routeId: number) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("payment_fees")
      .select("*")
      .eq("route_id", routeId)
      .lte("effective_from", today)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("❌ Error fetching fee for route", routeId, error);
      return { data: undefined, error };
    }
    if (!data) {
      console.warn("⚠️ No fee found for route", routeId, "— admin must set a fee first");
    }
    return { data: (data || null) as PaymentFee | null };
  } catch (err) {
    console.error("❌ Exception in getRouteFee:", err);
    return { data: undefined, error: { message: String(err) } };
  }
}

// Set fee for a route (admin only)
export async function setRouteFee(payload: {
  route_id: number;
  monthly_amount: number;
  effective_from: string;
}) {
  try {
    const { data, error } = await supabase
      .from("payment_fees")
      .insert({
        route_id: payload.route_id,
        monthly_amount: payload.monthly_amount,
        effective_from: payload.effective_from,
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as PaymentFee };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// ===== PAYMENTS =====

// Get student's payments
export async function getStudentPayments(studentId: number) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, routes(id, route_name)")
      .eq("student_id", studentId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: (data || []) as any[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get all payments (admin)
export async function getAllPayments(filters?: {
  month?: number;
  year?: number;
  status?: string;
  route_id?: number;
  student_id?: number;
}) {
  try {
    let query = supabase
      .from("payments")
      .select("*, routes(id, route_name), students(id, full_name, student_class, parent_phone), payment_invoices(invoice_number))")
      .order("created_at", { ascending: false });

    if (filters?.month) query = query.eq("month", filters.month);
    if (filters?.year) query = query.eq("year", filters.year);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.route_id) query = query.eq("route_id", filters.route_id);
    if (filters?.student_id) query = query.eq("student_id", filters.student_id);

    const { data, error } = await query;

    if (error) return { data: undefined, error };
    return { data: (data || []) as any[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get current month due for a student
export async function getStudentCurrentDue(studentId: number) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get student's latest enrollment to find their route (case-insensitive status check)
    const { data: enrollmentRow, error: enrollErr } = await supabase
      .from("bus_enrollments")
      .select("route_id, status")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollErr) return { data: null, error: enrollErr };
    if (!enrollmentRow) return { data: null, error: null };

    const enrollmentStatus = (enrollmentRow.status || "").toString().toLowerCase();
    if (enrollmentStatus !== "approved") {
      return { data: null, error: null };
    }

    const routeId = enrollmentRow.route_id;

    // Check if payment already exists for this month (use maybeSingle to handle "no rows" gracefully)
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("student_id", studentId)
      .eq("route_id", routeId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    // If payment exists, return it
    if (paymentData) {
      console.log("✅ Payment record found for current month:", paymentData);
      return {
        data: paymentData,
        error: null,
      };
    }

    // No payment exists yet, so calculate dues from fee
    console.log("📊 No payment record yet, fetching route fee...");
    const { data: feeData } = await getRouteFee(routeId);

    if (!feeData) {
      console.warn("⚠️ No fee set for route", routeId);
      return { data: null, error: null };
    }

    console.log("✅ Fee found:", feeData);
    return {
      data: {
        student_id: studentId,
        route_id: routeId,
        month,
        year,
        amount: feeData.monthly_amount,
        status: "pending",
        routes: { id: routeId, route_name: "" },
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: String(err) } };
  }
}

// Create pending payment for Razorpay (student)
export async function createPendingPayment(payload: {
  student_id: number;
  route_id: number;
  month: number;
  year: number;
  amount: number;
  gateway_order_id: string;
}) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: payload.student_id,
        route_id: payload.route_id,
        month: payload.month,
        year: payload.year,
        amount: payload.amount,
        payment_type: "online",
        gateway_order_id: payload.gateway_order_id,
        status: "pending",
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Verify and update payment (webhook)
export async function verifyPayment(payload: {
  gateway_order_id: string;
  gateway_payment_id: string;
  amount: number;
}) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .update({
        gateway_payment_id: payload.gateway_payment_id,
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_order_id", payload.gateway_order_id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) return { data: undefined, error };

    // Generate invoice
    if (data) {
      await generateInvoice(data.id);
    }

    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create offline payment (admin)
export async function createOfflinePayment(payload: {
  student_id: number;
  route_id: number;
  month: number;
  year: number;
  amount: number;
  payment_method?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: payload.student_id,
        route_id: payload.route_id,
        month: payload.month,
        year: payload.year,
        amount: payload.amount,
        payment_type: "offline",
        payment_method: payload.payment_method || "cash",
        status: "paid",
      })
      .select()
      .single();

    if (error) return { data: undefined, error };

    // Generate invoice
    if (data) {
      await generateInvoice(data.id);
    }

    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Mark offline payment as paid (admin)
export async function markPaymentPaid(paymentId: number) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (error) return { data: undefined, error };

    // Generate invoice if not exists
    if (data) {
      await generateInvoice(data.id);
    }

    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// ===== INVOICES =====

// Generate invoice number and record
async function generateInvoice(paymentId: number) {
  try {
    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from("payment_invoices")
      .select("*")
      .eq("payment_id", paymentId)
      .single();

    if (existingInvoice) {
      return { data: existingInvoice };
    }

    // Generate invoice number: INV-YYYYMMDD-{paymentId}
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    const invoiceNumber = `INV-${dateStr}-${paymentId}`;

    const { data, error } = await supabase
      .from("payment_invoices")
      .insert({
        payment_id: paymentId,
        invoice_number: invoiceNumber,
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as PaymentInvoice };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Check if student has a successful payment for current month
export async function checkCurrentMonthPaymentExists(studentId: number) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data, error } = await supabase
      .from("payments")
      .select("id")
      .eq("student_id", studentId)
      .eq("month", month)
      .eq("year", year)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (err) {
    return { exists: false, error: { message: String(err) } };
  }
}

// Determine whether the student can pay now (DB-driven)
export async function canPayNow(studentId: number) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get student's latest enrollment and check status case-insensitively
    const { data: enrollmentData, error: enrollErr } = await supabase
      .from("bus_enrollments")
      .select("route_id, status")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollErr) return { canPay: false, error: enrollErr };
    if (!enrollmentData) return { canPay: false, error: null };

    const enrollmentStatus = (enrollmentData.status || "").toString().toLowerCase();
    if (enrollmentStatus !== "approved") {
      return { canPay: false, error: null };
    }

    const routeId = enrollmentData.route_id;

    // Check if a successful payment exists for this student/route/month
    const { data: paymentData, error: paymentErr } = await supabase
      .from("payments")
      .select("id")
      .eq("student_id", studentId)
      .eq("route_id", routeId)
      .eq("month", month)
      .eq("year", year)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();

    if (paymentErr) return { canPay: false, error: paymentErr };
    if (paymentData) return { canPay: false, error: null };

    return { canPay: true, error: null };
  } catch (err) {
    return { canPay: false, error: { message: String(err) } };
  }
}

// Insert a pending payment record (before gateway order)
export async function createLocalPendingPayment(payload: {
  student_id: number;
  route_id: number;
  month: number;
  year: number;
  amount: number;
}) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: payload.student_id,
        route_id: payload.route_id,
        month: payload.month,
        year: payload.year,
        amount: payload.amount,
        payment_type: "online",
        status: "pending",
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch a payment by id
export async function getPaymentById(paymentId: number) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, routes(id, route_name)")
      .eq("id", paymentId)
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Payment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get payment invoice for a payment
export async function getPaymentInvoice(paymentId: number) {
  try {
    const { data, error } = await supabase
      .from("payment_invoices")
      .select("*")
      .eq("payment_id", paymentId)
      .single();

    if (error && error.code !== "PGRST116") {
      return { data: undefined, error };
    }
    return { data: (data || null) as PaymentInvoice | null };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}
