import { supabase } from "./supabaseClient";

/**
 * Check if authenticated user is an admin
 * This is a backend security check - RLS policies will enforce this at DB level
 */
export async function isUserAdmin(authId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (error) {
      console.error("Admin check error:", error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
}

/**
 * Get user role based on profile tables
 */
export async function getUserRole(
  authId: string
): Promise<"admin" | "driver" | "student" | null> {
  try {
    // Check admins
    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (adminData) return "admin";

    // Check drivers
    const { data: driverData } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverData) return "driver";

    // Check students
    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (studentData) return "student";

    return null;
  } catch (err) {
    console.error("Error getting user role:", err);
    return null;
  }
}

/**
 * Get full user profile
 */
export async function getUserProfile(authId: string, role: string) {
  try {
    const table =
      role === "student" ? "students" : role === "driver" ? "drivers" : "admins";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
}
