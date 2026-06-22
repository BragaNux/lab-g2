"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import type { HistoryChallenge, User } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Lock, ChevronRight, Loader2, Crown } from "lucide-react"

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-xs ${i < value ? "text-primary" : "text-muted-foreground/25"}`}>★</span>
      ))}
    </span>
  )
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [challenges, setChallenges] = useState<HistoryChallenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/auth/me").then((res) => {
      setUser(res.data)
      if (res.data.is_premium) {
        return api.get("/challenge/history").then((r) => setChallenges(r.data))
      }
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </main>
    )
  }

  if (!user?.is_premium) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-sm text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Acesso Exclusivo</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              O histórico de desafios anteriores é uma funcionalidade Premium.
              Ative o plano simulado para explorar todos os desafios passados.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left space-y-2">
            {["Acesso a todos os desafios passados", "Jogue no seu próprio ritmo", "3 dicas por desafio"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <span className="text-primary text-xs">✦</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link href="/profile">
            <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Crown className="w-4 h-4" />
              Ativar Premium Simulado
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-1">
          <Clock className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Histórico de Desafios</h1>
          <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">Premium</Badge>
        </div>
        <p className="text-muted-foreground text-sm ml-8">
          {challenges.length} desafio{challenges.length !== 1 ? "s" : ""} disponível{challenges.length !== 1 ? "s" : ""}
        </p>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <span className="text-4xl block mb-3">📚</span>
          <p className="text-muted-foreground">Nenhum desafio anterior disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up-delay">
          {challenges.map((c, i) => (
            <Link
              key={c.id}
              href={`/history/${c.id}`}
              className="block group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="rounded-xl border border-border/60 bg-card p-4 card-hover">
                <div className="flex items-center justify-between gap-4">
                  {/* Date badge */}
                  <div className="shrink-0 w-14 text-center">
                    <div className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-1.5">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide">
                        {formatShortDate(c.date)}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">Desafio do Dia {formatFullDate(c.date)}</p>
                    </div>
                    <Stars value={c.difficulty} />
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
