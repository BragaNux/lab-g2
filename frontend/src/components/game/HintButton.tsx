"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Lightbulb, Loader2 } from "lucide-react"

interface Props {
  onHintReceived: (hint: string) => void
  disabled?: boolean
}

export function HintButton({ onHintReceived, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleClick() {
    setLoading(true)
    setError("")
    try {
      const res = await api.post("/challenge/today/hint")
      onHintReceived(res.data.hint)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Não foi possível obter dica.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled || loading}
        className="h-11 gap-2 border-border/60 hover:border-primary/40 hover:text-primary transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Lightbulb className="w-4 h-4" />
        )}
        {loading ? "Buscando…" : "Dica −50% XP"}
      </Button>
      {error && <p className="text-xs text-destructive max-w-[180px] text-right">{error}</p>}
    </div>
  )
}
