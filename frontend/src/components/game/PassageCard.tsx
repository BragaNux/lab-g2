"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import type { Challenge, SubmitResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HintButton } from "./HintButton"
import { ResultModal } from "./ResultModal"
import { Loader2 } from "lucide-react"

interface Props {
  challenge: Challenge
  mode?: "today" | "history"
}

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-base ${i < value ? "text-primary" : "text-muted-foreground/30"}`}>
          ★
        </span>
      ))}
    </span>
  )
}

export function PassageCard({ challenge, mode = "today" }: Props) {
  const [answer, setAnswer] = useState("")
  const [hint, setHint] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submitUrl = mode === "history"
    ? `/challenge/history/${challenge.id}/play`
    : "/challenge/today/submit"

  const pointsAvailable = hint
    ? Math.floor(challenge.points_available / 2)
    : challenge.points_available

  async function handleSubmit() {
    if (!answer.trim()) return
    setLoading(true)
    setError("")
    try {
      const payload =
        mode === "history"
          ? { answer: answer.trim() }
          : { answer: answer.trim(), used_hint: !!hint }
      const res = await api.post(submitUrl, payload)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao enviar resposta.")
    } finally {
      setLoading(false)
    }
  }

  if (challenge.already_played && !result) {
    return (
      <div className="max-w-2xl w-full mx-auto animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <span className="text-4xl block">📖</span>
          <p className="text-lg font-semibold">Desafio já concluído</p>
          <p className="text-muted-foreground text-sm">
            {mode === "today"
              ? "Você completou o desafio de hoje. Volte amanhã!"
              : "Você já jogou este desafio anteriormente."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl w-full mx-auto animate-slide-up">
      <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/20 overflow-hidden">
        {/* Header bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stars value={challenge.difficulty} />
            <span className="text-xs text-muted-foreground">Dificuldade {challenge.difficulty}/5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Vale</span>
            <span className="text-sm font-bold text-primary">{pointsAvailable} XP</span>
          </div>
        </div>

        {/* Passage */}
        <div className="px-4 sm:px-6 py-6">
          <blockquote className="relative">
            <span className="absolute -top-4 -left-1 text-6xl text-primary/20 font-literary leading-none select-none">
              &ldquo;
            </span>
            <p className="font-literary text-lg sm:text-xl italic leading-relaxed text-foreground/90 pl-4 relative z-10">
              {challenge.passage_text}
            </p>
            <span className="text-primary/20 font-literary text-4xl leading-none select-none float-right -mb-4">
              &rdquo;
            </span>
          </blockquote>
        </div>

        {/* Hint */}
        {hint && (
          <div className="mx-6 mb-4 rounded-xl bg-primary/8 border border-primary/20 p-4 animate-scale-in">
            <div className="flex gap-2 items-start">
              <span className="text-lg mt-0.5">💡</span>
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Dica</p>
                <p className="text-sm text-foreground/80">{hint}</p>
                <p className="text-xs text-muted-foreground mt-2">Resposta vale 50% dos pontos</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer: input / result */}
        <div className="px-4 sm:px-6 pb-6">
          {result ? (
            <ResultModal result={result} />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Digite o título do livro..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={loading}
                  className="h-12 text-base pr-10 bg-muted/40 border-border/60 focus:border-primary/50 focus:ring-primary/20"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-3.5 w-5 h-5 animate-spin text-muted-foreground" />
                )}
              </div>
              {error && (
                <p className="text-sm text-destructive animate-fade-in">{error}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !answer.trim()}
                  className="flex-1 h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
                >
                  Confirmar Resposta
                </Button>
                {!hint && (
                  <HintButton
                    url={mode === "history" ? `/challenge/history/${challenge.id}/hint` : "/challenge/today/hint"}
                    onHintReceived={setHint}
                    disabled={loading}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Pressione Enter para confirmar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
