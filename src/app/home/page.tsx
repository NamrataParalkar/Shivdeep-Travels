"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page was removed per request. Redirect users to the landing page.
export default function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
