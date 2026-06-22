"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Challenge } from "@/types"
import { PassageCard } from "@/components/game/PassageCard"
import { isLoggedIn } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2 } from "lucide-react"

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function GamePage() {
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/challenge/today")
      .then((res) => setChallenge(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Nenhum desafio disponível hoje."))
  }, [router])

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero strip */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Desafio do Dia</h1>
              <p className="text-xs text-muted-foreground capitalize">{formatDate(new Date())}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Leia o trecho e identifique a obra
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/30">
              <BookOpen className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : !challenge ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-sm">Carregando desafio…</p>
          </div>
        ) : (
          <PassageCard challenge={challenge} mode="today" />
        )}
      </div>
    </main>
  )
}
