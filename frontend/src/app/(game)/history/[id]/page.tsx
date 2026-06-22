"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import type { Challenge } from "@/types"
import { PassageCard } from "@/components/game/PassageCard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function HistoryChallengePlayPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get(`/challenge/history/${id}`)
      .then((res) => setChallenge(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Desafio não encontrado."))
  }, [id, router])

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Back bar */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Histórico
            </Button>
          </Link>
          {challenge && (
            <span className="text-sm text-muted-foreground">
              / Desafio Anterior
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        {error ? (
          <div className="text-center space-y-4 animate-fade-in max-w-sm">
            <span className="text-4xl block">🔒</span>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/history">
              <Button variant="outline" size="sm">Voltar ao Histórico</Button>
            </Link>
          </div>
        ) : !challenge ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-sm">Carregando desafio…</p>
          </div>
        ) : (
          <PassageCard challenge={challenge} mode="history" />
        )}
      </div>
    </main>
  )
}
