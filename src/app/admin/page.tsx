"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Bus,
  BarChart3,
  Map,
  Bell,
  Route,
  UserCheck,
  CreditCard,
  MessageCircle,
  Settings,
  LogOut,
  UserCircle,
  AlertCircle,
  Cog,
  Phone,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name);
      else router.push("/login");
    } else router.push("/login");
  }, []);

  const modules = [
    {
      category: "User Management",
      cards: [
        {
          title: "Manage Students",
          icon: <Users className="h-10 w-10 text-purple-600 drop-shadow-md" />,
          description: "View, edit, or remove student records.",
          link: "/admin/students",
          border: "border-purple-400",
          bgGradient: "from-purple-50 to-purple-100/50",
        },
        {
          title: "Manage Drivers",
          icon: <UserCheck className="h-10 w-10 text-pink-500 drop-shadow-md" />,
          description: "Add, update, or delete driver details.",
          link: "/admin/drivers",
          border: "border-pink-400",
          bgGradient: "from-pink-50 to-pink-100/50",
        },
      ],
    },
    {
      category: "Fleet Management",
      cards: [
        {
          title: "Manage Buses",
          icon: <Bus className="h-10 w-10 text-yellow-500 drop-shadow-md" />,
          description: "Maintain bus details and capacities.",
          link: "/admin/buses",
          border: "border-yellow-400",
          bgGradient: "from-yellow-50 to-yellow-100/50",
        },
        {
          title: "Manage Routes",
          icon: <Map className="h-10 w-10 text-green-500 drop-shadow-md" />,
          description: "Define and manage bus routes and stops.",
          link: "/admin/routes",
          border: "border-green-400",
          bgGradient: "from-green-50 to-green-100/50",
        },
      ],
    },
    {
      category: "Operations",
      cards: [
        {
          title: "Assign Bus to Students",
          icon: <Route className="h-10 w-10 text-orange-500 drop-shadow-md" />,
          description: "Assign students to buses and track allocation.",
          link: "/admin/assignments",
          border: "border-orange-400",
          bgGradient: "from-orange-50 to-orange-100/50",
        },
        {
          title: "View Payment Records",
          icon: <CreditCard className="h-10 w-10 text-pink-600 drop-shadow-md" />,
          description: "Track student payments and history.",
          link: "/admin/payments",
          border: "border-pink-400",
          bgGradient: "from-pink-50 to-pink-100/50",
        },
      ],
    },
    {
      category: "Communication & Support",
      cards: [
        {
          title: "Send Notifications",
          icon: <Bell className="h-10 w-10 text-rose-600 drop-shadow-md" />,
          description: "Send updates to students and drivers.",
          link: "/admin/notifications",
          border: "border-rose-400",
          bgGradient: "from-rose-50 to-rose-100/50",
        },
        {
          title: "View Complaints & Feedback",
          icon: <MessageCircle className="h-10 w-10 text-violet-600 drop-shadow-md" />,
          description: "Review and respond to user feedback.",
          link: "/admin/feedback",
          border: "border-violet-400",
          bgGradient: "from-violet-50 to-violet-100/50",
        },
        {
          title: "Manage Contact Info",
          icon: <Phone className="h-10 w-10 text-blue-600 drop-shadow-md" />,
          description: "Add and manage contact information for students.",
          link: "/admin/contact-info",
          border: "border-blue-400",
          bgGradient: "from-blue-50 to-blue-100/50",
        },
      ],
    },
    {
      category: "Booking Management",
      cards: [
        {
          title: "Manage Other Bookings",
          icon: <CreditCard className="h-10 w-10 text-blue-600 drop-shadow-md" />,
          description: "Manage special trip and event bookings.",
          link: "/admin/other-bookings",
          border: "border-blue-400",
          bgGradient: "from-blue-50 to-blue-100/50",
        },
      ],
    },
    {
      category: "Analytics & Settings",
      cards: [
        {
          title: "Reports & Analytics",
          icon: <BarChart3 className="h-10 w-10 text-indigo-600 drop-shadow-md" />,
          description: "View performance and analytics.",
          link: "/admin/reports",
          border: "border-indigo-400",
          bgGradient: "from-indigo-50 to-indigo-100/50",
        },
        {
          title: "Admin Profile & Settings",
          icon: <Cog className="h-10 w-10 text-slate-600 drop-shadow-md" />,
          description: "Edit profile, password, and admin settings.",
          link: "/admin/settings",
          border: "border-slate-400",
          bgGradient: "from-slate-50 to-slate-100/50",
        },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10"
    >
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center mb-12">
        <div className="flex-1 text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-md">
            Admin Dashboard
          </h1>
          <p className="text-gray-700 text-lg mt-2">
            Welcome back, <span className="font-semibold">{adminName}</span> 👋
          </p>
        </div>

        {/* Top-right controls */}
        <div className="flex items-center gap-5 ml-auto">
          <button
            onClick={() => router.push("/profile/admin")}
            className="flex items-center gap-2 bg-white/70 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <UserCircle size={22} />
            <span className="font-medium">Profile</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-full shadow-md transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="relative z-10">
        {modules.map((module, moduleIndex) => (
          <div key={moduleIndex} className="mb-12">
            {/* Category Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {module.category}
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 rounded-full mt-2"></div>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {module.cards.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  onClick={() => router.push(card.link)}
                  className={`cursor-pointer bg-gradient-to-br ${card.bgGradient} 
                    hover:to-current backdrop-blur-sm 
                    rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300
                    transform hover:-translate-y-1 p-8 border-2 ${card.border}
                    hover:scale-102 hover:bg-white`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                  <div className="mt-6 flex items-center text-gray-700 font-medium text-sm">
                    <span>Access Module</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
