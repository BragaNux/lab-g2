"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, Brain, Crown, Award, BookPlus, FileText, CalendarPlus, Users, RefreshCw, Flame } from "lucide-react"
import type { User } from "@/types"

type Tab = "ingest" | "passage" | "challenge" | "users"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "ingest",    label: "Ingerir Livro",       icon: BookPlus    },
  { id: "passage",   label: "Criar Trecho",         icon: FileText    },
  { id: "challenge", label: "Criar Desafio",        icon: CalendarPlus },
  { id: "users",     label: "Gerenciar Usuários",   icon: Users       },
]

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("users")

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return }
    api.get("/auth/me")
      .then((res) => { setCurrentUser(res.data); setAuthLoading(false) })
      .catch(() => setAuthLoading(false))
  }, [router])

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
    <main className="min-h-[calc(100vh-56px)] px-4 py-8 max-w-6xl mx-auto space-y-6">
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
        {tab === "ingest"    && <IngestForm />}
        {tab === "passage"   && <PassageForm />}
        {tab === "challenge" && <ChallengeForm />}
        {tab === "users"     && <UsersManagement currentUser={currentUser} />}
      </div>
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
function IngestForm() {
  const [file, setFile] = useState<File | null>(null)
  const [fields, setFields] = useState({ title: "", author: "", year: "", language: "pt" })
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setError(""); setResult(null)
    const form = new FormData()
    form.append("file", file)
    Object.entries(fields).forEach(([k, v]) => { if (v) form.append(k, v) })
    try {
      const res = await api.post("/admin/books/ingest", form)
      setResult(`Livro ingerido com sucesso! ID: ${res.data.book_id} | ${res.data.chunks_created} chunks criados.`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao ingerir livro.")
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
        {result && <p className="text-sm text-green-500 font-medium bg-green-500/10 rounded-lg px-3 py-2">{result}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Ingerindo...</> : "Ingerir Livro"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Passage Form ───── */
function PassageForm() {
  const [fields, setFields] = useState({ book_id: "", text: "", difficulty: "3" })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await api.post("/admin/passages", {
        book_id: fields.book_id,
        text: fields.text,
        difficulty: parseInt(fields.difficulty),
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar trecho.")
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
        {result && <p className="text-sm text-green-500 font-medium bg-green-500/10 rounded-lg px-3 py-2">Trecho criado com sucesso! ID: {result.id} | {result.points} pts</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</> : "Criar Trecho"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Challenge Form ───── */
function ChallengeForm() {
  const [fields, setFields] = useState({ passage_id: "", date: "" })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(k: string, v: string) { setFields((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await api.post("/admin/daily-challenges", fields)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao criar desafio.")
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
        {result && <p className="text-sm text-green-500 font-medium bg-green-500/10 rounded-lg px-3 py-2">Desafio configurado para {result.date}! ID: {result.id}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 px-8">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Criando...</> : "Criar Desafio"}
        </Button>
      </form>
    </Panel>
  )
}

/* ───── Users Management ───── */
function UsersManagement({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true); setError("")
    try {
      const res = await api.get("/admin/users")
      setUsers(res.data)
    } catch {
      setError("Erro ao buscar lista de usuários.")
    } finally { setLoading(false) }
  }

  async function handleToggle(userId: string, type: "ai" | "premium" | "admin") {
    setTogglingId(`${userId}-${type}`)
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-${type}`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)))
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao alterar configurações do usuário.")
    } finally { setTogglingId(null) }
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
      {/* Search + refresh */}
      <div className="flex gap-2 mb-5">
        <Input
          placeholder="Buscar por usuário ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={fetchUsers} variant="outline" disabled={loading} className="shrink-0 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
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
          <div className="hidden md:grid grid-cols-[1fr_200px_180px] bg-muted/50 px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/40">
            <span>Usuário</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {/* Rows */}
          {filtered.map((u, i) => (
            <div
              key={u.id}
              className={`grid md:grid-cols-[1fr_200px_180px] gap-3 px-5 py-4 items-center ${
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
                {!u.allow_ai   && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 shrink-0"><Brain className="w-2.5 h-2.5" />Sem IA</Badge>}
                {u.allow_ai && !u.is_admin && !u.is_premium && <span className="text-xs text-muted-foreground">Padrão</span>}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={u.allow_ai ? "default" : "secondary"}
                  disabled={!!togglingId}
                  onClick={() => handleToggle(u.id, "ai")}
                  className="h-7 text-xs px-3 gap-1"
                >
                  {togglingId === `${u.id}-ai` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                  {u.allow_ai ? "IA ligada" : "IA desligada"}
                </Button>

                <Button
                  size="sm"
                  variant={u.is_premium ? "outline" : "secondary"}
                  disabled={!!togglingId}
                  onClick={() => handleToggle(u.id, "premium")}
                  className={`h-7 text-xs px-3 gap-1 ${u.is_premium ? "border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/5" : ""}`}
                >
                  {togglingId === `${u.id}-premium` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                  {u.is_premium ? "Premium" : "Free"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {filtered.length} usuário{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>
    </Panel>
  )
}
