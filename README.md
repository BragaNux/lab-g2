# 📖 BookGuess — Roteiro de Apresentação & Arquitetura do Sistema

Este guia serve como documentação de produção e suporte visual de leitura rápida para a apresentação do sistema **BookGuess**. Ele detalha o que é o sistema, por que escolhemos cada tecnologia e como suas principais engrenagens funcionam.

---

## 📌 Guia de Consulta Rápida (Para ler durante a apresentação)

| Pergunta da Banca / Dúvida | O que responder diretamente |
| :--- | :--- |
| **O que é o BookGuess?** | Um jogo diário de adivinhação de obras literárias (estilo *Wordle*) integrado com Inteligência Artificial para dicas. |
| **Por que usar Next.js no Frontend?** | **Segurança.** Permite renderização no servidor (SSR). Isso impede que a resposta correta fique visível inspecionando o código do navegador antes de responder. |
| **Por que FastAPI e Python?** | **Velocidade e IA.** FastAPI é assíncrono e extremamente veloz. Python é a linguagem nativa para lidar com IA (Anthropic Claude, embeddings e NLP). |
| **Por que PostgreSQL + pgvector?** | **Simplicidade e Economia.** Em vez de pagar um banco de dados vetorial externo (como Pinecone), salvamos dados relacionais e vetores no mesmo banco. |
| **Para que serve o Redis?** | **Rankings e Cache.** Processa o ranking global instantaneamente via *Sorted Sets* e faz cache do trecho do dia para não sobrecarregar o Postgres. |
| **O que é e por que usar RAG?** | **Busca Aumentada por Recuperação.** A IA não lê o livro inteiro na hora. O sistema busca trechos parecidos no banco vetorial para dar o contexto correto à IA. |
| **Como funciona a economia de tokens?** | **Dica Offline.** Se o painel admin desativar a IA (`allow_ai = False`), o sistema gera uma dica estática de metadados do banco, com custo zero de API. |
| **Como o painel de admin está protegido?** | **Admin Lock.** Travado no backend por `is_admin = True` e validação do username contra a variável de ambiente `ADMIN_USERNAME` configurada no servidor. |
| **Como foi feito o Deploy?** | **VPS DigitalOcean + Docker + Nginx.** Roda em containers isolados via Docker Compose, sob o proxy reverso do Nginx com SSL criptografado (Certbot). |

---

## 1. Conceito do Jogo & Conformidade Jurídica

### Mecânica de Jogo (Wordle Literário)
*   **Desafio Diário:** Um único trecho literário por dia para todos os usuários. O jogador tem apenas uma tentativa oficial.
*   **Sistema de Pontuação:** Acertar sem dicas garante **100%** dos pontos. Solicitar a dica progressiva reduz a recompensa em **50%**.
*   **Modo Exploração:** Histórico de dias anteriores liberado para treino (sem pontuação para o ranking global).

### ⚖️ Solução contra Processos de Direitos Autorais
Usar trechos de livros comerciais protegidos pode acarretar sanções legais. Para mitigar esse risco de forma definitiva no MVP:
1.  **Foco em Domínio Público:** Apenas obras de autores falecidos há mais de 70 anos (ex: Machado de Assis, Aluísio Azevedo, Shakespeare, Kafka).
2.  **Citação Curta:** Os trechos expostos possuem tamanho limitado (50 a 200 palavras), caracterizando citação justa e informativa.

---

## 2. Decisões de Stack (Justificativas do Projeto)

*   **Frontend (Next.js 14 + Tailwind CSS + shadcn/ui):** Combina design premium responsivo com Server-Side Rendering (SSR). A lógica de validação de resposta e o título correto nunca são carregados no cliente antes do término da partida.
*   **Backend (FastAPI + Python):** API REST rápida e assíncrona. A documentação OpenAPI é gerada de forma automática (acessível em `/docs`), e a integração com APIs de inteligência artificial é nativa.
*   **Banco de Dados (PostgreSQL 16 + pgvector):** Centraliza usuários, partidas e vetores no mesmo banco. O módulo `pgvector` permite realizar buscas de similaridade de cosseno diretamente no PostgreSQL, eliminando a complexidade de manter mais serviços ativos.
*   **Cache e Performance (Redis):** Gerencia rankings em tempo real e armazena em cache o desafio do dia, garantindo tempos de resposta inferiores a 50ms para os jogadores.
*   **Inteligência Artificial (Claude 3 Haiku via Anthropic):** Gera dicas contextuais inteligentes e interpreta respostas equivalentes em português com excelente custo-benefício.

---

## 3. Arquitetura de IA (Busca Vetorial & RAG)

Quando o jogador solicita uma dica, o sistema não faz uma pergunta genérica à IA. Ele utiliza a arquitetura **RAG (Retrieval-Augmented Generation)**:

```
[Jogador Pede Dica] 
        │
        ▼
[Gerar Embedding] ──► Gera o vetor (embedding) do trecho atual do jogo.
        │
        ▼
[Busca Vetorial]  ──► Pesquisa no PostgreSQL via pgvector:
                      "Selecione os chunks (parágrafos) mais parecidos 
                       deste mesmo livro no banco de dados."
        │
        ▼
[Claude LLM]      ──► Envia o trecho do jogo + os chunks do livro como contexto
                      para a API do Claude gerar a dica em tempo real.
        │
        ▼
[Dica na Tela]    ──► O usuário recebe a dica contextualizada em português.
```

---

## 4. Controle Inteligente de Custos (Dica Offline)

Para evitar que usuários mal-intencionados estourem a cota da API de IA gerando dicas repetidamente, o BookGuess traz um painel administrativo híbrido:

```
                 Usuário solicita Dica
                           │
                 Is allow_ai == True?
                /                    \
             [Sim]                  [Não]
              │                       │
     Chama RAG e LLM          Gera dica offline
     (Claude 3 Haiku)      (Metadados estruturados)
              │                       │
      Dica Inteligente        "DICA OFFLINE: Obra publicada em
      (Consome Tokens)        [ano], escrita originalmente em [idioma]."
```

1.  **Dica Online (IA):** Chamada de API rica com RAG.
2.  **Dica Offline (Metadados):** Fallback dinâmico. O sistema busca o ano e o idioma original do livro no banco de dados convencional e gera a dica sem realizar nenhuma chamada para a API da Anthropic, gerando **custo zero**.

---

## 5. Segurança do Sistema (Admin Lock)

O painel administrativo em `/admin` permite o cadastro de livros (ingestão RAG) e controle de usuários. Protegemos esse painel usando o mecanismo **Admin Lock**:

1.  **Dupla Validação no Backend:** Para executar qualquer chamada de API de admin, a dependência `require_admin` do FastAPI exige que a conta logada tenha a flag `is_admin = True` no banco de dados **E** o seu `username` seja igual à variável de ambiente `ADMIN_USERNAME` configurada no servidor (atualmente definida como `brayan`).
2.  **Bloqueio de Escalação de Privilégios:** O endpoint de `toggle-admin` bloqueia a promoção de qualquer outra conta que não possua o `username` do administrador principal, eliminando brechas de auto-promoção.

---

## 6. Infraestrutura de Produção e Deploy

O deploy foi efetuado em um servidor VPS Linux Ubuntu da DigitalOcean (`134.209.71.200`):

```
                   Requisição HTTPS (Cliente)
                               │
                               ▼
                       Nginx (Host do VPS)
                     [Gerencia Certificado SSL]
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
       bookguess-frontend-1        bookguess-backend-1
      (Porta 3000 — Next.js)      (Porta 8000 — FastAPI)
                                             │
                                     ┌───────┴───────┐
                                     ▼               ▼
                               bookguess-db-1  bookguess-redis-1
                                (PostgreSQL)        (Redis)
```

*   **Docker Compose V2:** Isola e roda todos os microsserviços do BookGuess em containers Linux autônomos.
*   **Nginx Proxy Reverso:** Intercepta o tráfego dos domínios `bookguess.panela.host` (frontend) e `bookguess-api.panela.host` (backend), repassando para as portas correspondentes.
*   **SSL Criptografado:** Protocolo HTTPS seguro ativado por meio do Certbot (Let's Encrypt), criptografando os dados trafegados entre o navegador e o servidor.

---
*Documento técnico desenvolvido para suporte de apresentação de sistema.*  
*Última atualização: Junho de 2026*
