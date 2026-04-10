# Roadmap MVP — Sistema de Gestión de Campañas de Crowdposting

## Metadata

| Campo | Valor |
|---|---|
| Versión | v1.0 |
| Fecha | 2026-04-10 |
| Estado | En planificación |
| Depende de | ADR-001 v1.3 · ADR-002 v1.1 |
| Stack | Next.js · Fastify · Supabase · Drizzle · pgvector · Vercel AI SDK |

---

## Criterio de done del MVP

> El equipo puede gestionar una campaña completa de 200+ creadores sin salir de la herramienta y sin volver a Google Sheets como fuente de verdad.

---

## Estructura del roadmap

6 semanas · 8 milestones · ~60 tareas de desarrollo

| Milestone | Semana | Foco |
|---|---|---|
| M0 — Proyecto base | 1 | Infraestructura, tooling, schema |
| M1 — Capa de datos | 1–2 | API CRUD, migraciones, CSV import |
| M2 — Frontend base | 2 | 4 pantallas, layout, navegación |
| M3 — Ciclo de vida | 2–3 | Estados, audit log, pipeline view |
| M4 — RAG Search | 3 | Embeddings, búsqueda semántica |
| M5 — Scoring + Métricas | 3–4 | Score automático, métricas de post |
| M6 — Chatbot | 4 | Asistente conversacional |
| M7 — QA + Rollout | 5–6 | Tests, polish, migración de datos |

---

## M0 — Proyecto base

**Objetivo:** Repositorio con todo el tooling configurado y esquema de base de datos en producción.

### Infraestructura

- [ ] **M0-01** Inicializar repo Next.js con App Router y Turbopack (`create-next-app --turbopack`)
- [ ] **M0-02** Configurar Biome como linter/formatter (reemplaza ESLint + Prettier); agregar hook pre-commit
- [ ] **M0-03** Inicializar proyecto Fastify con TypeScript en `/server`; estructura `src/routes`, `src/plugins`, `src/schemas`
- [ ] **M0-04** Configurar `@fastify/swagger` + `@fastify/swagger-ui`; exponer `/docs` en desarrollo
- [ ] **M0-05** Configurar proyecto Supabase (free tier); habilitar extensión `pgvector`
- [ ] **M0-06** Configurar Drizzle ORM + `drizzle-kit`; primera migración vacía confirmando conectividad
- [ ] **M0-07** Configurar `pg_cron` en Supabase: habilitar extensión, permisos de ejecución
- [ ] **M0-08** GitHub Actions: pipeline CI con `biome check`, `vitest run`, `tsc --noEmit`

### Schema de base de datos

- [ ] **M0-09** Migración: tabla `creators` con todos los campos definidos en ADR-001 (identidad, métricas, calculados, calidad, vectorización)
- [ ] **M0-10** Migración: tabla `campaigns` (name, brand, description, dates, brief_text, status, target_creator_count)
- [ ] **M0-11** Migración: tabla `campaign_creators` (pivot) con assignment_status enum (9 estados), post_url, notes, timestamps por estado, campos de métricas de post
- [ ] **M0-12** Migración: tabla `audit_log` inmutable con entity_type, entity_id, action, field_name, old_value, new_value, performed_by, performed_at, session_context
- [ ] **M0-13** Migración: tabla `creator_scores` con score, pesos por variable, calculated_at, score_version
- [ ] **M0-14** Migración: tabla `creator_embeddings` con vector(512), source_text, model_id
- [ ] **M0-15** Migración: índice HNSW sobre `creator_embeddings.embedding` (`vector_cosine_ops`, m=16, ef_construction=64)
- [ ] **M0-16** Migración: tabla `import_jobs` (id, filename, status: queued|processing|done|failed, created_at, completed_at, error_log JSONB)
- [ ] **M0-17** Migración: tabla `categories` + tabla pivot `creator_categories` con is_primary; seed de taxonomía base (7 categorías, subcategorías)
- [ ] **M0-18** Trigger PL/pgSQL: `recalculate_creator_score` — se dispara on UPDATE de engagement_rate, consistency_score, campaigns_participated en `creators`; escribe en `creator_scores`

### Testing setup

- [ ] **M0-19** Configurar Vitest con `vitest.config.ts` independiente de `next.config.ts`
- [ ] **M0-20** Configurar MSW para mocking de API en tests de componentes
- [ ] **M0-21** Configurar Playwright para tests E2E; smoke test de que `/` responde 200

---

## M1 — Capa de datos (API)

**Objetivo:** Todos los endpoints CRUD disponibles y documentados en Swagger. Pipeline CSV operativo.

### Creators API

- [ ] **M1-01** `GET /api/v1/creators` — listado paginado con filtros (city, tier, category, engagement_quality, followers_min/max); Zod para validación de query params
- [ ] **M1-02** `GET /api/v1/creators/:id` — perfil completo con score y estado de embedding
- [ ] **M1-03** `POST /api/v1/creators` — creación con validación Zod; escribe en `audit_log` en misma transacción Drizzle
- [ ] **M1-04** `PUT /api/v1/creators/:id` — actualización parcial; detecta campos que invalidan embedding (full_name, bio_text, city, category, creator_tier, engagement_quality) y marca `embedding_updated_at = NULL` para requeue
- [ ] **M1-05** `DELETE /api/v1/creators/:id` — soft delete; escribe en `audit_log`

### Campaigns API

- [ ] **M1-06** `GET /api/v1/campaigns` — listado con estado y contadores por estado del ciclo de vida
- [ ] **M1-07** `GET /api/v1/campaigns/:id` — detalle completo con asignaciones y pipeline stats
- [ ] **M1-08** `POST /api/v1/campaigns` — creación; valida fechas coherentes
- [ ] **M1-09** `PUT /api/v1/campaigns/:id` — actualización; no permite editar si status = closed
- [ ] **M1-10** `POST /api/v1/campaigns/:id/creators` — asignar creadores (bulk); inserta en `campaign_creators`; previene duplicados

### Campaign lifecycle API

- [ ] **M1-11** `PATCH /api/v1/campaigns/:id/creators/:creatorId/status` — cambiar estado del creador en campaña; valida transición válida; escribe `audit_log` en misma transacción; devuelve pipeline stats actualizados
- [ ] **M1-12** `PATCH /api/v1/campaigns/:id/creators/:creatorId/post-url` — registrar URL del post; valida formato URL
- [ ] **M1-13** `PATCH /api/v1/campaigns/:id/creators/:creatorId/metrics` — registrar métricas de post (impressions, reach, saves, likes, comments); escribe metrics_entered_by y metrics_entered_at
- [ ] **M1-14** `GET /api/v1/campaigns/:id/export` — devuelve CSV de la campaña completa (nombre, handle, estado, post_url, métricas, score)

### CSV Import pipeline

- [ ] **M1-15** `POST /api/v1/import/creators` — recibe archivo CSV; crea registro en `import_jobs` con status=queued; devuelve job_id inmediatamente (async, no bloquea)
- [ ] **M1-16** Worker de importación (invocado por pg_cron cada 2 min): lee `import_jobs` con status=queued; procesa el CSV en 5 fases: (1) parse, (2) sanitize (normalizar followers, engagment_rate typo, handles), (3) validate por fila con Zod, (4) upsert en `creators`, (5) actualizar job con resultado y error_log si hay filas rechazadas
- [ ] **M1-17** `GET /api/v1/import/:jobId` — estado del job de importación (para polling desde el frontend)

### Audit log API

- [ ] **M1-18** `GET /api/v1/creators/:id/audit` — historial de cambios de un creador, paginado, ordenado por performed_at DESC
- [ ] **M1-19** `GET /api/v1/campaigns/:id/audit` — historial de cambios de una campaña

---

## M2 — Frontend base

**Objetivo:** Las 4 pantallas del MVP navegables con datos reales. Layout y navegación funcionales.

### Layout y navegación

- [ ] **M2-01** Layout raíz (`app/layout.tsx`): sidebar fijo, topbar con nombre de campaña activa, área de contenido scrollable
- [ ] **M2-02** Sidebar con navegación: Creators, Campaigns, links activos resaltados
- [ ] **M2-03** Configurar TanStack Query (`QueryClientProvider`) en layout cliente
- [ ] **M2-04** Configurar shadcn/ui: instalar componentes base (DataTable, Dialog, Badge, Tooltip, Sheet)

### /creators — Directorio (CSR)

- [ ] **M2-05** Página `/creators`: Client Component, fetch con TanStack Query a `GET /api/v1/creators`
- [ ] **M2-06** DataTable: columnas (avatar, nombre, handle, seguidores, engagement, categoría, score, estado); sorting por columna
- [ ] **M2-07** Filtros laterales: categoría (multi-select), ciudad, rango de followers, engagement_quality; aplican como query params
- [ ] **M2-08** Paginación: server-side, controles prev/next con contador de resultados
- [ ] **M2-09** Estado vacío, estado de carga (skeleton rows), estado de error
- [ ] **M2-10** Botón "Importar CSV": abre dialog con file picker; llama `POST /api/v1/import/creators`; polling del job_id hasta done/failed

### /creators/new + /creators/[id]/edit — Formulario (Server Component + Client)

- [ ] **M2-11** Server Component: fetch del creador por ID (edit) o página vacía (new)
- [ ] **M2-12** Formulario controlado con react-hook-form + Zod: todos los campos de Creator; validación inline
- [ ] **M2-13** Submit via Server Action: POST o PUT según contexto; redirect a `/creators` con toast de éxito
- [ ] **M2-14** Sección "Historial de cambios": lista del audit log del creador (últimos 20 eventos)

### /campaigns — Lista de campañas (Server Component + Streaming)

- [ ] **M2-15** Server Component con `cache: 'no-store'`; Streaming por sección con Suspense
- [ ] **M2-16** Tarjeta por campaña: nombre, marca, estado, fechas, contador de creadores por estado
- [ ] **M2-17** Botón "Nueva campaña": dialog con formulario de creación (nombre, marca, fechas, brief)

### /campaigns/[id] — Vista de campaña y kanban (CSR)

- [ ] **M2-18** Client Component; fetch de campaña completa con TanStack Query
- [ ] **M2-19** Header de campaña: nombre, marca, fechas, estado; pipeline stats (9 contadores + barra de progreso)
- [ ] **M2-20** Tabla de asignaciones: creador, estado (dropdown), post_url (inline edit), notas, score, métricas
- [ ] **M2-21** Vista kanban: columnas por estado, tarjetas arrastrables; drag-and-drop actualiza estado con optimistic update
- [ ] **M2-22** Toggle tabla / kanban: estado en URL param (`?view=table|kanban`)
- [ ] **M2-23** Supabase Realtime: suscripción a `campaign_creators` para actualizar contadores sin reload

---

## M3 — Ciclo de vida y audit log

**Objetivo:** Cambio de estado en < 3 clics. Historial inmutable visible en UI.

- [ ] **M3-01** Máquina de estados: validación de transiciones válidas en el servidor (ej. no se puede pasar de Prospecto directo a Publicado); tabla de transiciones documentada en código
- [ ] **M3-02** Selector de estado en tabla: dropdown con los estados válidos según estado actual; aplica PATCH en < 2 clics
- [ ] **M3-03** Regla de negocio: no se puede mover a "Publicado" sin post_url registrada; error inline en el dropdown
- [ ] **M3-04** Optimistic update: el contador del pipeline se actualiza inmediatamente al cambiar estado; rollback si el servidor devuelve error
- [ ] **M3-05** Panel de audit log en `/campaigns/[id]`: feed lateral con todos los cambios de la campaña (quién, qué, cuándo, valor anterior → nuevo); paginación infinita
- [ ] **M3-06** Audit log en ficha de creador `/creators/[id]/edit`: historial de modificaciones del perfil
- [ ] **M3-07** Indicador "última actualización" en cada fila de la tabla de asignaciones

---

## M4 — RAG Search

**Objetivo:** El usuario escribe en lenguaje natural y obtiene resultados relevantes. Tiempo de respuesta < 2s para corpus de 1.000 creadores.

### Pipeline de embeddings

- [ ] **M4-01** Función `buildEmbeddingSourceText(creator)`: compone el texto estructurado para vectorizar; excluye phone y email via TypeScript `Omit<Creator, 'phone' | 'email'>`
- [ ] **M4-02** Worker de embeddings (invocado por pg_cron cada 5 min): query `SELECT * FROM creators WHERE embedding_updated_at IS NULL LIMIT 50`; llama `text-embedding-3-small` con 512 dims via OpenAI API; upsert en `creator_embeddings`; actualiza `embedding_updated_at`
- [ ] **M4-03** Manejo de errores en pipeline: si OpenAI falla, el creador queda con `embedding_updated_at = NULL` y reintenta en el siguiente ciclo; log de error en `import_jobs` o tabla dedicada
- [ ] **M4-04** Endpoint de estado del pipeline: `GET /api/v1/embeddings/status` — devuelve `{total, vectorized, pending, last_run}`

### Search API

- [ ] **M4-05** `POST /api/v1/search` — endpoint RAG híbrido:
  1. Recibe `{query: string, filters?: object}`
  2. Llama a `gpt-4o-mini` via `generateObject` (Vercel AI SDK) para extraer filtros duros (`city`, `tier`, `followers_min/max`, `engagement_quality`, `category_slugs`)
  3. Ejecuta query SQL con filtros duros para reducir corpus
  4. Genera embedding de la query con `text-embedding-3-small`
  5. Vector search con `<=>` sobre el subconjunto filtrado
  6. Ranking híbrido: `distance * 0.7 + (1 - normalized_score) * 0.3`
  7. Devuelve creadores rankeados con `semantic_score` y `filters_applied` para transparencia

### Search UI

- [ ] **M4-06** Componente `RAGSearch`: input con ícono violeta; placeholder con ejemplo de query
- [ ] **M4-07** Al tipear y enviar: llama `POST /api/v1/search`; muestra chips de filtros extraídos por el LLM debajo del input
- [ ] **M4-08** Cada chip es removible: al eliminar un chip, relanza la búsqueda sin ese filtro
- [ ] **M4-09** Indicador "X creadores encontrados · búsqueda semántica sobre Y resultados" debajo de los chips
- [ ] **M4-10** Fallback graceful si el pipeline de embeddings aún no procesó: muestra resultados solo con filtros duros con aviso "Búsqueda semántica disponible cuando se completen los embeddings"

---

## M5 — Scoring automático y métricas de posts

**Objetivo:** Cada creador tiene un score explicable visible en toda la UI. El ops puede registrar métricas de post sin salir de la vista de campaña.

### Creator Score

- [ ] **M5-01** Trigger PL/pgSQL `recalculate_creator_score`: se dispara on INSERT/UPDATE de `creators` cuando cambian `engagement_rate`, `consistency_score`, `campaigns_participated`, `creator_tier`; fórmula ponderada: engagement 40% + tier 30% + consistencia 20% + historial 10%; escribe en `creator_scores` con `score_version`
- [ ] **M5-02** Badge de score en todas las vistas (DataTable, kanban card, ficha de creador): letra (A/B/C/D) + número; tooltip con el desglose de pesos
- [ ] **M5-03** Sorting por score en DataTable
- [ ] **M5-04** Sección "Score" en ficha de creador: breakdown visual de cada variable y su contribución

### Métricas de posts

- [ ] **M5-05** Formulario inline de métricas en la tabla de asignaciones: click en celda de métricas abre un popover con campos (impresiones, alcance, saves, likes, comentarios); submit via PATCH; registra metrics_entered_by y metrics_entered_at
- [ ] **M5-06** Indicador visual en la fila cuando las métricas fueron ingresadas vs pendientes (estado con icono)
- [ ] **M5-07** Resumen de métricas agregadas en el header de campaña: totales de impresiones, alcance y saves de todos los posts verificados

---

## M6 — Chatbot conversacional

**Objetivo:** El equipo puede hacer preguntas en lenguaje natural sobre creadores y campañas. Respuestas en < 3s en P95.

### Backend del chatbot

- [ ] **M6-01** `POST /api/v1/chat` — endpoint streaming con Vercel AI SDK `streamText`
- [ ] **M6-02** Tool `searchCreators`: ejecuta el flujo RAG híbrido de M4-05; devuelve lista de creadores con score
- [ ] **M6-03** Tool `queryCampaign`: ejecuta SQL sobre `campaign_creators` para responder preguntas de estado ("¿quiénes aún no publicaron?", "¿cuántos están en brief?")
- [ ] **M6-04** Tool `findSimilarCreators`: dado un `creator_id`, usa su embedding para buscar los N más cercanos en `creator_embeddings` con `<=>` (distancia coseno); filtra por estado activo
- [ ] **M6-05** Prompt de sistema: define el contexto del agente, lista de capabilities, restricciones (no inventa datos, cita la fuente, no accede a phone/email)
- [ ] **M6-06** Manejo de rate limit: si gpt-4o-mini está degradado, devuelve error 503 con retry-after; el cliente muestra aviso sin romper la UI

### Chat UI

- [ ] **M6-07** Componente `ChatPanel`: panel lateral colapsable (toggle con shortcut); usa `useChat` de Vercel AI SDK
- [ ] **M6-08** Renderizado de mensajes: burbujas usuario/asistente; tool calls mostrados como cards violeta con nombre de la herramienta invocada y parámetros compactos
- [ ] **M6-09** Mini-cards de resultados inline: cuando `searchCreators` o `findSimilarCreators` devuelven creadores, se muestran como cards compactas con avatar, nombre, handle y score — sin salir del chat
- [ ] **M6-10** Streaming de respuesta: el texto aparece token a token; indicador de "pensando" con 3 puntos animados mientras se ejecuta un tool call
- [ ] **M6-11** Input con sugerencias de queries de ejemplo al abrir por primera vez

---

## M7 — QA, polish y rollout

**Objetivo:** La herramienta está lista para ser la fuente de verdad de una campaña real.

### Testing

- [ ] **M7-01** Vitest: tests unitarios de `buildEmbeddingSourceText` — confirma que phone y email no aparecen en el output
- [ ] **M7-02** Vitest: tests de la máquina de estados — todas las transiciones válidas pasan, las inválidas devuelven error con mensaje correcto
- [ ] **M7-03** Vitest: tests del CSV import worker — filas con `engagment_rate` (typo), followers como "1,317", categorías con "&"; todos normalizados correctamente
- [ ] **M7-04** Vitest + MSW: tests de componentes React — formulario de creador valida campos requeridos, muestra errores inline, no hace submit con datos inválidos
- [ ] **M7-05** pgTAP: tests de DB — trigger de score se dispara con los campos correctos; audit_log no permite UPDATE ni DELETE; índice HNSW existe
- [ ] **M7-06** Playwright E2E: flujo completo "crear campaña → asignar creador → cambiar estado 3 veces → registrar post_url → registrar métricas" sin errores
- [ ] **M7-07** Playwright E2E: búsqueda RAG devuelve resultados con chips de filtros extraídos; eliminar chip relanza búsqueda

### Estados de UI y error handling

- [ ] **M7-08** Estado vacío en todas las listas (cero creadores, cero campañas, cero asignaciones): mensaje + CTA
- [ ] **M7-09** Skeleton loaders en DataTable, kanban y pipeline stats (sin layout shift)
- [ ] **M7-10** Toast de confirmación en todas las acciones destructivas o de cambio de estado
- [ ] **M7-11** Error boundary global: captura errores inesperados del cliente sin romper la app; botón "reintentar"
- [ ] **M7-12** Manejo de errores de red: TanStack Query retry con backoff; mensaje al usuario si falla después de 3 intentos

### Migración y rollout

- [ ] **M7-13** Script de migración del CSV real (`data/influencer_data_colombia.csv`): corre el pipeline de importación con los 24 creadores reales; confirma 0 filas rechazadas o documenta las excepciones
- [ ] **M7-14** Smoke test post-deploy: verificar que todos los endpoints de `/api/v1/` responden, que pgvector está habilitado, que pg_cron tiene los jobs configurados
- [ ] **M7-15** Onboarding del equipo: sesión de 30 min con el ops team; registrar feedback de la primera semana
- [ ] **M7-16** Monitoreo semana 1: revisar `audit_log` para confirmar que el equipo está cambiando estados en la herramienta y no en Sheets; medir Sheet abandonment rate

---

## Dependencias críticas entre milestones

```
M0 (schema + tooling)
  └── M1 (API)
        ├── M2 (frontend base)
        │     └── M3 (lifecycle UI)
        ├── M3 (lifecycle API) ←── paralelo con M2
        ├── M4 (RAG) ←── puede empezar en paralelo con M2
        ├── M5 (scoring) ←── trigger de score en M0-18; UI en M2
        └── M6 (chatbot) ←── depende de M4 (tools reutilizan RAG)
M7 (QA + rollout) ←── depende de M2 + M3 + M4 + M5 + M6
```

---

## Gates para pasar a Fase 2

Los tres deben cumplirse simultáneamente antes de iniciar cualquier tarea de Fase 2:

| Gate | Métrica | Target |
|---|---|---|
| Sheet abandonment | % de ediciones en Sheets vs herramienta | > 85% sostenido 2 semanas |
| Campañas end-to-end | Campañas completas registradas en la herramienta | ≥ 3 |
| Estabilidad | Incidentes críticos de pérdida de datos | 0 en las últimas 4 semanas |

---

## Fuera del alcance del MVP (Won't Have)

- Autenticación y gestión de sesiones (auth)
- Notificaciones automáticas o alertas por inactividad
- Aplicación móvil
- Integración con Instagram API o cualquier API de red social
- Reportes visuales con diseño
- Clasificación automática de categorías con LLM (Fase 2)
- Detección de anomalías automática (Fase 2)
- Scoring contextual por campaña (Fase 2)
