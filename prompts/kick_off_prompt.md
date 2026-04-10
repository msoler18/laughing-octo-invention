# Prompt: Kick-off — Sistema de Gestión de Campañas de Crowdposting

## Metadata

| Campo | Valor |
|---|---|
| Versión | v1.0 |
| Fecha | 2026-04-10 |
| Estado | Ejecutado |
| Autor | RealUp |
| Output generado | `docs/ADR-001-sistema-gestion-campanas-crowdposting.md` |

---

## Agentes utilizados

| Agente | Rol en este prompt |
|---|---|
| `backend-architect` | Schema de datos, estrategia de parseo, estructura para RAG |
| `trend-researcher` | Benchmarking de plataformas del mercado |
| `growth-hacker` | Análisis de cuellos de botella operativos y automatizaciones |
| `ux-researcher` | Jobs-to-be-done, flujos críticos, criterios de usabilidad |
| `ai-engineer` | Roadmap de IA/LLM/RAG por fases |
| `instagram-curator` | Métricas de creadores, ciclo de vida, taxonomía de categorías |
| `rapid-prototype` | Scope del MVP con priorización MoSCoW |
| `experiment-tracker` | Hipótesis a validar, gates de adopción, métricas de producto |
| `project-shipper` | Plan de rollout, migración de datos, checklist de ship-readiness |
| `feedback-synthesizer` | Consolidación de todos los hallazgos en el ADR final |

---

## Prompt

```xml
<context>

En RealUp operamos campañas de influencer marketing a escala usando nuestro modelo de
Crowdposting: en lugar de apostar por uno o dos influencers grandes, activamos a cientos
o miles de micro y nano creadores al mismo tiempo para marcas como Google, Amazon y
Coca-Cola. El resultado es más autenticidad, más alcance y mejores resultados.

Para que eso funcione, necesitamos procesos y herramientas que nos permitan gestionar a
todos esos creadores de forma eficiente. Hoy parte de ese proceso es manual, y aquí es
donde entras tú.

</context>

<task>

- Construir un MVP de herramienta interna que ayude al equipo a gestionar creadores dentro
  de una campaña de Crowdposting. Hoy lo hacemos en Google Sheets: una fila por creador,
  columnas para métricas, y el estado de cada uno actualizado a mano. Cuando la campaña
  tiene 200+ creadores, ese proceso se vuelve caótico — se pierden actualizaciones, es
  difícil filtrar, y no hay visibilidad en tiempo real del progreso.

- Debes entender la estructura de la data aquí: data/influencer_data_colombia.csv para
  tener un panorama claro y revisar con el subagente backend-architect cual es la mejor
  forma de parsear la información para tenerla sanitizada, limpia y fácil de implementar
  un framework como RAG así como aplicar procesos eficientes de data mining. Es un ejemplo
  del dataset real con el que debe trabajar la app — incluye nombre, Instagram, seguidores,
  engagement rate y categoría de cada creador.

- Usa nuestros sub-agentes trend-researcher, content-creator, growth-hacker, twitter-engager,
  instagram-curator, rapid-prototype, experiment-tracker, project-shipper para hacer un
  benchmarking. Luego nuestro feedback-synthesizer debería crear un ADR documentando de
  forma limpia cuál sería el roadmap para desarrollar un producto funcional, que pueda
  escalar y que sea fácil de gestionar. 'User-friendly'.

- Tomando en consideración las capacidades agénticas que usaremos en el punto anterior,
  dentro del mismo ADR, vamos a documentar cuáles serían las funcionalidades que tendría
  el MVP así como propuestas que nos permitan ir más allá y tener un producto apalancado
  con IA, LLM y RAG que nos permita mejorar la eficiencia y automatizar los procesos de
  forma limpia y sin cuellos de botella.

</task>

<constrains>

- Aún no precisamos las tecnologías. Solo quiero establecer el ADR con el MVP, lo evaluamos
  y después tomamos las decisiones correspondientes a las tecnologías a usar.

</constrains>
```

---

## Notas de ejecución

- El `feedback-synthesizer` consolidó los outputs de los 9 agentes en un único ADR coherente.
- El dataset real tiene un typo en el header: `engagment_rate` (falta la `e`). Documentado en el ADR como parte de la estrategia de sanitización.

---

## Resultado

El prompt generó el ADR-001 que define:
- 3 entidades del sistema (Creator, Campaign, CampaignCreator)
- 9 estados del ciclo de vida de un creador en campaña
- 4 pantallas mínimas del MVP
- Roadmap en 3 fases: Control Operativo → IA y Automatización → Plataforma Inteligente
- Gates concretos para pasar de Fase 1 a Fase 2
- Plan de lanzamiento de 6 semanas con protocolo de rollback

---

## Revisión v1.1 — 2026-04-10

### Cambios al MVP

Cuatro funcionalidades fueron movidas de "Won't Have" al MVP tras revisión del equipo:

| Funcionalidad | Prioridad en v1.1 | Notas |
|---|---|---|
| Métricas de performance de posts | Should Have | Entrada manual (impresiones, alcance, saves). Sin integración API. |
| Scoring automático de creadores | Should Have | Fórmula determinista ponderada sobre campos ya calculados. No requiere ML. |
| Historial de cambios / audit log | Must Have | Registro inmutable de cada cambio. Entidad `AuditLog` separada. |
| Búsqueda por lenguaje natural | Must Have | LLM interpreta query libre → filtros estructurados. No RAG, no vectorización. |

### Implicación sobre IA en Fase 1

La búsqueda por lenguaje natural introduce un LLM en el MVP, pero con rol acotado: únicamente traduce consultas libres a filtros estructurados. No hay generación de contenido ni vectorización en esta fase.

**Próximo paso:** ADR-002 — Decisión de stack tecnológico.
