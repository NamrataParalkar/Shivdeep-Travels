"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // <- make sure this path is correct
import { User } from "@supabase/supabase-js";
// lucide-react icons not needed here
import Link from "next/link";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  

  const [authUser, setAuthUser] = useState<User | null>(null); // Supabase auth user
  const [role, setRole] = useState<"student" | "driver" | "admin" | null>(null); // "student" | "driver" | "admin"
  const [profile, setProfile] = useState<any>(null); // DB row
  const [formData, setFormData] = useState<Record<string, any>>({});

  // mapping for ordered fields (nice layout)
  const fieldsByRole = {
    student: ["full_name", "student_class", "school_name", "age", "gender", "parent_phone", "email"],
    driver: ["full_name", "age", "gender", "experience", "phone", "email"],
    admin:  ["full_name", "phone", "email"],
  };

  useEffect(() => {
    // init: get auth user then fetch profile
    (async () => {
      setLoading(true);
      try {
        // 1) get authenticated user via supabase.auth.getUser()
        let user: User | any = null;
        try {
          const { data } = await supabase.auth.getUser();
          user = data?.user ?? null;
        } catch (err) {
          console.warn("supabase.auth.getUser() failed", err);
          user = null;
        }

        // 2) fallback: localStorage (only client)
        if (!user && typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const obj = JSON.parse(stored);
              // prefer authId => try to create a lightweight auth-like object
              if (obj.authId || obj.id || obj.auth_id) {
                user = { id: obj.authId || obj.id || obj.auth_id, email: obj.email ?? null } as any;
              }
              // if obj contains role, keep it for role hint
              if (obj.role) setRole(obj.role);
            } catch (e) {
              console.warn("localStorage user parse error", e);
            }
          }
        }

        if (!user) {
          console.warn("No authenticated user found — redirecting to /login");
          window.location.href = "/login";
          return;
        }

        setAuthUser(user);

        // 3) determine role: if previously set (from localStorage) use it; otherwise probe tables
        let authId = user.id;
        let detectedRole = role; // maybe set by localStorage earlier
        if (!detectedRole) {
          // probe in order: students -> drivers -> admins
          const tryTables = ["students", "drivers", "admins"];
          for (const t of tryTables) {
            const { data, error } = await supabase
              .from(t)
              .select("id, auth_id")
              .eq("auth_id", authId)
              .limit(1)
              .maybeSingle();
            if (!error && data) {
              detectedRole = t === "students" ? "student" : t === "drivers" ? "driver" : "admin";
              break;
            }
          }
        }

        if (!detectedRole) {
          console.warn("User exists in auth but no profile found in students/drivers/admins.");
          // still allow the user to continue — user might be newly registered but not yet inserted into profile table
          // show friendly message
          setRole(null);
          setProfile(null);
          setFormData({});
          return;
        }

        setRole(detectedRole);

        // 4) fetch profile row
        const table = detectedRole === "student" ? "students" : detectedRole === "driver" ? "drivers" : "admins";
        const { data: profileRow, error: profileError } = await supabase
          .from(table)
          .select("*")
          .eq("auth_id", authId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setProfile(null);
          setFormData({});
        } else {
          setProfile(profileRow);
          setFormData(profileRow || {});
          
          
          
          // update saved localStorage user so later pages have quick access
          try {
            const stored = (typeof window !== "undefined") ? localStorage.getItem("user") : null;
            const existing = stored ? JSON.parse(stored) : {};
            const merged = {
              ...existing,
              ...(detectedRole ? { role: detectedRole } : {}),
              authId,
              email: (user as any).email,
              ...profileRow,
            };
            if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(merged));
          } catch (e) {
            // ignore localStorage write errors
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // small helper for display labels
  const label = (k: string | number) => String(k).replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());

  // handle input change
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setFormData((p: any) => ({ ...p, [name]: value }));
  }

  // Save updates to DB
  async function handleSave() {
    if (!profile || !role) {
      alert("No profile to update.");
      return;
    }
    setSaving(true);
    try {
      const table = role === "student" ? "students" : role === "driver" ? "drivers" : "admins";
      // create updates object and remove readonly fields
      const updates = { ...formData };
      delete updates.id;
      delete updates.auth_id;
      delete updates.created_at;

      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        alert("Failed to update profile: " + (error.message || JSON.stringify(error)));
      } else {
        setProfile(data);
        setFormData(data);
        // update localStorage
        try {
          const existing = (typeof window !== "undefined" && localStorage.getItem("user")) ? JSON.parse(localStorage.getItem("user")) : {};
          const merged = { ...existing, ...data, role, authId: authUser.id };
          if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(merged));
        } catch (e) { /* ignore */ }

        alert("Profile updated successfully.");
        setEditMode(false);
      }
    } catch (err) {
      console.error("handleSave exception:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    try {
      if (typeof window !== "undefined") localStorage.removeItem("user");
      supabase.auth.signOut().catch(() => {});
    } finally {
      window.location.href = "/login";
    }
  }

  function handleEnroll() {
    // placeholder navigation — implement a real page or modal
    window.location.href = "/bus/enroll";
  }

  // --- Render ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Loading profile…</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-700">
          You are not logged in. <br />
          <a href="/login" className="text-blue-600 underline">Go to login</a>
        </div>
      </div>
    );
  }

  if (!role || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white shadow rounded-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold mb-2">Profile not ready</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find a profile row for your account. If you just registered, please complete registration or contact admin.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => window.location.href = "/register"} className="px-4 py-2 bg-blue-600 text-white rounded">Register Profile</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  // get ordered fields for role
  const fields = fieldsByRole[role] || Object.keys(profile).filter(k => !["id","auth_id","created_at","password_hash"].includes(k));

  // avatar initials
  const initials = (profile.full_name || authUser.email || "U").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-800">{profile.full_name || authUser.email}</h1>
          <p className="text-gray-500 mt-1">{role.charAt(0).toUpperCase() + role.slice(1)} Account</p>
        </div>

        <div className="mt-8 space-y-4">
          

          {/* Profile Fields */}
          {fields.map((key) => {
            const value = formData[key] ?? profile[key] ?? "";
            return (
              <div key={key} className="grid grid-cols-3 items-center gap-4 py-2 border-b border-gray-100">
                <div className="text-sm text-gray-500 uppercase">{label(key)}</div>

                {editMode ? (
                  <div className="col-span-2">
                    <input
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                ) : (
                  <div className="col-span-2 text-gray-800 font-medium">{String(value || "—")}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          {editMode ? (
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-lg bg-green-600 text-white">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditMode(false); setFormData(profile); }} className="px-6 py-2 rounded-lg bg-gray-200">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditMode(true)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                Edit Profile
              </button>
              <button onClick={handleEnroll} className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                Enroll for Bus Service
              </button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500 text-white">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
