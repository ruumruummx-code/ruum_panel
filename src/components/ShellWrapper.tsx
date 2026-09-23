"use client";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

const PUBLIC = ["/login", "/auth"];

export default function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (isPublic) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
