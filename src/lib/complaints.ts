import { supabase } from "./supabaseClient";

export type Entry = {
  id: number;
  user_id: string;
  user_role: string;
  entry_type: "complaint" | "feedback";
  category?: string | null;
  subject: string;
  message: string;
  priority?: "Low" | "Normal" | "High" | null;
  // status follows DB constraint: allowed values
  // includes UI-only feedback statuses (mapped to DB on write)
  status: "Pending" | "In Progress" | "Resolved" | "Closed" | "Under Review" | "Reviewed";
  admin_response?: string | null;
  created_at: string;
  updated_at?: string;
};

// Create a new complaint or feedback entry
export async function createEntry(payload: {
  user_id: string;
  user_role: string;
  entry_type: "complaint" | "feedback";
  category?: string;
  subject: string;
  message: string;
  priority?: "Low" | "Normal" | "High";
}) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("complaints_feedback")
      .insert({
        user_id: payload.user_id,
        user_role: payload.user_role,
        entry_type: payload.entry_type,
        category: payload.category || null,
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority || "Normal",
        // default status depends on entry type
        // Feedback UI uses "Under Review" but DB constraint requires 'In Progress' — store DB-friendly status
        status: payload.entry_type === "feedback" ? "In Progress" : "Pending",
        admin_response: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    // Map DB statuses to UI-friendly statuses for feedback
    const mapped = { ...(data as any) } as any;
    if (mapped.entry_type === "feedback") {
      if (mapped.status === "In Progress") mapped.status = "Under Review";
      if (mapped.status === "Resolved") mapped.status = "Reviewed";
    }
    return { data: mapped as Entry };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch entries for a given user (student/parent)
export async function fetchUserEntries(userId: string) {
  try {
    const { data, error } = await supabase
      .from("complaints_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    // Map DB statuses to UI-friendly feedback statuses
    const mapped = (data as any[]).map((r) => {
      const copy = { ...r } as any;
      if (copy.entry_type === "feedback") {
        if (copy.status === "In Progress") copy.status = "Under Review";
        if (copy.status === "Resolved") copy.status = "Reviewed";
      }
      return copy;
    });
    return { data: mapped as Entry[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch entries for admin with filters
export async function fetchAdminEntries(filters: {
  entry_type?: "complaint" | "feedback" | "all";
  status?: "Pending" | "In Progress" | "Resolved" | "Closed" | "all";
  category?: string | "all";
  priority?: "Low" | "Normal" | "High" | "all";
  search?: string;
  from?: string;
  to?: string;
}) {
  try {
    let query: any = supabase.from("complaints_feedback").select("*");

    if (filters.entry_type && filters.entry_type !== "all") query = query.eq("entry_type", filters.entry_type);

    // Map UI feedback statuses to DB statuses for filtering
    if (filters.status && filters.status !== "all") {
      let dbStatus = filters.status as string;
      if (dbStatus === "Under Review") dbStatus = "In Progress";
      if (dbStatus === "Reviewed") dbStatus = "Resolved";
      query = query.eq("status", dbStatus);
    }
    if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
    if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);
    if (filters.search) {
      const s = filters.search.trim();
      query = query.or(`subject.ilike.%${s}%,message.ilike.%${s}%,user_id.ilike.%${s}%`);
    }
    if (filters.from) query = query.gte("created_at", filters.from);
    if (filters.to) query = query.lte("created_at", filters.to);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return { data: undefined, error };
    const mapped = (data as any[]).map((r) => {
      const copy = { ...r } as any;
      if (copy.entry_type === "feedback") {
        if (copy.status === "In Progress") copy.status = "Under Review";
        if (copy.status === "Resolved") copy.status = "Reviewed";
      }
      return copy;
    });
    return { data: mapped as Entry[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update status (admin only)
export async function updateStatus(
  id: number,
  status: "Pending" | "In Progress" | "Resolved" | "Closed" | "Under Review" | "Reviewed"
) {
  try {
    // Map UI feedback statuses to DB statuses
    let dbStatus = status as string;
    if (dbStatus === "Under Review") dbStatus = "In Progress";
    if (dbStatus === "Reviewed") dbStatus = "Resolved";
    const { data, error } = await supabase
      .from("complaints_feedback")
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    // Map DB status back to UI-friendly status for feedback
    const mapped = { ...(data as any) } as any;
    if (mapped.entry_type === "feedback") {
      if (mapped.status === "In Progress") mapped.status = "Under Review";
      if (mapped.status === "Resolved") mapped.status = "Reviewed";
    }
    return { data: mapped as Entry };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update admin response (admin only)
export async function updateAdminResponse(id: number, admin_response: string) {
  try {
    const { data, error } = await supabase
      .from("complaints_feedback")
      .update({ admin_response, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: undefined, error };
    // Map DB statuses to UI statuses for feedback entries
    const mapped = { ...(data as any) } as any;
    if (mapped.entry_type === "feedback") {
      if (mapped.status === "In Progress") mapped.status = "Under Review";
      if (mapped.status === "Resolved") mapped.status = "Reviewed";
    }
    return { data: mapped as Entry };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete entry (admin only)
export async function deleteEntry(id: number) {
  try {
    const { error } = await supabase.from("complaints_feedback").delete().eq("id", id);
    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}

// Fetch user profiles (students/drivers/admins) for a list of auth IDs or numeric IDs
export async function fetchUserProfiles(userIds: string[]) {
  try {
    // prepare arrays
    const authIds = userIds.filter((u) => typeof u === "string" && u.length > 0);
    const numericIds = userIds
      .map((u) => (Number.isFinite(Number(u)) ? Number(u) : null))
      .filter((n) => n !== null) as number[];

    const profiles: Record<string, { full_name?: string; role?: string; id?: number; auth_id?: string }> = {};

    // query admins by auth_id and id separately so we OR-match correctly
    if (authIds.length) {
      const { data: adminsByAuth } = await supabase.from("admins").select("id,full_name,auth_id").in("auth_id", authIds);
      if (adminsByAuth && Array.isArray(adminsByAuth)) {
        adminsByAuth.forEach((a: any) => {
          const key = a.auth_id || String(a.id);
          profiles[key] = { full_name: a.full_name, role: "admin", id: a.id, auth_id: a.auth_id };
        });
      }
    }
    if (numericIds.length) {
      const { data: adminsById } = await supabase.from("admins").select("id,full_name,auth_id").in("id", numericIds);
      if (adminsById && Array.isArray(adminsById)) {
        adminsById.forEach((a: any) => {
          const key = a.auth_id || String(a.id);
          profiles[key] = { full_name: a.full_name, role: "admin", id: a.id, auth_id: a.auth_id };
        });
      }
    }

    // drivers
    if (authIds.length) {
      const { data: driversByAuth } = await supabase.from("drivers").select("id,full_name,auth_id").in("auth_id", authIds);
      if (driversByAuth && Array.isArray(driversByAuth)) {
        driversByAuth.forEach((d: any) => {
          const key = d.auth_id || String(d.id);
          profiles[key] = { full_name: d.full_name, role: "driver", id: d.id, auth_id: d.auth_id };
        });
      }
    }
    if (numericIds.length) {
      const { data: driversById } = await supabase.from("drivers").select("id,full_name,auth_id").in("id", numericIds);
      if (driversById && Array.isArray(driversById)) {
        driversById.forEach((d: any) => {
          const key = d.auth_id || String(d.id);
          profiles[key] = { full_name: d.full_name, role: "driver", id: d.id, auth_id: d.auth_id };
        });
      }
    }

    // students
    if (authIds.length) {
      const { data: studentsByAuth } = await supabase.from("students").select("id,full_name,auth_id").in("auth_id", authIds);
      if (studentsByAuth && Array.isArray(studentsByAuth)) {
        studentsByAuth.forEach((s: any) => {
          const key = s.auth_id || String(s.id);
          profiles[key] = { full_name: s.full_name, role: "student", id: s.id, auth_id: s.auth_id };
        });
      }
    }
    if (numericIds.length) {
      const { data: studentsById } = await supabase.from("students").select("id,full_name,auth_id").in("id", numericIds);
      if (studentsById && Array.isArray(studentsById)) {
        studentsById.forEach((s: any) => {
          const key = s.auth_id || String(s.id);
          profiles[key] = { full_name: s.full_name, role: "student", id: s.id, auth_id: s.auth_id };
        });
      }
    }

    return { data: profiles };
  } catch (err) {
    return { data: {}, error: { message: String(err) } };
  }
}
