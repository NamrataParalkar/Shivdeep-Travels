"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Download, AlertCircle, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getStudentPayments,
  getStudentCurrentDue,
  getPaymentInvoice,
} from "@/lib/payments";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState("");

  // Current month due
  const [currentDue, setCurrentDue] = useState<any>(null);

  // Student enrollment status (from students table): not_enrolled | enrolled | suspended
  const [studentEnrollmentStatus, setStudentEnrollmentStatus] = useState<"not_enrolled" | "enrolled" | "suspended">("not_enrolled");

  // Bus enrollment status (from bus_enrollments table): pending | approved | rejected
  const [busEnrollmentStatus, setBusEnrollmentStatus] = useState<"pending" | "approved" | "rejected" | null>(null);

  // Payment history
  const [payments, setPayments] = useState<any[]>([]);
  const [canPay, setCanPay] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Get auth user
        let user = null;
        try {
          const maybe = await supabase.auth.getUser();
          user = maybe?.data?.user ?? null;
        } catch (err) {
          user = null;
        }

        if (!user && typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const obj = JSON.parse(stored);
              if (obj.authId || obj.id || obj.auth_id) {
                user = { id: obj.authId || obj.id || obj.auth_id, email: obj.email ?? null };
              }
            } catch (e) {
              // ignore
            }
          }
        }

        if (!user) {
          router.push("/login");
          return;
        }

        // Get student info
        const { data: studentData } = await supabase
          .from("students")
          .select("id, full_name")
          .eq("auth_id", user.id)
          .single();

        if (studentData) {
          setStudentId(studentData.id);
          setStudentName(studentData.full_name);

          // Fetch student enrollment status from students table
          try {
            const { data: studentRow } = await supabase
              .from("students")
              .select("enrollment_status")
              .eq("id", studentData.id)
              .single();

            if (studentRow && studentRow.enrollment_status) {
              setStudentEnrollmentStatus((studentRow.enrollment_status || "").toString().toLowerCase() as any);
            } else {
              setStudentEnrollmentStatus("not_enrolled");
            }
          } catch (err) {
            console.warn("Failed to fetch student enrollment status", err);
            setStudentEnrollmentStatus("not_enrolled");
          }

          // Fetch bus enrollment status from bus_enrollments table
          try {
            const { data: busEnrollmentRow } = await supabase
              .from("bus_enrollments")
              .select("status")
              .eq("student_id", studentData.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (busEnrollmentRow && busEnrollmentRow.status) {
              setBusEnrollmentStatus((busEnrollmentRow.status || "").toString().toLowerCase() as any);
            } else {
              setBusEnrollmentStatus(null);
            }
          } catch (err) {
            console.warn("Failed to fetch bus enrollment status", err);
            setBusEnrollmentStatus(null);
          }

          // Load current month due
          const { data: dueData } = await getStudentCurrentDue(studentData.id);
          if (dueData) {
            setCurrentDue(dueData);
            console.log("✅ Current Due loaded:", dueData);
          } else {
            console.warn("⚠️ No current due found (no approved enrollment or no fee set)");
            setCurrentDue(null);
          }

          // Compute canPay from DB
          try {
            const { canPay, error: canPayErr } = await (await import("@/lib/payments")).canPayNow(studentData.id);
            if (canPayErr) console.warn("❌ canPayNow error", canPayErr);
            console.log("📊 canPayNow result:", canPay);
            setCanPay(Boolean(canPay));
          } catch (e) {
            console.warn("❌ Failed to compute canPay", e);
            setCanPay(false);
          }

          // Load payment history
          const { data: paymentsData } = await getStudentPayments(studentData.id);
          if (paymentsData) {
            setPayments(paymentsData);
          }
        } else {
          setErrorMsg("Student profile not found");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load payments page");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Subscribe to realtime changes for enrollment updates so UI updates immediately
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`enrollments_student_${studentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bus_enrollments", filter: `student_id=eq.${studentId}` },
        (payload) => {
          // refresh bus enrollment status and dues
          (async () => {
            try {
              const { data: busEnrollmentRow } = await supabase
                .from("bus_enrollments")
                .select("status")
                .eq("student_id", studentId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              setBusEnrollmentStatus((busEnrollmentRow?.status || "").toString().toLowerCase() as any);

              // Refresh students table status too
              const { data: studentRow } = await supabase
                .from("students")
                .select("enrollment_status")
                .eq("id", studentId)
                .single();
              setStudentEnrollmentStatus((studentRow?.enrollment_status || "").toString().toLowerCase() as any);

              // Refresh dues and canPay
              const { data: dueData } = await getStudentCurrentDue(studentId);
              setCurrentDue(dueData || null);
              const { canPay } = await (await import("@/lib/payments")).canPayNow(studentId);
              setCanPay(Boolean(canPay));
            } catch (e) {
              console.warn("Realtime refresh error", e);
            }
          })();
        }
      )
      .subscribe();

    // also listen for student row updates
    const studentChannel = supabase
      .channel(`students_student_${studentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students", filter: `id=eq.${studentId}` },
        (payload) => {
          (async () => {
            try {
              const { data: studentRow } = await supabase
                .from("students")
                .select("enrollment_status")
                .eq("id", studentId)
                .single();
              setStudentEnrollmentStatus((studentRow?.enrollment_status || "").toString().toLowerCase() as any);
            } catch (e) {
              console.warn("Student realtime error", e);
            }
          })();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
        supabase.removeChannel(studentChannel);
      } catch (e) {
        // ignore
      }
    };
  }, [studentId]);

  const handlePayNow = async () => {
    // Validation before allowing payment
    if (!studentId) {
      setErrorMsg("Student ID not found");
      return;
    }

    if (!canPay) {
      setErrorMsg("Payment not allowed at this time");
      return;
    }

    if (!currentDue || currentDue.status === "paid") {
      setErrorMsg("No pending payment found for this month");
      return;
    }

    // Create a pending payment record in DB, then navigate to checkout
    try {
      const { data: pending, error } = await (await import("@/lib/payments")).createLocalPendingPayment({
        student_id: studentId,
        route_id: currentDue.route_id,
        month: currentDue.month,
        year: currentDue.year,
        amount: currentDue.amount,
      });
      if (error || !pending) {
        console.error("Failed to create pending payment", error);
        setErrorMsg("Failed to initiate payment");
        return;
      }

      router.push(`/payments/checkout?paymentId=${pending.id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to navigate to checkout");
    }
  };

  const loadPayments = async () => {
    if (!studentId) return;
    try {
      const { data } = await getStudentPayments(studentId);
      if (data) {
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      const { data: invoice } = await getPaymentInvoice(paymentId);
      if (invoice) {
        // Generate PDF - for now just show the invoice number
        alert(`Invoice Number: ${invoice.invoice_number}`);
        // In production, you would generate an actual PDF here
      }
    } catch (err) {
      setErrorMsg("Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-full shadow-sm transition"
            title="Back to Profile"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Bus Payments</h1>
        </div>

        {/* Persistent Pay Now control (always visible) */}
        <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Pay Monthly Bus Fee</h3>
            <p className="text-sm text-gray-600 mt-2">
              {studentEnrollmentStatus !== "enrolled" && (
                studentEnrollmentStatus === "not_enrolled" ?
                  "You are not enrolled yet. Please go to your profile and enroll for the bus service." :
                  (studentEnrollmentStatus === "suspended" ? "Your enrollment has been suspended. Contact admin." : "")
              )}
              {studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "pending" && (
                "Your enrollment request is pending approval. Please wait for admin confirmation."
              )}
              {studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "approved" && currentDue && (
                currentDue.status === "paid" ?
                  "Payment completed for this month. Next payment due in the next month." :
                  `Your enrollment is approved. Current due: ₹${currentDue.amount?.toFixed(2) || "0.00"}`
              )}
            </p>
          </div>
          <div>
            <button
              onClick={handlePayNow}
              disabled={!(studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "approved" && canPay && currentDue && currentDue.status !== "paid")}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
            >
              Pay Now
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-start gap-3">
            <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 font-semibold">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Payment Status Banner (centralized) */}
        <div className="mb-8">
          {studentEnrollmentStatus === "not_enrolled" && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-yellow-400">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">You are not enrolled</h3>
                  <p className="text-sm text-gray-600 mt-1">You are not enrolled for any bus service yet. Please enroll first.</p>
                </div>
                <div>
                  <button onClick={() => router.push('/bus/enroll')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Enroll</button>
                </div>
              </div>
            </div>
          )}

          {studentEnrollmentStatus === "suspended" && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-400">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Enrollment Suspended</h3>
                  <p className="text-sm text-gray-600 mt-1">Your enrollment has been suspended. Contact admin for details.</p>
                </div>
              </div>
            </div>
          )}

          {studentEnrollmentStatus === "enrolled" && !busEnrollmentStatus && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-yellow-400">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Please Select a Bus Route</h3>
                  <p className="text-sm text-gray-600 mt-1">You are enrolled but haven't selected a bus route yet. Please request a route.</p>
                </div>
                <div>
                  <button onClick={() => router.push('/bus/enroll')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Select Route</button>
                </div>
              </div>
            </div>
          )}

          {studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "pending" && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-yellow-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Bus Enrollment Pending</h3>
                <p className="text-sm text-gray-600 mt-1">Your bus enrollment request has been sent to the admin. Please wait for approval before paying.</p>
              </div>
            </div>
          )}

          {studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "approved" && currentDue && currentDue.status === "paid" && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-400">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Completed</h3>
                  <p className="text-sm text-gray-600 mt-1">Payment completed for this month.</p>
                </div>
              </div>
            </div>
          )}

          {studentEnrollmentStatus === "enrolled" && busEnrollmentStatus === "approved" && (!currentDue || currentDue.status === "pending") && (
            <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-400">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">✅ Enrollment Approved</h3>
                <p className="text-sm text-gray-600 mt-1">Your enrollment is approved and you can now pay the monthly bus fee using the Pay Now button above.</p>
              </div>
            </div>
          )}
        </div>

        {/* Current Month Due */}
        {currentDue && currentDue.status === "pending" && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Current Month Due</h2>
                <p className="text-gray-600">
                  {new Date(currentDue.year, currentDue.month - 1).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  ₹{currentDue.amount.toFixed(2)}
                </div>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                  Pending
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Route:</span>{" "}
                {currentDue.routes?.route_name || "Loading..."}
              </p>
            </div>

            {/* Pay Now is available via the Payment Status Banner above */}
          </div>
        )}

        {currentDue && currentDue.status === "paid" && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-8 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Current Month</h2>
                <p className="text-gray-600">
                  {new Date(currentDue.year, currentDue.month - 1).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  ₹{currentDue.amount.toFixed(2)}
                </div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center gap-2">
                  <Check size={16} /> Paid
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment History</h2>

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No payment history yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-100 to-cyan-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Month/Year
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Route
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-700 font-semibold">
                        {new Date(payment.year, payment.month - 1).toLocaleString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {payment.routes?.route_name || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-semibold">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === "paid" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                            <Check size={16} /> Paid
                          </span>
                        ) : payment.status === "pending" ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                            <X size={16} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <span className="capitalize">
                          {payment.payment_type === "online"
                            ? "Online"
                            : payment.payment_method || "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === "paid" && (
                          <button
                            onClick={() => handleDownloadInvoice(payment.id)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition font-semibold"
                          >
                            <Download size={18} /> Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
