

# TeacherMind — Plan de Implementación Completo

## Estética definida
Inspirada en el sitio Pilates Circle: **glassmorphism** con fondos translúcidos, backdrop-blur, bordes sutiles semitransparentes. Paleta de **colores tierra/naranja** (terracotta, arena, beige, naranja quemado). Tipografías: **Montserrat** (UI general) y **Roca Two** (headings/display).

## Fase 1: Fundación (Design System + Layout + Routing)

### Archivos a crear/modificar:
- **`index.html`** — Agregar Google Fonts: Montserrat (400,500,600,700) y Roca Two (400,700)
- **`src/index.css`** — Nuevo design system completo:
  - Variables CSS tierra: terracotta (`15 70% 45%`), sand (`30 40% 90%`), warm-beige (`35 30% 95%`), burnt-orange (`20 80% 55%`), clay (`18 50% 35%`)
  - Backgrounds con glassmorphism: `background/80` + `backdrop-blur-xl`
  - Override de todas las variables `--background`, `--primary`, `--card`, etc. a tonos tierra
  - Clase `.glass` utilitaria para paneles glass
  - Font families: `--font-sans: 'Montserrat'`, `--font-display: 'Roca Two'`
- **`tailwind.config.ts`** — Extender con colores tierra custom, fontFamily con montserrat/roca-two, animaciones glass (shimmer, float)
- **`src/components/layout/AppSidebar.tsx`** — Sidebar principal glass con navegación: Dashboard, Students, Class History, Lesson Generator, Material Generator, Lesson Plans, Progress, Search, Settings
- **`src/components/layout/AppLayout.tsx`** — Layout wrapper con sidebar + contenido principal + fondo gradiente tierra
- **`src/App.tsx`** — Rutas para todas las páginas

### Páginas (estructura inicial con datos mock):
- **`src/pages/Dashboard.tsx`** — Cards glass: próximas clases, últimas alumnas, tareas pendientes, progreso bloques, botón "Generate Next Lesson"
- **`src/pages/Students.tsx`** — Lista de alumnas con cards glass
- **`src/pages/StudentDetail.tsx`** — Perfil completo con tabs (Historial, Gramática, Vocabulario, Progreso, Notas)
- **`src/pages/ClassHistory.tsx`** — Lista cronológica con búsqueda y filtros
- **`src/pages/LessonGenerator.tsx`** — Selector de alumna + formulario de parámetros + preview de clase generada
- **`src/pages/MaterialGenerator.tsx`** — Generador con filtros (tipo, nivel, tema, gramática)
- **`src/pages/LessonPlans.tsx`** — Bloques de clases con timeline/progreso
- **`src/pages/ProgressTracking.tsx`** — Gráficos recharts de progreso por alumna
- **`src/pages/Search.tsx`** — Buscador global con filtros
- **`src/pages/Settings.tsx`** — Configuración y módulos de vocabulario profesional

## Fase 2: Componentes Glass Reutilizables

- **`src/components/ui/glass-card.tsx`** — Card con `bg-white/15 backdrop-blur-xl border border-white/20 shadow-lg`
- **`src/components/ui/glass-panel.tsx`** — Panel más grande para secciones
- **`src/components/ui/glass-input.tsx`** — Input con fondo translúcido
- **`src/components/ui/glass-badge.tsx`** — Badge para niveles CEFR (A1-C2) con colores tierra
- **`src/components/ui/stat-card.tsx`** — Card de estadística para dashboard

## Fase 3: Componentes de Dominio

- **`src/components/students/StudentCard.tsx`** — Card de alumna con nivel, profesión, próxima clase
- **`src/components/students/StudentProfile.tsx`** — Perfil detallado con tabs
- **`src/components/lessons/LessonCard.tsx`** — Card de clase con fecha, gramática, vocabulario
- **`src/components/lessons/LessonEditor.tsx`** — Editor de secciones de clase (warm up, grammar, exercises, etc.)
- **`src/components/lessons/LessonSection.tsx`** — Sección individual editable
- **`src/components/materials/MaterialCard.tsx`** — Card de material con tipo y nivel
- **`src/components/blocks/BlockTimeline.tsx`** — Vista timeline de bloque de clases
- **`src/components/progress/ProgressChart.tsx`** — Gráfico recharts con estilo glass
- **`src/components/ai/SmartSuggestion.tsx`** — Card de sugerencia IA
- **`src/components/ai/GenerateButton.tsx`** — Botón prominente "Generate with AI"

## Fase 4: Datos y Estado

- **`src/data/mock-data.ts`** — Datos mock completos: 3-4 alumnas con perfiles, historial de clases, vocabulario, gramática, bloques
- **`src/types/index.ts`** — TypeScript types: Student, Lesson, LessonBlock, Material, GrammarTopic, VocabularyItem, ProgressNote, ProfessionalModule
- **`src/hooks/useStudents.ts`** — Hook para gestionar alumnas (state local por ahora)
- **`src/hooks/useLessons.ts`** — Hook para gestionar clases

## Detalle Visual

```text
┌──────────────────────────────────────────────────┐
│  Fondo: gradiente terracotta → sand (sutil)      │
│  ┌────────┬───────────────────────────────────┐   │
│  │SIDEBAR │  CONTENIDO PRINCIPAL              │   │
│  │ glass  │  ┌─────────┐ ┌─────────┐         │   │
│  │ bg/15  │  │Glass    │ │Glass    │         │   │
│  │ blur   │  │Card 1   │ │Card 2   │         │   │
│  │        │  └─────────┘ └─────────┘         │   │
│  │ Logo   │  ┌──────────────────────┐         │   │
│  │ Nav    │  │ Panel principal      │         │   │
│  │ items  │  │ glass + blur         │         │   │
│  │        │  └──────────────────────┘         │   │
│  └────────┴───────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

- Todos los paneles: `backdrop-blur-xl bg-white/10-20 border border-white/20 rounded-2xl`
- Headings en Roca Two, body en Montserrat
- Badges CEFR con gradientes tierra
- Botones primarios en terracotta con hover más oscuro
- Iconos de lucide-react consistentes
- Dark mode: misma estética glass pero sobre fondo oscuro tierra

## Orden de Implementación

Dado que es "todo completo", construiré en un solo paso todas las páginas con datos mock y la estética glass completa. La integración con Supabase y las edge functions de IA se harán en iteraciones posteriores cuando conectemos la base de datos.

**Estimación**: ~20 archivos nuevos/modificados en esta primera implementación.

