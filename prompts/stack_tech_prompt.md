# Prompt: Stack Tecnológico — Sistema de Gestión de Campañas de Crowdposting

## Metadata

| Campo | Valor |
|---|---|
| Versión | v1.0 |
| Fecha | 2026-04-10 |
| Estado | Ejecutado |
| Autor | RealUp |
| Depende de | `docs/ADR-001-sistema-gestion-campanas-crowdposting.md` |
| Output generado | `docs/ADR-002-stack-tecnologico.md` |

---

## Agentes utilizados

| Agente | Rol en este prompt |
|---|---|
| `frontend-developer` | Evaluar estrategias de renderizado Next.js, Design System con Tailwind + tokens + SASS, hooks limpios con SOLID, Suspense y optimistic updates |
| `backend-architect` | Evaluar Python + Supabase, edge functions, endpoints versionados con OpenAPI/Swagger, TDD en backend |
| `ai-engineer` | Evaluar stack de RAG y vectorización compatible con Supabase, integración con el pipeline asíncrono de embeddings definido en ADR-001 |

---

## Prompt

```
Contexto: Ya contamos con un ADR-001 que define el scope del MVP:
sistema de gestión de campañas de Crowdposting para RealUp.
Incluye 3 entidades (Creator, Campaign, CampaignCreator),
ciclo de vida de 9 estados, búsqueda RAG con vectorización,
audit log, scoring determinista y métricas de performance manual.

Tarea: Desarrollar el ADR de stack tecnológico. Los siguientes
puntos de entrada deben ser revisados, refutados con argumentos
cuando aplique, y restructurados:

Frontend:
- Next.js con SSR por defecto. Evaluar cuándo usar ISR u otras
  estrategias de renderizado según el componente.
- Tailwind CSS como framework base con Design System customizado
  a través de tokens y SASS.
- Vite y Vitest para tests unitarios y de integración (TDD).
- TypeScript con uso de unknown, typeof y ZOD para validar
  interfaces y tipos.
- Suspense y optimistic updates para mejor UX.
- Evitar hooks con mucha lógica. Custom hooks con principios
  SOLID para separación de concerns.

Backend:
- Python + Supabase.
- Edge functions de Next.js y Supabase cuando sea posible.
- Endpoints versionados con OpenAPI y Swagger.
- Código documentado en inglés.
- TDD para el backend.

AI/RAG:
- Stack compatible con Supabase para vectorización.
- Pipeline asíncrono de embeddings.
- Búsqueda semántica con filtros duros previos al vector search.

Los agentes deben refutar cuando sea necesario y proponer
alternativas con argumentos. El output se consolida en ADR-002.
```

---

## Notas de ejecución

- **backend-architect refutó Python:** reemplazado por Fastify + TypeScript. El pipeline de embeddings va a BullMQ (Node.js worker), no a un proceso Python separado.
- **frontend-developer refutó SSR por defecto:** cada pantalla recibe la estrategia correcta (CSR para directorio y kanban, Server Components + Streaming para campañas, Server Components + Client interactivos para formularios).
- **frontend-developer refutó Vite como bundler:** Vitest sí como test runner, Turbopack para bundling. Vite y Next.js son mutuamente excluyentes.
- **ai-engineer propuso Python worker para embeddings** — reconciliado con la decisión de backend-architect: el worker vive en Node.js (BullMQ) para mantener un solo ecosistema.

---

## Resultado

El prompt generó el ADR-002 que define:
- Stack: Next.js (App Router) + Fastify + Supabase + Drizzle ORM + Redis/BullMQ
- Estrategia de renderizado por pantalla (CSR / Server Components / Streaming)
- Design System: Tailwind + SASS (solo tokens) + shadcn/ui
- Testing: Vitest + MSW + Playwright + pgTAP
- IA/RAG: text-embedding-3-small (512 dims) + pgvector HNSW + gpt-4o-mini (Vercel AI SDK)
- Costo IA estimado: < $1/mes para 1.000 creadores y 50 búsquedas/día
- Privacidad: exclusión estructural de phone/email via TypeScript Omit en capa de embeddings

---

---

## Revisión v1.1 — 2026-04-10

### Cambios al stack

| Cambio | Antes | Ahora | Motivo |
|---|---|---|---|
| Workers async | BullMQ + Redis | `pg_cron` dentro de Supabase | Simplifica infra de MVP; Redis no justificado a esta escala |
| Chatbot | No incluido | Agregado al MVP | Infraestructura RAG ya existente; costo adicional < $2/mes |

### Decisiones de infraestructura confirmadas

- Supabase free tier es suficiente para el MVP (~1K creadores, embeddings 512 dims = ~2MB de vectores)
- BullMQ + Redis queda documentado como upgrade explícito para cuando el volumen supere ~500 creadores nuevos/día
- Costo total de IA estimado con chatbot: **< $3/mes**

---

## Siguiente tarea

Generar un Design System en archivo HTML que muestre los
componentes, tokens, colores, fuentes y grid que se usarán
en la herramienta. Es el entregable previo al inicio del desarrollo.
