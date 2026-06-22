"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { setToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post("/auth/login", { email, password })
      setToken(res.data.access_token)
      router.push("/")
    } catch (err: any) {
      setError(err.response?.data?.detail || "E-mail ou senha incorretos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border/60 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 text-center space-y-6 max-w-xs">
          <div className="animate-float" style={{ animationDuration: "4s" }}>
            <Image src="/icon_bookguess.png" alt="BookGuess" width={120} height={120} className="mx-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              <span className="text-primary">Book</span>Guess
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              O desafio literário diário que vai testar seu conhecimento da literatura brasileira.
            </p>
          </div>
          <div className="space-y-2 text-left">
            {[
              "Trecho novo a cada dia",
              "Dicas inteligentes com IA",
              "Ranking com outros leitores",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary text-xs">✦</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/icon_bookguess.png" alt="BookGuess" width={64} height={64} className="mx-auto mb-3" />
            <h1 className="text-2xl font-bold">
              <span className="text-primary">Book</span>Guess
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold">Entrar</h2>
            <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta, leitor</p>
          </div>

          {registered && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 animate-fade-in">
              Conta criada! Faça login para começar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-destructive animate-fade-in">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/20 transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline underline-offset-4">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
