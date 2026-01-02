"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeProfile, setWelcomeProfile] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        alert("❌ " + authError.message);
        return;
      }

      const authUser = authData.user;
      if (!authUser) {
        alert("❌ No user returned from Supabase Auth.");
        return;
      }

      let table =
        role === "student" ? "students" : role === "driver" ? "drivers" : "admins";

      const { data: profile, error: profileError } = await supabase
        .from(table)
        .select("*")
        .eq("auth_id", authUser.id)
        .single();

      if (profileError || !profile) {
        alert("❌ Profile not found in " + table);
        return;
      }

      // Save user locally and show a modern welcome modal instead of browser alert
      localStorage.setItem(
        "user",
        JSON.stringify({ ...profile, role, authId: authUser.id })
      );

      setWelcomeProfile(profile);
      setShowWelcome(true);
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-pink-50 via-white to-pink-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-slate-800">Login</h2>
        <p className="text-gray-500 text-center mt-2">Access your dashboard</p>

        {/* Role Selection */}
        <div className="mt-6 flex justify-center gap-3">
          {["student", "driver", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                role === r
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                  : "bg-gray-100 text-purple-600 hover:bg-gray-200"
              }`}
            >
              {r === "student"
                ? "Student/Parent"
                : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-400 pr-10"
            />

            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 🔑 Forgot Password Link */}
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-sm text-purple-600 hover:underline font-medium"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 font-semibold"
          >
            {loading
              ? "Logging in..."
              : `Login as ${role === "student" ? "Student/Parent" : role}`}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-purple-600 font-semibold hover:underline"
          >
            Register
          </a>
        </p>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWelcome(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4">
            <button
              aria-label="Close welcome"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
              onClick={() => setShowWelcome(false)}
            >
              ×
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {welcomeProfile && (welcomeProfile.name || welcomeProfile.first_name || welcomeProfile.full_name)
                  ? (welcomeProfile.name || welcomeProfile.first_name || welcomeProfile.full_name).charAt(0).toUpperCase()
                  : "👋"}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800">{
                  `Welcome${welcomeProfile && (welcomeProfile.name || welcomeProfile.first_name || welcomeProfile.full_name)
                    ? `, ${welcomeProfile.name || welcomeProfile.first_name || welcomeProfile.full_name}`
                    : "!"}`
                }</h3>
                <p className="text-sm text-gray-500 mt-1">You are logged in as <span className="font-medium text-purple-600">{role}</span>.</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowWelcome(false);
                  router.push("/");
                }}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Go to Landing Page
              </button>

              {role !== "student" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowWelcome(false);
                    if (role === "admin") router.push("/admin");
                    else router.push("/profile");
                  }}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:opacity-95"
                >
                  Continue to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
