"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { createBooking, getStudentBookings, OtherBooking } from "@/lib/otherBookings";

const BOOKING_TYPES = [
  "School Trip",
  "Tuition Trip",
  "Wedding",
  "Function",
  "1-Day",
  "2-Day",
  "Weekly",
  "Other",
];

export default function OtherBookingsPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");

  // Form state
  const [bookingType, setBookingType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState("");

  // UI state
  const [bookings, setBookings] = useState<OtherBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "student" || parsed.role === "parent") {
        setStudentId(parsed.id || parsed.auth_id || "");
        setStudentName(parsed.full_name || parsed.name || "Student");
        loadBookings(parsed.id || parsed.auth_id || "");
      } else {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadBookings = async (sid: string) => {
    setLoading(true);
    try {
      const { data, error } = await getStudentBookings(sid);
      if (error) {
        let msg = "Unknown error";
        try {
          msg = (error && error.message) || JSON.stringify(error);
        } catch (e) {
          msg = String(error);
        }
        console.error("Error loading bookings:", msg);
        setErrorMsg("Failed to load bookings. Please try again.");
      } else if (data) {
        setBookings(data);
      }
    } catch (err) {
      console.error("Unexpected error loading bookings:", String(err));
      setErrorMsg("Unexpected error loading bookings. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingType || !startDate || !pickupLocation || !dropLocation) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await createBooking(studentId, {
        booking_type: bookingType,
        start_date: startDate,
        end_date: endDate || undefined,
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        passenger_count: passengerCount,
        notes: notes || undefined,
      });

      if (error) {
        let msg = "Failed to submit booking";
        try {
          msg = (error && error.message) || String(error);
        } catch (e) {
          msg = "Failed to submit booking. Please try again.";
        }
        setErrorMsg(msg);
        console.error(error);
      } else if (data) {
        setSuccessMsg("Booking submitted successfully!");
        setBookings([data, ...bookings]);
        // Reset form
        setBookingType("");
        setStartDate("");
        setEndDate("");
        setPickupLocation("");
        setDropLocation("");
        setPassengerCount(1);
        setNotes("");
        setShowForm(false);
      }
    } catch (err) {
      const msg = String(err || "Unexpected error");
      console.error("Unexpected error submitting booking:", msg);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 border-green-200 text-green-800";
      case "Rejected":
        return "bg-red-50 border-red-200 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-white/70 hover:bg-purple-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-purple-700">Other Bookings</h1>
              <p className="text-gray-600">
                Hello, <span className="font-semibold text-purple-600">{studentName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
          >
            <Plus size={20} /> New Booking
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <div>
              <strong>❌ Error:</strong>
              <div className="mt-1 text-sm">{errorMsg}</div>
              <div className="mt-2 text-xs text-gray-600">If the issue persists, ensure the <code className="bg-gray-100 px-1 rounded">other_bookings</code> table exists in Supabase. Run: <code className="bg-gray-100 px-1 rounded">scripts/CREATE_OTHER_BOOKINGS_TABLE.sql</code></div>
            </div>
          </div>
        )}

        {/* New Booking Form */}
        {showForm && (
          <div className="mb-8 bg-white shadow-lg rounded-2xl p-8 border-l-4 border-purple-600">
            <h2 className="text-2xl font-bold text-purple-700 mb-6">Submit New Booking</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Booking Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Booking Type *
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select booking type...</option>
                    {BOOKING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Passenger Count */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Passengers *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pickup Location *
                  </label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g., Home, School"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Drop Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Drop Location *
                  </label>
                  <input
                    type="text"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    placeholder="e.g., Venue, School"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or additional information..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none h-20 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:opacity-90 disabled:opacity-60 transition"
                >
                  {submitting ? "Submitting..." : "Submit Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Booking History */}
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">Booking History</h2>

          {loading ? (
            <div className="text-center text-gray-600">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No bookings yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                <Plus size={18} /> Create Your First Booking
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-6 rounded-lg border-l-4 ${getStatusColor(booking.status)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(booking.status)}
                      <div>
                        <h3 className="text-lg font-semibold">{booking.booking_type}</h3>
                        <p className="text-sm opacity-75">
                          Submitted on {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/60 text-sm font-semibold">
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Dates:</span> {booking.start_date}
                      {booking.end_date && ` to ${booking.end_date}`}
                    </div>
                    <div>
                      <span className="font-semibold">Passengers:</span> {booking.passenger_count}
                    </div>
                    <div>
                      <span className="font-semibold">Pickup:</span> {booking.pickup_location}
                    </div>
                    <div>
                      <span className="font-semibold">Drop:</span> {booking.drop_location}
                    </div>
                    {booking.notes && (
                      <div className="md:col-span-2">
                        <span className="font-semibold">Notes:</span> {booking.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
