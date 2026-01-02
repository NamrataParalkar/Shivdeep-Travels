import { supabase } from "./supabaseClient";

export type ContactInfo = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  created_at: string;
};

// Get all contacts (for student view - read-only)
export async function getAllContacts() {
  try {
    const { data, error } = await supabase
      .from("contact_info")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: data as ContactInfo[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a new contact (admin only)
export async function createContact(contactData: Omit<ContactInfo, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from("contact_info")
      .insert({
        name: contactData.name,
        phone: contactData.phone || null,
        email: contactData.email || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as ContactInfo };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update a contact (admin only)
export async function updateContact(id: number, contactData: Partial<Omit<ContactInfo, "id" | "created_at">>) {
  try {
    const { data, error } = await supabase
      .from("contact_info")
      .update({
        name: contactData.name,
        phone: contactData.phone || null,
        email: contactData.email || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as ContactInfo };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete a contact (admin only)
export async function deleteContact(id: number) {
  try {
    const { error } = await supabase
      .from("contact_info")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}
