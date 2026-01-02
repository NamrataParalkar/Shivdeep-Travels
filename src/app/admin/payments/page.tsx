"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Download, CheckCircle, X } from "lucide-react";
import { getAllPayments, markPaymentPaid, createOfflinePayment, setRouteFee, getStudentPayments } from "@/lib/payments";

interface Payment {
  id: number;
  student_id: number;
  student_name: string;
  student_class: string;
  route_id: number;
  route_name: string;
  month: number;
  year: number;
  amount: number;
  payment_type: "online" | "offline";
  status: "paid" | "pending" | "failed";
  payment_date?: string;
  invoice_number?: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [routes, setRoutes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Modals
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [offlineData, setOfflineData] = useState({ student_id: "", route_id: "", amount: "", method: "cash" });
  const [feeData, setFeeData] = useState({ route_id: "", monthly_amount: "" });
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "admin") router.push("/login");
    } else router.push("/login");

    fetchPayments();
  }, [month, year, status, routeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getAllPayments({
        month: month !== 0 ? month : undefined,
        year: year !== 0 ? year : undefined,
        status: status !== "all" ? status : undefined,
        route_id: routeFilter !== "all" ? parseInt(routeFilter) : undefined,
      });

      if (response.data) {
        const flattenedPayments = response.data.map((payment: any) => ({
          id: payment.id,
          student_id: payment.student_id,
          student_name: payment.students?.full_name || "Unknown",
          student_class: payment.students?.student_class || "N/A",
          route_id: payment.route_id,
          route_name: payment.routes?.route_name || "Unknown",
          month: payment.month,
          year: payment.year,
          amount: payment.amount,
          payment_type: payment.payment_type,
          status: payment.status,
          payment_date: payment.created_at,
          invoice_number: payment.payment_invoices && payment.payment_invoices.length > 0 
            ? payment.payment_invoices[0].invoice_number 
            : undefined,
        }));
        setPayments(flattenedPayments);
        setFilteredPayments(flattenedPayments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (paymentId: number) => {
    if (!window.confirm("Mark this payment as paid?")) return;
    
    try {
      setProcessingId(paymentId);
      await markPaymentPaid(paymentId);
      fetchPayments();
      alert("Payment marked as paid successfully!");
    } catch (error) {
      alert("Error marking payment as paid");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddOfflinePayment = async () => {
    if (!offlineData.student_id || !offlineData.route_id || !offlineData.amount) {
      alert("Please fill all fields");
      return;
    }

    try {
      setProcessingId(-1);
      await createOfflinePayment({
        student_id: parseInt(offlineData.student_id),
        route_id: parseInt(offlineData.route_id),
        month,
        year,
        amount: parseFloat(offlineData.amount),
        payment_method: offlineData.method,
      });
      setShowOfflineModal(false);
      setOfflineData({ student_id: "", route_id: "", amount: "", method: "cash" });
      fetchPayments();
      alert("Offline payment recorded successfully!");
    } catch (error: any) {
      alert(error.message || "Error recording offline payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetFee = async () => {
    if (!feeData.route_id || !feeData.monthly_amount) {
      alert("Please fill all fields");
      return;
    }

    try {
      setProcessingId(-2);
      await setRouteFee({
        route_id: parseInt(feeData.route_id),
        monthly_amount: parseFloat(feeData.monthly_amount),
      });
      setShowFeeModal(false);
      setFeeData({ route_id: "", monthly_amount: "" });
      alert("Route fee updated successfully!");
    } catch (error) {
      alert("Error setting route fee");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadInvoice = (invoiceNumber: string | undefined) => {
    if (!invoiceNumber) {
      alert("Invoice not available");
      return;
    }
    alert(`Invoice: ${invoiceNumber}`);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4 md:p-10">
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/70 hover:bg-pink-100 text-pink-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-pink-500 to-rose-400 bg-clip-text text-transparent">
            Payment Management
          </h1>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg border-2 border-pink-200 bg-white/80 focus:outline-none focus:border-pink-400"
          >
            <option value="0">All Months</option>
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg border-2 border-pink-200 bg-white/80 focus:outline-none focus:border-pink-400"
          >
            <option value="0">All Years</option>
            {[...Array(3)].map((_, i) => {
              const y = currentYear - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-pink-200 bg-white/80 focus:outline-none focus:border-pink-400"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-pink-200 bg-white/80 focus:outline-none focus:border-pink-400"
          >
            <option value="all">All Routes</option>
            {/* Routes will be populated from routes table */}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setShowOfflineModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg shadow-md transition font-semibold"
            >
              <Plus size={18} /> Add Offline
            </button>
            <button
              onClick={() => setShowFeeModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg shadow-md transition font-semibold"
            >
              <Plus size={18} /> Set Fee
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600">No payments found.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-pink-100 to-rose-100">
                <tr>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Student</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Class</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Route</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Month/Year</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Amount</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Type</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Status</th>
                  <th className="px-4 py-4 text-left text-gray-800 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-gray-200 hover:bg-pink-50 transition">
                    <td className="px-4 py-4 text-gray-800 font-medium">{payment.student_name}</td>
                    <td className="px-4 py-4 text-gray-600">{payment.student_class}</td>
                    <td className="px-4 py-4 text-gray-600">{payment.route_name}</td>
                    <td className="px-4 py-4 text-gray-600">{monthNames[payment.month - 1]} {payment.year}</td>
                    <td className="px-4 py-4 text-gray-800 font-semibold">₹{payment.amount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.payment_type === "online"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {payment.payment_type === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 flex gap-2">
                      {payment.status === "pending" && (
                        <button
                          onClick={() => handleMarkPaid(payment.id)}
                          disabled={processingId === payment.id}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 transition disabled:opacity-50"
                          title="Mark as Paid"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {payment.invoice_number && (
                        <button
                          onClick={() => handleDownloadInvoice(payment.invoice_number)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                          title="Download Invoice"
                        >
                          <Download size={18} />
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

      {/* Add Offline Payment Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Record Offline Payment</h2>
              <button onClick={() => setShowOfflineModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
                <input
                  type="number"
                  value={offlineData.student_id}
                  onChange={(e) => setOfflineData({ ...offlineData, student_id: e.target.value })}
                  placeholder="Student ID"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                <input
                  type="number"
                  value={offlineData.route_id}
                  onChange={(e) => setOfflineData({ ...offlineData, route_id: e.target.value })}
                  placeholder="Route ID"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={offlineData.amount}
                  onChange={(e) => setOfflineData({ ...offlineData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <select
                  value={offlineData.method}
                  onChange={(e) => setOfflineData({ ...offlineData, method: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                >
                  <option value="cash">Cash</option>
                  <option value="manual_upi">Manual UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowOfflineModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOfflinePayment}
                  disabled={processingId === -1}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition font-semibold disabled:opacity-50"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Route Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Set Route Fee</h2>
              <button onClick={() => setShowFeeModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                <input
                  type="number"
                  value={feeData.route_id}
                  onChange={(e) => setFeeData({ ...feeData, route_id: e.target.value })}
                  placeholder="Route ID"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Amount (₹)</label>
                <input
                  type="number"
                  value={feeData.monthly_amount}
                  onChange={(e) => setFeeData({ ...feeData, monthly_amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetFee}
                  disabled={processingId === -2}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-semibold disabled:opacity-50"
                >
                  Update Fee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
