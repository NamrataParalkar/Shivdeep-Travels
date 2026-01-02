import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabaseClient";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "student" | "driver" | "admin";

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  fullName?: string;
  authId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session: authSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setLoading(false);
          return;
        }

        if (authSession?.user) {
          setSession(authSession);
          // Fetch user profile from localStorage (for quick UI state)
          // In production, also verify with backend
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (e) {
              console.error("Failed to parse cached user:", e);
            }
          }
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event);

      if (newSession?.user) {
        setSession(newSession);
        // Update user from localStorage if available
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            console.error("Failed to parse cached user:", e);
          }
        }
      } else {
        setUser(null);
        setSession(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem("user");

      // Clear state
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin: user?.role === "admin",
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
