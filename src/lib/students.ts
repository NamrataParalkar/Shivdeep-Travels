import { supabase } from "./supabaseClient";

export type Student = {
  id: number;
  full_name: string;
  class: string;
  school_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone?: string;
  parent_phone: string;
  email?: string;
  auth_id?: string;
  enrollment_status: "not_enrolled" | "enrolled" | "suspended";
  enrolled_at?: string;
  must_reset_password: boolean;
  created_at: string;
  updated_at?: string;
};

export type StudentWithAssignments = Student & {
  bus?: { id: number; bus_number: string };
  route?: { id: number; route_name: string };
};

// Fetch all students (admin)
export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) return { data: undefined, error };
    // Map DB column `student_class` to `class` property expected by UI
    const mapped = (data || []).map((r: any) => ({ ...r, class: r.student_class }));
    return { data: mapped as Student[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch enrolled students only
export async function getEnrolledStudents() {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("enrollment_status", "enrolled")
      .order("full_name", { ascending: true });

    if (error) return { data: undefined, error };
    const mapped = (data || []).map((r: any) => ({ ...r, class: r.student_class }));
    return { data: mapped as Student[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch a single student by ID
export async function getStudent(id: number) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return { data: undefined, error };
    if (data) data.class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch student by phone (for login)
export async function getStudentByPhone(phone: string) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) return { data: undefined, error };
    if (data) data.class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Fetch student by email (for login)
export async function getStudentByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("email", email)
      .single();

    if (error) return { data: undefined, error };
    if (data) data.class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Create new student (admin manual enrollment)
export async function createStudent(payload: {
  full_name: string;
  class: string;
  school_name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  parent_phone: string;
  phone?: string;
  email?: string;
  enrollment_status?: "not_enrolled" | "enrolled" | "suspended";
}) {
  try {
    const insertData = {
        full_name: payload.full_name,
        student_class: payload.class,
      school_name: payload.school_name,
      age: payload.age,
      gender: payload.gender,
      parent_phone: payload.parent_phone,
      phone: payload.phone || null,
      email: payload.email || null,
      enrollment_status: payload.enrollment_status || "enrolled",
      enrolled_at: new Date().toISOString(),
      must_reset_password: true,
    };

    const { data: insertedData, error: insertError } = await supabase
      .from("students")
      .insert(insertData)
      .select()
      .single();

    if (insertError) return { data: undefined, error: insertError };
    
    // Map student_class to class
    if (insertedData) (insertedData as any).class = (insertedData as any).student_class;
    return { data: insertedData as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Update student (admin or self)
export async function updateStudent(
  id: number,
  payload: Partial<{
    full_name: string;
    class: string;
    school_name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    phone: string;
    parent_phone: string;
    email: string;
    enrollment_status: "not_enrolled" | "enrolled" | "suspended";
    auth_id: string;
    must_reset_password: boolean;
  }>
) {
  try {
    const updateData: any = {};
    if (payload.full_name !== undefined) updateData.full_name = payload.full_name;
    if (payload.class !== undefined) updateData.student_class = payload.class;
    if (payload.school_name !== undefined) updateData.school_name = payload.school_name;
    if (payload.age !== undefined) updateData.age = payload.age;
    if (payload.gender !== undefined) updateData.gender = payload.gender;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.parent_phone !== undefined)
      updateData.parent_phone = payload.parent_phone;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.enrollment_status !== undefined) {
      updateData.enrollment_status = payload.enrollment_status;
      if (payload.enrollment_status === "enrolled") {
        updateData.enrolled_at = new Date().toISOString();
      }
    }
    if (payload.auth_id !== undefined) updateData.auth_id = payload.auth_id;
    if (payload.must_reset_password !== undefined)
      updateData.must_reset_password = payload.must_reset_password;

    updateData.updated_at = new Date().toISOString();

    // Update the student
    const { error: updateError } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", id);

    if (updateError) return { data: undefined, error: updateError };
    
    // Fetch the updated student
    const { data, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return { data: undefined, error: fetchError };
    if (data) (data as any).class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Enroll a student
export async function enrollStudent(id: number) {
  try {
    // Update the enrollment status
    const { error: updateError } = await supabase
      .from("students")
      .update({
        enrollment_status: "enrolled",
        enrolled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return { data: undefined, error: updateError };
    
    // Fetch the updated student
    const { data, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return { data: undefined, error: fetchError };
    if (data) (data as any).class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Suspend a student
export async function suspendStudent(id: number) {
  try {
    // Update the enrollment status
    const { error: updateError } = await supabase
      .from("students")
      .update({
        enrollment_status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return { data: undefined, error: updateError };
    
    // Fetch the updated student
    const { data, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return { data: undefined, error: fetchError };
    if (data) (data as any).class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Clear password reset flag (student has reset password)
export async function clearPasswordResetFlag(id: number) {
  try {
    // Update the password reset flag
    const { error: updateError } = await supabase
      .from("students")
      .update({
        must_reset_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return { data: undefined, error: updateError };
    
    // Fetch the updated student
    const { data, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) return { data: undefined, error: fetchError };
    if (data) (data as any).class = (data as any).student_class;
    return { data: data as Student };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Delete a student (hard delete)
export async function deleteStudent(id: number) {
  try {
    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) return { success: false, error };
    return { success: true };
  } catch (err) {
    return { success: false, error: { message: String(err) } };
  }
}
