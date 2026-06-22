"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Trophy, Clock, User, Menu, X, LogOut, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { isLoggedIn, logout } from "@/lib/auth"
import { api } from "@/lib/api"

const links = [
  { href: "/",         label: "Jogar",     icon: BookOpen },
  { href: "/history",  label: "Histórico", icon: Clock },
  { href: "/ranking",  label: "Ranking",   icon: Trophy },
  { href: "/profile",  label: "Perfil",    icon: User },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isLoggedIn()) {
      api.get("/auth/me")
        .then((res) => setIsAdmin(res.data.is_admin))
        .catch(() => setIsAdmin(false))
    } else {
      setIsAdmin(false)
    }
  }, [pathname])


  const loggedIn = mounted && isLoggedIn()

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icon_bookguess.png"
            alt="BookGuess"
            width={30}
            height={30}
            className="rounded-lg transition-transform group-hover:scale-110"
          />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-primary">Book</span>Guess
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
          {loggedIn && isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === "/admin"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 ml-1"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md animate-fade-in">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                pathname === href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {loggedIn && isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                pathname === "/admin" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          )}
        </div>
      )}
    </header>
  )
}
