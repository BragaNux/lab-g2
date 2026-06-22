"use client"

import { usePathname, useRouter } from "next/navigation"
import { Navbar } from "./Navbar"
import { useEffect, useState } from "react"
import { isLoggedIn } from "@/lib/auth"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuth = pathname === "/login" || pathname === "/register"
  
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const logged = isLoggedIn()
    setIsAuthenticated(logged)
    setCheckingAuth(false)

    if (!logged && !isAuth) {
      router.replace("/login")
    }
  }, [pathname, isAuth, router])

  // Prevent flash of private UI/Navbar before authentication check completes
  if (!isAuth && (checkingAuth || !isAuthenticated)) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuth && <Navbar />}
      <div className="flex-1">{children}</div>
    </div>
  )
}
