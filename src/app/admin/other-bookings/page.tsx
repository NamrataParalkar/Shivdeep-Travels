"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { getAllBookings, updateBookingStatus, deleteBooking, OtherBooking } from "@/lib/otherBookings";

export default function ManageOtherBookingsPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [bookings, setBookings] = useState<OtherBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<OtherBooking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") {
        setAdminName(parsed.full_name || parsed.name || "Admin");
        loadBookings();
      } else {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await getAllBookings();
    if (error) {
      console.error("Error loading bookings:", error);
    } else if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (bookingId: number, newStatus: "Approved" | "Rejected") => {
    const { error } = await updateBookingStatus(bookingId, newStatus);
    if (error) {
      console.error("Error updating status:", error);
    } else {
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      setShowDetails(false);
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    const { error } = await deleteBooking(bookingId);
    if (error) {
      console.error("Error deleting booking:", error);
    } else {
      setBookings(bookings.filter((b) => b.id !== bookingId));
      setShowDetails(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const statusMatch = filterStatus === "All" || b.status === filterStatus;
    const typeMatch = filterType === "All" || b.booking_type === filterType;
    return statusMatch && typeMatch;
  });

  const uniqueTypes = Array.from(new Set(bookings.map((b) => b.booking_type)));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "Pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/70 hover:bg-purple-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-purple-700">Manage Other Bookings</h1>
            <p className="text-gray-600">Signed in as <span className="font-semibold text-purple-600">{adminName}</span></p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option>All</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-600">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-100 to-cyan-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Student ID</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Dates</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Pickup → Drop</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Passengers</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-gray-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-200 hover:bg-blue-50 transition">
                      <td className="px-6 py-4 text-gray-800 font-semibold">{booking.booking_type}</td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{booking.student_id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {booking.start_date}
                        {booking.end_date && ` → ${booking.end_date}`}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {booking.pickup_location} → {booking.drop_location}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{booking.passenger_count}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.status)}
                          <span className="font-semibold">{booking.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-8">
              <h2 className="text-2xl font-bold text-purple-700 mb-6">{selectedBooking.booking_type}</h2>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-semibold">{selectedBooking.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedBooking.status)}
                      <span className="font-semibold">{selectedBooking.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold">{selectedBooking.start_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold">{selectedBooking.end_date || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Pickup Location</p>
                    <p className="font-semibold">{selectedBooking.pickup_location}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Drop Location</p>
                    <p className="font-semibold">{selectedBooking.drop_location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Passengers</p>
                    <p className="font-semibold">{selectedBooking.passenger_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted On</p>
                    <p className="font-semibold">{new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedBooking.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-semibold">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
                {selectedBooking.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, "Approved")}
                      className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, "Rejected")}
                      className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition flex items-center gap-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedBooking.id)}
                  className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
