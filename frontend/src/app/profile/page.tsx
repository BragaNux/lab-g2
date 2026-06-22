"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
      <div className="rounded-2xl border border-border/60 bg-card p-6 mb-4 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-sm font-semibold ${level.color}`}>{level.name}</span>
            {user.is_premium && (
              <Badge className="bg-primary/15 text-primary border-primary/20 text-xs gap-1">
                <Crown className="w-3 h-3" /> Premium
              </Badge>
            )}
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
            <h3 className="font-semibold text-sm">Plano Premium Simulado</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Acesso ao histórico completo de desafios, 3 dicas por partida e muito mais.
          </p>
          <Button
            onClick={handleSimulatePremium}
            disabled={simLoading}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            size="sm"
          >
            {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            {simLoading ? "Ativando…" : "Ativar Premium Simulado"}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4 animate-slide-up-delay">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Crown className="w-4 h-4" />
            Premium ativo — aproveite todos os recursos!
          </div>
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
