"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function BackButton() {
  const router = useRouter();
  const handleBack = useCallback(() => {
    try {
      // Prefer history back; fallback to home
      if (typeof window !== "undefined" && window.history.length > 1) router.back();
      else router.push("/");
    } catch (err) {
      router.push("/");
    }
  }, [router]);

  return (
    <button
      aria-label="Go back"
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 px-3 py-2 rounded-full shadow-sm hover:shadow-md"
    >
      ←
    </button>
  );
}
