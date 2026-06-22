"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { getLevel, type RankingItem } from "@/types"
import { Trophy, Loader2 } from "lucide-react"

const MEDAL = ["🥇", "🥈", "🥉"]
const PODIUM_COLORS = [
  "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400",
  "from-slate-400/20 to-slate-400/5 border-slate-400/30 text-slate-300",
  "from-amber-600/20 to-amber-600/5 border-amber-600/30 text-amber-500",
]

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

  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 mb-3">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Top {ranking.length} leitores</p>
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6 animate-slide-up-delay">
          {top3.map((item, i) => (
            <div
              key={item.user_id}
              className={`rounded-2xl border bg-gradient-to-b p-3 text-center ${PODIUM_COLORS[i]} ${
                item.is_me ? "ring-2 ring-primary/40" : ""
              }`}
            >
              <div className="text-2xl mb-1">{MEDAL[i]}</div>
              <p className="font-bold text-xs truncate text-foreground">{item.username}</p>
              {item.is_me && <p className="text-[10px] text-primary mt-0.5">(você)</p>}
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{getLevel(item.xp)}</p>
              <p className="text-sm font-black mt-1">{item.xp}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          ))}
        </div>
      )}

      {/* Rest of the list */}
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
                  <span className="text-xs text-muted-foreground">{getLevel(item.xp)}</span>
                  {item.streak > 0 && (
                    <span className="text-xs text-orange-400">🔥 {item.streak}d</span>
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
          <span className="text-4xl block mb-3">📚</span>
          <p className="text-muted-foreground">Nenhum leitor no ranking ainda.</p>
        </div>
      )}
    </main>
  )
}
