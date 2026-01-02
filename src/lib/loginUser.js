import { supabase } from "./supabaseClient";

export const loginUser = async (role, email, password) => {
  try {
    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { error: "No auth user returned" };
    }

    // Step 2: Fetch profile from the right table using auth_id
    let table = role === "student" ? "students" : role === "driver" ? "drivers" : "admins";

    const { data: profile, error: profileError } = await supabase
      .from(table)
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    if (profileError || !profile) {
      return { error: "Profile not found" };
    }

    return {
      user: {
        id: authUser.id,
        role,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone || profile.parent_phone || null,
      },
      session: authData.session,
    };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Login failed" };
  }
};
