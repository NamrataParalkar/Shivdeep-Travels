"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Loader, ChevronDown, Home } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Check Supabase Auth session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setIsLoggedIn(true);
          // Get user name and role from localStorage (synced during login)
          const userData = localStorage.getItem("user");
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              setUserName(parsed.full_name || parsed.name || "User");
              setUserRole(parsed.role || "");
            } catch (e) {
              setUserName("User");
              setUserRole("");
            }
          }
        } else {
          setIsLoggedIn(false);
          setUserRole("");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            setUserName(parsed.full_name || parsed.name || "User");
            setUserRole(parsed.role || "");
          } catch (e) {
            setUserName("User");
            setUserRole("");
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserRole("");
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Supabase Auth
      await supabase.auth.signOut();
      // Clear localStorage
      localStorage.removeItem("user");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/90 backdrop-blur-sm shadow-sm z-30 flex items-center justify-between px-6 transition-all duration-300
        ${collapsed ? "left-20" : "left-64"}`}
    >
      <div className="flex items-center gap-3">
        <Image src="/images/logo.png" alt="Logo" width={38} height={38} className="rounded-md" />
        <div>
          <div className="text-lg font-extrabold text-purple-700">Shivdeep Travels</div>
          <div className="text-sm text-gray-500">School Bus Platform</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <Loader className="w-5 h-5 text-purple-600 animate-spin" />
        ) : isLoggedIn ? (
          <>
            <span className="text-sm text-slate-600">Welcome, {userName}</span>
            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 p-2 rounded-full text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                title="Menu"
              >
                <User className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-purple-100 z-50">
                  <button
                    onClick={() => {
                      if (userRole === "admin") router.push("/profile/admin");
                      else if (userRole === "driver") router.push("/profile/driver");
                      else router.push("/profile");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 transition-colors duration-200 flex items-center gap-2 border-b border-purple-100"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>

                  {/* Admin-only menu item */}
                  {userRole === "admin" && (
                    <button
                      onClick={() => {
                        router.push("/");
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 transition-colors duration-200 flex items-center gap-2 border-b border-purple-100"
                    >
                      <Home className="w-4 h-4" />
                      Back to Home
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <a
              href="/login"
              className="px-4 py-2 rounded-full text-purple-700 border border-purple-200 hover:bg-purple-50 transition-colors duration-200"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
            >
              Register
            </a>
          </>
        )}
      </div>
    </header>
  );
}
