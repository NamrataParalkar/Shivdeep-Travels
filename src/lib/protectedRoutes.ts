import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";

/**
 * Hook to protect admin routes - ensures user is authenticated and has admin role
 */
export function useAdminAuth() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          router.push("/login");
          setLoading(false);
          return;
        }

        // Check if user is in admins table
        const { data: adminRecord, error: adminError } = await supabase
          .from("admins")
          .select("id")
          .eq("auth_id", session.user.id)
          .single();

        if (adminError || !adminRecord) {
          console.error("User is not an admin");
          router.push("/");
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        setLoading(false);
      } catch (err) {
        console.error("Admin auth check error:", err);
        router.push("/login");
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  return { isAdmin, loading };
}

/**
 * Hook to protect student/parent routes
 */
export function useStudentAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          router.push("/login");
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/login");
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, loading };
}
