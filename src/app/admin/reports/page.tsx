"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ReportsAnalytics() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDrivers: 0,
    totalBuses: 0,
    totalRoutes: 0,
    activeBookings: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name);
      else router.push("/login");
    } else router.push("/login");

    // TODO: Fetch analytics data from Supabase
    setLoading(false);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10"
    >
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-300 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/70 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Stat Cards */}
            {[
              { label: "Total Students", value: stats.totalStudents, color: "purple" },
              { label: "Total Drivers", value: stats.totalDrivers, color: "pink" },
              { label: "Total Buses", value: stats.totalBuses, color: "yellow" },
              { label: "Total Routes", value: stats.totalRoutes, color: "green" },
              { label: "Active Bookings", value: stats.activeBookings, color: "orange" },
              { label: "Total Payments", value: `₹${stats.totalPayments}`, color: "indigo" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 rounded-2xl shadow-lg p-8 border-2 border-${stat.color}-400`}
              >
                <p className={`text-gray-600 text-sm font-medium mb-2`}>{stat.label}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-400 bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Bus Occupancy</h3>
            <div className="h-80 flex items-center justify-center text-gray-400">
              [Chart will be rendered here with Recharts]
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Status</h3>
            <div className="h-80 flex items-center justify-center text-gray-400">
              [Chart will be rendered here with Recharts]
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Route Usage</h3>
          <div className="h-80 flex items-center justify-center text-gray-400">
            [Chart will be rendered here with Recharts]
          </div>
        </div>
      </div>
    </div>
  );
}
