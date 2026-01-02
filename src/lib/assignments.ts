import { supabase } from "./supabaseClient";

export type Assignment = {
  id: number;
  student_id: number;
  bus_id: number;
  route_id: number;
  assigned_at: string;
  unassigned_at?: string;
};

export type AssignmentWithDetails = Assignment & {
  student?: { full_name: string; class?: string; student_class: string; school_name: string };
  bus?: { id: number; bus_number: string; capacity: number };
  route?: { id: number; route_name: string };
};

// Get all assignments (admin view)
export async function getAssignments() {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .select(
        `
        id,
        student_id,
        bus_id,
        route_id,
        assigned_at,
        unassigned_at,
        students (full_name, student_class, school_name),
        buses (bus_number, capacity),
        routes (route_name)
      `
      )
      .order("assigned_at", { ascending: false });

    if (error) return { data: undefined, error };
    const mapped = (data || []).map((row: any) => {
      const student = row.students
        ? { full_name: row.students.full_name, class: row.students.student_class, student_class: row.students.student_class, school_name: row.students.school_name }
        : undefined;
      const bus = row.buses ? { id: row.buses.id, bus_number: row.buses.bus_number, capacity: row.buses.capacity } : undefined;
      const route = row.routes ? { id: row.routes.id, route_name: row.routes.route_name } : undefined;
      return { ...row, student, bus, route };
    });
    return { data: mapped as AssignmentWithDetails[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get only active assignments
export async function getActiveAssignments() {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .select(
        `
        id,
        student_id,
        bus_id,
        route_id,
        assigned_at,
        unassigned_at,
        students (full_name, student_class, school_name),
        buses (bus_number, capacity),
        routes (route_name)
      `
      )
      .is("unassigned_at", null)
      .order("assigned_at", { ascending: false });

    if (error) return { data: undefined, error };
    const mapped = (data || []).map((row: any) => {
      const student = row.students
        ? { full_name: row.students.full_name, class: row.students.student_class, student_class: row.students.student_class, school_name: row.students.school_name }
        : undefined;
      const bus = row.buses ? { id: row.buses.id, bus_number: row.buses.bus_number, capacity: row.buses.capacity } : undefined;
      const route = row.routes ? { id: row.routes.id, route_name: row.routes.route_name } : undefined;
      return { ...row, student, bus, route };
    });
    return { data: mapped as AssignmentWithDetails[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get students already assigned (for filtering in dropdown)
export async function getAssignedStudentIds() {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .select("student_id")
      .is("unassigned_at", null);

    if (error) return { data: undefined, error };
    return { data: (data?.map((d) => d.student_id) || []) as number[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Count assigned students for a bus
export async function getAssignedCountForBus(busId: number) {
  try {
    const { count, error } = await supabase
      .from("student_bus_assignments")
      .select("id", { count: "exact" })
      .eq("bus_id", busId)
      .is("unassigned_at", null);

    if (error) return { count: 0, error };
    return { count: count || 0 };
  } catch (err) {
    return { count: 0, error: { message: String(err) } };
  }
}

// Get bus capacity
export async function getBusCapacity(busId: number) {
  try {
    const { data, error } = await supabase
      .from("buses")
      .select("capacity")
      .eq("id", busId)
      .single();

    if (error) return { capacity: 0, error };
    return { capacity: data?.capacity || 0 };
  } catch (err) {
    return { capacity: 0, error: { message: String(err) } };
  }
}

// Check if bus has capacity
export async function canAssignToBus(busId: number): Promise<{
  canAssign: boolean;
  currentCount?: number;
  capacity?: number;
  error?: any;
}> {
  const { count: currentCount, error: countError } =
    await getAssignedCountForBus(busId);
  if (countError)
    return {
      canAssign: false,
      error: countError,
    };

  const { capacity, error: capacityError } = await getBusCapacity(busId);
  if (capacityError)
    return {
      canAssign: false,
      error: capacityError,
    };

  return {
    canAssign: currentCount < capacity,
    currentCount,
    capacity,
  };
}

// Check if student is already assigned
export async function isStudentAssigned(studentId: number) {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .select("id")
      .eq("student_id", studentId)
      .is("unassigned_at", null)
      .single();

    if (error && error.code !== "PGRST116") return { assigned: false, error };
    return { assigned: !!data };
  } catch (err) {
    return { assigned: false, error: { message: String(err) } };
  }
}

// Get student's current assignment
export async function getStudentAssignment(studentId: number) {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .select(
        `
        id,
        student_id,
        bus_id,
        route_id,
        assigned_at,
        unassigned_at,
        buses (bus_number, capacity),
        routes (route_name)
      `
      )
      .eq("student_id", studentId)
      .is("unassigned_at", null)
      .single();

    if (error && error.code !== "PGRST116")
      return { data: undefined, error };
    return { data: data as any };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Assign student to bus and route
export async function assignStudentToBus(payload: {
  student_id: number;
  bus_id: number;
  route_id: number;
}) {
  try {
    // Validation: Check student enrollment status
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("enrollment_status")
      .eq("id", payload.student_id)
      .single();

    if (studentError || !studentData) {
      return {
        data: undefined,
        error: { message: "Student not found" },
      };
    }

    if (studentData.enrollment_status !== "enrolled") {
      return {
        data: undefined,
        error: {
          message: `Student must be enrolled before assignment. Current status: ${studentData.enrollment_status}`,
        },
      };
    }

    // Validation: Check if bus has capacity
    const { canAssign, currentCount, capacity, error: capacityError } =
      await canAssignToBus(payload.bus_id);
    if (!canAssign) {
      return {
        data: undefined,
        error: {
          message: `Bus capacity exceeded. Current: ${currentCount}/${capacity}`,
        },
      };
    }

    // Validation: Check if student is already assigned
    const { assigned, error: assignmentError } = await isStudentAssigned(
      payload.student_id
    );
    if (assigned) {
      return {
        data: undefined,
        error: { message: "Student is already assigned to a bus" },
      };
    }

    // Insert new assignment
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .insert({
        student_id: payload.student_id,
        bus_id: payload.bus_id,
        route_id: payload.route_id,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Assignment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Unassign student from bus
export async function unassignStudent(assignmentId: number) {
  try {
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .update({
        unassigned_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Assignment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Reassign student to different bus/route
export async function reassignStudent(payload: {
  assignmentId: number;
  new_bus_id: number;
  new_route_id: number;
}) {
  try {
    // Check new bus capacity
    const { canAssign, error: capacityError } = await canAssignToBus(
      payload.new_bus_id
    );
    if (!canAssign) {
      return {
        data: undefined,
        error: { message: "New bus does not have available capacity" },
      };
    }

    // Unassign from old bus
    await unassignStudent(payload.assignmentId);

    // Get student_id from old assignment
    const { data: oldAssignment, error: getError } = await supabase
      .from("student_bus_assignments")
      .select("student_id")
      .eq("id", payload.assignmentId)
      .single();

    if (getError) return { data: undefined, error: getError };

    // Assign to new bus
    const { data, error } = await supabase
      .from("student_bus_assignments")
      .insert({
        student_id: oldAssignment.student_id,
        bus_id: payload.new_bus_id,
        route_id: payload.new_route_id,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as Assignment };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Get full route path (helper)
export async function getRouteWithStops(routeId: number) {
  try {
    const { data: routeData, error: routeError } = await supabase
      .from("routes")
      .select("route_name, start_point, end_point")
      .eq("id", routeId)
      .single();

    if (routeError) return { route: undefined, error: routeError };

    const { data: stopsData, error: stopsError } = await supabase
      .from("route_stops")
      .select("stop_name")
      .eq("route_id", routeId)
      .order("stop_order", { ascending: true });

    if (stopsError) return { route: undefined, error: stopsError };

    const stopNames = stopsData?.map((s) => s.stop_name) || [];
    const fullPath = [
      routeData?.start_point,
      ...stopNames,
      routeData?.end_point,
    ]
      .filter(Boolean)
      .join(" → ");

    return {
      route: {
        id: routeId,
        route_name: routeData?.route_name,
        full_path: fullPath,
      },
    };
  } catch (err) {
    return { route: undefined, error: { message: String(err) } };
  }
}
