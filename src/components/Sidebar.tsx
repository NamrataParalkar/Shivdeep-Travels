"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Home,
  MapPin,
  User,
  CreditCard,
  Bell,
  Map,
  ChevronLeft,
  FileText,
  Phone,
  Building2,
  MessageSquare,
} from "lucide-react";

//  Define routes properly - all routes point to existing student/user pages (NOT admin)
const items = [
  { key: "home", label: "Home", icon: Home, href: "/" },
  { key: "track", label: "Track Bus", icon: MapPin, href: "/bus_routes" },
  { key: "drivers", label: "Driver Details", icon: User, href: "/drivers" },
  { key: "payments", label: "Payments", icon: CreditCard, href: "/payments" },
  { key: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
  { key: "routes", label: "Bus Routes", icon: Map, href: "/bus_routes" },
  { key: "facilities", label: "Facilities", icon: Building2, href: "/facilities" },
  { key: "complaints", label: "Complaints & Feedback", icon: MessageSquare, href: "/complaints" },
  { key: "contact", label: "Contact Info", icon: Phone, href: "/contact-info" },
  { key: "bookings", label: "Other Bookings", icon: FileText, href: "/bookings" },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const [active, setActive] = useState("home");

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-purple-600 to-purple-700 text-white shadow-xl flex flex-col`}
    >
      {/* Top Logo */}
      <div className="flex items-center justify-between p-4">
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center w-full" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl"></span>
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold">Shivdeep Travels</div>
              <div className="text-xs text-white/80">School Bus Platform</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-white/10"
          aria-label="Toggle"
        >
          <ChevronLeft
            className={`transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/*  Scrollable Menu with real links */}
      <nav className="mt-4 px-2 flex flex-col gap-1 flex-grow overflow-y-auto hide-scrollbar">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <Link
              key={it.key}
              href={it.href}
              onClick={() => setActive(it.key)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mx-2 cursor-pointer transition ${
                isActive
                  ? "bg-white/20 text-white font-semibold"
                  : "hover:bg-white/10 text-white/90"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{it.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="w-full py-3 border-t border-white/20">
        {!collapsed ? (
          <div className="text-xs text-white/70 px-7"> Shivdeep Travels</div>
        ) : null}
      </div>
    </aside>
  );
}
