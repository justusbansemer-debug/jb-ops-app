"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";

// Hides the top nav bar on the login screen — no point showing "Dashboard,
// Customers, Jobs…" links to someone who isn't signed in yet.
export default function ConditionalNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Nav />;
}
