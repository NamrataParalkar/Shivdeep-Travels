"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // try to get auth user id
        let authUser = null;
        try {
          const res = await supabase.auth.getUser();
          authUser = res?.data?.user ?? null;
        } catch (err) {
          // fallback to legacy
          if (typeof (supabase.auth as any).user === "function") {
            authUser = (supabase.auth as any).user();
          }
        }

        // fallback to localStorage only if needed
        if (!authUser && typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              authUser = { id: parsed.authId || parsed.id || parsed.auth_id, email: parsed.email };
            } catch (e) {
              // ignore
            }
          }
        }

        if (!authUser) {
          // not authenticated — redirect to login
          if (typeof window !== "undefined") router.push("/login");
          return;
        }

        // fetch admin profile row
        const { data, error } = await supabase
          .from("admins")
          .select("*")
          .eq("auth_id", authUser.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to load admin profile:", error.message || error);
          setProfile(null);
          setFormData({});
        } else if (data) {
          setProfile(data);
          setFormData(data);
          // keep localStorage quick cache in sync
          try {
            const existing = (typeof window !== "undefined" && localStorage.getItem("user"))
              ? JSON.parse(localStorage.getItem("user") as string)
              : {};
            const merged = { ...existing, role: "admin", authId: authUser.id, ...data };
            if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(merged));
          } catch (e) { /* ignore */ }
        } else {
          setProfile(null);
          setFormData({});
        }
      } catch (err) {
        console.error("Error initializing admin profile page:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const updates: any = { ...formData };
      delete updates.id;
      delete updates.auth_id;
      delete updates.created_at;
        // ensure we don't send fields that don't exist in admins table
        if (updates.phone_number) delete updates.phone_number;

      const { data, error } = await supabase
        .from("admins")
        .update(updates)
        .eq("id", profile.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Update failed:", error);
        alert("Failed to update profile: " + (error.message || JSON.stringify(error)));
      } else {
        setProfile(data);
        setFormData(data || {});
        // sync localStorage
        try {
          const existing = (typeof window !== "undefined" && localStorage.getItem("user"))
            ? JSON.parse(localStorage.getItem("user") as string)
            : {};
          const merged = { ...existing, ...data, role: "admin" };
          if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(merged));
        } catch (e) { /* ignore */ }

        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6">
          <div className="text-sm text-slate-600">Loading profile…</div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.name || "Administrator";
  const displayEmail = profile?.email || (typeof window !== "undefined" ? (() => { try { const s = JSON.parse(localStorage.getItem("user") || "{}"); return s.email; } catch(e){return "";} })() : "");
  const displayPhone = profile?.phone || "—";
  const displayRole = profile?.role ? (String(profile.role).toLowerCase() === "owner" ? "Owner" : "Admin") : "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
            <UserCircle className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{displayName}</h1>
                <p className="text-sm text-slate-500">{displayRole}</p>
              </div>
              <div className="ml-2">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm rounded-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving} className="px-3 py-1 bg-green-600 text-white text-sm rounded-md">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => { setEditMode(false); setFormData(profile || {}); }} className="px-3 py-1 bg-gray-200 text-sm rounded-md">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              {!editMode ? (
                <div className="space-y-1">
                  <div><strong className="text-gray-500">Email:</strong> <span className="text-gray-800">{displayEmail || "—"}</span></div>
                  <div><strong className="text-gray-500">Phone:</strong> <span className="text-gray-800">{displayPhone}</span></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Full Name</label>
                    <input name="full_name" value={formData?.full_name || ""} onChange={(e) => setFormData((p:any)=>({...p, full_name: e.target.value}))} className="w-full border rounded px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <input name="email" value={formData?.email || ""} onChange={(e) => setFormData((p:any)=>({...p, email: e.target.value}))} className="w-full border rounded px-3 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <input name="phone" value={formData?.phone || ""} onChange={(e) => setFormData((p:any)=>({...p, phone: e.target.value}))} className="w-full border rounded px-3 py-2 mt-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">This is the admin profile area. Use the options below to navigate.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Back to Home
            </button>

            <button
              onClick={() => router.push("/admin")}
              className="w-full sm:w-auto px-4 py-2 border border-purple-200 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
