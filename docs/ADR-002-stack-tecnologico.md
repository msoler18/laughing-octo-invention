# ADR-002: Stack Tecnológico — Sistema de Gestión de Campañas de Crowdposting

## Metadata

- Fecha: 2026-04-10
- Estado: Propuesto
- Autores: Equipo de Producto RealUp
- Revisores: Por definir
- Revisión: 2026-04-10 (v1.1 — BullMQ reemplazado por pg_cron, chatbot agregado)
- Depende de: ADR-001 v1.3

---

## Contexto

El ADR-001 v1.3 define el scope del MVP: 4 pantallas, 6 entidades (Creator, Campaign, CampaignCreator, AuditLog, CreatorScore, CreatorEmbedding), búsqueda RAG con vectorización completa, audit log inmutable, scoring determinista, métricas de performance de posts y chatbot conversacional. Este ADR define con qué se construye todo eso.

---

## Refutaciones — Puntos de entrada revisados y modificados

Tres de los puntos de entrada originales fueron refutados por los agentes con argumentos técnicos. Se documentan aquí para trazabilidad.

### ❌ Refutación 1: Python como backend

**Propuesto:** Python como lenguaje del servidor backend.

**Por qué no:** Python introduce fricción de ecosistema sin aportar capacidad que TypeScript + Node.js no tenga para este caso. Las tres operaciones que podrían justificar Python (pipeline de embeddings, scoring, importación CSV) tienen mejor solución dentro del stack TypeScript:
- Pipeline de embeddings → BullMQ worker en Node.js llamando OpenAI API
- Scoring → trigger PL/pgSQL en la DB (atómico, versionado con migraciones)
- Importación CSV → handler Fastify con pipeline de 5 fases en memoria

Mantener todo en TypeScript elimina el cambio de contexto de lenguaje, unifica el sistema de tipos entre frontend y backend, y reduce la superficie de herramientas del proyecto.

**Decisión:** Backend en **Fastify + TypeScript**.

---

### ❌ Refutación 2: SSR por defecto en todas las pantallas

**Propuesto:** SSR como estrategia de renderizado por defecto.

**Por qué no:** SSR es inadecuado para las pantallas más críticas del producto. El directorio de creadores con filtros RAG en tiempo real invalida cualquier caché de servidor — SSR aquí añade latencia sin beneficio. El kanban de campaña con optimistic updates y contadores en tiempo real requiere estado cliente persistente obligatoriamente.

**Decisión:** Estrategia de renderizado por pantalla (ver sección Frontend).

---

### ❌ Refutación 3: Vite como bundler junto a Next.js

**Propuesto:** Vite y Vitest para tests.

**Por qué no:** Vite y Next.js son mutuamente excluyentes como bundlers. No coexisten en producción.

**Decisión:** **Vitest como test runner** (sí, compatible con Next.js), **Turbopack** como bundler de desarrollo de Next.js. Vite no entra en el proyecto.

---

## Stack Decidido

### Vista general

```
┌────────────────────────────────────────────────────────────┐
│                      Next.js (UI)                          │
│  App Router · Server + Client Components · TanStack Query  │
│  Chat UI (Vercel AI SDK useChat)                           │
└───────────────────────────┬────────────────────────────────┘
                            │ fetch / Server Actions
┌───────────────────────────▼────────────────────────────────┐
│                   Fastify API  /api/v1/*                   │
│  TypeScript · Drizzle ORM · Zod · @fastify/swagger         │
│  AuditLog transaccional · Auth JWT (Supabase Auth)         │
│  /api/v1/search  (RAG híbrido)                             │
│  /api/v1/chat    (streaming conversacional)                │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                       Supabase                             │
│  PostgreSQL · pgvector (HNSW) · RLS · Supabase Auth        │
│  pg_cron — jobs programados dentro de la DB:               │
│    · Embedding batch pipeline (cada 5 min)                 │
│    · CSV import jobs (enqueue vía tabla jobs)              │
└────────────────────────────────────────────────────────────┘
```

**Sin Redis ni BullMQ en el MVP.** La complejidad operativa de gestionar una instancia Redis no está justificada a esta escala. `pg_cron` resuelve los mismos casos de uso dentro de Supabase, que ya está en el stack.

---

## Frontend

### Next.js — App Router con estrategia de renderizado por pantalla

| Pantalla | Estrategia | Justificación |
|---|---|---|
| `/creators` (directorio) | **CSR** — Client Component con TanStack Query | Filtros RAG en tiempo real invalidan caché de servidor. Cada búsqueda es única. |
| `/creators/[id]/edit` | **Server Component** + Client Components para campos | Fetch inicial del creador por ID desde Supabase; submit via Server Action. |
| `/campaigns` | **Server Component** con `cache: 'no-store'` + Streaming | Datos que cambian pero no en tiempo real. Streaming por sección con Suspense. |
| `/campaigns/[id]` (kanban) | **CSR** — Client Component con TanStack Query + Supabase Realtime | Optimistic updates, contadores en tiempo real, estado cliente persistente. |

**Regla:** `app/` solo orquesta layouts y páginas. Nunca contiene lógica de negocio ni fetch directo. Toda lógica vive en `features/`.

### Tailwind CSS + Design System + SASS

Roles estrictamente separados:

- **SASS** gestiona únicamente tokens primitivos como CSS custom properties en `:root` (color palette, spacing scale, typography scale, border radius, shadow levels).
- **Tailwind** consume esas CSS variables mediante `tailwind.config.ts` con `extend.colors`, `extend.spacing`, etc. mapeando `--token-name` a clases utilitarias.
- **SASS no escribe clases de componentes.** La presencia de `.btn-primary` en SASS es una violación de esta arquitectura.

**shadcn/ui** es la capa de componentes sobre Tailwind. Justificación específica para este producto:
- El directorio de creadores requiere `DataTable` con sorting, paginación y filtros — shadcn/ui sobre TanStack Table resuelve esto con accesibilidad correcta sin escribirla desde cero.
- El kanban necesita dialogs, tooltips, badges y focus traps — Radix UI primitives via shadcn/ui.
- Herramienta interna: el ROI de velocidad supera cualquier overhead de customización.

### Testing — TDD con Vitest

Vitest como test runner usando `vitest.config.ts` separado de `next.config.ts`.

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitario | Vitest + jsdom | Parsing RAG (query → filtros), transformaciones de datos, schemas Zod, utilidades de scoring, selectores de estado |
| Integración | Vitest + MSW | Hooks TanStack Query contra handlers mock, flujos de formulario completos, comportamiento del kanban con estado simulado |
| E2E | Playwright | Flujo crítico: buscar creador → añadir a campaña → cambiar estado → verificar contador actualizado |

### TypeScript — Convenciones estrictas

```typescript
// unknown en boundaries externos (responses sin schema validado, params antes de parsear)
async function handleWebhook(raw: unknown) {
  const parsed = WebhookSchema.safeParse(raw)
  if (!parsed.success) throw new ValidationError(parsed.error)
  return parsed.data // tipado garantizado post-parse
}

// never en exhaustive checks de estados
function assertNever(status: never): never {
  throw new Error(`Unhandled status: ${status}`)
}
switch (status) {
  case 'prospecto': ...
  case 'publicado': ...
  default: return assertNever(status) // rompe en compilación al agregar estado
}

// Zod + react-hook-form en formularios
const CreatorFormSchema = z.object({
  instagramHandle: z.string().min(1).max(30),
  followersCount: z.number().int().positive(),
  engagementRate: z.number().min(0).max(100),
})
const form = useForm({ resolver: zodResolver(CreatorFormSchema) })

// Zod en Server Actions
export async function updateCreatorStatus(raw: unknown) {
  const parsed = UpdateStatusSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten() }
  // parsed.data está tipado correctamente
}
```

Supabase devuelve `any` por defecto. Toda query de Supabase pasa por una capa de repositorio en `features/*/api.ts` que valida con Zod antes de exponer el dato al resto de la app.

### Data Fetching y UX

**TanStack Query** sobre SWR y RSC nativos. Razones: optimistic updates con rollback automático, invalidación granular por `queryKey`, devtools para debugging de caché, `useInfiniteQuery` para paginación del directorio.

Implementación del optimistic update en kanban:

```typescript
useMutation({
  mutationFn: updateCreatorStatus,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['campaign', campaignId] })
    const previous = queryClient.getQueryData(['campaign', campaignId])
    queryClient.setQueryData(['campaign', campaignId], (old) =>
      applyStatusChange(old, variables) // función pura, testeable
    )
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['campaign', campaignId], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
  },
})
```

Los contadores en tiempo real usan `supabase.channel()` en un `useEffect` que llama `queryClient.invalidateQueries` al recibir eventos — sin estado duplicado.

### Hooks — Separación de concerns (SOLID)

El hook de búsqueda RAG se descompone en responsabilidades únicas:

```
useRAGSearch
  ├── useQueryParser(rawInput)          → { filters, embedding }
  ├── useCreatorSearch({ filters })     → TanStack Query (resultados)
  └── useSearchUI()                     → { inputValue, setInputValue, debouncedValue }
```

Ningún hook tiene más de una responsabilidad. Los hooks de lógica (`useQueryParser`, `useCreatorSearch`) no conocen la UI. Los hooks de UI (`useSearchUI`) no conocen la lógica de negocio.

### Arquitectura de carpetas

```
src/
  features/
    creators/
      components/     # CreatorTable, CreatorCard, CreatorFilters
      hooks/          # useRAGSearch, useQueryParser, useCreatorMutation
      types.ts        # CreatorSchema (Zod), CreatorStatus (enum)
      api.ts          # Repositorio Supabase con validación Zod
    campaigns/
      components/     # KanbanBoard, KanbanColumn, CampaignList
      hooks/          # useCampaignRealtime, useOptimisticStatus
      types.ts
      api.ts
    embeddings/
      types.ts        # CreatorEmbeddingInput (Omit<Creator, 'phone' | 'email'>)
  lib/
    supabase/         # client (browser), server (Server Components), middleware
    query/            # queryClient config, query keys centralizados
    zod/              # schemas compartidos entre features
  app/                # Next.js App Router — solo layout y páginas, sin lógica
  workers/            # BullMQ workers (comparten tipos con features/)
```

---

## Backend

### Fastify + TypeScript

Fastify como servidor HTTP con soporte nativo de OpenAPI:

```typescript
// Endpoint versionado con schema Zod → JSON Schema automático
fastify.post('/api/v1/creators/:id/status', {
  schema: {
    body: zodToJsonSchema(UpdateStatusSchema),
    response: { 200: zodToJsonSchema(CampaignCreatorSchema) },
  },
}, async (request, reply) => {
  const parsed = UpdateStatusSchema.parse(request.body)
  return campaignService.updateStatus(parsed)
})
```

**OpenAPI + Swagger:** `@fastify/swagger` genera la spec desde los schemas de Zod en runtime. `@fastify/swagger-ui` expone `/docs` con la UI interactiva. Cero duplicación entre tipos y documentación.

**Versionado:** prefijo de ruta `/api/v1/`. Para versiones futuras, `fastify-plugin` por versión. Headers de versionado (`Accept-Version`) añaden complejidad sin beneficio en una herramienta interna.

### Supabase + Drizzle ORM

Drizzle ORM sobre el cliente directo de Supabase para:
- Transacciones explícitas (AuditLog + cambio de estado en un commit atómico)
- Migrations versionadas como código
- Type-safety end-to-end entre schema SQL y tipos TypeScript

El AuditLog **siempre** se escribe vía Fastify en la misma transacción Drizzle que el cambio que registra. RLS bloquea escrituras directas de PostgREST a tablas sensibles:

```sql
-- Solo el service_role del servidor Fastify puede escribir
CREATE POLICY "server_only" ON audit_log
  USING (auth.role() = 'service_role');
```

### Jobs async — pg_cron (sin Redis, sin BullMQ)

`pg_cron` es una extensión de PostgreSQL incluida en Supabase free tier. Ejecuta jobs programados directamente en la DB, sin infraestructura adicional.

| Job | Schedule | Operación |
|---|---|---|
| `process_pending_embeddings` | Cada 5 min | Selecciona hasta 50 creadores con `embedding_status = 'pending'`, llama OpenAI API, escribe en `creator_embeddings`, marca `done` |
| `process_csv_imports` | Cada 2 min | Lee tabla `import_jobs` con `status = 'queued'`, ejecuta pipeline de 5 fases, actualiza resultado |

```sql
-- Setup pg_cron jobs
SELECT cron.schedule(
  'process-pending-embeddings',
  '*/5 * * * *',
  $$ SELECT net.http_post(
       url := 'https://api.realup.internal/api/v1/workers/embeddings',
       headers := '{"Authorization": "Bearer <service_token>"}'
     ) $$
);
```

El endpoint de Fastify que dispara el job es idempotente: si ya hay un batch procesándose, retorna 204 sin ejecutar otro. No hay riesgo de procesamiento duplicado.

**Cuándo migrar a BullMQ + Redis:** cuando el volumen de creadores nuevos supere ~500/día o cuando el CSV import supere archivos de 10K filas. En MVP esos límites no se alcanzan.

**Tabla `import_jobs` (cola liviana en PostgreSQL):**

```
id          UUID PK
filename    TEXT
status      TEXT  -- queued | processing | done | failed
created_at  TIMESTAMPTZ
started_at  TIMESTAMPTZ
finished_at TIMESTAMPTZ
error_log   JSONB
```

### Scoring — PL/pgSQL trigger

El score del creador se recalcula en la DB como trigger sobre `campaign_creators` y cambios en `creators`. Vive en la DB para ser atómico, reproducible y versionado con migraciones Drizzle.

```sql
CREATE OR REPLACE FUNCTION recalculate_creator_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creator_scores (creator_id, score, calculated_at, score_version)
  VALUES (
    NEW.id,
    (
      CASE NEW.engagement_quality
        WHEN 'viral' THEN 40
        WHEN 'high'  THEN 30
        WHEN 'average' THEN 20
        WHEN 'low'   THEN 10
        ELSE 0
      END
      + (NEW.campaigns_participated * 2)  -- max 40 pts
      + (NEW.consistency_score * 20)      -- 0-20 pts
    ),
    now(),
    1  -- score_version
  )
  ON CONFLICT (creator_id) DO UPDATE
    SET score = EXCLUDED.score,
        calculated_at = EXCLUDED.calculated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### TDD — Estrategia por capa

| Capa | Framework | Approach |
|---|---|---|
| Fastify handlers | Vitest + `fastify.inject()` | Supabase local real (`supabase start`), sin mocks de DB |
| Pipeline CSV (5 fases) | Vitest | Cada fase es función pura: `parse(rows) → Result<T, Error[]>`. Tests de integración con fixtures CSV reales. |
| Trigger PL/pgSQL scoring | pgTAP | `INSERT` de prueba → `SELECT` del score resultante en DB local |
| BullMQ workers | Vitest | Mock del cliente OpenAI; verifica output en DB local |

### Privacidad — Garantía arquitectónica

`phone` y `email` se excluyen estructuralmente en TypeScript antes de llegar a cualquier función que construya prompts o embeddings:

```typescript
// src/features/embeddings/types.ts
type CreatorEmbeddingInput = Omit<Creator, 'phone' | 'email'>

function buildEmbeddingText(creator: CreatorEmbeddingInput): string {
  // El compilador rechaza cualquier path que pase Creator completo
  return `Creator: ${creator.fullName}\nInstagram: @${creator.instagramHandle}...`
}
```

En DB, la query que alimenta el worker de embeddings excluye explícitamente esas columnas en el `SELECT`.

### Convenciones de documentación (en inglés)

```typescript
/**
 * Transitions a CampaignCreator to a new status and appends an immutable audit entry.
 * Runs inside a single Drizzle transaction — either both writes succeed or neither does.
 *
 * @throws {StatusTransitionError} If the transition is not a valid edge in STATUS_GRAPH
 * @throws {DatabaseError} If the transaction fails at the DB level
 */
async function updateCreatorStatus(
  campaignCreatorId: string,
  nextStatus: CampaignCreatorStatus,
  actorId: string,
): Promise<CampaignCreator>
```

Regla: JSDoc obligatorio en toda función que toca DB, cola, API externa o estado compartido. Opcional en funciones puras de menos de 5 líneas.

---

## IA y RAG

### Modelo de embeddings

**`text-embedding-3-small` de OpenAI a 512 dimensiones.**

- Calidad en español suficiente para textos cortos (bio ~100 tokens, categorías, ciudad)
- 512 dims (reducción nativa de OpenAI): reduce almacenamiento en pgvector un 67% vs 1536 dims sin degradar recall significativamente para este corpus
- Costo de re-vectorización completa de 10.000 creadores: ~$0.03

Alternativa evaluada: Cohere embed-multilingual (mejor calidad en español) — descartada por añadir un segundo proveedor de IA al stack.

### pgvector — Índice HNSW

```sql
CREATE INDEX ON creator_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- En query time:
SET hnsw.ef_search = 40;
```

**HNSW sobre IVFFlat:** IVFFlat requiere `VACUUM ANALYZE` y re-tuning de `lists` conforme crece el corpus. HNSW mantiene recall alto sin re-entrenamiento del índice. Para 10.000 vectores de 512 dims (~20 MB), pgvector es suficiente. El límite real antes de evaluar Pinecone/Qdrant es ~500.000 vectores con requisito de p95 < 50ms.

### LLM para interpretación de queries

**`gpt-4o-mini` con `generateObject` via Vercel AI SDK.**

```typescript
const { object: filters } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: SearchFiltersSchema, // Zod schema
  prompt: buildFilterExtractionPrompt(userQuery),
})
```

El schema Zod valida y descarta valores fuera del enum antes de que lleguen al SQL. El prompt incluye:
- Few-shot examples cubriendo typos ("futbool" → sport: fútbol)
- Queries mixtos ("lifestyle creator en CDMX con +50k")
- Queries ambiguos: devuelve `null` en campos inciertos, nunca adivina

El texto del query también se embeds directamente para la búsqueda semántica, independientemente de los filtros extraídos.

### Flujo de búsqueda RAG completo

```
POST /api/v1/search { query: string }
  │
  ├─ 1. gpt-4o-mini → generateObject(FilterSchema)
  │       → { ciudad: "Medellín", categoria: ["fitness"], min_followers: 5000 }
  │
  ├─ 2. text-embedding-3-small → queryVector[512]
  │
  ├─ 3. SQL híbrido:
  │       SELECT c.*, ce.embedding <=> $queryVector AS distance
  │       FROM creators c
  │       JOIN creator_embeddings ce ON ce.creator_id = c.id
  │       WHERE c.city = $ciudad                  ← filtros duros primero
  │         AND c.creator_tier = ANY($tiers)
  │         AND c.followers_count >= $min_followers
  │       ORDER BY (distance * 0.7) + ((1 - cs.score/100) * 0.3)
  │       LIMIT 20
  │
  └─ 4. Respuesta: id, nombre, score, distance, bio snippet
```

Sin framework de orquestación (LangChain, LlamaIndex) en el MVP. La lógica es una función TypeScript de ~80 líneas. LangChain añade abstracción sin beneficio a esta escala.

### Pipeline de embeddings asíncrono

`embedding_status` en `creators`: `pending | processing | done | failed`

`source_hash` en `creator_embeddings`: SHA-256 del texto fuente. Permite detección exacta de desactualización sin comparar timestamps.

Trigger de regeneración:
```sql
CREATE OR REPLACE FUNCTION mark_embedding_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.bio_text IS DISTINCT FROM NEW.bio_text
     OR OLD.city IS DISTINCT FROM NEW.city
     OR OLD.creator_tier IS DISTINCT FROM NEW.creator_tier
  THEN
    NEW.embedding_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Costos estimados (1.000 creadores, 50 búsquedas/día)

| Operación | Tokens/mes | Costo/mes |
|---|---|---|
| Extracción de filtros (gpt-4o-mini) | ~450K | ~$0.07 |
| Embeddings de queries | ~45K | < $0.001 |
| Re-vectorización corpus (5% actualización) | ~7.5K | < $0.001 |
| **Total** | | **< $1/mes** |

### Observabilidad de búsquedas

Campos a loguear por búsqueda:
- `query_raw` (truncado a 200 chars, sin PII)
- `filters_extracted`, `results_count`
- `top3_distances`, `top3_creator_ids`
- `llm_latency_ms`, `vector_search_latency_ms`
- `model_used`, `embedding_model_used`

---

## Chatbot Conversacional

El chatbot usa exactamente la misma infraestructura RAG del MVP: pgvector, embeddings de creadores ya generados, gpt-4o-mini. El costo adicional es mínimo porque el índice vectorial ya existe.

### Stack

- **`useChat`** de Vercel AI SDK en el frontend — maneja el estado de mensajes, streaming y el historial de conversación en el cliente.
- **`streamText`** de Vercel AI SDK en el servidor — genera respuestas en streaming con tool calling para consultas estructuradas.
- **Endpoint:** `POST /api/v1/chat` en Fastify con soporte de streaming (`Transfer-Encoding: chunked`).

### Qué puede responder el chatbot

El chatbot tiene acceso a dos fuentes de datos via tools:

| Tool | Descripción | Ejemplo de query |
|---|---|---|
| `searchCreators` | RAG sobre el catálogo vectorizado | *"¿Quiénes son los mejores de fitness en Bogotá con más del 4% de engagement?"* |
| `queryCampaign` | SQL directo sobre estado de campañas | *"¿Qué creadores de la campaña Google aún no han publicado?"* |
| `findSimilarCreators` | Vector similarity sobre un creador de referencia | *"Muéstrame perfiles similares a @durbanclavijo"* |

### Flujo de una respuesta

```
Usuario: "¿Cuántos creadores de tecnología tenemos en Medellín disponibles?"
  │
  ├─ gpt-4o-mini analiza el intent → llama tool searchCreators
  │     { category: "tecnología", city: "Medellín", is_active: true }
  │
  ├─ searchCreators ejecuta RAG híbrido (filtros duros + vector search)
  │     → devuelve 3 creadores
  │
  └─ gpt-4o-mini genera respuesta en streaming:
       "Tienes 3 creadores de tecnología activos en Medellín:
        @nubelectrica_ (1.1K seguidores, 4.32% engagement)..."
```

### Contexto de sesión

El historial de mensajes se mantiene en el cliente (Vercel AI SDK `useChat`). El servidor es stateless — cada request incluye el array de mensajes anteriores. Para el MVP no hay persistencia de conversaciones en DB (eso es Fase 2).

### UI

Un panel lateral o modal de chat accesible desde cualquier pantalla de la herramienta. Diseñado con shadcn/ui. Soporta Markdown en las respuestas del bot para formatear listas de creadores.

### Costo adicional del chatbot

Cada turno de conversación consume ~500-1000 tokens de gpt-4o-mini (historial + respuesta). Con 20 conversaciones/día de 5 turnos promedio: ~100K tokens/día → **~$1.50/mes adicional**. Total IA con chatbot: **< $3/mes** a escala de MVP.

---

## Consecuencias y Compromisos

**Un solo lenguaje en todo el stack (TypeScript):** frontend, backend, workers y tipos compartidos. Elimina el cambio de contexto entre Python y JavaScript que habría existido con el stack original.

**Fastify en vez de Supabase como único backend:** PostgREST no orquesta transacciones complejas ni colas. Fastify es la capa de lógica de negocio; Supabase es la capa de datos.

**Sin Redis en el MVP:** `pg_cron` dentro de Supabase maneja los jobs de embeddings y de CSV import. BullMQ + Redis queda como upgrade explícito cuando el volumen justifique la complejidad operativa adicional.

**RAG y chatbot desde el MVP:** la infraestructura de vectores y embeddings se construye ahora. El chatbot reutiliza esa infraestructura sin costo estructural adicional. Costo total de IA estimado: **< $3/mes** a escala de MVP (búsquedas + chatbot).

**Deuda técnica planificada:**
- Auth de usuario (Supabase Auth + RLS por `auth.uid()`) no está en el MVP pero el sistema está diseñado para recibirla sin refactorización
- Notificaciones automáticas (WebSockets o Supabase Realtime push) quedan para Fase 2
- El scoring determinista (trigger PL/pgSQL) puede evolucionar a scoring ML en Fase 3 reemplazando solo la función SQL, sin tocar la entidad `CreatorScore`
