"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { getLevel, type SubmitResult } from "@/types"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, BookOpen, Trophy, RotateCcw, User, Flame, Loader2, Award } from "lucide-react"
import { api } from "@/lib/api"


interface Props {
  result: SubmitResult
  challengeId: string
  allowAi: boolean
  mode?: "today" | "history"
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

/* ── Animated Streak counter ── */
function StreakCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(Math.max(0, target - 1))
  const [bouncing, setBouncing] = useState(false)

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      let start = Math.max(0, target - 1)
      if (start === target) {
        setBouncing(true)
        return
      }
      
      const duration = 1000
      const startTime = performance.now()

      function tick(now: number) {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentVal = Math.round(start + eased * (target - start))
        setDisplay(currentVal)
        
        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          setBouncing(true)
        }
      }
      const animId = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(animId)
    }, 1000)

    return () => clearTimeout(delayTimer)
  }, [target])

  return (
    <span className={`inline-block transition-transform duration-300 ${bouncing ? "scale-125 font-black text-orange-400 animate-bounce" : "font-extrabold text-orange-500"}`}>
      {display}
    </span>
  )
}


export function ResultModal({ result, challengeId, allowAi, mode = "today" }: Props) {
  const { is_correct, points_earned, correct_answer, new_streak, new_xp } = result
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [curiosities, setCuriosities] = useState<string[]>([])
  const [loadingCuriosities, setLoadingCuriosities] = useState(false)

  const [hasLevelUp, setHasLevelUp] = useState(false)
  const [oldLevel, setOldLevel] = useState("")
  const [newLevelName, setNewLevelName] = useState("")

  useEffect(() => {
    if (is_correct && new_xp !== undefined && points_earned > 0) {
      const oldXp = Math.max(0, new_xp - points_earned)
      const oldLvl = getLevel(oldXp)
      const newLvl = getLevel(new_xp)
      if (oldLvl !== newLvl) {
        setHasLevelUp(true)
        setOldLevel(oldLvl)
        setNewLevelName(newLvl)
      }
    }
  }, [is_correct, new_xp, points_earned])

  useEffect(() => {
    setMounted(true)
    // tiny delay so the entrance feels deliberate
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (is_correct && allowAi) {
      setLoadingCuriosities(true)
      api.get(`/challenge/curiosities/${challengeId}`)
        .then((res) => setCuriosities(res.data))
        .catch((err) => console.error("Error loading curiosities:", err))
        .finally(() => setLoadingCuriosities(false))
    }
  }, [is_correct, allowAi, challengeId])

  if (!mounted) return null

  return createPortal(
    /* Full overlay */
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      {/* Modal card */}
      <div
        className={`relative w-full max-w-sm rounded-3xl overflow-y-auto max-h-[90vh] border shadow-2xl transition-all duration-500 ${
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

          {/* Level Up block */}
          {hasLevelUp && (
            <div className="rounded-2xl bg-gradient-to-b from-yellow-950/60 to-background/70 border border-yellow-500/30 p-5 text-center space-y-3 animate-bounce-in relative overflow-hidden glow-primary">
              {/* Radial gradient background lights */}
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 70%)" }} />
              
              {/* Expanding circular beam */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full border border-dashed border-yellow-500/40 animate-pulse-beam" />
              </div>

              {/* Sparks explosion (16 particles) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i * 360) / 16
                  const distance = 70 + Math.random() * 50
                  const tx = `${Math.cos((angle * Math.PI) / 180) * distance}px`
                  const ty = `${Math.sin((angle * Math.PI) / 180) * distance}px`
                  const delay = `${Math.random() * 0.15}s`
                  return (
                    <span
                      key={i}
                      className="particle-spark"
                      style={{
                        "--tx": tx,
                        "--ty": ty,
                        animationDelay: delay,
                        left: "50%",
                        top: "50%",
                        marginLeft: "-3px",
                        marginTop: "-3px",
                      } as React.CSSProperties}
                    />
                  )
                })}
              </div>

              <div className="relative flex justify-center py-2">
                <div className="absolute inset-0 w-16 h-16 bg-yellow-500/30 rounded-full blur-xl mx-auto animate-pulse" />
                <Award className="w-16 h-16 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.9)] relative z-10 animate-badge-pop" />
              </div>
              <div className="space-y-1 relative z-10">
                <h4 className="text-2xl font-black tracking-wider text-shimmer-gold uppercase">
                  Subiu de Nível!
                </h4>
                <p className="text-base text-foreground font-bold">
                  Você agora é um <span className="text-primary font-extrabold">{newLevelName}</span>!
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nível anterior: {oldLevel}
                </p>
              </div>
            </div>
          )}

          {/* Duolingo Streak Flame block */}
          {mode !== "history" && is_correct && new_streak !== undefined && new_streak > 0 && (
            <div className="rounded-2xl bg-gradient-to-b from-orange-950/50 to-background/60 border border-orange-500/25 p-5 text-center space-y-3 animate-scale-in relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)" }} />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full border border-dashed border-orange-500/30 animate-fire-ring" />
              </div>

              {/* Heat rise sparks (8 dynamic sparks) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => {
                  const hx = `${(Math.random() - 0.5) * 20}px`
                  const delay = `${i * 0.2}s`
                  const size = `${3 + Math.random() * 4}px`
                  return (
                    <span
                      key={i}
                      className="absolute bottom-6 rounded-full animate-heat-rise"
                      style={{
                        "--hx": hx,
                        animationDelay: delay,
                        width: size,
                        height: size,
                        left: `calc(50% + ${(Math.random() - 0.5) * 16}px)`,
                        background: Math.random() > 0.4 ? "#f97316" : "#facc15",
                        boxShadow: "0 0 6px rgba(249,115,22,0.6)"
                      } as React.CSSProperties}
                    />
                  )
                })}
              </div>

              <div className="relative flex justify-center py-2">
                <div className="absolute inset-0 w-16 h-16 bg-orange-500/30 rounded-full blur-xl mx-auto animate-pulse" />
                <div className="flame-premium">
                  <Flame className="w-16 h-16 text-orange-500 fill-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.9)] relative z-10" />
                </div>
              </div>
              <div className="space-y-0.5 relative z-10">
                <h4 className="text-2xl font-black text-orange-400 tracking-tight">
                  <StreakCounter target={new_streak} /> {new_streak === 1 ? "DIA" : "DIAS"}!
                </h4>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-200/70">
                  Ofensiva diária ativa!
                </p>
              </div>
            </div>
          )}

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

          {/* Claude Curiosities */}
          {is_correct && allowAi && (
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 animate-slide-up-delay space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                💡 Curiosidades da Obra
              </p>
              {loadingCuriosities ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                  <span>Obtendo curiosidades...</span>
                </div>
              ) : curiosities.length > 0 ? (
                <ul className="space-y-2">
                  {curiosities.map((item, idx) => (
                    <li key={idx} className="text-xs text-foreground/80 leading-relaxed list-disc list-inside pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma curiosidade carregada.</p>
              )}
            </div>
          )}

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
    </div>,
    document.body
  )
}
