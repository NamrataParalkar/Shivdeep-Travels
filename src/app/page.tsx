"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import DashboardCards from "@/components/DashboardCard";
//import MovingBus from "@/components/MovingBus";
import Footer from "@/components/Footer";
import { ShieldCheck } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserRole(parsed.role || "");
      } catch (e) {
        setUserRole("");
      }
    }
  }, []);

  return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white overflow-x-hidden">
      {/* pass state to Sidebar + Navbar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Navbar collapsed={collapsed} />
      

      {/* main area shifts based on sidebar */}
      <main
        className={`pr-4 pt-20 max-w-7xl mx-auto transition-all duration-300 ${
          collapsed ? "pl-20" : "pl-64"
        }`}
      >
        {/* Admin Navigation Banner */}
        {userRole === "admin" && (
          <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Admin Mode Active</span>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Go to Admin Dashboard
            </button>
          </div>
        )}

        <HeroSlider />

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Features</h2>
            <p className="text-sm text-gray-500">Explore quick actions</p>
          </div>

          <DashboardCards />
        </section>

        {/* How it works / Info */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">How it works</h3>
            <p className="mt-4 text-gray-600">
              Register, Add your child and route, Track live — We handle the rest.
              Real-time notifications for boarding, departure, and arrival keep
              you informed every step of the way.
            </p>
            <ul className="mt-4 text-gray-600 space-y-2 list-disc list-inside">
              <li>Live GPS tracking of buses</li>
              <li>Instant notifications</li>
              <li>Secure payment gateway (future)</li>
            </ul>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md">
            <img
              src="/images/slide1.jpg"
              alt="How it works"
              className="w-full object-cover h-64"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 bg-gradient-to-r from-purple-600 to-pink-500 text-white p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                Get started with Shivdeep Travels
              </h3>
              <p className="mt-2 text-white/90">
                Register now and keep your child safe with real-time tracking and
                instant alerts.
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <a
                href="/register"
                className="px-6 py-3 bg-white text-purple-700 rounded-full font-semibold"
              >
                Register Now
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
