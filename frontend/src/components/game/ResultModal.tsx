import Link from "next/link"
import type { SubmitResult } from "@/types"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, BookOpen, Trophy } from "lucide-react"

interface Props {
  result: SubmitResult
}

export function ResultModal({ result }: Props) {
  const { is_correct, points_earned, correct_answer } = result

  return (
    <div className={`rounded-2xl border p-6 animate-bounce-in ${
      is_correct
        ? "bg-emerald-500/10 border-emerald-500/30"
        : "bg-destructive/10 border-destructive/30"
    }`}>
      {/* Icon + title */}
      <div className="flex items-center gap-3 mb-4">
        {is_correct ? (
          <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-7 h-7 text-destructive shrink-0" />
        )}
        <div>
          <h3 className={`font-bold text-lg ${is_correct ? "text-emerald-400" : "text-destructive"}`}>
            {is_correct ? "Correto!" : "Incorreto"}
          </h3>
          {is_correct && points_earned > 0 && (
            <p className="text-sm text-emerald-400/80">+{points_earned} XP ganhos</p>
          )}
        </div>
      </div>

      {/* Book info */}
      <div className="rounded-xl bg-background/40 border border-border/40 p-4 mb-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold font-literary italic text-base leading-tight">
              {correct_answer.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{correct_answer.author}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {is_correct && (
        <div className="flex gap-2">
          <Link href="/ranking" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              <Trophy className="w-4 h-4" />
              Ver Ranking
            </Button>
          </Link>
          <Link href="/profile" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2 border-border/60 hover:border-primary/40">
              Meu Perfil
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
