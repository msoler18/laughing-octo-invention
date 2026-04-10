# ADR-001: Sistema Interno de Gestión de Campañas de Crowdposting — RealUp

## Metadata

- Fecha: 2026-04-10
- Revisión: 2026-04-10 (v1.2 — RAG y vectorización adelantados al MVP)
- Estado: Propuesto
- Autores: Equipo de Producto RealUp
- Revisores: Por definir

---

## Contexto

RealUp opera un modelo de Crowdposting: activa cientos de micro y nano creadores simultáneamente para marcas como Google, Amazon y Coca-Cola. A diferencia de las agencias de influencer marketing tradicionales que trabajan con 10 a 50 perfiles grandes, RealUp coordina entre 200 y 1.000 creadores por campaña.

Hoy, toda la operación vive en Google Sheets. Cada fila es un creador. Cada columna es un campo que alguien actualizó manualmente, en algún momento, sin garantía de que siga siendo válido.

Este modelo funcionó mientras la escala era manejable. Ya no lo es.

---

## El Problema

El problema no es que Google Sheets sea una mala herramienta. El problema es que Google Sheets no puede sostener las garantías operativas que RealUp necesita a escala de 200+ creadores por campaña.

Los síntomas concretos, ordenados por impacto diario:

**1. Pérdida de actualizaciones de estado (crítico, cotidiano).** No existe sistema de notificaciones. El seguimiento es completamente reactivo: el campaign manager revisa fila por fila para saber si algo cambió. Esto consume tiempo no cuantificado y genera ansiedad operativa real: terminar el día sin saber si algo se escapó.

**2. Recolección de evidencias dispersa (alto).** Los campaign managers persiguen individualmente a cada creador para obtener la URL del post publicado. No hay un canal estructurado de entrega. No hay trazabilidad de quién envió qué y cuándo.

**3. Consolidación manual del reporte final (alto).** Construir el reporte post-campaña toma entre 6 y 10 horas. Es trabajo que puede automatizarse casi en su totalidad dado que los datos ya existen, solo están dispersos y sin estructura.

**4. Onboarding de creadores sin estándar (moderado).** Cada nuevo creador se ingresa de forma distinta según quién lo registre. Los datos de calidad son inconsistentes: campos faltantes, tipos de dato incorrectos (teléfonos almacenados como número, URLs completas en lugar de handles, engagement rates fuera de rango).

**5. Filtrado ineficiente (alto, cotidiano).** Filtrar creadores por categoría, ciudad, tier o engagement requiere combinar filtros de Sheets que no fueron diseñados para consultas operativas frecuentes. No hay vista de pipeline. No hay contadores en tiempo real.

**6. Edición concurrente sin control (alto).** Dos personas pueden editar la misma celda simultáneamente sin advertencia. No existe historial confiable de cambios ni posibilidad de revertir a un estado anterior conocido.

El mercado de herramientas existentes (Grin, Aspire, Upfluence, Modash) no resuelve esto. Están optimizadas para gestionar 10 a 50 influencers grandes, no para la coordinación operativa de 200 a 1.000 micro y nano creadores. Las reviews en G2 y Capterra confirman que los equipos de operaciones siguen recurriendo a Sheets precisamente porque les da más control sobre el tracking de estado a escala que cualquier herramienta comercial disponible. El diferenciador real de una herramienta interna es que puede diseñarse exactamente para el flujo del equipo, sin las capas de features que nadie usa.

---

## Decisión

Se construirá una herramienta interna de gestión de campañas de Crowdposting diseñada específicamente para el flujo operativo de RealUp.

Esta herramienta no reemplaza Google Sheets con otro Sheets. Introduce estructura, estado y trazabilidad donde hoy no existe ninguna. El producto se construirá en fases: un MVP funcional que resuelve los problemas críticos de seguimiento, seguido de automatización progresiva y, eventualmente, capacidades de inteligencia artificial aplicada a la operación.

La decisión de stack tecnológico se documentará en un ADR separado.

---

## Funcionalidades del MVP (MoSCoW)

### Must Have — Sin esto el MVP no cumple su propósito

- CRUD completo de creadores con formulario estructurado y validación de campos críticos
- Importación de creadores desde CSV con validación en ingesta y reporte de errores por fila
- Creación de campañas y asignación de creadores a campañas
- Cambio de estado de un creador en campaña en menos de 3 clics, con historial automático registrado
- Registro de URL del post publicado por creador
- Filtros por categoría, ciudad, rango de followers y engagement rate
- **Búsqueda por lenguaje natural con RAG:** el usuario escribe en lenguaje libre ("fitness en Medellín con más de 5K seguidores") y el sistema combina búsqueda semántica sobre el catálogo vectorizado con filtros duros estructurados. Los dropdowns son opcionales, no obligatorios.
- **Historial de cambios / audit log:** cada modificación de estado o dato de un creador queda registrada con quién la hizo, cuándo y cuál fue el valor anterior. Inmutable una vez registrada.
- Vista de campaña con tabla de asignaciones, estado actual, post URL y notas
- Vista de pipeline con contadores en tiempo real por etapa
- Progreso de campaña visible sin scroll

### Should Have — Alto valor, se incluye si el tiempo lo permite

- Buscador de creadores por nombre con tolerancia a errores tipográficos
- Contadores actualizados en tiempo real al cambiar estados
- Notas por asignación (relación creador-campaña)
- Exportación de campaña a CSV en una sola acción para reporte
- **Métricas de performance de posts:** registro manual de impresiones, alcance y saves por post. Entrada de datos por el ops team; sin integración con API en esta fase.
- **Scoring automático de creadores:** puntuación calculada (0-100) por creador basada en engagement_quality, consistency_score, historial de campañas completadas y tier. Se recalcula automáticamente cuando estos campos cambian. Es explicable: la interfaz muestra qué variables pesaron en el score.

### Could Have — Deseable en iteraciones cortas post-MVP

- Marca de "última actualización" siempre visible por registro
- Incorporación de nuevo creador a campaña activa sin fricción
- Campos adicionales nullable capturados desde el inicio: bio, handle de TikTok, tarifa, método de pago, consent GDPR, notas libres

### Won't Have en MVP — Explícitamente fuera del alcance

- Login y autenticación con gestión de sesiones
- Notificaciones automáticas o alertas por inactividad
- Aplicación móvil
- Integración con Instagram API o cualquier API de red social para extracción automática de métricas
- Reportes visuales con diseño

---

## Modelo de Datos (sin tecnología)

### Entidad: Creator

Representa el perfil permanente de un creador, independiente de cualquier campaña.

**Campos de identidad:**
- `instagram_handle` — identificador único, extraído del URL, no la URL completa
- `full_name`
- `phone` — almacenado como texto, no como número
- `email`
- `country`, `city`

**Métricas de alcance:**
- `followers_count` — entero
- `engagement_rate` — decimal con dos cifras (ej. 3.45)
- `avg_likes_last_10` — promedio de likes en los últimos 10 posts, nullable
- `reach_rate` — alcance sobre followers; rango saludable 15-25%

**Campos calculados y materializados:**
- `creator_tier` — calculado desde followers_count:
  - nano: < 10K
  - micro: 10K – 50K
  - mid: 50K – 100K
  - macro: 100K – 500K
  - mega: > 500K
- `engagement_quality` — derivado del engagement_rate: zero, low, average, high, viral

**Señales de calidad:**
- `consistency_score` — frecuencia de publicación en los últimos 90 días
- `audience_quality_score` — porcentaje de audiencia real vs bots
- `data_quality_flags` — estructura flexible para centralizar problemas detectados en ingesta sin bloquear el registro

**Campos de contexto del creador:**
- `bio_text`, `content_language`, `dominant_format` (Reels, carrusel, foto)
- `peak_activity_hours`, `tiktok_handle`
- `brand_mentions_last_30_posts`, `bio_keywords`

**Campos comerciales y operativos (nullable desde MVP):**
- `content_rate_usd`, `payment_method`
- `onboarding_status`, `campaigns_participated`
- `notes`, `tags[]`, `gdpr_consent_at`

**Vectorización (RAG desde MVP):**
- `embedding_updated_at` — timestamp del último embedding generado. Si es `NULL`, el creador aún no ha sido vectorizado.
- El vector en sí se almacena en una entidad separada `CreatorEmbedding` para no impactar las queries relacionales ordinarias.

**Categorización:** Relación M:N con entidad `Category` mediante tabla pivot `creator_categories` con campo `is_primary`. Taxonomía de dos niveles + campo de subnicho libre.

Taxonomía base:
| Categoría | Subcategorías |
|---|---|
| Estilo de vida | Fitness, Bienestar, Moda, Belleza |
| Gastronomía | Restaurantes, Recetas, Bebidas |
| Entretenimiento | Música, Humor, Gaming |
| Viajes | Nacional, Internacional, Ciudad |
| Tecnología | Gadgets, Apps, Productividad |
| Negocios | Emprendimiento, Finanzas |
| Familia | Maternidad, Mascotas, Educación |

**Señales de alerta que la herramienta debe registrar:**
- Engagement rate = 0%
- Engagement rate > 15% en cuentas con más de 10K followers (compra de interacciones)
- Ratio comentarios/likes < 1:50
- Crecimiento de followers > 20% en 30 días sin evento viral identificable
- Contenido de marcas competidoras en los últimos 60 días
- Sin publicaciones en los últimos 45 días

### Entidad: Campaign

- `name`, `brand`, `description`
- `start_date`, `end_date`
- `brief_text`
- `status` — draft, active, closed
- `target_creator_count`

### Entidad: CampaignCreator (tabla pivot)

Unidad operativa central del sistema.

- `assignment_status` — ver ciclo de vida
- `post_url` — URL del contenido publicado
- `notes` — notas libres por asignación
- `status_updated_at` — timestamp del último cambio de estado
- `assigned_at`, `confirmed_at`, `published_at`, `verified_at`, `paid_at`

**Métricas de performance del post (ingreso manual en MVP):**
- `impressions` — impresiones totales del post
- `reach` — alcance único del post
- `saves` — número de saves
- `likes`, `comments` — métricas básicas de interacción
- `metrics_entered_by` — quién ingresó las métricas (trazabilidad)
- `metrics_entered_at` — cuándo se ingresaron

### Entidad: AuditLog

Registro inmutable de todos los cambios en el sistema. Cada evento genera una entrada; ninguna entrada puede modificarse ni eliminarse.

- `id` — UUID, PK
- `entity_type` — `'creator' | 'campaign' | 'campaign_creator'`
- `entity_id` — UUID del registro afectado
- `action` — `'created' | 'updated' | 'status_changed' | 'deleted'`
- `field_name` — campo que cambió (nullable si es creación o borrado)
- `old_value` — valor anterior en texto (nullable)
- `new_value` — nuevo valor en texto
- `performed_by` — identificador del usuario que realizó el cambio
- `performed_at` — `TIMESTAMPTZ NOT NULL DEFAULT now()`
- `session_context` — metadata adicional opcional (IP, navegador) para auditoría de seguridad

### Entidad: CreatorScore

Score calculado por creador, separado del perfil para facilitar su recálculo sin tocar la tabla principal.

- `creator_id` — FK → creators(id)
- `score` — `NUMERIC(5,2)` de 0 a 100
- `engagement_weight` — contribución del engagement_quality al score
- `consistency_weight` — contribución del consistency_score
- `campaign_history_weight` — contribución del historial de campañas
- `tier_weight` — contribución del tier
- `calculated_at` — cuándo se calculó
- `score_version` — versión del algoritmo de scoring (para poder comparar scores calculados con versiones distintas)

### Entidad: CreatorEmbedding

Almacena el vector semántico de cada creador para búsqueda RAG. Separada de `creators` para no afectar queries relacionales y poder reindexar de forma independiente.

- `creator_id` — FK → creators(id), UNIQUE
- `embedding` — vector de alta dimensión (dimensión determinada por el modelo de embeddings elegido en ADR-002)
- `source_text` — el texto compuesto que se pasó al modelo para generar el vector, para auditoría y reproducibilidad:
  ```
  Creator: {full_name}
  Instagram: @{instagram_handle}
  Location: {city}, {country}
  Categories: {category_labels}
  Tier: {creator_tier}
  Followers: {followers_count}
  Engagement Rate: {engagement_rate}%
  Engagement Quality: {engagement_quality}
  Bio: {bio_text}
  ```
- `model_id` — identificador del modelo de embeddings usado (para detectar embeddings generados con modelos distintos)
- `created_at`, `updated_at`

**Cuándo regenerar el embedding:**
- Cambio en `full_name`, `bio_text`, `category`, `city`, `creator_tier` o `engagement_quality`
- Nunca por cambio de `updated_at` solo
- Regeneración en pipeline asíncrono (batch), nunca en tiempo de consulta

**Flujo de búsqueda RAG en el MVP:**

```
Query en lenguaje natural
        ↓
LLM extrae filtros duros (ciudad, tier, followers_min, etc.)
        ↓
Filtros duros reducen el espacio de búsqueda en la DB relacional
        ↓
Query semántica sobre los embeddings del subconjunto filtrado
        ↓
Ranking por similitud semántica
        ↓
Resultados ordenados presentados al usuario
```

Los filtros duros siempre se aplican primero para limitar el corpus semántico. El vector search opera sobre el subconjunto ya filtrado, no sobre todo el catálogo, lo que garantiza performance incluso a escala.

**Metadata que viaja junto al vector (para filtros pre-búsqueda):**
- `creator_tier`, `engagement_quality`, `country`, `city`, `category_slugs[]`, `followers_count`, `engagement_rate`, `is_active`, `score`

---

## Ciclo de Vida de un Creador en Campaña

```
Prospecto → Contactado → Confirmado → En brief → Contenido enviado → Aprobado → Publicado → Verificado → Pagado → Banco de talento
```

**Puntos de mayor riesgo operativo:**
- **Confirmado → En brief:** Dropout más alto del ciclo. Requiere seguimiento activo.
- **Publicado → Verificado:** Riesgo de eliminación del post antes del registro. Requiere verificación rápida.

**Regla de integridad:** Un creador no puede estar en dos estados simultáneamente dentro de la misma campaña.

---

## Pantallas Mínimas del MVP

| Ruta | Propósito |
|---|---|
| `/creators` | Tabla paginada del directorio con filtros y búsqueda |
| `/creators/new` + `/creators/[id]/edit` | Formulario de creador (alta y edición) |
| `/campaigns` | Lista de campañas con estado y contadores rápidos |
| `/campaigns/[id]` | Vista de campaña: tabla de asignaciones con selector de estado, post_url y notas |

---

## Roadmap de Evolución

### Fase 1 — MVP: Control Operativo

**Objetivo:** Que el equipo pueda gestionar una campaña completa de 200+ creadores sin salir de la herramienta y sin volver al Sheet.

**Criterio de done:** El equipo utilizó la herramienta durante al menos una campaña real completa sin volver al Sheet como fuente de verdad.

### Fase 2 — IA y Automatización: Reducción de Carga Operativa

**Prerequisito:** Completar los tres gates de adopción definidos. Sin ellos, la Fase 2 no comienza.

**Lo que se construye:**
- Alertas cuando un creador lleva X días sin avanzar de estado
- Formulario de entrega de evidencia estructurado por creador
- Reporte post-campaña autogenerado desde los datos existentes
- Clasificación automática de creadores por categorías con LLM (batch asíncrono)
- Scoring de fit por campaña (0-100) con explicación de variables
- Redacción de outreach personalizado asistida por LLM
- Detección de anomalías en métricas (engagement inflado, crecimiento sospechoso)
- RAG conversacional sobre el catálogo de creadores

### Fase 3 — Plataforma Inteligente: Operación Asistida por IA

**Lo que se construye:**
- Brief como entrada → shortlist con justificación automática → validación humana
- Monitoreo de abandono con sugerencia de reemplazos proactivos
- Narrativa automática del reporte post-campaña (interpretación, no solo datos)
- Modelo de ranking aprendido de señales de calidad de campañas pasadas
- Integración con APIs de redes sociales para detección automática de publicación

---

## Propuestas de IA / LLM / RAG por Fase

### Fase 1 — RAG y vectorización desde el MVP

El MVP incluye RAG y vectorización completa del catálogo de creadores. Esto no es un adelanto experimental: es la base que permite que la búsqueda por lenguaje natural funcione con precisión real y que la Fase 2 no requiera refactorización.

**Vectorización del catálogo:**
- Cada creador recibe un embedding generado a partir de un texto compuesto (nombre, bio, categorías, ciudad, tier, engagement quality). Ver entidad `CreatorEmbedding`.
- La vectorización ocurre en un pipeline asíncrono (batch). No bloquea la ingesta ni las operaciones del día a día.
- Cuando un creador se actualiza, su embedding se regenera en el siguiente ciclo del pipeline.

**Búsqueda RAG en el MVP:**
1. Usuario escribe: *"fitness en Medellín con más de 5K seguidores y engagement alto"*
2. LLM extrae filtros duros: `{city: "Medellín", followers_min: 5000, engagement_quality: ["high", "viral"]}`
3. Filtros duros reducen el corpus en la DB relacional
4. Query semántica sobre los embeddings del subconjunto filtrado
5. Resultados ordenados por similitud semántica y score

Esto resuelve búsquedas que los filtros estructurados solos no pueden: *"creadores con vibe de aventura y outdoor"*, *"perfiles parecidos a @usuario123"*, *"tone of voice informal y cercano"*.

**Lo que NO hace la IA en Fase 1:**
- No genera contenido ni outreach
- No entrena modelos con datos históricos
- No hace clasificación automática de categorías (eso es Fase 2)
- No detecta anomalías automáticamente

**Scoring de creadores en Fase 1:** determinista, no ML. Fórmula ponderada explícita sobre `engagement_quality`, `consistency_score`, `campaigns_participated` y `creator_tier`. Explicable, recalculable, sin caja negra.

**Restricción de privacidad (aplica desde Fase 1):** teléfonos y emails nunca entran en el texto fuente del embedding ni en ningún contexto de prompt. Solo accesibles en capa de aplicación con control de acceso por rol.

### Fase 2 — IA aplicada a operaciones (sobre infraestructura RAG ya existente)

La Fase 2 no construye vectorización desde cero — esa infraestructura ya existe desde el MVP. Agrega inteligencia sobre los datos acumulados.

**Clasificación y enriquecimiento automático:** LLM analiza bio, handle y categorías declaradas para validar o corregir la categorización en la taxonomía de dos niveles. Identifica discrepancias entre la categoría autodeclarada y el contenido real. Ejecución en batch asíncrono.

**Scoring de fit por campaña:** el score de Fase 1 es genérico (calidad del creador en abstracto). En Fase 2, el scoring es contextual: dado un brief de campaña, ¿qué tan bien encaja este creador específicamente? Incorpora historial real de campañas completadas como señal de peso.

**Agente conversacional con refinamiento iterativo:** el usuario puede refinar su búsqueda en múltiples turnos dentro de la misma sesión. *"Ahora filtra solo los que tienen menos de 20K seguidores"*, *"quita los que ya participaron en campañas de esta marca"*. El agente mantiene contexto entre turnos.

**Redacción de outreach personalizado:** dado el brief y el perfil del creador, el LLM genera un mensaje de contacto que suena personalizado. El ops revisa y envía.

**Detección de anomalías:** reglas deterministas primero (engagement rate > 15% en cuentas > 10K, crecimiento > 20% en 30 días sin viral). LLM para casos ambiguos que no disparan las reglas pero presentan patrones sospechosos.

### Fase 3 — IA como capa operativa

El brief es el input. La herramienta produce el shortlist con justificación. El equipo valida.

El modelo de ranking aprende de campañas pasadas: qué combinaciones de creador + brief + marca produjeron los mejores resultados. El reporte post-campaña tiene narrativa generada: no solo "140 de 200 publicaron", sino por qué un segmento superó las expectativas.

---

## Métricas de Éxito

### Métricas de adopción

| Métrica | Target |
|---|---|
| Sheet abandonment rate | < 10% de ediciones en Sheet en semana 6 |
| Tasa de campaña 100% gestionada en herramienta | 80% de campañas activas en semana 6 |
| Time-to-status | Reducción del 40% vs baseline en Sheets |

### Métricas de experiencia del usuario

- Cambiar el estado de un creador: < 10 segundos desde que se localiza
- Vista de progreso de campaña visible sin scroll
- Marca de "última actualización" siempre visible
- Cero pérdidas de datos por edición concurrente en los primeros 30 días

### Gates para pasar a Fase 2 (los tres simultáneamente)

1. Sheet abandonment rate > 85% sostenido durante dos semanas consecutivas
2. Mínimo 3 campañas completas end-to-end registradas en la herramienta
3. Cero incidentes críticos de pérdida de datos en las últimas 4 semanas

---

## Plan de Lanzamiento y Adopción

### Rollout en 6 semanas

| Semana | Modo | Descripción |
|---|---|---|
| 1-2 | Shadow mode | Operación en Sheets + herramienta en paralelo. Identificar discrepancias entre flujo real y flujo modelado. |
| 3 | Piloto controlado | 1-2 campañas nuevas exclusivamente en la herramienta. Sheet no se actualiza para esas campañas. |
| 4-5 | Migración progresiva | Campañas activas se migran una por una con owner asignado. Sheets pasa a ser referencia. |
| 6 | Sheets en solo lectura | La herramienta es la única fuente de verdad. Los Sheets quedan como archivo histórico. |

**Los Sheets originales NO se eliminan hasta completar la semana 6.**

### Criterios de Go/No-Go antes del piloto

- CRUD sin errores bloqueantes en ningún flujo principal
- Datos del piloto coinciden 100% con Sheet al finalizar la semana de shadow
- Al menos 2 personas del equipo de ops pueden operar sin soporte de engineering
- Backup automatizado activo y verificado

### Protocolo de Rollback

- **Trigger:** 2 bugs bloqueantes en < 24 horas, o pérdida de datos confirmada
- **Acción:** ops vuelve al Sheet (habilitar edición), engineering exporta datos desde último backup
- **Ventana de recuperación máxima:** 2 horas

### Checklist de Ship-Readiness

- [ ] Autenticación funcional con cuentas del equipo y permisos por rol
- [ ] Backup diario verificado con restauración probada
- [ ] Runbook de incidentes documentado y accesible
- [ ] Sesión de onboarding grabada
- [ ] Canal de soporte activo con engineer de guardia

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Uso paralelo indefinido de Sheets y herramienta | Alto | Semana 6 Sheets pasa a solo lectura de forma deliberada y comunicada con anticipación |
| La herramienta no refleja cómo trabaja realmente el equipo | Alto | Shadow mode en semanas 1-2 para descubrir discrepancias. El flujo real puede estar en WhatsApp, no en el ADR. |
| Adopción forzada genera rechazo | Medio | El piloto de semana 3 debe usar una campaña donde el campaign manager quiera usar la herramienta, no donde se le instruya. |
| Calidad de datos en la migración | Alto | Script de importación valida en ingesta y reporta errores por fila. Datos malos entran marcados, no rechazados. |
| Pérdida de datos por bug en el MVP | Crítico | Backup diario verificado, timestamp en cada cambio de estado, ventana de rollback de 2 horas como garantía mínima. |
| Construir Fase 2 antes de que el dato sea confiable | Alto | Gates de Fase 2 son bloqueantes. Datos sucios anulan el valor del RAG. |

---

## Lo que explícitamente NO está en el alcance de este ADR

- **Stack tecnológico:** framework, base de datos, proveedor de hosting, modelo de LLM, infraestructura de vectores. Materia del próximo ADR.
- **Diseño de interfaz:** layout, sistema de diseño, componentes visuales.
- **Integraciones externas en Fase 1 y 2:** Instagram API, TikTok API, herramientas de pagos, CRM.
- **App móvil:** la herramienta es web-first y exclusiva para el equipo interno.
- **Módulo de autenticación y permisos avanzados:** mencionado como requisito de ship-readiness, diseño detallado fuera del alcance.
- **Modelo de precios o monetización:** es una herramienta interna.
- **Reportes hacia marcas:** el CSV exportable es un mecanismo interno. El formato y delivery hacia clientes queda fuera de esta versión.

---

## Consecuencias y Compromisos

**Lo que este ADR implica construir:**
Un sistema de tres entidades (Creator, Campaign, CampaignCreator) con lógica de estados, campos calculados materializados desde el día uno, y una interfaz de cuatro pantallas que cubren el ciclo completo de una campaña. El modelo de datos está diseñado para soportar IA desde la Fase 2 sin necesidad de refactorización estructural.

**Lo que este ADR implica no construir todavía:**
Automatizaciones, notificaciones, app móvil, integraciones con APIs externas para extracción automática de métricas.

**Lo que este ADR adelanta al MVP (respecto a la versión inicial):**
Seis capacidades que estaban en fases posteriores pasan al MVP: historial de cambios (audit log), métricas de performance de posts (entrada manual), scoring determinista de creadores, búsqueda por lenguaje natural, vectorización completa del catálogo de creadores y RAG para búsqueda semántica. La infraestructura de RAG construida en el MVP elimina la necesidad de migración estructural en Fase 2 y es el habilitador directo de las capacidades conversacionales avanzadas.

**El compromiso operativo del equipo:**
Las fases 2 y 3 solo tienen sentido si la Fase 1 se adopta completamente. Sin adopción real y sostenida, los datos que alimentarían la IA son escasos, incompletos o no confiables. La calidad del sistema en Fase 3 depende directamente de la disciplina operativa en Fase 1.

**El compromiso de producto:**
El MVP resuelve cinco problemas críticos: visibilidad de estado en tiempo real, registro estructurado de evidencias, trazabilidad completa de cambios (audit log), métricas de performance por post, y búsqueda ágil por lenguaje natural. El scoring automático agrega señal de calidad desde el primer día.

**El riesgo aceptado conscientemente:**
Se construye una herramienta interna en lugar de adaptar una herramienta comercial existente. Ese costo se acepta porque ninguna herramienta comercial disponible está diseñada para el flujo de Crowdposting a la escala que RealUp opera. El diferenciador no es la tecnología. Es que esta herramienta hace exactamente lo que el equipo necesita y nada más.
