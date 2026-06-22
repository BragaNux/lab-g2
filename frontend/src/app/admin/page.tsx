"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Brain, Crown, Award, BookPlus, FileText, CalendarPlus, Users, RefreshCw, Flame, Trash2, CheckCircle2, XCircle } from "lucide-react"
import type { User } from "@/types"



type Tab = "ingest" | "passage" | "challenge" | "users"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "ingest",    label: "Ingerir Livro",       icon: BookPlus    },
  { id: "passage",   label: "Criar Trecho",         icon: FileText    },
  { id: "challenge", label: "Criar Desafio",        icon: CalendarPlus },
  { id: "users",     label: "Gerenciar Usuários",   icon: Users       },
]

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-scale-in space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onCancel} className="h-10 text-xs px-4">
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            className="h-10 text-xs px-4"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
    isDestructive?: boolean
  } | null>(null)
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("admin_active_tab")
      if (saved && ["ingest", "passage", "challenge", "users"].includes(saved)) {
        return saved as Tab
      }
    }
    return "users"
  })
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/auth/me")
      .then((res) => { setCurrentUser(res.data); setAuthLoading(false) })
      .catch(() => setAuthLoading(false))
  }, [router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = sessionStorage.getItem("admin_notification")
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          setNotification(parsed)
        } catch (e) {}
        sessionStorage.removeItem("admin_notification")
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("admin_active_tab", tab)
    }
  }, [tab])

  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 4000)
    return () => clearTimeout(t)
  }, [notification])

  function triggerNotification(message: string, type: "success" | "error" = "success") {
    if (type === "success") {
      sessionStorage.setItem("admin_notification", JSON.stringify({ type, message }))
      window.location.reload()
    } else {
      setNotification({ type, message })
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Verificando autorização...</p>
        </div>
      </main>
    )
  }

  if (!currentUser || !currentUser.is_admin) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-8 animate-scale-in">
          <span className="text-5xl block">🚫</span>
          <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
          <p className="text-sm text-muted-foreground">
            Você não possui privilégios de administrador para visualizar esta página.
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            Voltar ao início
          </Button>
        </div>
      </main>
    )
  }

  const ActiveTab = TABS.find((t) => t.id === tab)!

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-8 max-w-6xl mx-auto space-y-6 relative">
      {/* Top Floating Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border animate-scale-in flex items-center gap-2.5 max-w-sm ${
          notification.type === "success"
            ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-400 glow-emerald"
            : "bg-red-950/95 border-destructive/30 text-destructive animate-shake"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-destructive" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerencie o acervo, crie desafios e administre permissões</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex-1 min-w-[130px] justify-center ${
              tab === id
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === "ingest"    && <IngestForm onNotify={triggerNotification} />}
        {tab === "passage"   && <PassageForm onNotify={triggerNotification} />}
        {tab === "challenge" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChallengeForm onNotify={triggerNotification} />
              <ResetTodayBox onNotify={triggerNotification} onConfirmRequest={setConfirmConfig} />
            </div>
            <ResetHistoryBox onNotify={triggerNotification} onConfirmRequest={setConfirmConfig} />
          </div>
        )}
        {tab === "users"     && <UsersManagement currentUser={currentUser} onNotify={triggerNotification} onConfirmRequest={setConfirmConfig} />}
      </div>

      <ConfirmModal
        isOpen={confirmConfig !== null}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        isDestructive={confirmConfig?.isDestructive}
        onConfirm={() => {
          if (confirmConfig) {
            confirmConfig.onConfirm()
            setConfirmConfig(null)
          }
        }}
        onCancel={() => setConfirmConfig(null)}
      />
    </main>
  )
}

/* ───── Shared panel wrapper ───── */
function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="px-6 py-5 border-b border-border/40">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ───── Ingest Form ───── */
function IngestForm({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState({ title: "", author: "", year: "", language: "pt" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setError("")
    const form = new FormData()
    form.append("file", file)
    Object.entries(fields).forEach(([k, v]) => { if (v) form.append(k, v) })
    try {
      const res = await api.post("/admin/books/ingest", form)
      onNotify(`Livro "${fields.title}" ingerido com sucesso! (${res.data.chunks_created} chunks criados)`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao ingerir livro.")
      onNotify(err.response?.data?.detail || "Erro ao ingerir livro.", "error")
    } finally { setLoading(false) }
  }

  return (
    <Panel title="Ingerir Livro" description="Envie um arquivo PDF ou TXT. O sistema divide o livro em chunks e gera os embeddings automaticamente.">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground block font-medium">Arquivo (.txt ou .pdf)</span>
          <Input type="file" accept=".txt,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="bg-muted/40 cursor-pointer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input placeholder="Título do livro" value={fields.title} onChange={(e) => set("title", e.target.value)} required />
          <Input placeholder="Nome do autor" value={fields.author} onChange={(e) => set("author", e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input placeholder="Ano de publicação (opcional)" type="number" value={fields.year} onChange={(e) => set("year", e.target.value)} />
          <Input placeholder="Idioma: pt, en, es..." value={fields.language} onChange={(e) => set("language", e.target.value)} />
        </div>
        {error  && <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Ingerindo...</> : "Ingerir Livro"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Passage Form ───── */
function PassageForm({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [fields, setFields] = useState({ book_id: "", text: "", difficulty: "3" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await api.post("/admin/passages", {
        book_id: fields.book_id,
        text: fields.text,
        difficulty: parseInt(fields.difficulty),
      })
      onNotify(`Trecho literário criado com sucesso! (${res.data.points} pts)`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar trecho.")
      onNotify(err.response?.data?.detail || "Erro ao criar trecho.", "error")
    } finally { setLoading(false) }
  }

  return (
    <Panel title="Criar Trecho Literário" description="Cadastre um novo trecho de um livro para ser utilizado como desafio diário.">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Input placeholder="ID do livro (UUID)" value={fields.book_id} onChange={(e) => set("book_id", e.target.value)} required />
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground block font-medium">Trecho literário</span>
          <textarea
            className="w-full border border-input rounded-lg px-3 py-2 text-sm min-h-[140px] bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Cole o trecho do livro aqui..."
            value={fields.text}
            onChange={(e) => set("text", e.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Dificuldade:</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => set("difficulty", String(n))}
                className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                  fields.difficulty === String(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        {error  && <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : "Criar Trecho"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Challenge Form ───── */
function ChallengeForm({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [fields, setFields] = useState({ passage_id: "", date: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await api.post("/admin/daily-challenges", fields)
      const dateParts = fields.date.split("-")
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : fields.date
      onNotify(`Desafio criado com sucesso para a data ${formattedDate}!`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar desafio.")
      onNotify(err.response?.data?.detail || "Erro ao criar desafio.", "error")
    } finally { setLoading(false) }
  }

  return (
    <Panel title="Criar Desafio Diário" description="Vincule um trecho já cadastrado a uma data específica para virar o desafio do dia.">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input placeholder="ID do trecho (UUID)" value={fields.passage_id} onChange={(e) => set("passage_id", e.target.value)} required />
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground block font-medium">Data do desafio</span>
          <Input type="date" value={fields.date} onChange={(e) => set("date", e.target.value)} required />
        </div>
        {error  && <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Criando...</> : "Criar Desafio"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Reset TODAY Box ───── */
function ResetTodayBox({
  onNotify,
  onConfirmRequest,
}: {
  onNotify: (msg: string, type?: "success" | "error") => void
  onConfirmRequest: (config: { title: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [loadingEra, setLoadingEra] = useState<"modern" | "classic" | null>(null)

  async function handleReset() {
    onConfirmRequest({
      title: "Resetar Desafio de Hoje",
      message: "Tem certeza? Isso apagará todas as tentativas de hoje, subtrairá o XP e decrementará a ofensiva de quem jogou.",
      isDestructive: true,
      onConfirm: async () => {
        setLoading(true)
        try {
          const res = await api.post("/admin/challenges/today/reset")
          onNotify(res.data.message || "Desafio de hoje resetado com sucesso!")
        } catch (err: any) {
          onNotify(err.response?.data?.detail || "Erro ao resetar desafio.", "error")
        } finally { setLoading(false) }
      }
    })
  }

  async function handleResetByEra(era: "modern" | "classic") {
    const eraLabel = era === "modern" ? "literatura moderna (pós 1980)" : "literatura clássica (pré 1980)"
    onConfirmRequest({
      title: `Hoje: ${era === "modern" ? "Literatura Moderna 📚" : "Literatura Clássica 🏛️"}`,
      message: `O desafio de HOJE será trocado por um trecho de ${eraLabel}. As tentativas de hoje serão apagadas e o XP descontado.`,
      isDestructive: true,
      onConfirm: async () => {
        setLoadingEra(era)
        try {
          const res = await api.post(`/admin/challenges/today/reset-by-era?era=${era}`)
          onNotify(res.data.message || `Desafio de hoje trocado para ${eraLabel}!`)
        } catch (err: any) {
          onNotify(err.response?.data?.detail || "Erro ao resetar desafio.", "error")
        } finally { setLoadingEra(null) }
      }
    })
  }

  const isAnyLoading = loading || loadingEra !== null

  return (
    <Panel title="🗓️ Resetar Desafio de HOJE" description="Apaga tentativas de hoje, subtrai XP e ofensiva. Sorteia novo trecho — aleatório, moderno ou clássico.">
      <div className="space-y-2.5 max-w-sm">
        <Button onClick={handleReset} disabled={isAnyLoading} variant="destructive"
          className="w-full h-10 gap-2 text-sm">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Aleatório
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => handleResetByEra("modern")} disabled={isAnyLoading}
            className="h-10 gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white border-0">
            {loadingEra === "modern" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>📚</span>}
            Modernos
          </Button>
          <Button onClick={() => handleResetByEra("classic")} disabled={isAnyLoading}
            className="h-10 gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white border-0">
            {loadingEra === "classic" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>🏛️</span>}
            Clássicos
          </Button>
        </div>
      </div>
    </Panel>
  )
}

/* ───── Reset HISTORY Box ───── */
function ResetHistoryBox({
  onNotify,
  onConfirmRequest,
}: {
  onNotify: (msg: string, type?: "success" | "error") => void
  onConfirmRequest: (config: { title: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void
}) {
  const [loadingEra, setLoadingEra] = useState<"modern" | "classic" | null>(null)
  const [days, setDays] = useState(7)

  async function handleHistoryReset(era: "modern" | "classic") {
    const eraLabel = era === "modern" ? "literatura moderna (pós 1980)" : "literatura clássica (pré 1980)"
    const eraEmoji = era === "modern" ? "📚" : "🏛️"
    onConfirmRequest({
      title: `Histórico: ${eraEmoji} ${era === "modern" ? "Literatura Moderna" : "Literatura Clássica"}`,
      message: `Os últimos ${days} desafio(s) do histórico terão seus trechos substituídos por ${eraLabel}. Os jogos anteriores não são afetados (histórico não dá XP).`,
      isDestructive: false,
      onConfirm: async () => {
        setLoadingEra(era)
        try {
          const res = await api.post(`/admin/challenges/history/reset-by-era?era=${era}&days=${days}`)
          onNotify(res.data.message || `Histórico atualizado para ${eraLabel}!`)
        } catch (err: any) {
          onNotify(err.response?.data?.detail || "Erro ao atualizar histórico.", "error")
        } finally { setLoadingEra(null) }
      }
    })
  }

  const isAnyLoading = loadingEra !== null

  return (
    <Panel
      title="📜 Resetar Histórico por Era"
      description="Substitui os trechos dos desafios históricos (dias passados) para literatura moderna ou clássica. Útil para testar a tela de histórico com desafios específicos. Não afeta XP nem ofensiva."
    >
      <div className="space-y-4">
        {/* Days selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground shrink-0">Últimos dias:</span>
          <div className="flex gap-1.5">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`w-10 h-8 rounded-lg text-xs font-bold border transition-all ${
                  days === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Era buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <button
            onClick={() => handleHistoryReset("modern")}
            disabled={isAnyLoading}
            className="relative group flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10 transition-all disabled:opacity-50 text-left"
          >
            <div className="flex items-center gap-2">
              {loadingEra === "modern" ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <span className="text-lg">📚</span>}
              <span className="font-semibold text-sm text-violet-300">Literatura Moderna</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Harry Potter, Game of Thrones, Jogos Vorazes, Percy Jackson, O Alquimista…
            </p>
            <span className="text-[10px] text-violet-400/70 mt-0.5">Publicados a partir de 1980</span>
          </button>

          <button
            onClick={() => handleHistoryReset("classic")}
            disabled={isAnyLoading}
            className="relative group flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all disabled:opacity-50 text-left"
          >
            <div className="flex items-center gap-2">
              {loadingEra === "classic" ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <span className="text-lg">🏛️</span>}
              <span className="font-semibold text-sm text-amber-300">Literatura Clássica</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Dom Casmurro, Hamlet, 1984, Crime e Castigo, O Guarani, Cem Anos de Solidão…
            </p>
            <span className="text-[10px] text-amber-400/70 mt-0.5">Publicados antes de 1980</span>
          </button>
        </div>
      </div>
    </Panel>
  )
}


/* ───── Users Management ───── */
function UsersManagement({
  currentUser,
  onNotify,
  onConfirmRequest,
}: {
  currentUser: User
  onNotify: (msg: string, type?: "success" | "error") => void
  onConfirmRequest: (config: { title: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void
}) {

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true); setError("")
    try {
      const res = await api.get("/admin/users")
      setUsers(res.data)
    } catch {
      setError("Erro ao buscar lista de usuários.")
      onNotify("Erro ao buscar lista de usuários.", "error")
    } finally { setLoading(false) }
  }

  async function handleSaveStats(userId: string, xp: number, streak: number) {
    await api.post(`/admin/users/${userId}/update-stats`, { xp, streak })
    onNotify("Estatísticas do usuário atualizadas com sucesso!")
    fetchUsers()
  }

  async function handleToggle(userId: string, type: "ai" | "premium" | "admin") {
    setTogglingId(`${userId}-${type}`)
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-${type}`)
      const label = type === "ai" ? "IA" : type === "premium" ? "Premium" : "Admin"
      onNotify(`Permissão de ${label} do usuário alterada com sucesso!`)
    } catch (err: any) {
      onNotify(err.response?.data?.detail || "Erro ao alterar configurações do usuário.", "error")
    } finally { setTogglingId(null) }
  }

  async function handleResetAll() {
    onConfirmRequest({
      title: "Resetar Geral",
      message: "ATENÇÃO: Tem certeza que deseja resetar TODOS os usuários? Isso apagará permanentemente o XP, as ofensivas, e todo o histórico de jogo de todos os usuários do sistema.",
      isDestructive: true,
      onConfirm: () => {
        onConfirmRequest({
          title: "Confirmação Adicional",
          message: "CONFIRMAÇÃO ADICIONAL: Isso apagará permanentemente o XP, as ofensivas, e todo o histórico de jogo de todos os usuários do sistema. Continuar?",
          isDestructive: true,
          onConfirm: async () => {
            setLoading(true)
            setError("")
            try {
              await api.post("/admin/users/reset-stats")
              onNotify("Resetado tudo com sucesso!")
            } catch (err: any) {
              onNotify(err.response?.data?.detail || "Erro ao resetar usuários.", "error")
            } finally {
              setLoading(false)
            }
          }
        })
      }
    })
  }

  async function handleResetUser(userId: string, username: string) {
    onConfirmRequest({
      title: "Resetar Usuário",
      message: `Tem certeza que deseja resetar o usuário "${username}" do zero? Isso apagará seu XP, sua ofensiva e todas as suas tentativas de jogo.`,
      isDestructive: true,
      onConfirm: async () => {
        setTogglingId(`${userId}-reset`)
        try {
          await api.post(`/admin/users/reset-stats?user_id=${userId}`)
          onNotify("Usuário resetado com sucesso!")
        } catch (err: any) {
          onNotify(err.response?.data?.detail || "Erro ao resetar usuário.", "error")
        } finally {
          setTogglingId(null)
        }
      }
    })
  }

  async function handleResetStreak(userId: string, username: string) {
    onConfirmRequest({
      title: "Zerar Ofensiva",
      message: `Tem certeza que deseja zerar a ofensiva do usuário "${username}"?`,
      isDestructive: true,
      onConfirm: async () => {
        setTogglingId(`${userId}-reset-streak`)
        try {
          await api.post(`/admin/users/reset-stats?user_id=${userId}&target=streak`)
          onNotify("Ofensa resetada com sucesso!")
        } catch (err: any) {
          onNotify(err.response?.data?.detail || "Erro ao resetar ofensiva.", "error")
        } finally {
          setTogglingId(null)
        }
      }
    })
  }

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Panel
      title="Gerenciar Usuários"
      description="Controle as permissões de cada usuário: acesso à IA, status premium e privilégios de administrador."
    >
      {/* Search + refresh + reset all */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <Input
          placeholder="Buscar por usuário ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" disabled={loading} className="flex-1 sm:flex-initial gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Atualizar</span>
          </Button>
          <Button onClick={handleResetAll} variant="destructive" disabled={loading} className="flex-1 sm:flex-initial gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Trash2 className="w-4 h-4" />
            <span>Resetar Geral</span>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_200px_350px] bg-muted/50 px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/40">
            <span>Usuário</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {/* Rows */}
          {filtered.map((u, i) => (
            <div
              key={u.id}
              className={`grid md:grid-cols-[1fr_200px_350px] gap-3 px-5 py-4 items-center ${
                i < filtered.length - 1 ? "border-b border-border/30" : ""
              } hover:bg-muted/30 transition-colors`}
            >
              {/* User info */}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{u.username}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Award className="w-3 h-3 text-primary" />{u.xp} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{u.streak}d</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {u.is_admin    && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 shrink-0"><Shield className="w-2.5 h-2.5" />Admin</Badge>}
                {u.is_premium  && <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] gap-1 shrink-0"><Crown className="w-2.5 h-2.5" />Premium</Badge>}
                {!u.is_premium && u.premium_requested && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] gap-1 shrink-0 animate-pulse">
                    Solicitou Premium
                  </Badge>
                )}
                {!u.allow_ai   && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 shrink-0"><Brain className="w-2.5 h-2.5" />Sem IA</Badge>}
                {u.allow_ai && !u.is_admin && !u.is_premium && <span className="text-xs text-muted-foreground">Padrão</span>}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={u.allow_ai ? "default" : "secondary"}
                  disabled={!!togglingId}
                  onClick={() => handleToggle(u.id, "ai")}
                  className="h-7 text-xs px-2.5 gap-1 shrink-0"
                >
                  {togglingId === `${u.id}-ai` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                  {u.allow_ai ? "IA" : "Sem IA"}
                </Button>

                <Button
                  size="sm"
                  variant={u.is_premium ? "outline" : "secondary"}
                  disabled={!!togglingId}
                  onClick={() => handleToggle(u.id, "premium")}
                  className={`h-7 text-xs px-2.5 gap-1 shrink-0 ${u.is_premium ? "border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/5" : ""}`}
                >
                  {togglingId === `${u.id}-premium` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                  {u.is_premium ? "Premium" : "Free"}
                </Button>

                {currentUser.username === "brayan" && (
                  <Button
                    size="sm"
                    variant={u.is_admin ? "outline" : "secondary"}
                    disabled={!!togglingId || u.username === "brayan"}
                    onClick={() => handleToggle(u.id, "admin")}
                    className={`h-7 text-xs px-2.5 gap-1 shrink-0 ${u.is_admin ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/5" : ""}`}
                  >
                    {togglingId === `${u.id}-admin` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                    {u.is_admin ? "Admin" : "Promover"}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!togglingId}
                  onClick={() => setEditingUser(u)}
                  className="h-7 text-xs px-2.5 gap-1 shrink-0 border-primary/40 text-primary hover:bg-primary/10 transition-all"
                >
                  <Award className="w-3 h-3" />
                  Editar XP/Streak
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!togglingId}
                  onClick={() => handleResetUser(u.id, u.username)}
                  className="h-7 text-xs px-2.5 gap-1 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Resetar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!togglingId}
                  onClick={() => handleResetStreak(u.id, u.username)}
                  className="h-7 text-xs px-2.5 gap-1 shrink-0 border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition-all"
                >
                  {togglingId === `${u.id}-reset-streak` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flame className="w-3 h-3" />}
                  Zerar Ofensiva
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {filtered.length} usuário{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      <EditStatsModal 
        isOpen={editingUser !== null} 
        onClose={() => setEditingUser(null)} 
        user={editingUser} 
        onSave={handleSaveStats} 
      />
    </Panel>
  )
}

interface EditStatsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSave: (userId: string, xp: number, streak: number) => Promise<void>
}

function EditStatsModal({ isOpen, onClose, user, onSave }: EditStatsModalProps) {
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setXp(user.xp)
      setStreak(user.streak)
      setError("")
    }
  }, [user])

  if (!isOpen || !user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSave(user.id, xp, streak)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao salvar estatísticas.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-scale-in space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-foreground">Editar Estatísticas</h3>
        <p className="text-xs text-muted-foreground">Atualizar XP e Ofensiva de <strong>{user.username}</strong></p>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Pontos de XP</span>
            <Input 
              type="number" 
              value={xp} 
              onChange={(e) => setXp(Math.max(0, parseInt(e.target.value) || 0))}
              required 
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Ofensiva (dias)</span>
            <Input 
              type="number" 
              value={streak} 
              onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value) || 0))}
              required 
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="h-10 text-xs px-4">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/95"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-primary-foreground" /> : null}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}

