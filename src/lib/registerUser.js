// lib/registerUser.ts
import { supabase } from "./supabaseClient";

export const registerUser = async (role, formData) => {
  try {
    // 1. Create account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;
    const user = authData?.user;
    if (!user) throw new Error("No user returned from signUp");

    // 2. Insert into custom table
    if (role === "student") {
      const payload = {
        auth_id: user.id,
        full_name: formData.fullName,
        class: formData.studentClass,
        school_name: formData.schoolName,
        age: Number(formData.age),
        gender: formData.gender,
        parent_phone: formData.parentPhone,
        email: formData.email,
      };

      const { data, error } = await supabase.from("students").insert([payload]);
      if (error) throw error;
      return { data, error: null };
    }

    if (role === "driver") {
      const payload = {
        auth_id: user.id,
        full_name: formData.fullName,
        age: Number(formData.age),
        gender: formData.gender,
        experience: Number(formData.experience),
        phone: formData.phone,
        email: formData.email,
      };

      const { data, error } = await supabase.from("drivers").insert([payload]);
      if (error) throw error;
      return { data, error: null };
    }

    throw new Error("Invalid role");
  } catch (err) {
    return { data: null, error: err };
  }
};
