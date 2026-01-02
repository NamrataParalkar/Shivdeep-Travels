import { supabase } from "./supabaseClient";

export type OtherBooking = {
  id: number;
  student_id: string;
  booking_type: string;
  start_date: string;
  end_date?: string;
  pickup_location: string;
  drop_location: string;
  passenger_count: number;
  notes?: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
};

export async function createBooking(
  studentId: string,
  data: Omit<OtherBooking, "id" | "created_at" | "status" | "student_id">
) {
  try {
    const { data: result, error } = await supabase
      .from("other_bookings")
      .insert({
        ...data,
        student_id: studentId,
        status: "Pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: result as OtherBooking };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function getStudentBookings(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("other_bookings")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: data as OtherBooking[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function getAllBookings() {
  try {
    const { data, error } = await supabase
      .from("other_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: undefined, error };
    return { data: data as OtherBooking[] };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function updateBookingStatus(
  bookingId: number,
  status: "Pending" | "Approved" | "Rejected"
) {
  try {
    const { data, error } = await supabase
      .from("other_bookings")
      .update({ status })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data: data as OtherBooking };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function deleteBooking(bookingId: number) {
  try {
    const { error } = await supabase
      .from("other_bookings")
      .delete()
      .eq("id", bookingId);

    if (error) return { error };
    return { success: true };
  } catch (err) {
    return { error: { message: String(err) } };
  }
}
