"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getLevel, type RankingItem } from "@/types"
import { Trophy, Loader2, Flame, Medal, BookOpen } from "lucide-react"

/* ── Podium medal colours ── */
const PODIUM = [
  {
    // 2nd – LEFT
    rank: 2,
    height: "h-24",
    bg: "from-slate-400/20 to-slate-400/5 border-slate-400/30",
    text: "text-slate-300",
    label: "text-slate-300",
    iconColor: "text-slate-300",
    ringColor: "ring-slate-400/40",
    zIndex: "z-10",
    order: "order-1",
    mt: "mt-8",           // lower than gold
    podiumBg: "bg-slate-400/10",
  },
  {
    // 1st – CENTER (highest)
    rank: 1,
    height: "h-32",
    bg: "from-yellow-500/25 to-yellow-500/5 border-yellow-500/40",
    text: "text-yellow-400",
    label: "text-yellow-400",
    iconColor: "text-yellow-400",
    ringColor: "ring-yellow-500/50",
    zIndex: "z-20",
    order: "order-2",
    mt: "mt-0",           // top – gold is tallest
    podiumBg: "bg-yellow-500/10",
  },
  {
    // 3rd – RIGHT
    rank: 3,
    height: "h-16",
    bg: "from-amber-600/20 to-amber-600/5 border-amber-600/30",
    text: "text-amber-500",
    label: "text-amber-500",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-600/40",
    zIndex: "z-10",
    order: "order-3",
    mt: "mt-14",          // lowest
    podiumBg: "bg-amber-600/10",
  },
]

/* Medal icon per rank */
function RankMedalIcon({ rank, className }: { rank: number; className?: string }) {
  if (rank === 1) return <Trophy className={className} />
  return <Medal className={className} />
}

export default function RankingPage() {
  const router = useRouter()
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/ranking").then((res) => setRanking(res.data.ranking)).finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </main>
    )
  }

  // Reorder: we render in display order [2nd, 1st, 3rd]
  const top3Raw = ranking.slice(0, 3)  // [1st, 2nd, 3rd]
  // Map to podium display slots: slot 0 = 2nd, slot 1 = 1st, slot 2 = 3rd
  const podiumSlots = [top3Raw[1], top3Raw[0], top3Raw[2]].filter(Boolean) as RankingItem[]
  const podiumConfig = [PODIUM[1], PODIUM[0], PODIUM[2]] // silver, gold, bronze

  const rest = ranking.slice(3)

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 mb-3">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Top {ranking.length} leitores</p>
      </div>

      {/* ── Olympic Podium ── */}
      {podiumSlots.length > 0 && (
        <div className="mb-8 animate-slide-up-delay">
          {/* Player cards — aligned to bottom of the podium blocks */}
          <div className="flex items-end justify-center gap-3 px-2">
            {podiumSlots.map((item, slotIdx) => {
              const cfg = podiumConfig[slotIdx]
              const isFirst = cfg.rank === 1
              return (
                <div
                  key={item.user_id}
                  className={`flex-1 flex flex-col items-center ${cfg.mt} ${cfg.order} max-w-[140px]`}
                >
                  {/* Card */}
                  <div
                    className={`w-full rounded-2xl border bg-gradient-to-b ${cfg.bg} p-3 text-center ${cfg.zIndex} relative ${
                      item.is_me ? `ring-2 ${cfg.ringColor}` : ""
                    } ${isFirst ? "shadow-xl shadow-yellow-500/10" : ""}`}
                  >
                    {/* Medal icon */}
                    <div className={`flex justify-center mb-2`}>
                      <RankMedalIcon
                        rank={cfg.rank}
                        className={`${isFirst ? "w-7 h-7" : "w-5 h-5"} ${cfg.iconColor}`}
                      />
                    </div>

                    {/* Rank number */}
                    <p className={`text-[10px] font-bold tracking-wider uppercase ${cfg.label} mb-1`}>
                      {cfg.rank}º lugar
                    </p>

                    {/* Username */}
                    <p className="font-bold text-xs truncate text-foreground leading-tight">
                      {item.username}
                    </p>
                    {item.is_me && (
                      <p className="text-[10px] text-primary mt-0.5">(você)</p>
                    )}

                    {/* Level */}
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {getLevel(item.xp)}
                    </p>

                    {/* XP */}
                    <p className={`${isFirst ? "text-base" : "text-sm"} font-black mt-1 ${cfg.text}`}>
                      {item.xp}
                    </p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>

                  {/* Podium block beneath */}
                  <div
                    className={`w-full ${cfg.height} ${cfg.podiumBg} border border-t-0 ${cfg.bg.split(" ")[2]} rounded-b-xl flex items-end justify-center pb-1.5`}
                  >
                    <span className={`text-2xl font-black ${cfg.text} opacity-30 select-none`}>
                      {cfg.rank}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Rest of the list ── */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-fade-in">
          {rest.map((item, i) => (
            <div
              key={item.user_id}
              className={`flex items-center px-5 py-3.5 ${
                i < rest.length - 1 ? "border-b border-border/40" : ""
              } ${item.is_me ? "bg-primary/5" : "hover:bg-muted/40 transition-colors"}`}
            >
              <span className="w-7 text-sm font-mono text-muted-foreground shrink-0">
                {item.position}.
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">
                  {item.username}
                  {item.is_me && (
                    <span className="ml-1.5 text-xs text-primary font-normal">(você)</span>
                  )}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{getLevel(item.xp)}</span>
                  {item.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-orange-400">
                      <Flame className="w-3 h-3" />
                      {item.streak}d
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-sm">{item.xp}</span>
                <span className="text-xs text-muted-foreground ml-1">XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {ranking.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/30 mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground">Nenhum leitor no ranking ainda.</p>
        </div>
      )}
    </main>
  )
}
