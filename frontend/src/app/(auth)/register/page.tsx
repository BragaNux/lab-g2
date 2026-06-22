"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, User, Mail, Lock } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/register", form)
      router.push("/login?registered=1")
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail[0]?.msg : detail || "Erro ao cadastrar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border/60 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 text-center space-y-6 max-w-xs">
          <div className="text-7xl animate-float" style={{ animationDuration: "4s" }}>📖</div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              <span className="text-primary">Book</span>Guess
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Crie sua conta e comece a explorar a literatura brasileira de uma forma nunca vista.
            </p>
          </div>
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 text-left">
            &ldquo;Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.&rdquo;
            <footer className="mt-1 text-xs not-italic text-muted-foreground/60">— George R.R. Martin</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden text-center mb-8">
            <span className="text-4xl block mb-2">📖</span>
            <h1 className="text-2xl font-bold">
              <span className="text-primary">Book</span>Guess
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold">Criar Conta</h2>
            <p className="text-muted-foreground text-sm mt-1">Junte-se à comunidade de leitores</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nome de usuário"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                required
                minLength={3}
                className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={6}
                className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive animate-fade-in">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
