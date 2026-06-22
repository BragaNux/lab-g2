# BookGuess - Documento de Arquitetura

> Plataforma gamificada de adivinhação de trechos literários  
> Versão 1.0 - Arquitetura para MVP

---

## Índice

1. [Alerta Legal - Leia Primeiro](#1-alerta-legal)
2. [Visão do Produto](#2-visão-do-produto)
3. [Decisões de Stack](#3-decisões-de-stack)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Modelagem de Dados](#5-modelagem-de-dados)
6. [Pipeline RAG e IA](#6-pipeline-rag-e-ia)
7. [Mecânicas de Jogo](#7-mecânicas-de-jogo)
8. [APIs - Endpoints](#8-apis)
9. [Gamificação](#9-gamificação)
10. [Segurança](#10-segurança)
11. [DevOps e Deploy](#11-devops-e-deploy)
12. [Monetização](#12-monetização)
13. [Estrutura de Pastas](#13-estrutura-de-pastas)
14. [Roadmap 12 Meses](#14-roadmap-12-meses)
15. [Código Inicial](#15-código-inicial)

---

## 1. Alerta Legal

**Este é o maior risco do projeto. Não é detalhe - é o fundamento.**

### O problema real

Usar trechos de livros comerciais em uma plataforma de entretenimento (especialmente monetizada) **não** é coberto automaticamente por fair use / uso justo, em nenhuma jurisdição. A doutrina de fair use (EUA) e as exceções similares no Brasil (Lei 9.610/98, Art. 46) cobrem crítica, comentário, educação, pesquisa - não jogos com monetização.

O risco não é teórico. A HarperCollins, Penguin Random House e outros grandes grupos têm histórico de ação legal agressiva contra usos não licenciados de seus catálogos.

### Estratégias para mitigar (em ordem de segurança)

**Opção A - Domínio público (recomendada para MVP)**  
Obras com mais de 70 anos após a morte do autor estão em domínio público no Brasil e na maioria dos países. Isso inclui:
- Todo o cânone da literatura ocidental até início do século XX
- Machado de Assis, Eça de Queirós, Dostoiévski, Tolstói, Dickens, Austen, Kafka, etc.
- Fontes: Project Gutenberg, Domínio Público (BR), Standard Ebooks

**Opção B - Licenciamento ativo**  
Contatar editoras e autores independentes para licenciamento. Difícil para MVP, mas necessário para catálogo contemporâneo.

**Opção C - Conteúdo gerado / sintético**  
Usar LLM para gerar trechos *no estilo de* autores (não extraídos de obras reais). Juridicamente mais seguro, mas perde a autenticidade do produto.

**Limite prático de texto exibido**  
Mesmo em domínio público, exibir trechos muito longos pode ser problemático dependendo da edição utilizada (traduções recentes são protegidas separadamente). Mantenha trechos entre **50 e 200 palavras**. Nunca exiba um capítulo inteiro ou a obra completa.

**Decisão para o MVP:** Iniciar 100% com domínio público. Construir o produto, validar mecânicas, depois negociar licenciamentos.

---

## 2. Visão do Produto

### Conceito central

Um jogo diário (modelo Wordle/NYT) onde o usuário lê um trecho literário e tenta identificar a obra. Uma frase por dia, para todos os usuários, muda à meia-noite. O RAG serve exclusivamente para o **sistema de dicas progressivas** - não para seleção aleatória de frases.

### Mecânicas definidas

| Situação | Pontos |
|---|---|
| Acerta sem dica | 100% dos pontos da rodada |
| Acerta com dica | 50% dos pontos da rodada |
| Erra | 0 pontos |
| Dias anteriores (modo exploração) | Sem pontos, sem ranking |

### Fluxo do jogador

```
Acessa o site
    ↓
Vê o trecho do dia
    ↓
Digita resposta (título + autor opcional)
    ↓
Pede dica? → RAG busca contexto → Dica exibida → Resposta final
    ↓
Feedback: acertou / errou + explicação
    ↓
Pontos atualizados + posição no ranking
```

---

## 3. Decisões de Stack

### Frontend

**Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui**

Por quê Next.js e não Remix ou Vite SPA?  
- SSR nativo: o trecho do dia pode ser renderizado server-side sem expor lógica de resposta no cliente
- API Routes: elimina a necessidade de um servidor separado no MVP
- Ecosystem maduro para um desenvolvedor solo

Alternativa rejeitada: Vue/Nuxt - ecosystem menor para UI components, curva maior para integrar com bibliotecas de IA.

### Backend

**Python + FastAPI**

Por quê não Node.js?  
Porque o ecossistema de IA (LangChain, sentence-transformers, pgvector client, pypdf) é Python-nativo. Forçar isso em Node adicionaria camadas desnecessárias.

Estrutura: monolito modular no MVP, quebrado em serviços quando houver necessidade comprovada.

### Banco de Dados

**PostgreSQL + pgvector + Redis**

Comparação de bancos vetoriais:

| | pgvector | Qdrant | Pinecone |
|---|---|---|---|
| Custo MVP | Grátis (junto ao Postgres) | Grátis tier | $70+/mês |
| Operação | 0 infra extra | 1 serviço extra | Gerenciado |
| Performance (< 100k vetores) | Suficiente | Melhor | Melhor |
| Complexidade | Baixa | Média | Baixa |

**Decisão: pgvector para MVP.** Um banco, zero custo extra, performance suficiente para < 100k chunks. Migrar para Qdrant se a base crescer e queries vetoriais ficarem lentas (> 200ms).

Redis para:
- Cache do trecho diário (evita query a cada request)
- Rate limiting
- Session tokens
- Leaderboard em tempo real (sorted sets)

### LLM

**API da Anthropic (Claude) para geração de dicas e avaliação semântica**

Para embeddings: **`text-embedding-3-small` da OpenAI** - mais barato que ada-002, suficiente para chunks literários.

Custo estimado embeddings (100 livros de domínio público, ~5MB de texto cada):  
`~500k tokens × $0.02/1M = ~$0.01 por livro` → custo de ingestão irrisório.

Custo de operação por dica solicitada (1 chamada Claude Haiku):  
`~500 tokens input + 200 output ≈ $0.0001` → 10.000 dicas = $1.

---

## 4. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│         Next.js 14 - Vercel                             │
│  Landing | Game | Ranking | Profile | Admin             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST
┌────────────────────▼────────────────────────────────────┐
│                      BACKEND                            │
│              FastAPI - Railway                          │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth API   │  │   Game API   │  │   Admin API   │  │
│  │  JWT + BCR  │  │  Partidas    │  │  Books CRUD   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              RAG Service                         │   │
│  │  Ingestão → Chunking → Embeddings → Retrieval   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐                    │
│  │  Scheduler   │   │  LLM Client  │                    │
│  │  Trecho dia  │   │  Anthropic   │                    │
│  └──────────────┘   └──────────────┘                    │
└────────┬──────────────────────┬────────────────────────┘
         │                      │
┌────────▼──────┐    ┌──────────▼────────┐
│  PostgreSQL   │    │      Redis         │
│  + pgvector   │    │  Cache + Ranking   │
└───────────────┘    └───────────────────┘
```

### Componentes principais

**Scheduler (APScheduler)**  
Roda diariamente à meia-noite UTC:
1. Seleciona o próximo trecho da fila (curada manualmente ou via IA)
2. Salva como "trecho do dia" no Redis (TTL 24h) e no PostgreSQL
3. Zera o ranking diário

**RAG Service**  
Ativado apenas quando o usuário solicita uma dica. Não é usado para seleção do trecho principal (essa decisão é editorial/curada).

**LLM Client**  
Wrapper sobre a API da Anthropic. Usado para:
- Gerar dicas contextuais (RAG → contexto → prompt → dica)
- Avaliar semelhança semântica entre resposta do usuário e resposta correta
- Classificar dificuldade dos trechos durante ingestão

---

## 5. Modelagem de Dados

```sql
-- Usuários
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(30) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    xp          INTEGER DEFAULT 0,
    level       SMALLINT DEFAULT 1,
    streak      SMALLINT DEFAULT 0,
    last_played DATE,
    is_premium  BOOLEAN DEFAULT FALSE,
    is_admin    BOOLEAN DEFAULT FALSE,
    allow_ai    BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Livros
CREATE TABLE books (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(500) NOT NULL,
    author      VARCHAR(255) NOT NULL,
    year        SMALLINT,
    language    VARCHAR(10) DEFAULT 'pt',
    copyright_status VARCHAR(20) DEFAULT 'public_domain',
    source_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trechos
CREATE TABLE passages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id     UUID REFERENCES books(id),
    text        TEXT NOT NULL,             -- o trecho exibido
    difficulty  SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    points      SMALLINT GENERATED ALWAYS AS (difficulty * 20) STORED,
    used_on     DATE,                      -- NULL = disponível, DATE = já usado
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks vetorizados (para RAG de dicas)
CREATE TABLE chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id     UUID REFERENCES books(id),
    passage_id  UUID REFERENCES passages(id) NULL,  -- chunk pode não ter passagem associada
    text        TEXT NOT NULL,
    embedding   vector(1536),              -- OpenAI text-embedding-3-small
    chunk_index SMALLINT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trecho do dia
CREATE TABLE daily_challenges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_id  UUID REFERENCES passages(id),
    date        DATE UNIQUE NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

-- Partidas
CREATE TABLE games (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    challenge_id UUID REFERENCES daily_challenges(id),
    answer      TEXT,
    is_correct  BOOLEAN,
    used_hint   BOOLEAN DEFAULT FALSE,
    points_earned SMALLINT DEFAULT 0,
    played_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)   -- um jogo por usuário por desafio
);

-- Ranking (espelho do Redis, para histórico)
CREATE TABLE ranking_snapshots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    date        DATE,
    xp_day      INTEGER DEFAULT 0,
    xp_week     INTEGER DEFAULT 0,
    position_day SMALLINT,
    position_week SMALLINT,
    snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges / Conquistas
CREATE TABLE badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    xp_reward   SMALLINT DEFAULT 0
);

CREATE TABLE user_badges (
    user_id     UUID REFERENCES users(id),
    badge_id    UUID REFERENCES badges(id),
    earned_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- Índices
CREATE INDEX ON games(user_id, played_at DESC);
CREATE INDEX ON games(challenge_id, is_correct);
CREATE INDEX ON daily_challenges(date);
CREATE INDEX ON passages(book_id, used_on);
```

---

## 6. Pipeline RAG e IA

### Por que RAG só para dicas?

A pergunta que o documento original não faz: *por que você precisa de RAG para selecionar o trecho do dia?*

Você não precisa. Seleção aleatória de um trecho curado funciona perfeitamente - e é mais previsível, auditável e barato. RAG entra especificamente quando o usuário pede dica: o sistema busca contexto relevante do livro para informar a dica gerada pelo LLM. Isso é um uso correto de RAG.

### Pipeline de ingestão (offline)

```
Arquivo (PDF/EPUB/TXT)
        ↓
Extração de texto (pypdf / ebooklib / raw)
        ↓
Limpeza (remoção de cabeçalhos, notas de rodapé, hifenizações)
        ↓
Divisão em chunks (500 tokens, overlap 50 tokens)
        ↓
Geração de embeddings (OpenAI text-embedding-3-small)
        ↓
Persistência no PostgreSQL + pgvector
        ↓
[Opcional] LLM analisa chunks → identifica trechos bons para jogo → salva em passages
```

### Pipeline de dica (online, por request)

```
Usuário pede dica
        ↓
Busca vetorial: query = texto do trecho → top-5 chunks similares do mesmo livro
        ↓
Prompt para Claude:
  "Você é assistente de um jogo literário. O jogador está tentando
   identificar de qual livro veio este trecho: [TRECHO].
   Contexto do livro: [CHUNKS RECUPERADOS].
   Gere uma dica que ajude sem revelar o título ou autor.
   A dica deve mencionar época, estilo ou tema."
        ↓
Dica exibida → flag used_hint = true no game
```

### Controle de IA e Dica Offline (Economia de API Tokens)

Para evitar o consumo excessivo de créditos de API com requisições repetitivas durante testes ou apresentações públicas, o sistema implementa uma camada de controle administrativo:

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
      Dica Gerada         "DICA OFFLINE: Obra publicada em
                      [ano], escrita originalmente em [idioma]."
```

1. **allow_ai = True**: O sistema faz a busca vetorial (RAG) no pgvector e envia o contexto para a API do Claude 3 Haiku gerar a dica em português.
2. **allow_ai = False**: O sistema consome **zero tokens de LLM**. Ele busca os metadados do livro no banco (ano de publicação e idioma original) e retorna uma dica estruturada e sem custos.

### Avaliação semântica de respostas

Para lidar com variações ("Dom Casmurro" vs "dom casmurro" vs "Dom Casmurro de Machado de Assis"):

**Nível 1 - Comparação fuzzy (free, implementar primeiro)**  
```python
from rapidfuzz import fuzz
score = fuzz.token_sort_ratio(user_answer.lower(), correct_title.lower())
is_correct = score >= 85
```

**Nível 2 - Embedding similarity (pago, implementar depois)**  
Calcular cosine similarity entre embedding da resposta do usuário e embedding do título correto. Threshold: 0.82.

**Nível 3 - LLM judge (mais caro, para casos ambíguos)**  
Usar apenas quando levels 1 e 2 discordarem.

### Classificação de dificuldade (durante ingestão)

```python
DIFFICULTY_PROMPT = """
Avalie este trecho de um jogo de adivinhação literária.
Retorne um JSON com:
- difficulty: 1 (muito fácil) a 5 (muito difícil)
- reason: string curta explicando

Critérios:
- Fácil: trecho contém nome de personagem icônico, lugar ou frase famosa
- Difícil: trecho é genérico, poderia ser de vários livros, sem marcadores óbvios

Trecho: {passage}
"""
```

---

## 7. Mecânicas de Jogo

### Fluxo detalhado

```
Estado inicial: desafio carregado, resposta vazia, 0 dicas usadas

Jogador submete resposta
    ↓
Backend: normalizar resposta → fuzzy match → resultado
    ↓
SE ACERTO:
  - used_hint = false → points = passage.points (100%)
  - used_hint = true  → points = passage.points * 0.5 (50%)
  - Salvar game, atualizar user.xp, atualizar Redis ranking
    ↓
SE ERRO:
  - Salvar tentativa, 0 pontos
  - Exibir resposta correta + contexto
```

### Modo exploração (dias anteriores)

- Endpoint separado: `GET /challenges/history`
- Retorna lista de desafios passados
- Ao jogar um histórico: salva no banco com `is_historic = true`, sem atualizar XP ou ranking
- UX: indicador visual claro "modo exploração - sem pontos"

### Proteção contra múltiplas tentativas

- `UNIQUE(user_id, challenge_id)` no banco garante um game por desafio
- Após submeter, o resultado é final - sem retentativas no desafio do dia
- Modo exploração: pode tentar quantas vezes quiser (sem consequências de ranking)

---

## 8. APIs

### Autenticação

```
POST /auth/register
  Body: { username, email, password }
  Response: { user_id, token }

POST /auth/login
  Body: { email, password }
  Response: { token, user: { id, username, xp, level } }

POST /auth/refresh
  Headers: Authorization: Bearer <refresh_token>
  Response: { token }
```

### Jogo

```
GET /challenge/today
  Response: {
    id, passage_text, difficulty, points_available,
    already_played: bool, result?: { is_correct, points_earned }
  }

POST /challenge/today/submit
  Body: { answer: string }
  Response: {
    is_correct: bool,
    points_earned: int,
    correct_answer: { title, author, year },
    explanation: string
  }

POST /challenge/today/hint
  Response: { hint: string }
  Efeito: marca used_hint = true para este game

GET /challenges/history?page=1&limit=20
  Response: { challenges: [...], total, pages }

POST /challenges/{challenge_id}/play
  Body: { answer: string }
  Response: { is_correct, correct_answer }  # sem pontos
```

### Ranking

```
GET /ranking/daily?limit=50
  Response: { rankings: [{ position, username, xp_day }] }

GET /ranking/weekly?limit=50
  Response: { rankings: [...] }

GET /ranking/me
  Response: { daily: { position, xp }, weekly: { position, xp } }
```

### Perfil

```
GET /users/me
  Response: { id, username, xp, level, streak, badges, recent_games }

GET /users/{username}
  Response: perfil público (sem email, sem histórico detalhado)
```

### Admin

```
POST /admin/books
  Body: { title, author, year, file: multipart }
  Dispara pipeline de ingestão assíncrono

GET /admin/books
GET /admin/books/{id}
DELETE /admin/books/{id}

GET /admin/passages?book_id=&difficulty=&used=
POST /admin/passages/{id}/schedule
  Body: { date: "2025-10-15" }

GET /admin/queue  # fila de trechos futuros
```

---

## 9. Gamificação

### XP e Níveis

```
XP ganho por partida = passage.difficulty * 20 * hint_multiplier
hint_multiplier = 0.5 se used_hint, 1.0 se não

Níveis:
  1 - Leitor Iniciante    (0 XP)
  2 - Aprendiz Literário  (200 XP)
  3 - Conhecedor          (600 XP)
  4 - Bibliófilo          (1.500 XP)
  5 - Erudito             (3.500 XP)
  6 - Mestre das Letras   (8.000 XP)
  7 - Guardião da Memória (20.000 XP)
```

### Streak

- Incrementa 1 por dia que o usuário joga o desafio diário (acertando ou errando)
- Resetado se passar um dia sem jogar
- Bonus: streak de 7 dias → +50 XP; streak de 30 dias → +300 XP

### Badges iniciais

| Slug | Condição |
|---|---|
| `first_blood` | Primeiro acerto |
| `no_hints` | 10 acertos sem dica |
| `scholar` | 50 partidas jogadas |
| `streak_7` | 7 dias consecutivos |
| `streak_30` | 30 dias consecutivos |
| `century` | 100 XP em um dia |
| `genre_master` | Acertar 5 trechos do mesmo autor |
| `night_owl` | Jogar entre meia-noite e 3h |

---

## 10. Segurança

### Principais vetores e mitigações

**Acesso Administrativo Blindado (Admin Lock)**
*   **Vulnerabilidade Mitigada:** Escalação de privilégios de administrador por adulteração direta do banco de dados (ex: SQL injection, roubo de credenciais secundárias) ou exploits de rotas administrativas.
*   **Mitigação:** O sistema usa uma verificação em duas etapas no backend (`require_admin`). Não basta o usuário possuir o atributo `is_admin = True` no banco de dados; o seu `username` precisa coincidir exatamente com a variável de ambiente `ADMIN_USERNAME` configurada no servidor (atualmente definida como `brayan`).
*   **Bloqueio de Promoção de Admins:** O endpoint `toggle-admin` no backend foi bloqueado contra auto-promoção e contra a promoção de qualquer outro username que não corresponda ao `ADMIN_USERNAME` principal, garantindo segurança absoluta durante a execução da aplicação em rede pública.

**SQL Injection**  
Usar exclusivamente prepared statements via SQLAlchemy ORM. Nunca concatenar strings em queries.

**XSS**  
- Todos os inputs sanitizados no backend (bleach library)
- CSP headers no Next.js (via next.config.js)
- React escapa output por padrão - não usar dangerouslySetInnerHTML

**Rate Limiting**  
```python
# FastAPI + slowapi
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/challenge/today/submit")
@limiter.limit("10/minute")  # previne brute force
async def submit_answer(...):
```

Endpoints críticos:
- `/auth/login`: 5 req/minuto por IP
- `/challenge/today/submit`: 10 req/minuto por usuário
- `/challenge/today/hint`: 3 req/desafio por usuário

**Upload de arquivos (admin)**  
- Validar MIME type server-side (não confiar no Content-Type do cliente)
- Tamanho máximo: 50MB
- Processar em ambiente isolado (nunca executar conteúdo do arquivo)
- Salvar em storage separado (S3/R2), não no filesystem do servidor

**Proteção contra scraping**  
- O trecho do dia não deve ser exposto em meta tags de SEO
- Resposta correta nunca enviada junto com o trecho (apenas após submissão)
- Considerar obfuscação do endpoint de hint após MVP

**CSRF**  
- APIs stateless com JWT não são vulneráveis ao CSRF clássico
- Garantir que o frontend nunca armazene JWT em cookies sem SameSite=Strict

---

## 11. DevOps e Deploy

### Comparação de plataformas

| | Vercel | Railway | Render | Fly.io | AWS |
|---|---|---|---|---|---|
| Frontend | ✅ Ideal | Funciona | Funciona | Funciona | Complexo |
| Backend Python | ❌ Não | ✅ Ideal | ✅ Bom | ✅ Bom | Complexo |
| PostgreSQL | ❌ Não | ✅ Incluído | ✅ Incluído | Addon | RDS pago |
| Redis | ❌ Não | ✅ Incluído | ✅ Incluído | Upstash | ElastiCache |
| Custo MVP | $0 | ~$10-20/mês | ~$7-15/mês | ~$10/mês | $50+/mês |

**Recomendação MVP:**
- Frontend: Vercel (free tier suficiente)
- Backend + PostgreSQL + Redis: Railway (Developer plan $5/mês)

### Docker Compose (desenvolvimento local)

```yaml
version: '3.9'

services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/bookguess
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on: [db, redis]

  db:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=bookguess
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest tests/ -v
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run type-check
          npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 12. Monetização

### Modelo freemium

**Plano gratuito (base)**
- Desafio diário completo
- Ranking global
- Histórico de 30 dias
- 1 dica por desafio

**Plano Premium (~R$15/mês)**
- Tudo do gratuito
- 3 dicas por desafio
- Desafios temáticos exclusivos (ex: "Semana Machado de Assis")
- Exploração ilimitada de histórico
- Estatísticas detalhadas (gêneros, autores, taxa de acerto)
- Badge premium no perfil
- Sem propagandas (caso implementadas)

**Prioridade de implementação:** validar product-market fit no plano gratuito antes de construir premium. Não implementar paywall antes de ter 500 usuários ativos.

---

## 13. Estrutura de Pastas

```
bookguess/
├── frontend/               # Next.js 14
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (game)/
│   │   │   ├── page.tsx           # tela do jogo (hoje)
│   │   │   └── history/
│   │   ├── ranking/
│   │   ├── profile/
│   │   └── admin/
│   ├── components/
│   │   ├── game/
│   │   │   ├── PassageCard.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   ├── HintButton.tsx
│   │   │   └── ResultModal.tsx
│   │   ├── ranking/
│   │   └── ui/                    # shadcn components
│   ├── lib/
│   │   ├── api.ts                 # axios client
│   │   └── auth.ts
│   └── types/
│
├── backend/                # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── game.py
│   │   │   ├── ranking.py
│   │   │   └── admin.py
│   │   ├── models/            # SQLAlchemy
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   ├── passage.py
│   │   │   └── game.py
│   │   ├── schemas/           # Pydantic
│   │   │   ├── auth.py
│   │   │   └── game.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── game_service.py
│   │   │   ├── scoring_service.py
│   │   │   └── ranking_service.py
│   │   └── rag/
│   │       ├── ingestor.py        # pipeline offline
│   │       ├── retriever.py       # busca vetorial
│   │       └── hint_generator.py  # gera dica via LLM
│   ├── tests/
│   └── requirements.txt
│
└── docker-compose.yml
```

---

## 14. Código Inicial

### Backend - main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, game, ranking, admin
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="BookGuess API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://bookguess.vercel.app", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(game.router, prefix="/challenge", tags=["game"])
app.include_router(ranking.router, prefix="/ranking", tags=["ranking"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

### Backend - game_service.py (lógica principal)

```python
from datetime import date
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
import redis

from app.models.game import Game
from app.models.passage import DailyChallenge
from app.rag.hint_generator import generate_hint

r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

FUZZY_THRESHOLD = 85

def get_today_challenge(db: Session) -> DailyChallenge:
    cached = r.get("challenge:today")
    if cached:
        return DailyChallenge(**json.loads(cached))
    
    challenge = db.query(DailyChallenge).filter(
        DailyChallenge.date == date.today(),
        DailyChallenge.is_active == True
    ).first()
    
    if not challenge:
        raise HTTPException(404, "No challenge for today")
    
    r.setex("challenge:today", 3600, json.dumps(challenge.to_dict()))
    return challenge


def evaluate_answer(user_answer: str, correct_title: str) -> bool:
    score = fuzz.token_sort_ratio(
        user_answer.strip().lower(),
        correct_title.strip().lower()
    )
    return score >= FUZZY_THRESHOLD


def submit_answer(user_id: str, answer: str, db: Session) -> dict:
    challenge = get_today_challenge(db)
    
    # Verificar se já jogou hoje
    existing = db.query(Game).filter(
        Game.user_id == user_id,
        Game.challenge_id == challenge.id
    ).first()
    
    if existing:
        raise HTTPException(409, "Already played today")
    
    is_correct = evaluate_answer(answer, challenge.passage.book.title)
    
    # Verificar se usou dica
    hint_key = f"hint_used:{user_id}:{challenge.id}"
    used_hint = r.exists(hint_key)
    
    points = 0
    if is_correct:
        base_points = challenge.passage.points
        points = base_points // 2 if used_hint else base_points
    
    game = Game(
        user_id=user_id,
        challenge_id=challenge.id,
        answer=answer,
        is_correct=is_correct,
        used_hint=bool(used_hint),
        points_earned=points
    )
    db.add(game)
    
    if points > 0:
        # Atualizar XP no banco e ranking no Redis
        update_user_xp(user_id, points, db)
        r.zincrby(f"ranking:daily:{date.today()}", points, user_id)
        r.zincrby(f"ranking:weekly:{get_week_key()}", points, user_id)
    
    db.commit()
    
    return {
        "is_correct": is_correct,
        "points_earned": points,
        "correct_answer": {
            "title": challenge.passage.book.title,
            "author": challenge.passage.book.author,
        }
    }


def request_hint(user_id: str, db: Session) -> str:
    challenge = get_today_challenge(db)
    hint_key = f"hint_used:{user_id}:{challenge.id}"
    
    # Marcar dica como usada (independente de já ter pedido antes)
    r.setex(hint_key, 86400, "1")
    
    # Gerar dica via RAG
    hint = generate_hint(
        passage_text=challenge.passage.text,
        book_id=str(challenge.passage.book_id),
        db=db
    )
    return hint
```

### Backend - hint_generator.py (RAG)

```python
from anthropic import Anthropic
from sqlalchemy.orm import Session
from app.models.chunk import Chunk

client = Anthropic()

def generate_hint(passage_text: str, book_id: str, db: Session) -> str:
    # 1. Gerar embedding da passagem para buscar contexto similar
    from openai import OpenAI
    oai = OpenAI()
    
    response = oai.embeddings.create(
        model="text-embedding-3-small",
        input=passage_text
    )
    query_embedding = response.data[0].embedding
    
    # 2. Buscar chunks similares do mesmo livro (pgvector)
    similar_chunks = db.execute(
        """
        SELECT text 
        FROM chunks 
        WHERE book_id = :book_id
        ORDER BY embedding <=> :embedding
        LIMIT 3
        """,
        {"book_id": book_id, "embedding": query_embedding}
    ).fetchall()
    
    context = "\n\n".join([row.text for row in similar_chunks])
    
    # 3. Gerar dica com Claude
    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Você é assistente de um jogo literário.
O jogador está tentando identificar de qual livro veio este trecho:

"{passage_text}"

Contexto adicional do livro:
{context}

Gere UMA dica útil que:
- Mencione época, estilo literário ou tema central
- NÃO revele o título nem o nome do autor
- Seja curta (máximo 2 frases)
- Esteja em português"""
        }]
    )
    
    return message.content[0].text
```

### Frontend - PassageCard.tsx

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

interface PassageCardProps {
  challenge: {
    id: string
    passage_text: string
    difficulty: number
    points_available: number
    already_played: boolean
  }
}

export function PassageCard({ challenge }: PassageCardProps) {
  const [answer, setAnswer] = useState("")
  const [hint, setHint] = useState<string | null>(null)
  const [result, setResult] = useState<{
    is_correct: boolean
    points_earned: number
    correct_answer: { title: string; author: string }
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const data = await api.post("/challenge/today/submit", { answer })
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleHint() {
    setLoading(true)
    try {
      const data = await api.post("/challenge/today/hint")
      setHint(data.hint)
    } finally {
      setLoading(false)
    }
  }

  if (challenge.already_played && result === null) {
    return <div>Você já jogou hoje. Volte amanhã!</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Dificuldade {challenge.difficulty}/5</Badge>
        <Badge>{challenge.points_available} pts</Badge>
      </div>

      <blockquote className="border-l-4 border-muted pl-6 py-2 text-lg italic leading-relaxed">
        "{challenge.passage_text}"
      </blockquote>

      {hint && (
        <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <strong>Dica:</strong> {hint}
          <p className="mt-1 text-xs">⚠ Acerto com dica vale 50% dos pontos</p>
        </div>
      )}

      {result ? (
        <div className={`rounded-lg p-4 ${result.is_correct ? "bg-green-50" : "bg-red-50"}`}>
          <p className="font-semibold">
            {result.is_correct ? `✓ Correto! +${result.points_earned} pts` : "✗ Incorreto"}
          </p>
          <p className="text-sm mt-1">
            {result.correct_answer.title} - {result.correct_answer.author}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Digite o título do livro..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !answer.trim()} className="flex-1">
              Responder
            </Button>
            {!hint && (
              <Button variant="outline" onClick={handleHint} disabled={loading}>
                Pedir dica (−50%)
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

*Documento gerado para uso interno de desenvolvimento.*  
*Última atualização: 2026*
