"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, User, CreditCard, Bell, Map } from "lucide-react";

const cards = [
  { title: "Track Bus", text: "Live location of your child's bus.", icon: MapPin, href: "/bus_routes" },
  { title: "Driver Details", text: "View driver profile & emergency contact.", icon: User, href: "/drivers" },
  { title: "Payments", text: "View fee history & pay online.", icon: CreditCard, href: "/payments" },
  { title: "Notifications", text: "Get real-time alerts & updates.", icon: Bell, href: "/notifications" },
  { title: "Bus Routes", text: "View routes & stop timings.", icon: Map, href: "/bus_routes" },
];

export default function DashboardCards() {
  return (
    <section id="dashboard" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((c) => (
        <Link key={c.title} href={c.href} className="block">
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className="block bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-full">
                <c.icon className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-700">{c.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{c.text}</p>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </section>
  );
}
