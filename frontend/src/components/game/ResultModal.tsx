"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { SubmitResult } from "@/types"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, BookOpen, Trophy, RotateCcw, User } from "lucide-react"

interface Props {
  result: SubmitResult
}

/* ── Confetti particle ── */
const COLORS = ["#f59e0b","#fcd34d","#10b981","#6366f1","#ec4899","#f97316","#84cc16"]
function Confetti() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    size: `${6 + Math.random() * 8}px`,
    shape: Math.random() > 0.5 ? "rounded-full" : "rounded-sm",
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 animate-confetti ${p.shape}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: `${0.9 + Math.random() * 0.6}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Animated XP counter ── */
function XPCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (target === 0) return
    let start = 0
    const duration = 1200
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target])

  return <span>{display}</span>
}

export function ResultModal({ result }: Props) {
  const { is_correct, points_earned, correct_answer } = result
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // tiny delay so the entrance feels deliberate
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    /* Full overlay */
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      {/* Modal card */}
      <div
        className={`relative w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 ${
          visible ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        } ${
          is_correct
            ? "bg-gradient-to-b from-emerald-950/90 to-card border-emerald-500/30 glow-emerald"
            : "bg-gradient-to-b from-red-950/80 to-card border-destructive/30 animate-shake"
        }`}
      >
        {/* confetti only on correct */}
        {is_correct && <Confetti />}

        <div className="relative z-10 p-6 space-y-5">
          {/* Result header */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto animate-pop-in ${
              is_correct ? "bg-emerald-500/20" : "bg-destructive/20"
            }`}>
              {is_correct
                ? <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                : <XCircle className="w-9 h-9 text-destructive" />
              }
            </div>

            <h3 className={`text-2xl font-bold animate-slide-up ${
              is_correct ? "text-emerald-400" : "text-destructive"
            }`}>
              {is_correct ? "Acertou!" : "Quase lá!"}
            </h3>

            {is_correct && points_earned > 0 && (
              <div className="animate-slide-up-delay">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-lg">
                  +<XPCounter target={points_earned} /> XP
                </span>
              </div>
            )}

            {!is_correct && (
              <p className="text-sm text-muted-foreground animate-fade-in">
                Não desanime, tente novamente amanhã!
              </p>
            )}
          </div>

          {/* Divider */}
          <div className={`h-px ${is_correct ? "bg-emerald-500/20" : "bg-destructive/20"}`} />

          {/* Book reveal */}
          <div className="rounded-2xl bg-background/60 border border-border/40 p-4 animate-slide-up-delay space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              A obra era
            </p>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold font-literary italic text-base leading-snug text-foreground">
                  {correct_answer.title}
                </p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {correct_answer.author}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {is_correct ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/ranking" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    Ranking
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 gap-1.5 border-border/60 hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <User className="w-4 h-4" />
                    Perfil
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/history" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ver histórico
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
