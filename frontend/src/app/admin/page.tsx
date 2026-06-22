"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { isLoggedIn } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, User as UserIcon, Brain, Crown, Award } from "lucide-react"
import type { User } from "@/types"

type Tab = "ingest" | "passage" | "challenge" | "users"

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("ingest")

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }
    api.get("/auth/me")
      .then((res) => {
        setCurrentUser(res.data)
        setAuthLoading(false)
      })
      .catch(() => {
        setAuthLoading(false)
      })
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
            Voltar para o Início
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 py-10 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gerencie o acervo, crie desafios e administre permissões de usuários.</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {([
            { id: "ingest", label: "Ingerir Livro" },
            { id: "passage", label: "Criar Trecho" },
            { id: "challenge", label: "Criar Desafio" },
            { id: "users", label: "Gerenciar Usuários" }
          ] as { id: Tab; label: string }[]).map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
              className="whitespace-nowrap rounded-lg"
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in">
        {tab === "ingest" && <IngestForm />}
        {tab === "passage" && <PassageForm />}
        {tab === "challenge" && <ChallengeForm />}
        {tab === "users" && <UsersManagement currentUser={currentUser} />}
      </div>
    </main>
  )
}

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
      setResult(`Livro ingerido! ID: ${res.data.book_id} — ${res.data.chunks_created} chunks criados.`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao ingerir livro.")
    } finally { setLoading(false) }
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Ingerir Livro</CardTitle>
        <CardDescription>Envie um arquivo PDF ou TXT. O sistema dividirá o livro em chunks e criará os embeddings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Arquivo (.txt ou .pdf)</span>
            <Input type="file" accept=".txt,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="bg-muted/40 cursor-pointer" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Título" value={fields.title} onChange={(e) => set("title", e.target.value)} required />
            <Input placeholder="Autor" value={fields.author} onChange={(e) => set("author", e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Ano (opcional)" type="number" value={fields.year} onChange={(e) => set("year", e.target.value)} />
            <Input placeholder="Idioma (pt, en, es...)" value={fields.language} onChange={(e) => set("language", e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {result && <p className="text-sm text-green-600 font-medium">{result}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Ingerindo...</span> : "Ingerir Livro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

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
    <Card className="rounded-2xl border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Criar Trecho Literário</CardTitle>
        <CardDescription>Cadastre um novo trecho de um livro para ser utilizado como desafio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Book ID (UUID)" value={fields.book_id} onChange={(e) => set("book_id", e.target.value)} required />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Trecho Literário</span>
            <textarea
              className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[120px] bg-background focus:ring-primary/20 focus:border-primary/50"
              placeholder="Digite o trecho do livro..."
              value={fields.text}
              onChange={(e) => set("text", e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dificuldade:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <Badge
                key={n}
                variant={fields.difficulty === String(n) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-sm font-semibold transition-all hover:scale-105"
                onClick={() => set("difficulty", String(n))}
              >
                {n}
              </Badge>
            ))}
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {result && <p className="text-sm text-green-600 font-medium">Trecho criado com sucesso! ID: {result.id} — {result.points} pts</p>}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span> : "Criar Trecho"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

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
    <Card className="rounded-2xl border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Criar Desafio Diário</CardTitle>
        <CardDescription>Vincule um trecho cadastrado a uma data específica.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Passage ID (UUID)" value={fields.passage_id} onChange={(e) => set("passage_id", e.target.value)} required />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">Data do Desafio</span>
            <Input type="date" value={fields.date} onChange={(e) => set("date", e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {result && <p className="text-sm text-green-600 font-medium">Desafio configurado para {result.date}! ID: {result.id}</p>}
          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Criando...</span> : "Criar Desafio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function UsersManagement({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true); setError("")
    try {
      const res = await api.get("/admin/users")
      setUsers(res.data)
    } catch (err: any) {
      setError("Erro ao buscar lista de usuários.")
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(userId: string, type: "ai" | "premium" | "admin") {
    setTogglingId(`${userId}-${type}`)
    try {
      const endpoint = `/admin/users/${userId}/toggle-${type}`
      const res = await api.post(endpoint)
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)))
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao alterar configurações do usuário.")
    } finally {
      setTogglingId(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="rounded-2xl border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
        <CardDescription>
          Controle as permissões do sistema. Desative a IA para evitar o consumo excessivo de tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por usuário ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Nenhum usuário cadastrado ou correspondente.</p>
        ) : (
          <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/45 hover:bg-card transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{u.username}</span>
                    {u.is_admin && <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px] gap-0.5"><Shield className="w-2.5 h-2.5" /> Admin</Badge>}
                    {u.is_premium && <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 text-[10px] gap-0.5"><Crown className="w-2.5 h-2.5" /> Premium</Badge>}
                    {!u.allow_ai && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 text-[10px] gap-0.5"><Brain className="w-2.5 h-2.5" /> Sem IA</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Award className="w-3.5 h-3.5 text-primary" /> {u.xp} XP</span>
                    <span>•</span>
                    <span>Sequência: <strong>{u.streak}d</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI toggle */}
                  <Button
                    size="sm"
                    variant={u.allow_ai ? "default" : "secondary"}
                    disabled={togglingId === `${u.id}-ai`}
                    onClick={() => handleToggle(u.id, "ai")}
                    className="h-8 text-xs gap-1"
                  >
                    {togglingId === `${u.id}-ai` && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Brain className="w-3.5 h-3.5" />
                    {u.allow_ai ? "IA Ativa" : "IA Inativa"}
                  </Button>

                  {/* Premium toggle */}
                  <Button
                    size="sm"
                    variant={u.is_premium ? "outline" : "secondary"}
                    disabled={togglingId === `${u.id}-premium`}
                    onClick={() => handleToggle(u.id, "premium")}
                    className={`h-8 text-xs gap-1 ${u.is_premium ? "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/5 hover:text-yellow-600" : ""}`}
                  >
                    {togglingId === `${u.id}-premium` && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Crown className="w-3.5 h-3.5" />
                    {u.is_premium ? "Remover Premium" : "Tornar Premium"}
                  </Button>

                  {/* Admin toggle */}
                  <Button
                    size="sm"
                    variant={u.is_admin ? "outline" : "secondary"}
                    disabled={togglingId === `${u.id}-admin` || u.id === currentUser.id}
                    onClick={() => handleToggle(u.id, "admin")}
                    className="h-8 text-xs gap-1"
                  >
                    {togglingId === `${u.id}-admin` && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Shield className="w-3.5 h-3.5" />
                    {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
