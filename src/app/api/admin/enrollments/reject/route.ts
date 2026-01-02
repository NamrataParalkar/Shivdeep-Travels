import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE configuration on server: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const serverSupabase = createClient(supabaseUrl, serviceRoleKey);

// Helper: verify user is an admin
async function verifyAdminAuth(authId: string) {
  try {
    const { data, error } = await serverSupabase
      .from("admins")
      .select("id")
      .eq("auth_id", authId)
      .single();
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const enrollmentId = body?.id;
    const authId = body?.authId;
    
    if (!enrollmentId) {
      return NextResponse.json({ error: { message: "Missing enrollment id" } }, { status: 400 });
    }
    
    if (!authId) {
      return NextResponse.json({ error: { message: "Unauthorized: missing auth ID" } }, { status: 401 });
    }
    
    // Verify admin
    const isAdmin = await verifyAdminAuth(authId);
    if (!isAdmin) {
      return NextResponse.json({ error: { message: "Unauthorized: not an admin" } }, { status: 403 });
    }

    // Fetch enrollment to verify it exists
    const { data: enrollment, error: enrollError } = await serverSupabase
      .from("bus_enrollments")
      .select("id, status")
      .eq("id", enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: { message: "Enrollment not found" } }, { status: 404 });
    }

    // Update enrollment status to rejected
    const { data: updatedEnrollment, error: updateError } = await serverSupabase
      .from("bus_enrollments")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 });
    }

    return NextResponse.json({ data: updatedEnrollment });
  } catch (err) {
    console.error("Reject enrollment error:", err);
    return NextResponse.json({ error: { message: String(err) } }, { status: 500 });
  }
}
