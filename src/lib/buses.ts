import { supabase } from "./supabaseClient";

export type Bus = {
  id: number;
  bus_number: string;
  capacity: number;
  driver_id: number | null;
  status: "active" | "maintenance" | "inactive";
  created_at: string;
  updated_at: string;
};

export type Driver = {
  id?: number;
  full_name: string;
  phone: string;
  email?: string;
};

// Fetch all buses (admin only)
export async function getBuses() {
  try {
    const { data, error } = await supabase
      .from("buses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: data as Bus[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get drivers for assignment dropdown
export async function getDriversForAssignment() {
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select("id, full_name, phone, email");

    if (error) return { data: undefined, error };
    return { data: data as Driver[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a new bus
export async function createBus(payload: {
  bus_number: string;
  capacity: number;
  driver_id?: string;
  status?: "active" | "maintenance" | "inactive";
}) {
  try {
    const insertPayload = {
      bus_number: payload.bus_number,
      capacity: payload.capacity,
      driver_id: payload.driver_id || null,
      status: payload.status || "active",
    };

    const { data, error } = await supabase
      .from("buses")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Bus };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update a bus
export async function updateBus(
  id: number,
  payload: Partial<{
    bus_number: string;
    capacity: number;
    driver_id: number | null;
    status: "active" | "maintenance" | "inactive";
  }>
) {
  try {
    const updateData: any = {};
    if (payload.bus_number !== undefined) updateData.bus_number = payload.bus_number;
    if (payload.capacity !== undefined) updateData.capacity = payload.capacity;
    if (payload.driver_id !== undefined) updateData.driver_id = payload.driver_id;
    if (payload.status !== undefined) updateData.status = payload.status;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("buses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Bus };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Change bus status
export async function changeBusStatus(
  id: number,
  status: "active" | "maintenance" | "inactive"
) {
  try {
    const { data, error } = await supabase
      .from("buses")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Bus };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete a bus (status-based, not hard delete in RLS but we provide the endpoint)
export async function deleteBus(id: number) {
  try {
    // Instead of hard delete, mark as inactive (soft delete via status)
    const { error } = await supabase
      .from("buses")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}
