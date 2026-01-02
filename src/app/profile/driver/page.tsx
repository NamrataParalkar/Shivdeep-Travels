"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export default function DriverProfilePage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setName(parsed.full_name || parsed.name || "Driver");
      } catch (e) {
        setName("Driver");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{name}</h1>
            <p className="text-sm text-slate-500">Driver Account</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">This is a minimal driver profile page. No admin actions are available here.</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Back to Home
            </button>

            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
