"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, User, Mail, Lock, Eye, EyeOff, X, BookOpen, Shield, ScrollText } from "lucide-react"

/* ─────────────────────────────────────────
   Terms & Privacy Dialog
───────────────────────────────────────── */
function TermsDialog({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/80 bg-card shadow-2xl animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">Termos de Uso e Política de Privacidade</h2>
              <p className="text-[11px] text-muted-foreground">BookGuess — Última atualização: Junho 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm leading-relaxed">

          {/* Intro */}
          <p className="text-muted-foreground">
            Ao criar uma conta no <strong className="text-foreground">BookGuess</strong>, você concorda com os termos
            descritos abaixo. Leia com atenção antes de se cadastrar.
          </p>

          {/* Section 1 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold text-foreground">1. Sobre o BookGuess</h3>
            </div>
            <p className="text-muted-foreground">
              O BookGuess é uma plataforma educacional e de entretenimento que apresenta trechos de obras literárias —
              clássicas e contemporâneas — para que os usuários tentem identificar o livro de origem. O objetivo é promover
              o interesse pela leitura e o contato com a literatura de forma lúdica.
            </p>
            <p className="text-muted-foreground">
              Os trechos exibidos são utilizados para fins educacionais, culturais e de entretenimento, respeitando o
              direito de citação previsto na legislação de direitos autorais. Trechos curtos de obras protegidas podem ser
              utilizados desde que não substituam a obra original, conforme o Art. 46, III da Lei nº 9.610/1998 (Lei de
              Direitos Autorais brasileira).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-bold text-foreground">2. Dados Coletados</h3>
            </div>
            <p className="text-muted-foreground">Ao se cadastrar, coletamos os seguintes dados:</p>
            <ul className="list-none space-y-2 ml-1">
              {[
                { label: "Nome de usuário", desc: "Identificação pública na plataforma" },
                { label: "Endereço de e-mail", desc: "Para autenticação e eventuais comunicações" },
                { label: "Senha (criptografada)", desc: "Armazenada de forma segura com hash bcrypt — nunca em texto puro" },
                { label: "Histórico de jogos", desc: "Desafios respondidos, pontuação e sequência de dias (streak)" },
                { label: "Preferências de IA", desc: "Se o acesso às dicas por inteligência artificial está ativado" },
              ].map(({ label, desc }) => (
                <li key={label} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">{label}</strong>: {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">3. Como Usamos seus Dados</h3>
            <p className="text-muted-foreground">Seus dados são utilizados exclusivamente para:</p>
            <ul className="list-none space-y-1.5 ml-1">
              {[
                "Permitir o acesso à plataforma e autenticar sua conta",
                "Registrar seu progresso, XP e sequência de dias",
                "Exibir seu desempenho no ranking de usuários",
                "Personalizar a experiência (acesso a dicas por IA)",
                "Melhorar continuamente a plataforma",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Não vendemos, compartilhamos ou transferimos</strong> seus dados
              pessoais a terceiros para fins comerciais.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">4. Segurança dos Dados</h3>
            <p className="text-muted-foreground">
              Adotamos medidas técnicas para proteger seus dados, incluindo criptografia de senhas com bcrypt,
              autenticação via tokens JWT com tempo de expiração e comunicação via HTTPS. Ainda assim, nenhum sistema
              é 100% inviolável — utilize uma senha forte e não a compartilhe.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">5. Conteúdo Literário e Direitos Autorais</h3>
            <p className="text-muted-foreground">
              Os trechos utilizados nos desafios são excertos curtos de obras literárias, utilizados conforme o direito
              de citação. O BookGuess não reproduz obras completas nem substitui a experiência de leitura dos livros
              originais — muito pelo contrário, nosso objetivo é <strong className="text-foreground">estimular a leitura</strong> e
              o interesse pela literatura.
            </p>
            <p className="text-muted-foreground">
              Caso seja titular de direitos autorais e identifique conteúdo que viole seus direitos, entre em contato
              para que possamos analisar e, se necessário, remover o trecho.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">6. Seus Direitos</h3>
            <p className="text-muted-foreground">
              Você pode solicitar a exclusão da sua conta e de todos os seus dados a qualquer momento, entrando em
              contato com os administradores da plataforma. Após a exclusão, seus dados serão permanentemente removidos
              de nossos servidores.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">7. Alterações nestes Termos</h3>
            <p className="text-muted-foreground">
              Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas na plataforma.
              O uso continuado após as alterações implica na aceitação dos novos termos.
            </p>
          </section>

          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Ao marcar a caixa de aceite e criar sua conta, você confirma que leu, compreendeu e concorda com estes
              Termos de Uso e Política de Privacidade do BookGuess.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button onClick={() => { onAccept(); onClose() }} className="w-full h-10">
            Entendi e Aceito
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Register Page
───────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [confirm, setConfirm] = useState("")
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Only show mismatch after the user has left the confirm field
  const confirmMismatch = confirmTouched && confirm !== "" && form.password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== confirm) {
      setError("As senhas não coincidem.")
      setConfirmTouched(true)
      return
    }
    if (!termsAccepted) {
      setError("Você precisa aceitar os Termos de Uso e Política de Privacidade.")
      return
    }

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

  const canSubmit = !loading
    && form.password === confirm
    && confirm !== ""
    && termsAccepted
    && form.username.length >= 3
    && form.email.length > 0
    && form.password.length >= 6

  return (
    <>
      {showTerms && <TermsDialog onClose={() => setShowTerms(false)} onAccept={() => setTermsAccepted(true)} />}

      <div className="min-h-screen flex">
        {/* Left panel */}
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
                Crie sua conta e comece a explorar a literatura de uma forma nunca vista.
              </p>
            </div>
            <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3 text-left">
              &ldquo;Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.&rdquo;
              <footer className="mt-1 text-xs not-italic text-muted-foreground/60">George R.R. Martin</footer>
            </blockquote>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="lg:hidden text-center mb-8">
              <Image src="/icon_bookguess.png" alt="BookGuess" width={64} height={64} className="mx-auto mb-3" />
              <h1 className="text-2xl font-bold">
                <span className="text-primary">Book</span>Guess
              </h1>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold">Criar Conta</h2>
              <p className="text-muted-foreground text-sm mt-1">Junte-se à comunidade de leitores</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Nome de usuário"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  required
                  minLength={3}
                  className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                  className="pl-9 h-11 bg-muted/40 border-border/60 focus:border-primary/50"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha (mín. 6 caracteres)"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={6}
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirmar senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    required
                    className={`pl-9 pr-10 h-11 bg-muted/40 border-border/60 focus:border-primary/50 transition-colors ${
                      confirmMismatch ? "border-destructive/60 focus:border-destructive/60" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Only show mismatch after blur */}
                {confirmMismatch && (
                  <p className="text-xs text-destructive animate-fade-in flex items-center gap-1">
                    <span>⚠</span> As senhas não coincidem.
                  </p>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        termsAccepted
                          ? "bg-primary border-primary"
                          : "border-border/70 bg-muted/40 group-hover:border-primary/50"
                      }`}
                    >
                      {termsAccepted && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    Li e concordo com os{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-primary font-medium hover:underline underline-offset-2 transition-colors"
                    >
                      Termos de Uso e Política de Privacidade
                    </button>
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-sm text-destructive animate-fade-in">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md shadow-primary/20 transition-all"
                disabled={!canSubmit}
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
    </>
  )
}
