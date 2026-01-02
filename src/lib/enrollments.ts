import { supabase } from "./supabaseClient";

export type BusEnrollment = {
  id: number;
  student_id: number;
  route_id: number;
  remarks?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at?: string;
  updated_at: string;
};

export type RouteRequest = {
  id: number;
  student_id: number;
  requested_stop: string;
  area?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

// ===== BUS ENROLLMENTS =====

// Fetch pending and approved enrollments for a student
export async function getStudentEnrollments(studentId: number) {
  try {
    const { data, error } = await supabase
      .from("bus_enrollments")
      .select("*, routes(id, route_name, start_point, end_point), students(full_name, student_class, school_name, parent_phone)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: (data || []) as any[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch all enrollments for admin
export async function getEnrollments(status?: "pending" | "approved" | "rejected") {
  try {
    let query = supabase
      .from("bus_enrollments")
      .select(
            "*, routes(id, route_name, start_point, end_point), students(id, full_name, student_class, school_name, parent_phone)"
          )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      const raw: any = error;
      const serialized: Record<string, any> = {};
      try {
        Object.getOwnPropertyNames(raw).forEach((k) => {
          serialized[k] = raw[k];
        });
      } catch (e) {
        // ignore
      }
      const err = {
        message: raw?.message || raw?.error || raw?.statusText || JSON.stringify(serialized) || String(raw),
        details: raw?.details || raw?.hint || serialized,
        raw: serialized,
      };
      return { data: undefined, error: err };
    }
    return { data: (data || []) as any[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a new enrollment request
export async function createEnrollment(payload: {
  student_id: number;
  route_id: number;
  remarks?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("bus_enrollments")
      .insert({
        student_id: payload.student_id,
        route_id: payload.route_id,
        remarks: payload.remarks || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as BusEnrollment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Approve an enrollment request (admin)
export async function approveEnrollment(enrollmentId: number, authId?: string) {
  try {
    const resp = await fetch("/api/admin/enrollments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: enrollmentId, authId }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: undefined, error: json.error || { message: json.message || 'Failed to approve' } };
    return { data: json.data as BusEnrollment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Reject an enrollment request (admin)
export async function rejectEnrollment(enrollmentId: number, authId?: string) {
  try {
    const resp = await fetch("/api/admin/enrollments/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: enrollmentId, authId }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: undefined, error: json.error || { message: json.message || 'Failed to reject' } };
    return { data: json.data as BusEnrollment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}
// Fetch route requests for a student
export async function getStudentRouteRequests(studentId: number) {
  try {
    const { data, error } = await supabase
      .from("route_requests")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: (data || []) as RouteRequest[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch all route requests for admin
export async function getRouteRequests(status?: "pending" | "approved" | "rejected") {
  try {
    let query = supabase
      .from("route_requests")
      .select("*, students(id, full_name, student_class, school_name, parent_phone)")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      const raw: any = error;
      const serialized: Record<string, any> = {};
      try {
        Object.getOwnPropertyNames(raw).forEach((k) => {
          serialized[k] = raw[k];
        });
      } catch (e) {
        // ignore
      }
      const err = {
        message: raw?.message || raw?.error || raw?.statusText || JSON.stringify(serialized) || String(raw),
        details: raw?.details || raw?.hint || serialized,
        raw: serialized,
      };
      return { data: undefined, error: err };
    }
    return { data: (data || []) as any[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create a new route request
export async function createRouteRequest(payload: {
  student_id: number;
  requested_stop: string;
  area?: string;
  description?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("route_requests")
      .insert({
        student_id: payload.student_id,
        requested_stop: payload.requested_stop,
        area: payload.area || null,
        description: payload.description || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as RouteRequest };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Approve a route request (admin)
export async function approveRouteRequest(requestId: number) {
  try {
    const { data, error } = await supabase
      .from("route_requests")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as RouteRequest };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Reject a route request (admin)
export async function rejectRouteRequest(requestId: number) {
  try {
    const { data, error } = await supabase
      .from("route_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as RouteRequest };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}
