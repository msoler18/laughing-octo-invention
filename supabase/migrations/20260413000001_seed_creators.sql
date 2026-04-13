-- Seed: creators colombianos para testing/demo
-- 25 creadores · 5 campañas · creator_categories · creator_scores
-- Cubre todos los tiers (nano → mega) y nichos principales
-- Safe to re-run: uses DO $$ ... $$ with ON CONFLICT DO NOTHING

-- ─── Helpers ──────────────────────────────────────────────────────────────────

-- función auxiliar: calcula el tier a partir de followers_count
-- (no persiste, solo referencia interna del seed)

-- ─── CREATORS ─────────────────────────────────────────────────────────────────

INSERT INTO creators (
  id, instagram_handle, full_name, phone, email, country, city,
  followers_count, engagement_rate, avg_likes_last_10, reach_rate,
  creator_tier, engagement_quality,
  consistency_score, audience_quality_score, data_quality_flags,
  bio_text, content_language, dominant_format,
  tiktok_handle, brand_mentions_last_30_posts, bio_keywords,
  content_rate_usd, payment_method, onboarding_status,
  campaigns_participated, notes, tags
) VALUES

-- ── NANO (1K – 10K) ──────────────────────────────────────────────────────────

(
  'a1000000-0000-0000-0000-000000000001',
  'valentina.fit.bog',
  'Valentina Ríos',
  '+573001234567', 'vrios@gmail.com', 'Colombia', 'Bogotá',
  4200, 7.80, 328.00, 12.50,
  'nano', 'high',
  88.00, 82.00, '{}',
  'Entrenadora personal 🏋️ | Hábitos saludables desde Bogotá | DM para colabs',
  'es', 'Reels',
  'valentina.fit.bog', 2, ARRAY['fitness','salud','gym','hábitos'],
  80.00, 'Nequi', 'active',
  3, 'Muy buena tasa de respuesta. Comunidad pequeña pero fiel.', ARRAY['fitness','bogota']
),
(
  'a1000000-0000-0000-0000-000000000002',
  'danielacocina',
  'Daniela Herrera',
  '+573012345678', 'dherrera@outlook.com', 'Colombia', 'Medellín',
  6800, 6.20, 421.00, 10.80,
  'nano', 'high',
  75.00, 79.00, '{}',
  'Chef casera 🍳 | Recetas fáciles y económicas | Medellín',
  'es', 'Reels',
  'danielacocina', 1, ARRAY['cocina','recetas','foodie','tips'],
  60.00, 'Daviplata', 'active',
  1, NULL, ARRAY['gastronomia','medellin']
),
(
  'a1000000-0000-0000-0000-000000000003',
  'juantech.co',
  'Juan Sebastián Gómez',
  '+573023456789', 'jsgomez@gmail.com', 'Colombia', 'Bogotá',
  8900, 5.40, 480.00, 9.20,
  'nano', 'average',
  70.00, 72.00, '{}',
  'Tecnología al alcance de todos 📱 | Apps, gadgets y productividad | Bogotá',
  'es', 'carousel',
  'juantech.co', 0, ARRAY['tecnologia','apps','productividad','android'],
  100.00, 'Transferencia', 'active',
  2, 'Muy detallado en reviews técnicos.', ARRAY['tecnologia','bogota']
),
(
  'a1000000-0000-0000-0000-000000000004',
  'mamasfelices.cali',
  'Andrea Quintero',
  '+573034567890', 'aquintero@gmail.com', 'Colombia', 'Cali',
  3100, 8.90, 276.00, 14.20,
  'nano', 'viral',
  91.00, 88.00, '{}',
  'Mamá de dos 👶 | Crianza con amor desde Cali | Maternidad real',
  'es', 'Reels',
  'mamasfelices.cali', 1, ARRAY['maternidad','familia','crianza','lactancia'],
  50.00, 'Nequi', 'active',
  0, 'Alta interacción orgánica. Perfil muy auténtico.', ARRAY['familia','cali']
),
(
  'a1000000-0000-0000-0000-000000000005',
  'viajero.caribe',
  'Carlos Mejía',
  '+573045678901', 'cmejia@gmail.com', 'Colombia', 'Barranquilla',
  5500, 4.10, 225.00, 7.80,
  'nano', 'average',
  62.00, 68.00, '{"engagement_drop_detected": true}',
  'Explorando el Caribe colombiano 🌴 | Tips de viaje económicos',
  'es', 'Reels',
  NULL, 0, ARRAY['viajes','caribe','playa','turismo'],
  70.00, 'Daviplata', 'pending',
  0, 'Caída de engagement últimas 4 semanas. Monitorear.', ARRAY['viajes','barranquilla']
),

-- ── MICRO (10K – 100K) ───────────────────────────────────────────────────────

(
  'a2000000-0000-0000-0000-000000000001',
  'lafashionista.col',
  'Mariana Ospina',
  '+573056789012', 'mospina@gmail.com', 'Colombia', 'Medellín',
  42000, 5.80, 2436.00, 8.90,
  'micro', 'high',
  84.00, 86.00, '{}',
  'Moda colombiana 🇨🇴 | Outfits accesibles | Medellín fashion week',
  'es', 'Reels',
  'lafashionista.col', 4, ARRAY['moda','fashion','outfit','estilo'],
  350.00, 'Transferencia', 'active',
  8, 'Referente de moda en Medellín. Muy profesional.', ARRAY['moda','medellin']
),
(
  'a2000000-0000-0000-0000-000000000002',
  'fitnesswithsara',
  'Sara Montoya',
  '+573067890123', 'smontoya@gmail.com', 'Colombia', 'Bogotá',
  78000, 6.40, 4992.00, 10.20,
  'micro', 'high',
  89.00, 91.00, '{}',
  'Personal trainer 🏋️‍♀️ | Programas de entrenamiento | Nutrición real | Bogotá',
  'es', 'Reels',
  'fitnesswithsara', 6, ARRAY['fitness','entrenamiento','nutricion','salud'],
  500.00, 'Nequi', 'active',
  12, 'Top performer en campañas de suplementos.', ARRAY['fitness','bogota']
),
(
  'a2000000-0000-0000-0000-000000000003',
  'comiendoenbogota',
  'Felipe Ramírez',
  '+573078901234', 'framirez@gmail.com', 'Colombia', 'Bogotá',
  55000, 4.90, 2695.00, 8.10,
  'micro', 'average',
  76.00, 78.00, '{}',
  'Descubriendo restaurantes en Bogotá 🍔 | Reviews honestos | Foodies',
  'es', 'Reels',
  'comiendoenbogota', 3, ARRAY['restaurantes','bogota','foodie','gastronomia'],
  400.00, 'Transferencia', 'active',
  5, 'Muy conocido en escena gastronómica bogotana.', ARRAY['gastronomia','bogota']
),
(
  'a2000000-0000-0000-0000-000000000004',
  'emprendedor.col',
  'Luis Fernández',
  '+573089012345', 'lfernandez@gmail.com', 'Colombia', 'Bogotá',
  33000, 3.70, 1221.00, 6.40,
  'micro', 'low',
  58.00, 62.00, '{}',
  'Emprendedor colombiano 🚀 | Startups, finanzas personales y negocios digitales',
  'es', 'carousel',
  'emprendedor.col', 2, ARRAY['emprendimiento','negocios','finanzas','startup'],
  280.00, 'Transferencia', 'active',
  4, NULL, ARRAY['negocios','bogota']
),
(
  'a2000000-0000-0000-0000-000000000005',
  'humor.paisa',
  'Andrés Cardona',
  '+573090123456', 'acardona@gmail.com', 'Colombia', 'Medellín',
  91000, 7.20, 6552.00, 11.50,
  'micro', 'high',
  82.00, 80.00, '{}',
  'Humor paisa 😂 | Sketches y situaciones cotidianas | Medellín',
  'es', 'Reels',
  'humor.paisa', 5, ARRAY['humor','comedia','paisa','entretenimiento'],
  600.00, 'Nequi', 'active',
  7, 'Virales constantes. Perfil de entretenimiento puro.', ARRAY['entretenimiento','medellin']
),
(
  'a2000000-0000-0000-0000-000000000006',
  'bellezalatina.co',
  'Natalia Cruz',
  '+573101234567', 'ncruz@gmail.com', 'Colombia', 'Cali',
  67000, 5.50, 3685.00, 9.30,
  'micro', 'high',
  87.00, 89.00, '{}',
  'Tutoriales de maquillaje 💄 | Skincare para latinas | Cali',
  'es', 'Reels',
  'bellezalatina.co', 8, ARRAY['belleza','maquillaje','skincare','tips'],
  450.00, 'Daviplata', 'active',
  9, 'Especialista en beauty. Alta fidelidad de audiencia.', ARRAY['belleza','cali']
),
(
  'a2000000-0000-0000-0000-000000000007',
  'mascotas.colombia',
  'Paola Jiménez',
  '+573112345678', 'pjimenez@gmail.com', 'Colombia', 'Bogotá',
  28000, 6.80, 1904.00, 10.90,
  'micro', 'high',
  80.00, 83.00, '{}',
  'Mundo pet 🐾 | Tips para tu peludito | Adopción responsable | Bogotá',
  'es', 'Reels',
  'mascotas.colombia', 2, ARRAY['mascotas','perros','gatos','adopcion'],
  220.00, 'Nequi', 'active',
  3, NULL, ARRAY['mascotas','familia','bogota']
),
(
  'a2000000-0000-0000-0000-000000000008',
  'viajescolombia360',
  'Ricardo Torres',
  '+573123456789', 'rtorres@gmail.com', 'Colombia', 'Cartagena',
  48000, 4.30, 2064.00, 7.20,
  'micro', 'average',
  72.00, 74.00, '{}',
  'Colombia tiene todo 🌎 | Destinos nacionales e internacionales | Cartagena base',
  'es', 'Reels',
  'viajescolombia360', 3, ARRAY['viajes','turismo','colombia','playa'],
  360.00, 'Transferencia', 'active',
  4, 'Buen engagement en contenido de viajes nacionales.', ARRAY['viajes','cartagena']
),

-- ── MID (100K – 500K) ────────────────────────────────────────────────────────

(
  'a3000000-0000-0000-0000-000000000001',
  'recetasfaciles.co',
  'Claudia Vargas',
  '+573134567890', 'cvargas@gmail.com', 'Colombia', 'Medellín',
  185000, 4.80, 8880.00, 7.90,
  'mid', 'average',
  79.00, 81.00, '{}',
  'Chef casera 🍳 | Recetas rápidas y económicas para toda la familia | Medellín',
  'es', 'Reels',
  'recetasfaciles.co', 10, ARRAY['recetas','cocina','gastronomia','familia'],
  1200.00, 'Transferencia', 'active',
  15, 'Referente de gastronomía doméstica. Muy valorada.', ARRAY['gastronomia','medellin']
),
(
  'a3000000-0000-0000-0000-000000000002',
  'styleguybog',
  'Sebastián Díaz',
  '+573145678901', 'sdiaz@gmail.com', 'Colombia', 'Bogotá',
  220000, 3.90, 8580.00, 6.50,
  'mid', 'average',
  74.00, 76.00, '{}',
  'Moda masculina 👔 | Estilo urbano colombiano | Bogotá Fashion Week',
  'es', 'Reels',
  'styleguybog', 12, ARRAY['moda','hombre','estilo','fashion'],
  1500.00, 'Transferencia', 'active',
  11, NULL, ARRAY['moda','bogota']
),
(
  'a3000000-0000-0000-0000-000000000003',
  'bienestar360co',
  'Gabriela Muñoz',
  '+573156789012', 'gmunoz@gmail.com', 'Colombia', 'Bogotá',
  310000, 5.10, 15810.00, 8.40,
  'mid', 'high',
  85.00, 87.00, '{}',
  'Bienestar integral 🧘 | Mindfulness, yoga y salud mental | Bogotá',
  'es', 'carousel',
  'bienestar360co', 15, ARRAY['bienestar','yoga','mindfulness','salud'],
  2000.00, 'Nequi', 'active',
  18, 'Perfil premium de bienestar. Audiencia muy comprometida.', ARRAY['bienestar','fitness','bogota']
),
(
  'a3000000-0000-0000-0000-000000000004',
  'techlatam.col',
  'Mateo Castillo',
  '+573167890123', 'mcastillo@gmail.com', 'Colombia', 'Medellín',
  145000, 3.50, 5075.00, 5.80,
  'mid', 'low',
  65.00, 68.00, '{}',
  'Tech en español 💻 | Reseñas, tutoriales y noticias tech para LATAM',
  'es', 'carousel',
  'techlatam.col', 8, ARRAY['tecnologia','gadgets','reviews','latam'],
  1100.00, 'Transferencia', 'active',
  10, 'Comunidad tech sólida. Audiencia masculina 18-35.', ARRAY['tecnologia','medellin']
),
(
  'a3000000-0000-0000-0000-000000000005',
  'risaconandres',
  'Andrés Patiño',
  '+573178901234', 'apatino@gmail.com', 'Colombia', 'Medellín',
  470000, 8.20, 38540.00, 12.80,
  'mid', 'viral',
  93.00, 90.00, '{}',
  'Comediante colombiano 😂 | Sketches virales | Humor cotidiano de Colombia',
  'es', 'Reels',
  'risaconandres', 20, ARRAY['humor','comedia','entretenimiento','viral'],
  3000.00, 'Transferencia', 'active',
  22, 'Uno de los perfiles de humor más virales del país.', ARRAY['entretenimiento','medellin']
),
(
  'a3000000-0000-0000-0000-000000000006',
  'mochileracol',
  'Isabella Restrepo',
  '+573189012345', 'irestrepo@gmail.com', 'Colombia', 'Cali',
  195000, 5.60, 10920.00, 9.10,
  'mid', 'high',
  83.00, 85.00, '{}',
  'Viajera colombiana ✈️ | Guías de destinos nacionales e internacionales | Cali',
  'es', 'Reels',
  'mochileracol', 9, ARRAY['viajes','mochilera','turismo','aventura'],
  1300.00, 'Nequi', 'active',
  14, 'Excelente para campañas de turismo y aerolíneas.', ARRAY['viajes','cali']
),

-- ── MACRO (500K – 1M) ────────────────────────────────────────────────────────

(
  'a4000000-0000-0000-0000-000000000001',
  'lafoodiegirl',
  'Camila Reyes',
  '+573190123456', 'creyes@gmail.com', 'Colombia', 'Bogotá',
  720000, 4.20, 30240.00, 7.10,
  'macro', 'average',
  78.00, 80.00, '{}',
  'Foodie colombiana 🍽️ | Restaurantes, recetas y experiencias gourmet | Bogotá',
  'es', 'Reels',
  'lafoodiegirl', 25, ARRAY['foodie','gastronomia','restaurantes','gourmet'],
  5000.00, 'Transferencia', 'active',
  28, 'Referente gastronómico nacional. Muy profesional en entregas.', ARRAY['gastronomia','bogota']
),
(
  'a4000000-0000-0000-0000-000000000002',
  'fitnessconpablo',
  'Pablo Agudelo',
  '+573201234567', 'pagudelo@gmail.com', 'Colombia', 'Medellín',
  850000, 5.70, 48450.00, 9.20,
  'macro', 'high',
  88.00, 90.00, '{}',
  'Coach fitness 🏋️ | Transformaciones reales | Programas online | Medellín',
  'es', 'Reels',
  'fitnessconpablo', 30, ARRAY['fitness','gym','transformacion','coach'],
  7000.00, 'Transferencia', 'active',
  35, 'Top fitness creator en Colombia. CPM elevado pero ROI excelente.', ARRAY['fitness','medellin']
),
(
  'a4000000-0000-0000-0000-000000000003',
  'modacolombia.official',
  'Sofía Pedraza',
  '+573212345678', 'spedraza@gmail.com', 'Colombia', 'Bogotá',
  630000, 3.80, 23940.00, 6.30,
  'macro', 'average',
  76.00, 78.00, '{}',
  'Moda & lifestyle 🌟 | Diseñadora colombiana | Tendencias | Bogotá',
  'es', 'Reels',
  'modacolombia.official', 22, ARRAY['moda','diseño','lifestyle','tendencias'],
  5500.00, 'Transferencia', 'active',
  26, 'Perfil de moda premium. Audiencia femenina 20-40.', ARRAY['moda','lifestyle','bogota']
),
(
  'a4000000-0000-0000-0000-000000000004',
  'emprendimientocol',
  'Diego Salcedo',
  '+573223456789', 'dsalcedo@gmail.com', 'Colombia', 'Bogotá',
  560000, 3.20, 17920.00, 5.70,
  'macro', 'low',
  68.00, 70.00, '{}',
  'Emprendimiento & negocios 🚀 | Casos de éxito colombianos | Finanzas e inversión',
  'es', 'carousel',
  'emprendimientocol', 18, ARRAY['emprendimiento','negocios','finanzas','inversion'],
  4500.00, 'Transferencia', 'active',
  20, 'Comunidad de emprendedores. Audiencia con poder adquisitivo medio-alto.', ARRAY['negocios','bogota']
),

-- ── MEGA (1M+) ────────────────────────────────────────────────────────────────

(
  'a5000000-0000-0000-0000-000000000001',
  'juanpabloloco',
  'Juan Pablo Rincón',
  '+573234567890', 'jprincon@gmail.com', 'Colombia', 'Bogotá',
  2100000, 6.80, 142800.00, 10.50,
  'mega', 'high',
  90.00, 88.00, '{}',
  'El más loco de Colombia 🤪 | Entretenimiento, humor y lifestyle | Bogotá',
  'es', 'Reels',
  'juanpabloloco', 40, ARRAY['humor','entretenimiento','lifestyle','viral'],
  18000.00, 'Transferencia', 'active',
  55, 'Top creator nacional. Gestión a través de agencia.', ARRAY['entretenimiento','bogota']
),
(
  'a5000000-0000-0000-0000-000000000002',
  'marcelafitness',
  'Marcela Londoño',
  '+573245678901', 'mlondono@gmail.com', 'Colombia', 'Medellín',
  1450000, 7.30, 105850.00, 11.20,
  'mega', 'high',
  92.00, 93.00, '{}',
  'Fitness & wellness 💪 | Inspirando Colombia a moverse | Medellín',
  'es', 'Reels',
  'marcelafitness', 45, ARRAY['fitness','wellness','inspiracion','salud'],
  15000.00, 'Transferencia', 'active',
  48, 'Ícono fitness colombiana. Muy selectiva en colaboraciones.', ARRAY['fitness','bienestar','medellin']
)

ON CONFLICT (instagram_handle) DO NOTHING;

-- ─── CREATOR_CATEGORIES ───────────────────────────────────────────────────────

INSERT INTO creator_categories (creator_id, category_slug, is_primary, subniche) VALUES

-- Nano
('a1000000-0000-0000-0000-000000000001', 'fitness',        true,  'Entrenamiento funcional'),
('a1000000-0000-0000-0000-000000000001', 'bienestar',      false, NULL),
('a1000000-0000-0000-0000-000000000002', 'recetas',        true,  'Cocina casera económica'),
('a1000000-0000-0000-0000-000000000002', 'gastronomia',    false, NULL),
('a1000000-0000-0000-0000-000000000003', 'tecnologia',     true,  'Apps y productividad'),
('a1000000-0000-0000-0000-000000000003', 'apps',           false, NULL),
('a1000000-0000-0000-0000-000000000004', 'maternidad',     true,  'Crianza con apego'),
('a1000000-0000-0000-0000-000000000004', 'familia',        false, NULL),
('a1000000-0000-0000-0000-000000000005', 'viajes-nacional',true,  'Caribe colombiano'),
('a1000000-0000-0000-0000-000000000005', 'viajes',         false, NULL),

-- Micro
('a2000000-0000-0000-0000-000000000001', 'moda',           true,  'Moda accesible colombiana'),
('a2000000-0000-0000-0000-000000000001', 'lifestyle',      false, NULL),
('a2000000-0000-0000-0000-000000000002', 'fitness',        true,  'Entrenamiento y nutrición'),
('a2000000-0000-0000-0000-000000000002', 'bienestar',      false, NULL),
('a2000000-0000-0000-0000-000000000003', 'restaurantes',   true,  'Restaurantes Bogotá'),
('a2000000-0000-0000-0000-000000000003', 'gastronomia',    false, NULL),
('a2000000-0000-0000-0000-000000000004', 'emprendimiento', true,  'Startups digitales'),
('a2000000-0000-0000-0000-000000000004', 'negocios',       false, NULL),
('a2000000-0000-0000-0000-000000000005', 'humor',          true,  'Humor paisa cotidiano'),
('a2000000-0000-0000-0000-000000000005', 'entretenimiento',false, NULL),
('a2000000-0000-0000-0000-000000000006', 'belleza',        true,  'Maquillaje y skincare latinas'),
('a2000000-0000-0000-0000-000000000006', 'moda',           false, NULL),
('a2000000-0000-0000-0000-000000000007', 'mascotas',       true,  'Perros y gatos'),
('a2000000-0000-0000-0000-000000000007', 'familia',        false, NULL),
('a2000000-0000-0000-0000-000000000008', 'viajes-nacional',true,  'Destinos nacionales'),
('a2000000-0000-0000-0000-000000000008', 'viajes',         false, NULL),

-- Mid
('a3000000-0000-0000-0000-000000000001', 'recetas',        true,  'Cocina económica para familias'),
('a3000000-0000-0000-0000-000000000001', 'gastronomia',    false, NULL),
('a3000000-0000-0000-0000-000000000002', 'moda',           true,  'Moda masculina urbana'),
('a3000000-0000-0000-0000-000000000002', 'lifestyle',      false, NULL),
('a3000000-0000-0000-0000-000000000003', 'bienestar',      true,  'Yoga y mindfulness'),
('a3000000-0000-0000-0000-000000000003', 'fitness',        false, NULL),
('a3000000-0000-0000-0000-000000000004', 'tecnologia',     true,  'Reviews gadgets LATAM'),
('a3000000-0000-0000-0000-000000000004', 'gadgets',        false, NULL),
('a3000000-0000-0000-0000-000000000005', 'humor',          true,  'Sketches de humor colombiano'),
('a3000000-0000-0000-0000-000000000005', 'entretenimiento',false, NULL),
('a3000000-0000-0000-0000-000000000006', 'viajes',         true,  'Viajes mochilera Colombia'),
('a3000000-0000-0000-0000-000000000006', 'viajes-nacional',false, NULL),

-- Macro
('a4000000-0000-0000-0000-000000000001', 'gastronomia',    true,  'Foodie gourmet'),
('a4000000-0000-0000-0000-000000000001', 'restaurantes',   false, NULL),
('a4000000-0000-0000-0000-000000000002', 'fitness',        true,  'Coaching y transformaciones'),
('a4000000-0000-0000-0000-000000000002', 'bienestar',      false, NULL),
('a4000000-0000-0000-0000-000000000003', 'moda',           true,  'Diseño y tendencias'),
('a4000000-0000-0000-0000-000000000003', 'lifestyle',      false, NULL),
('a4000000-0000-0000-0000-000000000004', 'negocios',       true,  'Emprendimiento e inversión'),
('a4000000-0000-0000-0000-000000000004', 'emprendimiento', false, NULL),

-- Mega
('a5000000-0000-0000-0000-000000000001', 'entretenimiento',true,  'Humor y lifestyle viral'),
('a5000000-0000-0000-0000-000000000001', 'humor',          false, NULL),
('a5000000-0000-0000-0000-000000000002', 'fitness',        true,  'Wellness e inspiración'),
('a5000000-0000-0000-0000-000000000002', 'bienestar',      false, NULL)

ON CONFLICT (creator_id, category_slug) DO NOTHING;

-- ─── CREATOR_SCORES ───────────────────────────────────────────────────────────

INSERT INTO creator_scores (creator_id, score, engagement_weight, tier_weight, consistency_weight, campaign_history_weight) VALUES
-- Nano
('a1000000-0000-0000-0000-000000000001', 74.20, 31.20, 15.00, 22.00, 6.00),
('a1000000-0000-0000-0000-000000000002', 68.40, 24.80, 15.00, 18.75, 9.85),
('a1000000-0000-0000-0000-000000000003', 62.70, 21.60, 15.00, 17.50, 8.60),
('a1000000-0000-0000-0000-000000000004', 79.50, 35.60, 15.00, 22.75, 6.15),
('a1000000-0000-0000-0000-000000000005', 51.30, 16.40, 15.00, 15.50, 4.40),
-- Micro
('a2000000-0000-0000-0000-000000000001', 76.80, 23.20, 22.00, 21.00, 10.60),
('a2000000-0000-0000-0000-000000000002', 82.10, 25.60, 22.00, 22.25, 12.25),
('a2000000-0000-0000-0000-000000000003', 70.50, 19.60, 22.00, 19.00, 9.90),
('a2000000-0000-0000-0000-000000000004', 61.20, 14.80, 22.00, 14.50, 9.90),
('a2000000-0000-0000-0000-000000000005', 80.40, 28.80, 22.00, 20.50, 9.10),
('a2000000-0000-0000-0000-000000000006', 78.90, 22.00, 22.00, 21.75, 13.15),
('a2000000-0000-0000-0000-000000000007', 72.60, 27.20, 22.00, 20.00, 3.40),
('a2000000-0000-0000-0000-000000000008', 66.30, 17.20, 22.00, 18.00, 9.10),
-- Mid
('a3000000-0000-0000-0000-000000000001', 74.80, 19.20, 27.00, 19.75, 8.85),
('a3000000-0000-0000-0000-000000000002', 70.10, 15.60, 27.00, 18.50, 9.00),
('a3000000-0000-0000-0000-000000000003', 80.50, 20.40, 27.00, 21.25, 11.85),
('a3000000-0000-0000-0000-000000000004', 65.40, 14.00, 27.00, 16.25, 8.15),
('a3000000-0000-0000-0000-000000000005', 88.20, 32.80, 27.00, 23.25, 5.15),
('a3000000-0000-0000-0000-000000000006', 77.30, 22.40, 27.00, 20.75, 7.15),
-- Macro
('a4000000-0000-0000-0000-000000000001', 73.50, 16.80, 29.00, 19.50, 8.20),
('a4000000-0000-0000-0000-000000000002', 84.60, 22.80, 29.00, 22.00, 10.80),
('a4000000-0000-0000-0000-000000000003', 71.20, 15.20, 29.00, 19.00, 8.00),
('a4000000-0000-0000-0000-000000000004', 62.80, 12.80, 29.00, 17.00, 4.00),
-- Mega
('a5000000-0000-0000-0000-000000000001', 85.40, 27.20, 30.00, 22.50, 5.70),
('a5000000-0000-0000-0000-000000000002', 88.70, 29.20, 30.00, 23.00, 6.50)

ON CONFLICT (creator_id) DO NOTHING;

-- ─── CAMPAIGNS (demo) ─────────────────────────────────────────────────────────

INSERT INTO campaigns (id, name, brand, description, brief_text, start_date, end_date, status, target_creator_count) VALUES

(
  'b1000000-0000-0000-0000-000000000001',
  'Verano Activo 2026',
  'Nike Colombia',
  'Campaña de fitness y estilo de vida activo para temporada de verano.',
  'Contenido mostrando rutinas de entrenamiento y looks deportivos con productos Nike. Mínimo 1 Reel + 3 Stories.',
  '2026-05-01 00:00:00+00',
  '2026-06-30 23:59:59+00',
  'active',
  8
),
(
  'b1000000-0000-0000-0000-000000000002',
  'Sabor Colombia',
  'Bancolombia',
  'Campaña gastronómica destacando restaurantes y creadores de comida colombiana.',
  'Visitar restaurantes partner y crear contenido auténtico mostrando la experiencia culinaria colombiana.',
  '2026-04-15 00:00:00+00',
  '2026-05-31 23:59:59+00',
  'active',
  6
),
(
  'b1000000-0000-0000-0000-000000000003',
  'Tech for You',
  'Samsung Colombia',
  'Lanzamiento Galaxy S25 — reviews y unboxing con creadores tech.',
  'Reseña honesta del Galaxy S25 mostrando sus features principales. Formato: Reel de 60s + carousel técnico.',
  '2026-04-01 00:00:00+00',
  '2026-04-30 23:59:59+00',
  'active',
  4
),
(
  'b1000000-0000-0000-0000-000000000004',
  'Moda Primavera',
  'Arturo Calle',
  'Campaña de moda masculina y femenina para colección primavera-verano.',
  'Lookbook con prendas de la nueva colección. Al menos 2 outfits por creador.',
  '2026-03-01 00:00:00+00',
  '2026-03-31 23:59:59+00',
  'closed',
  5
),
(
  'b1000000-0000-0000-0000-000000000005',
  'Destinos Colombia',
  'ProColombia',
  'Campaña de turismo interno destacando destinos colombianos poco conocidos.',
  'Visitar un destino asignado y crear contenido mostrando atractivos turísticos, gastronomía y cultura local.',
  '2026-06-01 00:00:00+00',
  '2026-08-31 23:59:59+00',
  'draft',
  10
)

ON CONFLICT (id) DO NOTHING;

-- ─── CAMPAIGN_CREATORS (pipeline demo) ────────────────────────────────────────
-- Campaña Verano Activo — 8 creadores en distintos estados del pipeline

INSERT INTO campaign_creators (
  campaign_id, creator_id, assignment_status,
  post_url, notes,
  confirmed_at, published_at, verified_at, paid_at,
  likes, comments, reach, impressions
) VALUES

-- pagado (ciclo completo)
(
  'b1000000-0000-0000-0000-000000000001',
  'a5000000-0000-0000-0000-000000000002', -- marcelafitness (mega)
  'pagado',
  'https://www.instagram.com/p/demo-marcela-verano/',
  'Entregó antes del deadline. Métricas excelentes.',
  '2026-04-20 10:00:00+00', '2026-04-25 18:30:00+00',
  '2026-04-26 09:00:00+00', '2026-05-01 14:00:00+00',
  98400, 3200, 820000, 1150000
),
-- verificado
(
  'b1000000-0000-0000-0000-000000000001',
  'a4000000-0000-0000-0000-000000000002', -- fitnessconpablo (macro)
  'verificado',
  'https://www.instagram.com/p/demo-pablo-verano/',
  'Reel con gran engagement. Pendiente confirmación de pago.',
  '2026-04-21 11:00:00+00', '2026-04-27 20:00:00+00',
  '2026-04-28 10:00:00+00', NULL,
  42300, 1890, 380000, 520000
),
-- publicado
(
  'b1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000002', -- fitnesswithsara (micro)
  'publicado',
  'https://www.instagram.com/p/demo-sara-verano/',
  NULL,
  '2026-04-22 09:00:00+00', '2026-04-29 19:00:00+00',
  NULL, NULL,
  5200, 310, 42000, 68000
),
-- aprobado
(
  'b1000000-0000-0000-0000-000000000001',
  'a3000000-0000-0000-0000-000000000003', -- bienestar360co (mid)
  'aprobado',
  NULL,
  'Envió contenido borrador. Aprobado para publicación.',
  '2026-04-23 10:00:00+00', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
-- contenido_enviado
(
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001', -- valentina.fit.bog (nano)
  'contenido_enviado',
  NULL,
  'Envió borrador por DM. En revisión.',
  '2026-04-23 11:00:00+00', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
-- en_brief
(
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002', -- danielacocina (nano)
  'en_brief',
  NULL,
  'Brief enviado el 30 abr. Esperando confirmación de lectura.',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
-- contactado
(
  'b1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000001', -- lafashionista.col (micro)
  'contactado',
  NULL,
  'Primer mensaje enviado el 1 mayo. Sin respuesta aún.',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
-- prospecto
(
  'b1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000007', -- mascotas.colombia (micro)
  'prospecto',
  NULL,
  'Candidata identificada. Perfil fitness compatible.',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),

-- ── Campaña Sabor Colombia ─────────────────────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000002',
  'a4000000-0000-0000-0000-000000000001', -- lafoodiegirl (macro)
  'publicado',
  'https://www.instagram.com/p/demo-camila-sabor/',
  'Contenido de alta calidad. Alcanzó 700K personas.',
  '2026-04-16 09:00:00+00', '2026-04-22 19:30:00+00',
  NULL, NULL,
  31200, 1450, 690000, 950000
),
(
  'b1000000-0000-0000-0000-000000000002',
  'a2000000-0000-0000-0000-000000000003', -- comiendoenbogota (micro)
  'confirmado',
  NULL,
  'Confirmado para la semana del 5 de mayo.',
  '2026-04-18 10:00:00+00', NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
(
  'b1000000-0000-0000-0000-000000000002',
  'a3000000-0000-0000-0000-000000000001', -- recetasfaciles.co (mid)
  'contactado',
  NULL,
  'DM enviado. Interés expresado, negociando tarifa.',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
(
  'b1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000002', -- danielacocina (nano)
  'prospecto',
  NULL,
  NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),

-- ── Campaña Tech for You ───────────────────────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000003',
  'a3000000-0000-0000-0000-000000000004', -- techlatam.col (mid)
  'publicado',
  'https://www.instagram.com/p/demo-mateo-samsung/',
  'Review muy completo. Alto alcance orgánico.',
  '2026-04-03 10:00:00+00', '2026-04-10 20:00:00+00',
  NULL, NULL,
  8900, 620, 92000, 145000
),
(
  'b1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000003', -- juantech.co (nano)
  'verificado',
  'https://www.instagram.com/p/demo-juan-samsung/',
  'Métricas verificadas. Pago pendiente.',
  '2026-04-04 09:00:00+00', '2026-04-12 18:00:00+00',
  '2026-04-15 10:00:00+00', NULL,
  2100, 180, 7800, 12000
),

-- ── Campaña Moda Primavera (closed) ───────────────────────────────────────────

(
  'b1000000-0000-0000-0000-000000000004',
  'a4000000-0000-0000-0000-000000000003', -- modacolombia.official (macro)
  'pagado',
  'https://www.instagram.com/p/demo-sofia-moda/',
  'Campaña exitosa. Excelente ROI.',
  '2026-03-03 10:00:00+00', '2026-03-15 19:00:00+00',
  '2026-03-16 09:00:00+00', '2026-03-20 14:00:00+00',
  28900, 1200, 420000, 580000
),
(
  'b1000000-0000-0000-0000-000000000004',
  'a3000000-0000-0000-0000-000000000002', -- styleguybog (mid)
  'pagado',
  'https://www.instagram.com/p/demo-sebastian-moda/',
  NULL,
  '2026-03-04 10:00:00+00', '2026-03-16 20:00:00+00',
  '2026-03-17 09:00:00+00', '2026-03-22 14:00:00+00',
  11200, 580, 148000, 210000
),
(
  'b1000000-0000-0000-0000-000000000004',
  'a2000000-0000-0000-0000-000000000001', -- lafashionista.col (micro)
  'pagado',
  'https://www.instagram.com/p/demo-mariana-moda/',
  NULL,
  '2026-03-04 11:00:00+00', '2026-03-17 19:00:00+00',
  '2026-03-18 10:00:00+00', '2026-03-23 14:00:00+00',
  3800, 290, 38000, 54000
)

ON CONFLICT (campaign_id, creator_id) DO NOTHING;
