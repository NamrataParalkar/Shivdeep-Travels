import { supabase } from "./supabaseClient";
import bcrypt from "bcryptjs";

export type Driver = {
  id: number;
  full_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  experience: number;
  phone: string;
  email?: string;
  password_hash: string;
  created_at: string;
};

// Fetch all drivers
export async function getDrivers() {
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: data as Driver[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a driver (admin only)
export async function createDriver(payload: {
  full_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  experience: number;
  phone: string;
  email?: string;
  password: string;
}) {
  try {
    // Hash the password using bcryptjs
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(payload.password, salt);

    const insertPayload = {
      full_name: payload.full_name,
      age: payload.age,
      gender: payload.gender,
      experience: payload.experience,
      phone: payload.phone,
      email: payload.email || null,
      password_hash: hash,
    };

    const { data, error } = await supabase
      .from("drivers")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Driver };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update a driver (admin only). If password provided, hash it.
export async function updateDriver(id: number, payload: Partial<{
  full_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  experience: number;
  phone: string;
  email?: string;
  password?: string;
}>) {
  try {
    const updateData: any = {};
    if (payload.full_name !== undefined) updateData.full_name = payload.full_name;
    if (payload.age !== undefined) updateData.age = payload.age;
    if (payload.gender !== undefined) updateData.gender = payload.gender;
    if (payload.experience !== undefined) updateData.experience = payload.experience;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.email !== undefined) updateData.email = payload.email || null;
    if (payload.password) {
      const salt = bcrypt.genSaltSync(10);
      updateData.password_hash = bcrypt.hashSync(payload.password, salt);
    }

    const { data, error } = await supabase
      .from("drivers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Driver };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete a driver (admin only)
export async function deleteDriver(id: number) {
  try {
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}
