# RealUp — Plataforma de Gestión de Campañas de Crowdposting

Herramienta interna para gestionar creadores de contenido y campañas de influencer marketing en Colombia. Permite prospectar, filtrar, asignar y dar seguimiento a creadores a través de todo el pipeline de publicación.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 · React 19 · Tailwind CSS · shadcn/ui · TanStack Query |
| Backend | Fastify 5 · TypeScript · Drizzle ORM |
| Base de datos | Supabase (PostgreSQL) · pgvector · pg_cron |
| IA | Vercel AI SDK v6 · OpenAI `gpt-4o-mini` · `text-embedding-3-small` |
| Autenticación | Supabase Auth |
| Monorepo | `/web` (Next.js) · `/server` (Fastify) · `/supabase` (migraciones) |

---

## Estructura del proyecto

```
RealUp/
├── web/                  # Frontend Next.js
│   ├── app/
│   │   ├── creators/     # Lista, detalle y creación de creadores
│   │   └── campaigns/    # Campañas y pipeline de asignaciones
│   └── src/
│       ├── features/     # Módulos por dominio (creators, campaigns, chat)
│       └── components/   # UI compartida (sidebar, layout)
│
├── server/               # API Fastify
│   └── src/
│       ├── routes/v1/
│       │   ├── creators/ # CRUD de creadores + audit log
│       │   ├── campaigns/# CRUD de campañas + pipeline stats
│       │   ├── search.ts # Búsqueda semántica RAG + embeddings
│       │   ├── chat.ts   # Chat IA streaming con tools
│       │   └── import.ts # Importación CSV de creadores
│       ├── db/schema/    # Esquemas Drizzle ORM
│       ├── lib/          # embedding.ts · embedding-worker.ts
│       └── schemas/      # Validación Zod de requests
│
└── supabase/
    └── migrations/       # SQL migrations (aplicar manualmente vía SQL Editor)
```

---

## Requisitos previos

- Node.js 20+
- Proyecto en [Supabase](https://supabase.com) con extensiones `pgvector` y `pg_cron` habilitadas
- API Key de OpenAI

---

## Setup inicial

### 1. Variables de entorno

**`server/.env`** (copiar desde `server/.env.example`):
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_ANON_KEY=sb_publishable_...
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-proj-...
```

> **Importante:** Usar la URL del **Transaction pooler** de Supabase (puerto 6543), no la conexión directa.

**`web/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Migraciones de base de datos

Las migraciones **no se pueden aplicar con `drizzle-kit migrate`** desde redes con restricciones DNS (la conexión directa de Supabase en puerto 5432 puede no resolverse). Aplicarlas manualmente en el **SQL Editor de Supabase** en este orden:

```
supabase/migrations/20260410000001_enable_extensions.sql
supabase/migrations/20260410000002_pg_cron_permissions.sql
supabase/migrations/20260410000003_create_tables.sql
supabase/migrations/20260410000004_creator_score_trigger.sql
supabase/migrations/20260410999999_pg_cron_jobs.sql
```

Seed de datos para testing/demo (opcional):
```
supabase/migrations/20260413000001_seed_creators.sql
```

### 3. Instalación de dependencias

```bash
# Backend
cd server && npm install

# Frontend
cd web && npm install
```

---

## Desarrollo

```bash
# Terminal 1 — Backend (Fastify + pino-pretty)
cd server
npm run dev
# → http://localhost:3001
# → Swagger UI: http://localhost:3001/docs

# Terminal 2 — Frontend (Next.js)
cd web
npm run dev
# → http://localhost:3000
```

### Generar embeddings

Los embeddings se generan automáticamente cada 5 minutos vía `pg_cron`. Para generarlos manualmente (ej. tras cargar el seed):

```bash
curl -X POST http://localhost:3001/api/v1/embeddings/process
# → {"processed": 25, "failed": 0}
```

---

## Funcionalidades principales

### Gestión de creadores (`/creators`)
- Listado con filtros por tier, ciudad, categoría, engagement y seguidores
- Búsqueda semántica RAG en lenguaje natural (ej: *"microcreadores de fitness en Medellín"*)
- Creación manual y por importación de CSV
- Perfil completo con métricas, score calculado y audit log

### Pipeline de campañas (`/campaigns`)
- Creación y gestión de campañas con brief
- Asignación de creadores con seguimiento por estado:
  `Prospecto → Contactado → Confirmado → En brief → Contenido enviado → Aprobado → Publicado → Verificado → Pagado`
- Registro de URLs de publicación y métricas de performance

### Asistente IA (chat flotante, `⌘/`)
- Búsqueda de creadores por lenguaje natural con filtros semánticos
- Consulta de estado de campañas en tiempo real
- Descubrimiento de creadores similares por perfil de contenido
- Streaming via Vercel AI SDK · modelo `gpt-4o-mini`

---

## Scripts útiles

```bash
# Backend
npm run typecheck       # Verificar tipos TypeScript
npm run build           # Compilar para producción
npm run db:studio       # Drizzle Studio (explorar DB)

# Frontend
npm run typecheck       # Verificar tipos TypeScript
npm run check           # Biome lint + format check
npm run check:fix       # Biome auto-fix
npm run test            # Vitest (unit tests)
npm run e2e             # Playwright (E2E tests)
```

---

## Arquitectura de búsqueda semántica

```
Query usuario
    │
    ▼
gpt-4o-mini (extrae filtros estructurados)
    │
    ├── Filtros SQL hard (ciudad, tier, engagement, seguidores)
    │
    └── text-embedding-3-small (512 dims)
            │
            ▼
        pgvector HNSW (cosine distance)
            │
            ▼
        Hybrid score = distance × 0.7 + (1 - score/100) × 0.3
            │
            ▼
        Resultados rankeados
```

---

## Notas de compatibilidad

- **Zod v4 + AI SDK v6:** El SDK no convierte Zod v4 schemas automáticamente. Los tools del chat usan JSON Schema manual con `jsonSchema()` del SDK y el campo `inputSchema` directamente.
- **pgvector + postgres.js:** Los literales de vector se inline con `sql.raw()` — los casts `$1::vector` no funcionan con el driver de conexión pooled de Supabase.
- **Supabase Transaction pooler:** Usar siempre el pooler (puerto 6543) para conexiones runtime. Las migraciones requieren conexión directa (puerto 5432) que puede no estar disponible en todas las redes.
