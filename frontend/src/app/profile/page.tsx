"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getLevel, type User } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Flame, Star, BookOpen, Loader2, LogOut, Shield } from "lucide-react"
import { logout } from "@/lib/auth"

const LEVELS = [
  { name: "Leitor",    minXP: 0,    color: "text-muted-foreground" },
  { name: "Bibliófilo", minXP: 300,  color: "text-blue-400" },
  { name: "Erudito",   minXP: 1000, color: "text-primary" },
]

function getLevelProgress(xp: number) {
  const curr = [...LEVELS].reverse().find((l) => xp >= l.minXP)!
  const nextIdx = LEVELS.findIndex((l) => l.name === curr.name) + 1
  const next = LEVELS[nextIdx]
  if (!next) return { level: curr, progress: 100, nextName: null, xpToNext: 0 }
  const progress = Math.min(((xp - curr.minXP) / (next.minXP - curr.minXP)) * 100, 100)
  return { level: curr, progress, nextName: next.name, xpToNext: next.minXP - xp }
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/auth/me").then((res) => setUser(res.data))
  }, [router])

  async function handleSimulatePremium() {
    setSimLoading(true)
    try {
      const res = await api.post("/users/me/simulate-premium")
      setUser(res.data)
    } finally {
      setSimLoading(false)
    }
  }

  async function handleSimulateAdmin() {
    setSimLoading(true)
    try {
      const res = await api.post("/users/me/simulate-admin")
      setUser(res.data)
    } finally {
      setSimLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </main>
    )
  }

  const { level, progress, nextName, xpToNext } = getLevelProgress(user.xp)

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-10 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 animate-slide-up">Perfil</h1>

      {/* User card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 mb-4 animate-slide-up">
        {/* Top row: avatar + name + badges */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold truncate">{user.username}</h2>
              <span className={`text-xs font-semibold ${level.color} shrink-0`}>{level.name}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {user.is_premium && (
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] gap-1 shrink-0">
                  <Crown className="w-2.5 h-2.5" /> Premium
                </Badge>
              )}
              {user.is_admin && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] gap-1 shrink-0">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{user.xp} XP</span>
            {nextName && <span>{xpToNext} XP para {nextName}</span>}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: "XP Total", value: user.xp },
            { icon: Flame, label: "Sequência", value: `${user.streak}d` },
            { icon: BookOpen, label: "Nível", value: level.name },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium section */}
      {!user.is_premium ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-4 animate-slide-up-delay">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Plano Premium</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Desbloqueie o histórico completo de desafios, até 3 dicas por partida e acesso antecipado a novas funcionalidades.
          </p>
          <Button
            onClick={handleSimulatePremium}
            disabled={simLoading}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            size="sm"
          >
            {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            {simLoading ? "Ativando..." : "Solicitar Premium"}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4 animate-slide-up-delay">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Crown className="w-4 h-4" />
            Conta Premium ativa. Aproveite todos os recursos!
          </div>
        </div>
      )}

      {/* Admin Test Simulation */}
      {user.username === "brayan" && !user.is_admin && (
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-5 mb-4 animate-slide-up-delay">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Modo de Teste</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Promova sua conta temporariamente a administrador para gerenciar o acervo, trechos e outros usuários no Painel Admin.
          </p>
          <Button
            onClick={handleSimulateAdmin}
            disabled={simLoading}
            className="w-full gap-2 bg-secondary hover:bg-secondary/80 border border-border"
            size="sm"
          >
            {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {simLoading ? "Ativando..." : "Ativar Admin de Teste"}
          </Button>
        </div>
      )}

      {user.is_admin && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-4 animate-slide-up-delay flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Shield className="w-4 h-4" />
            Administrador Ativo
          </div>
          <Link href="/admin">
            <Button size="sm" className="h-8 text-xs font-semibold">
              Painel Admin
            </Button>
          </Link>
        </div>
      )}


      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground gap-2"
        onClick={() => { logout(); router.push("/login") }}
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>
    </main>
  )
}
