"use client";
import { ReactNode } from "react";
import BackButton from "../BackButton";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  gradient: string;
  accentColor: string;
}

export function AdminLayout({
  children,
  title,
  gradient,
  accentColor,
}: AdminLayoutProps) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10`}
    >
      {/* Decorative glowing circles */}
      <div className={`absolute top-0 left-0 w-64 h-64 bg-${accentColor}-300 rounded-full blur-3xl opacity-30`}></div>
      <div className={`absolute bottom-10 right-10 w-72 h-72 bg-${accentColor}-300 rounded-full blur-3xl opacity-30`}></div>

      {/* Back Button for admin context */}
      <BackButton />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
