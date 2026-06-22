"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === "/login" || pathname === "/register"
  return (
    <div className="min-h-screen flex flex-col">
      {!isAuth && <Navbar />}
      <div className="flex-1">{children}</div>
    </div>
  )
}
