"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bus, Users, UserCog, Map, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDrivers: 0,
    totalBuses: 0,
    activeRoutes: 0,
    todayTrips: 0,
  });

  // ✅ Fetch stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: studentCount } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true });

        const { count: driverCount } = await supabase
          .from("drivers")
          .select("*", { count: "exact", head: true });

        const { count: busCount } = await supabase
          .from("buses")
          .select("*", { count: "exact", head: true });

        // Placeholder values for routes and trips (add real tables later)
        setStats({
          totalStudents: studentCount || 0,
          totalDrivers: driverCount || 0,
          totalBuses: busCount || 0,
          activeRoutes: 5,
          todayTrips: 12,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      }
    };

    fetchStats();
  }, []);

  // 🎨 Card component
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div
      className={`flex items-center justify-between bg-white rounded-2xl shadow-md p-6 transition hover:shadow-lg border-l-4 ${color}`}
    >
      <div>
        <h3 className="text-gray-500 font-medium">{label}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full text-white">
        <Icon size={28} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      <h1 className="text-4xl font-extrabold text-slate-800 mb-8 text-center">
        Admin Dashboard
      </h1>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          color="border-pink-400"
        />
        <StatCard
          icon={UserCog}
          label="Total Drivers"
          value={stats.totalDrivers}
          color="border-purple-400"
        />
        <StatCard
          icon={Bus}
          label="Total Buses"
          value={stats.totalBuses}
          color="border-blue-400"
        />
        <StatCard
          icon={Map}
          label="Active Routes"
          value={stats.activeRoutes}
          color="border-green-400"
        />
        <StatCard
          icon={Clock}
          label="Today's Trips"
          value={stats.todayTrips}
          color="border-yellow-400"
        />
      </div>

      {/* Add-on Section */}
      <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Quick Overview
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Welcome to the <strong>Shivdeep Travels Admin Panel</strong>.  
          Manage all buses, drivers, and routes efficiently. You can monitor
          real-time activity, update records, and ensure smooth school
          transportation operations.
        </p>
      </div>
    </div>
  );
}
