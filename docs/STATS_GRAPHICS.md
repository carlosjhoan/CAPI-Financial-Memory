# STATS_GRAPHICS.md — Gráficos Históricos para el Dashboard de PFM

> **Propósito del documento:** Documentar la estrategia de graficación de datos históricos (mensuales y anuales) en el Dashboard de PFM usando React + TypeScript + TailwindCSS 3 con dark mode.

---

## Objetivo del Feature

**Brindar al usuario una visualización histórica, clara e interactiva de la evolución financiera** de cada módulo del negocio (Deudas, Ingresos, Gastos, Préstamos) directamente en el Dashboard, mediante gráficos de barras y de líneas con puntos que permitan:

| Necesidad | Cómo se resuelve |
|-----------|-----------------|
| **Entender tendencias** en el tiempo (¿estoy gastando más cada mes? ¿mis ingresos crecen?) | Gráficos de barras y líneas por mes/año para cada módulo |
| **Comparar módulos entre sí** (ej. Ingresos vs Gastos en el mismo período) | Gráficos de barras superpuestas con leyenda |
| **Navegar entre granularidades** (vista anual por meses ↔ vista mensual por días) | Selectores de año/mes + toggle de tipo de gráfico en cada `ChartCard` |
| **Interpretar los datos rápidamente** sin salir del Dashboard | Tooltips con valores formateados, leyendas, colores por módulo |
| **Experiencia visual consistente** en light y dark mode | Sistema de colores dual (`chart-theme.ts`) + clases `dark:` en wrappers |

### Alcance

El feature cubre los **4 módulos del negocio** con los siguientes gráficos:

| # | Gráfico | Tipo | Origen de datos |
|---|---------|------|-----------------|
| 1 | Ingresos vs Gastos (anual comparativo) | Barras superpuestas | `yearlyBreakdown` de ambos endpoints |
| 2 | Histórico de Deudas (anual) | Barras | `GET /debts/summary/yearly` |
| 3 | Histórico de Ingresos (anual) | Barras / Línea | `GET /incomes/summary/yearly` |
| 4 | Histórico de Gastos (anual) | Barras | `GET /expenses/summary/yearly` *(pendiente implementar)* |
| 5 | Rendimiento de Préstamos activos | Línea (múltiples series) | `GET /loans/summary/performance/:id` |
| 6 | Detalle diario de cualquier módulo | Línea con puntos | `GET /.../summary/monthly?year=&month=` |

### Criterios de éxito

- [ ] El Dashboard carga en < 2s con todos los gráficos visibles (gracias a lazy loading por sección).
- [ ] Cambiar de año no produce flash de loading (gracias a `keepPreviousData` en React Query).
- [ ] Todos los gráficos se ven correctos en light y dark mode.
- [ ] El tooltip muestra valores formateados en pesos colombianos (`$X.XXX`).
- [ ] Cada `ChartCard` permite alternar entre vista de barras y vista de líneas.

---

## 1. Datos disponibles desde el Backend

Los 4 módulos exponen endpoints de resúmenes (`/summary/*`) que alimentarán los gráficos. Todos retornan `ApiResponseDto<T>`:

```ts
{ statusCode, data: T, message, timestamp }
```

### 1.1 Forma de los datos por módulo

| Módulo | Endpoint | Dato clave para gráficos | Forma |
|--------|----------|--------------------------|-------|
| **Debts** | `GET /debts/summary/monthly?year=&month=` | `byDay: Record<string, number>` (`"01"`..`"31"` → monto) | Objeto |
| | `GET /debts/summary/yearly?year=` | `monthlyBreakdown: Record<string, number>` (`"Jan"`..`"Dec"` → monto) | Objeto |
| **Incomes** | `GET /incomes/summary/monthly?year=&month=` | `dailyBreakdown: Record<string, number>` (`"01"`..`"31"` → monto) | Objeto |
| | `GET /incomes/summary/yearly?year=` | `monthlyBreakdown: Record<string, number>` (`"Jan"`..`"Dec"` → monto) | Objeto |
| **Expenses** | `GET /expenses/summary/monthly?year=&month=` | `dailyBreakdown: Record<string, number>` (`"01"`..`"31"` → monto) | Objeto |
| | *(sin yearly endpoint)* | — | — |
| **Loans** | `GET /loans/summary/overall` | `totalAmountLent`, `totalExpectedReturn`, etc. | Objeto (KPIs) |
| | `GET /loans/summary/overdue` | `Loan[]` (lista completa de préstamos vencidos) | Array |

> **Nota:** Los meses en los query params son **1-indexed** (1=Enero, 12=Diciembre).  
> Las claves de `monthlyBreakdown` son strings: `"Jan"`, `"Feb"`, ..., `"Dec"`.  
> Las claves de `byDay` / `dailyBreakdown` son strings: `"01"`, `"02"`, ..., `"31"`.

---

## 2. Librerías de Gráficos — Comparativa

| Librería | Bundle (gzip) | Tailwind | Dark Mode | TypeScript | Facilidad | Ideal para |
|----------|--------------|----------|-----------|------------|-----------|------------|
| **Recharts** | ~120 kB | Parcial (props) | Manual (props) | Excelente | ★★★★☆ | Mejor DX React, más usada |
| **Tremor v3** | ~232 kB | **Nativo** (`dark:`) | **Automático** | Buena | ★★★★★ | Dashboards rápidos con Tailwind |
| **Nivo** | ~134 kB | Tema propio | Manual (swap tema) | Excelente | ★★★☆☆ | Visualizaciones avanzadas, SSR |
| **Chart.js + react-chartjs-2** | ~69 kB | Ninguno (Canvas) | Manual (reconfig) | Buena | ★★★☆☆ | Bundle más pequeño |
| **Victory** | ~134 kB | Prop-based | Manual (swap tema) | Regular | ★★☆☆☆ | React Native también |

### Recomendación para PFM: **Recharts** o **Tremor**

| Si buscas... | Usa |
|-------------|-----|
| Máximo control + menor bundle + comunidad masiva | **Recharts** |
| Integración perfecta con Tailwind + dark mode automático + productividad | **Tremor v3** |
| Híbrido (empieza con Tremor, baja a Recharts si necesitas más) | Tremor (está construido sobre Recharts) |

**PFM ya usa Recharts** como dependencia transitiva si se instala Tremor. Se recomienda partir con Recharts directamente, creando wrappers con estilos Tailwind consistentes.

---

## 3. Arquitectura de Componentes de Gráficos

### 3.1 Estructura de archivos propuesta

```
frontend/src/
├── features/
│   └── dashboard/
│       └── components/
│           ├── HistoricalBarChart.tsx      # Gráfico de barras reusable
│           ├── HistoricalLineChart.tsx     # Gráfico de líneas con puntos reusable
│           ├── ChartCard.tsx               # Card wrapper con título, filtro año/mes, skeleton
│           ├── DebtChartSection.tsx        # Sección de gráficos de Deudas
│           ├── IncomeChartSection.tsx      # Sección de gráficos de Ingresos
│           ├── ExpenseChartSection.tsx     # Sección de gráficos de Gastos
│           └── LoanChartSection.tsx        # Sección de gráficos de Préstamos
├── shared/
│   └── components/
│       └── charts/
│           ├── BaseBarChart.tsx            # BarChart base con Tailwind + dark mode
│           ├── BaseLineChart.tsx           # LineChart base con Tailwind + dark mode
│           ├── ChartTooltip.tsx            # Tooltip personalizado con estilos dark:
│           ├── ChartLegend.tsx             # Leyenda personalizada
│           └── chart-theme.ts              # Constantes de colores para light/dark
```

### 3.2 Patrón: `ChartCard` wrapper

```tsx
// Concepto — NO es código final, es patrón de arquitectura

interface ChartCardProps {
  title: string;
  year: number;
  month?: number;                   // opcional: si es vista mensual
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  onYearChange: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onViewToggle?: () => void;        // alternar bar↔line
}

// El ChartCard encapsula:
// - Título del módulo (e.g. "Histórico de Deudas")
// - Selectores de año / mes
// - Toggle de tipo de gráfico (barras / líneas)
// - Skeleton loading mientras se consulta la API
// - Estado de error
// - El gráfico (children)
```

---

## 4. Transformación de Datos: Backend → Formato de Gráfico

Tanto Recharts como Tremor esperan **arrays de objetos** con el formato:

```ts
// Formato esperado por la mayoría de librerías de gráficos
type ChartDataPoint = {
  label: string;        // "Ene", "Feb", ... o "01", "02", ... o "Ene 2024", etc.
  value: number;        // el monto numérico
  // opcional: múltiples series
  [key: string]: string | number;
};
```

### 4.1 Transformación desde `monthlyBreakdown` (vista anual)

```ts
// Backend retorna: { data: { monthlyBreakdown: { "Jan": 1500, "Feb": 2300, ... } } }
// Necesitamos: [{ label: "Ene", value: 1500 }, { label: "Feb", value: 2300 }, ...]

const MONTH_MAP: Record<string, string> = {
  Jan: "Ene", Feb: "Feb", Mar: "Mar", Apr: "Abr",
  May: "May", Jun: "Jun", Jul: "Jul", Aug: "Ago",
  Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dic",
};

function yearlyBreakdownToChartData(
  breakdown: Record<string, number>
): { label: string; value: number }[] {
  return Object.entries(breakdown).map(([key, value]) => ({
    label: MONTH_MAP[key] ?? key,
    value,
  }));
}
```

### 4.2 Transformación desde `byDay` / `dailyBreakdown` (vista mensual)

```ts
// Backend retorna: { data: { dailyBreakdown: { "01": 500, "02": 300, ... } } }
// Necesitamos: [{ label: "01", value: 500 }, { label: "02", value: 300 }, ...]

function dailyBreakdownToChartData(
  breakdown: Record<string, number>
): { label: string; value: number }[] {
  return Object.entries(breakdown)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))  // orden numérico
    .map(([day, value]) => ({
      label: day,
      value,
    }));
}
```

### 4.3 Transformación para comparativas (múltiples series)

Cuando se quiere comparar dos módulos (ej. Ingresos vs Gastos en el mismo gráfico), se necesita **hacer merge de ambos datasets**:

```ts
// Para vista anual comparativa Income vs Expense
// Resultado: [{ label: "Ene", income: 1500, expense: 1200 }, ...]

function mergeYearlyBreakdowns(
  incomeBreakdown: Record<string, number>,
  expenseBreakdown: Record<string, number>
): { label: string; income: number; expense: number }[] {
  return Object.keys(MONTH_MAP).map((key) => ({
    label: MONTH_MAP[key],
    income: incomeBreakdown[key] ?? 0,
    expense: expenseBreakdown[key] ?? 0,
  }));
}
```

> **Nota:** Para comparativas, la API debe llamarse una vez por cada módulo. Considerar usar `Promise.all` en el hook o usar React Query con `useQueries`.

---

## 5. Gráfico de Barras con Recharts + Tailwind + Dark Mode

### 5.1 Componente base `BaseBarChart`

```tsx
// Concepto de arquitectura — patrón reusable

// Colores definidos en chart-theme.ts
const CHART_COLORS = {
  debt:    { light: "#f97316", dark: "#fb923c" },  // orange
  income:  { light: "#22c55e", dark: "#4ade80" },  // green
  expense: { light: "#ef4444", dark: "#f87171" },  // red
  loan:    { light: "#8b5cf6", dark: "#a78bfa" },  // violet
  barFill: { light: "#3b82f6", dark: "#60a5fa" },  // blue
};

interface BaseBarChartProps {
  data: { label: string; value: number }[];
  height?: number;                     // default: 300
  color?: keyof typeof CHART_COLORS;   // default: "barFill"
  showGrid?: boolean;
  showTooltip?: boolean;
  showAxis?: boolean;
  valueFormatter?: (v: number) => string;
  barSize?: number;
}

// Internamente usa:
// - <ResponsiveContainer> de Recharts para width 100%
// - <BarChart data={data}>
// - <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
// - <XAxis dataKey="label" className="fill-gray-600 dark:fill-gray-400 text-xs" />
// - <YAxis className="fill-gray-600 dark:fill-gray-400 text-xs" />
// - <Tooltip content={<ChartTooltip />} />
// - <Bar dataKey="value" fill={colorActual} radius={[4,4,0,0]} />
```

### 5.2 Personalización del Tooltip con dark mode

```tsx
// Concepto de ChartTooltip — usa Tailwind dark:

function ChartTooltip({ active, payload, label, valueFormatter }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`
      rounded-lg border px-3 py-2 shadow-lg
      bg-white dark:bg-gray-800
      border-gray-200 dark:border-gray-700
    `}>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {valueFormatter(payload[0].value)}
      </p>
    </div>
  );
}
```

### 5.3 Ejemplo: Gráfico de barras de Ingresos (vista anual)

```tsx
// Uso en el Dashboard
function IncomeYearlyBarChart({ year }: { year: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["incomes", "summary", "yearly", year],
    queryFn: () => incomesApi.getYearlySummary(year),
  });

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ChartError error={error} />;

  const chartData = yearlyBreakdownToChartData(
    data.data.monthlyBreakdown
  );

  return (
    <BaseBarChart
      data={chartData}
      color="income"
      valueFormatter={(v) => `$${v.toLocaleString("es-CO")}`}
    />
  );
}
```

---

## 6. Gráfico de Líneas con Puntos (Line Chart con dots)

### 6.1 Cuándo usar línea en vez de barras

| Gráfico | Ideal para |
|---------|-----------|
| **Barras** | Comparar valores discretos (mes a mes, día a día) |
| **Línea con puntos** | Mostrar tendencia / evolución en el tiempo, especialmente útil para vista diaria (31 puntos) o para superponer múltiples series |

### 6.2 Componente base `BaseLineChart`

```tsx
// Concepto de arquitectura

interface BaseLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: keyof typeof CHART_COLORS;
  showDots?: boolean;           // puntos visibles en cada data point
  showArea?: boolean;           // área sombreada bajo la línea
  strokeWidth?: number;         // grosor de línea (default: 2)
  dotRadius?: number;           // radio de puntos (default: 4)
  connectNulls?: boolean;       // unir gaps
  showGrid?: boolean;
  showTooltip?: boolean;
  valueFormatter?: (v: number) => string;
}

// Internamente usa:
// - <ResponsiveContainer>
// - <LineChart data={data}>
// - <CartesianGrid className="stroke-gray-200 dark:stroke-gray-700" />
// - <XAxis dataKey="label" />
// - <YAxis />
// - <Tooltip content={<ChartTooltip />} />
// - <Line
//     type="monotone"
//     dataKey="value"
//     stroke={color}
//     strokeWidth={strokeWidth}
//     dot={showDots ? { r: dotRadius, fill: color } : false}
//     activeDot={{ r: 6 }}    // dot más grande en hover
//   />
// - {showArea && <Area type="monotone" dataKey="value" fill={color} fillOpacity={0.1} />}
```

### 6.3 Dot styling para dark mode en Recharts

```tsx
// Los dots (puntos) en Recharts aceptan props de estilo
// Se debe usar un approach basado en props, ya que los SVG internos no aceptan className/dark:

const dotStyle = {
  r: 4,
  strokeWidth: 2,
  stroke: isDarkMode ? "#60a5fa" : "#3b82f6",    // borde
  fill: isDarkMode ? "#1e293b" : "#ffffff",       // relleno blanco/dark
};
```

---

## 7. Integración con el Dashboard — Plan de Componentes

### 7.1 Vista general del Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                           │
│                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ KPIs (Overall)      │  │ KPIs (Overall)      │   │
│  │ Deudas | Ingresos   │  │ Gastos | Préstamos  │   │
│  └─────────────────────┘  └─────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ [Año: 2024 ▼] [Tipo: Barras ◐ Líneas]        │   │
│  │                                                │   │
│  │  ██  ██                                        │   │
│  │  ██  ██  ██     ██                             │   │
│  │  ██  ██  ██  ██  ██  ██     ██                │   │
│  │  ██  ██  ██  ██  ██  ██  ██  ██  ██  ██      │   │
│  │  Ene Feb Mar Abr May Jun Jul Ago Sep Oct ...   │   │
│  │  Histórico Anual — Ingresos vs Gastos          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ Histórico Deudas    │  │ Rendimiento Préstamos│   │
│  │ (barras mensuales)  │  │ (líneas por loan)    │   │
│  └─────────────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 7.2 Gráficos planificados

| # | Gráfico | Tipo | Datos | Filtros |
|---|---------|------|-------|---------|
| 1 | Ingresos vs Gastos anual | Barras superpuestas | `yearlyBreakdown` de ambos módulos | Año |
| 2 | Histórico de Deudas | Barras (por mes) | `GET /debts/summary/yearly` | Año |
| 3 | Histórico de Ingresos | Barras o Línea | `GET /incomes/summary/yearly` | Año |
| 4 | Histórico de Gastos | Barras | `GET /expenses/summary/monthly` × 12 (agregado manual) | Año |
| 5 | Rendimiento de Préstamos | Línea (múltiples series, uno por préstamo) | `GET /loans` → filtrar activos → `GET /loans/summary/performance/:id` | — |
| 6 | Detalle diario (cualquier módulo) | Línea con puntos | `GET /.../summary/monthly?year=&month=` | Año + Mes |

### 7.3 Consideración especial: Gastos sin endpoint yearly

El módulo de Gastos **no tiene endpoint `/expenses/summary/yearly`**. Para graficar el histórico anual de gastos hay dos opciones:

**Opción A — Agregar endpoint yearly (recomendado):**
Solicitar a `@backend-dev` que implemente `GET /expenses/summary/yearly?year=` con la misma firma que debts e incomes.

**Opción B — Agregar en el frontend:**
Hacer 12 llamadas a `GET /expenses/summary/monthly?year=YYYY&month=1..12` con `useQueries` y ensamblar el `monthlyBreakdown`. Esto implica 12 llamadas API cada vez que cambia el año.

---

## 8. Estrategia de Carga y Performance

### 8.1 React Query — Configuración para datos de gráficos

```ts
// staleTime más largo para resúmenes (los datos históricos no cambian seguido)
const CHART_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,    // 10 minutos
  gcTime: 30 * 60 * 1000,        // 30 minutos
  retry: 2,
  refetchOnWindowFocus: false,   // no recargar datos históricos al cambiar pestaña
};
```

### 8.2 Skeleton Loading para gráficos

```tsx
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
      style={{ height }}
    >
      {/* Opcional: skeleton más elaborado con barras simuladas */}
    </div>
  );
}
```

### 8.3 Lazy Loading de secciones del Dashboard

Cada `*ChartSection` debe cargarse con `React.lazy()` + `Suspense`:

```tsx
const DebtChartSection = React.lazy(
  () => import("@/features/dashboard/components/DebtChartSection")
);
const IncomeChartSection = React.lazy(
  () => import("@/features/dashboard/components/IncomeChartSection")
);
const ExpenseChartSection = React.lazy(
  () => import("@/features/dashboard/components/ExpenseChartSection")
);
const LoanChartSection = React.lazy(
  () => import("@/features/dashboard/components/LoanChartSection")
);
```

### 8.4 Prevención de requests innecesarios

- Implementar `enabled` option en `useQuery` para no disparar la consulta hasta que los filtros estén listos (año/mes seleccionados).
- Usar `keepPreviousData: true` (React Query v4) o `placeholderData: keepPreviousData` (v5) para evitar flashes de loading al cambiar de año.

---

## 9. Dark Mode — Estrategia Completa

### 9.1 Colores del tema para gráficos (chart-theme.ts)

```ts
// Concepto — constantes exportables

export const CHART_COLORS = {
  debt:    { light: "#f97316", dark: "#fb923c" },
  income:  { light: "#22c55e", dark: "#4ade80" },
  expense: { light: "#ef4444", dark: "#f87171" },
  loan:    { light: "#8b5cf6", dark: "#a78bfa" },
  blue:    { light: "#3b82f6", dark: "#60a5fa" },
} as const;

// Hook que retorna el color según tema actual
export function useChartColor(module: keyof typeof CHART_COLORS): string {
  const { isDark } = useTheme();   // usa el ThemeContext de PFM
  return isDark ? CHART_COLORS[module].dark : CHART_COLORS[module].light;
}
```

### 9.2 Elementos del gráfico que deben adaptarse al dark mode

| Elemento | Clase Tailwind (light / dark) |
|----------|-------------------------------|
| Grid lines | `stroke-gray-200 dark:stroke-gray-700` |
| Texto de ejes | `fill-gray-600 dark:fill-gray-400` |
| Tooltip fondo | `bg-white dark:bg-gray-800` |
| Tooltip borde | `border-gray-200 dark:border-gray-700` |
| Tooltip texto | `text-gray-900 dark:text-gray-100` |
| Barras / Líneas | Definido por `useChartColor(module)` |
| Dots (relleno) | `#fff` en light, `#1e293b` (gray-800) en dark |
| Área bajo línea | Mismo color que línea con `fillOpacity: 0.1` |

---

## 10. Resumen de Decisiones de Arquitectura

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Librería de gráficos | **Recharts** | Mejor DX en React, gran comunidad, bundle razonable, TypeScript nativo |
| Componentes base | `BaseBarChart` + `BaseLineChart` en `shared/components/charts/` | Reusabilidad entre módulos del Dashboard |
| Wrapper de sección | `ChartCard` con skeleton, selectores y toggle | Consistencia visual y DRY |
| Colores | Sistema de colores por módulo (`chart-theme.ts`) | Identidad visual consistente con el dominio |
| Transformación de datos | Funciones puras en `features/dashboard/utils/` | Separación de responsabilidades, testables |
| Carga de datos | React Query con `staleTime: 10min` + `keepPreviousData` | UX fluida al cambiar filtros |
| Lazy loading | `React.lazy()` por sección de gráfico | No bloquear el Dashboard inicial |
| Dark mode | Hook `useChartColor` + clases `dark:` en wrappers | Consistente con el sistema `class` de Tailwind del proyecto |

---

## 11. Próximos Pasos

1. [ ] Instalar Recharts: `cd frontend && npm install recharts`
2. [ ] Crear `frontend/src/shared/components/charts/chart-theme.ts`
3. [ ] Implementar `BaseBarChart` y `BaseLineChart`
4. [ ] Implementar `ChartTooltip` y `ChartSkeleton`
5. [ ] Implementar `ChartCard` wrapper
6. [ ] Crear funciones de transformación en `features/dashboard/utils/`
7. [ ] Solicitar a `@backend-dev` el endpoint `GET /expenses/summary/yearly`
8. [ ] Implementar `DebtChartSection`, `IncomeChartSection`, etc.
9. [ ] Integrar secciones con React.lazy() en `DashboardPage`
10. [ ] Verificar dark mode en todos los gráficos

---

## 12. Roadmap de Features Futuros — Robustez, Prevención y Predicción

> **Fuente:** Análisis comparativo de PFM vs sistemas líderes (YNAB, Empower, Quicken, Mint, PocketGuard).  
> Los features están organizados en tres pilares: **Robustez** (completitud), **Prevención** (alertas antes del problema) y **Predicción** (pronóstico del futuro financiero).

### 12.1 ¿Qué tiene PFM hoy vs qué tienen los líderes?

| Dimensión | PFM hoy | YNAB | Empower | Quicken |
|-----------|---------|------|---------|---------|
| Registro de transacciones | Manual (CRUD básico) | Manual + auto-import bancario | Auto-import + agregación | Auto-import + 35 años de historia |
| Categorización | ❌ No existe | Manual + reglas | Auto-categorización | Auto-categorización avanzada |
| Presupuestos mensuales | ❌ No existe | Zero-based budgeting | Tracking vs plan | Presupuestos detallados |
| Reportes / Gráficos | Planeado (ver secciones 1–11) | Spending trends, Net Worth | Portfolio + Cash Flow | +150 reportes |
| Metas de ahorro | ❌ No existe | Targets con progreso | Savings Planner | Goals |
| Simulador de deudas | ❌ No existe | Loan calculator (ahorro de interés) | Debt Paydown | Debt Reduction Planner |
| Alertas / Notificaciones | ❌ No existe | Budget warnings | Spending alerts | Bill reminders |
| Net Worth (patrimonio neto) | ❌ No existe | ✅ | ✅ (foco principal) | ✅ |
| Proyecciones / Forecast | ❌ No existe | ❌ | Retirement Planner | Lifetime Planner |

---

### 12.2 Features ROBUSTOS — Completitud y profesionalismo

Features que todo gestor financiero debe tener para ser considerado completo.

| # | Feature | Backend requerido | Frontend requerido | Prioridad |
|---|---------|-------------------|--------------------|-----------|
| **C1** | **Categorías** — `ExpenseCategory` / `IncomeCategory` con nombre, ícono y color. Relación `categoryId` en Expense e Income. | Nueva entidad + migración + CRUD endpoints + relación en DTOs | Selector de categoría en formularios de Expense/Income, vista agrupada por categoría, gráfico de torta por categoría | 🔴 Crítico |
| **C2** | **Presupuestos mensuales** — `Budget` entity (categoryId, month, year, limit, spent). Endpoint `GET /budgets?month=&year=` que calcule `spent` en tiempo real. | Nuevo módulo completo: entidad, repositorio, servicio, controlador. Lógica de agregación `spent = SUM(expenses WHERE category=X AND month=Y)` | Vista de presupuestos con barras de progreso, indicador visual de % consumido (verde → amarillo → rojo), formulario para crear/editar límites | 🔴 Crítico |
| **C3** | **Exportación de datos** — CSV/PDF de transacciones y resúmenes. | Endpoint `GET /expenses/export?format=csv&startDate=&endDate=` (aplicable a los 4 módulos). Usar `json2csv` en backend. | Botón "Exportar" en cada lista/gráfico. Generación de PDF con `jspdf` + `jspdf-autotable`. | 🟠 Alta |
| **C4** | **Transacciones recurrentes** — Campos `isRecurring: boolean`, `frequency: enum(weekly/monthly/yearly)`, `nextDate: Date` en Expense/Income. | Nuevos campos en entidades + migración. Job programado (`@nestjs/schedule`) que clone transacciones recurrentes cuando `nextDate <= today`. | Badge "Recurrente" en listas, opción "¿Es recurrente?" en formularios, selector de frecuencia. | 🟠 Alta |
| **C5** | **Múltiples cuentas** — `Account` entity (name, type: cash/bank/creditCard, balance). Relación `accountId` en Expense/Income. | Nueva entidad + migración + CRUD. Extender resúmenes para filtrar por cuenta. | Selector de cuenta en formularios y filtros. Resumen de saldo por cuenta en Dashboard. | 🟡 Media |
| **C6** | **Etiquetas / Tags** — `Tag` entity + tabla pivote `transaction_tags`. Relación many-to-many con Expense/Income. | Entidad Tag + CRUD + tabla pivote + migración. Filtro por tag en endpoints de lista. | Input de tags (autocomplete) en formularios. Filtro por tag en vistas de lista. | 🟡 Media |
| **C7** | **Perfil de usuario** — Extender `UserEntity`: avatar, `currency` (default: COP), `timezone`, `notificationsEnabled`. | Nuevos campos en User entity + migración + endpoint `PUT /auth/profile`. | Pantalla Settings con formulario de perfil, selector de moneda, toggle de notificaciones. | 🟡 Media |
| **C8** | **Notas en transacciones** — Campo `notes: text` en Expense/Income/Debt/Loan. | Nuevo campo en cada entidad + migración. Incluir en DTOs de creación/edición. | Campo de texto multilínea opcional en cada formulario. Visible en vistas de detalle. | 🟢 Baja |

---

### 12.3 Features PREVENTIVOS — Alertas antes del problema

Features que advierten al usuario antes de que ocurra un evento financiero negativo.

| # | Feature | Backend requerido | Frontend requerido | Prioridad |
|---|---------|-------------------|--------------------|-----------|
| **P1** | **Alertas de presupuesto** — "Llevas gastado el 80% de tu presupuesto de Alimentación este mes." | Endpoint `GET /budgets/alerts` que compare `spent` vs `limit` y retorne budgets en nivel warning (≥80%) y danger (≥100%). | Widget "Alertas de Presupuesto" en Dashboard con badges de colores. Barra de progreso con umbrales visuales. Toasts al crear un gasto que supere el umbral. | 🔴 Crítico |
| **P2** | **Alertas de vencimiento** — "Tu cuota de $500 a Banco X vence en 3 días." / "El préstamo a Juan vence mañana." | Endpoint `GET /alerts/due-dates?days=7` que compare `debt.date` / `loan.date` contra fecha actual y retorne los que vencen en N días. | Widget "Próximos Vencimientos" en Dashboard con contador de días restantes. Color coding: >7 días verde, 3-7 amarillo, 1-2 naranja, hoy/vence rojo. | 🔴 Crítico |
| **P3** | **Detección de anomalías** — "Este gasto de $800 es 3× tu promedio en Transporte ($267)." | Lógica en `POST /expenses`: al crear un gasto, comparar `amount` con el promedio de los últimos 3-6 meses para esa categoría. Retornar flag `isAnomaly: true` en la respuesta. | Banner/toast de advertencia al crear un gasto anómalo. Opción "Marcar como correcto" para entrenar umbrales. | 🟠 Alta |
| **P4** | **Proyección de sobregiro** — "Con tus gastos recurrentes y deudas, tu saldo estimado el 15 de mayo será de -$200,000." | Endpoint `GET /cash-flow/projection?days=90` que sume ingresos recurrentes proyectados - gastos recurrentes - cuotas de deuda, y calcule saldo diario estimado. | Gráfico de línea con área que muestre el saldo proyectado. Línea roja horizontal en $0. Alerta si la proyección cruza $0. | 🟠 Alta |
| **P5** | **Health Check financiero** — Score de salud financiera: savings rate, debt-to-income ratio, emergency fund. | Endpoint `GET /health-check` que calcule: `savingsRate = (income - expense) / income`, `dtiRatio = totalDebtPayments / totalIncome`, cobertura de fondo de emergencia. | Widget "Salud Financiera" en Dashboard con score circular (0-100) y breakdown de cada métrica con recomendaciones. | 🟡 Media |
| **P6** | **Widget de deudas morosas** — PFM ya tiene `GET /loans/summary/overdue`. Solo falta mostrarlo. | Ya implementado. | Widget en Dashboard: card roja con contador de préstamos vencidos + lista de los 3 más urgentes con link a detalle. | 🟢 Baja |
| **P7** | **Notificaciones configurables** — Email / in-app para cuotas, presupuestos, anomalías. | Tabla `Notification` (userId, type, title, message, read, createdAt). Jobs con `@nestjs/schedule` para generar notificaciones diarias. | Campanita con badge de no leídas en navbar. Panel de notificaciones desplegable. Pantalla Settings con toggles por tipo de notificación. | 🟢 Baja |

---

### 12.4 Features PREDICTIVOS — Pronóstico del futuro financiero

Features que usan datos históricos para proyectar escenarios futuros.

| # | Feature | Backend requerido | Frontend requerido | Prioridad |
|---|---------|-------------------|--------------------|-----------|
| **F1** | **Proyección de flujo de caja a 30/60/90 días** — Saldo diario estimado basado en ingresos y gastos recurrentes proyectados. | Usa los datos de **P4** (proyección de sobregiro). Endpoint `GET /cash-flow/projection?days=90`. Algoritmo: `saldoInicial + Σ ingresosProyectados(día) - Σ gastosProyectados(día) - Σ cuotas(día)`. | Gráfico de línea (`BaseLineChart`) con área sombreada bajo la curva. Eje Y: saldo estimado. Eje X: días. Línea horizontal en $0. Tooltip con breakdown diario. | 🔴 Crítico |
| **F2** | **Simulador de pago de deudas** — "Si pago $50,000 extra al mes en este préstamo, ahorraré $320,000 en intereses y terminaré 8 meses antes." | Endpoint `GET /loans/:id/simulate?extraPayment=X`. Usa los datos ya existentes de `Loan` (interestRate, remainingAmount, installment). Aplica fórmula de amortización con pago extra. Retorna: `{ monthsSaved, interestSaved, newPayoffDate, amortizationTable[] }`. | Modal/Panel interactivo: slider de "Pago extra mensual", tabla de amortización comparativa (plan actual vs acelerado), gráfico de barras comparando interés total. | 🔴 Crítico |
| **F3** | **Forecast de gastos por categoría** — "El próximo mes estimamos $450,000 en Alimentación (basado en tu promedio de 3 meses)." | Endpoint `GET /expenses/forecast?months=3` que calcule media móvil simple por categoría sobre los últimos N meses usando `GET /expenses/summary/monthly`. Retorna: `{ category, historicalAvg, forecast, trend: 'up'|'down'|'stable' }`. | Widget de forecast en Dashboard: card por categoría con valor proyectado + flecha de tendencia + % de cambio vs mes anterior. | 🟠 Alta |
| **F4** | **Proyección de patrimonio neto (Net Worth)** — `Assets - Liabilities` histórico y proyectado. | Nueva entidad `Asset` (name, type, value, date) para registrar bienes. Endpoint `GET /net-worth/history` que calcule: `Σ assets - Σ (debt.remainingAmount + loan.remainingAmount)` por mes. Endpoint `GET /net-worth/projection` para proyectar a futuro. | Gráfico de área (`AreaChart` de Recharts) con assets (verde), liabilities (rojo) y net worth (azul). Vista histórica + toggle de proyección. | 🟠 Alta |
| **F5** | **Planificador de metas de ahorro** — "Meta: $5,000,000 para un carro. Plazo: 12 meses. Necesitas ahorrar $416,667/mes." | Nueva entidad `SavingsGoal` (name, targetAmount, deadline, currentAmount, monthlyContribution, category). CRUD + endpoint `GET /savings-goals/:id/projection` que calcule fecha estimada de cumplimiento. | Card de meta con barra de progreso circular, fecha estimada de cumplimiento, botón "Aportar", gráfico de línea de progreso. | 🟡 Media |
| **F6** | **Escenarios "What-If"** — "¿Qué pasa si elimino este ingreso? ¿Y si tomo este nuevo préstamo?" | Endpoint `POST /cash-flow/scenario` que reciba overrides (removeIncomeIds, addExpense, addLoan) y recalcule la proyección de flujo de caja (F1) bajo ese escenario. | Panel interactivo: toggles para activar/desactivar fuentes de ingreso, sliders para agregar gastos/ préstamos hipotéticos. Gráfico comparativo: escenario base vs escenario alternativo. | 🟡 Media |
| **F7** | **Simulador de préstamos** — "Si pido $10,000,000 al 12% anual a 24 meses, mi cuota será de $470,735." | Endpoint `POST /loans/calculate` (no guarda, solo calcula). Recibe: amount, interestRate, months. Retorna: `{ monthlyPayment, totalInterest, totalPayment, amortizationTable[] }`. | Calculadora standalone: inputs de monto, tasa, plazo. Resultado: cuota mensual + tabla de amortización + gráfico de torta (capital vs interés). | 🟢 Baja |
| **F8** | **Predicción de categoría** — Auto-sugerir categoría al crear una transacción basada en el texto "reason" y el histórico. | Regla simple en backend: buscar la categoría más frecuente para ese `reason` en los últimos 90 días. Retornar `suggestedCategoryId` al hacer `GET /categories/suggest?reason=X`. | Autocompletado del campo categoría en formularios de Expense/Income al escribir el motivo. | 🟢 Baja |

---

### 12.5 Datos que PFM ya almacena y que habilitan estos features

| Dato existente en PFM | Feature que habilita directamente |
|------------------------|-----------------------------------|
| `Loan.interestRate`, `Loan.remainingAmount`, `Loan.installment`, `Loan.payments` | **F2** — Simulador de pago de deudas |
| `Loan.date`, `Debt.date` + campos de cuotas | **P2** — Alertas de vencimiento |
| `GET /loans/summary/overdue` (ya implementado) | **P6** — Widget de deudas morosas |
| `GET /*/summary/monthly?year=&month=` (ya implementado) | **F3** — Forecast de gastos por categoría |
| `GET /*/summary/yearly?year=` (ya implementado) | **F1** — Proyección de flujo de caja + **F4** — Net Worth histórico |
| `Expense.amount`, `Expense.date` | **P3** — Detección de anomalías (comparar vs promedio de la categoría) |
| `Debt.finalAmount`, `Debt.remainingAmount`, `Debt.paidAmount` | **P5** — Health check (debt-to-income ratio) |
| `Income.amount` + `Expense.amount` | **P5** — Health check (savings rate) |
| `Loan.initialAmount`, `Loan.interestRate` | **F7** — Simulador de préstamos (usa misma fórmula de amortización) |

---

### 12.6 Roadmap por Fases

```
Fase 1 — Robustez básica (lo mínimo para ser un PFM completo)
├── C1. Categorías para Expenses e Incomes
├── C2. Presupuestos mensuales por categoría
└── C3. Exportación CSV de transacciones

Fase 2 — Prevención (alertas que evitan problemas)
├── P1. Alertas de presupuesto (80% y 100% consumido)
├── P2. Alertas de vencimiento de cuotas
├── P6. Widget de deudas morosas en Dashboard (datos ya listos)
└── C4. Transacciones recurrentes (base para proyecciones)

Fase 3 — Predicción (mirar hacia adelante)
├── F2. Simulador de pago de deudas (usa datos existentes de Loan)
├── F1. Proyección de flujo de caja a 30/60/90 días
├── F3. Forecast de gastos por categoría (próximo mes)
└── P3. Detección de anomalías en gastos

Fase 4 — Avanzado
├── F4. Proyección de patrimonio neto (Net Worth)
├── F5. Metas de ahorro con tracking y proyección
├── P5. Health check financiero con score
└── F6. Escenarios "What-If" (simulador de escenarios)

Fase 5 — Premium
├── C5. Múltiples cuentas (bancos, efectivo, tarjetas)
├── C6. Etiquetas / Tags en transacciones
├── F7. Simulador de préstamos (calculadora standalone)
├── P7. Notificaciones configurables (email + in-app)
├── C7. Perfil de usuario avanzado
├── F8. Predicción automática de categorías
└── C8. Notas en transacciones
```

---

### 12.7 Prerrequisitos técnicos transversales

| Prerrequisito | Fases que lo necesitan | Descripción |
|---------------|----------------------|-------------|
| **Sistema de notificaciones** | Fase 2, 5 | Tabla `Notification` + endpoints + badge en navbar. Base para todas las alertas. |
| **Job scheduler** | Fase 1, 2, 3 | `@nestjs/schedule` para generar transacciones recurrentes, notificaciones diarias de vencimiento, y recalcular presupuestos. |
| **Módulo de Categorías** | Fase 1 (prerrequisito para casi todo) | Sin categorías, no hay presupuestos, ni forecasts, ni anomalías, ni health check. Es la base de todo el análisis financiero. |
| **Fórmulas financieras compartidas** | Fase 3, 5 | Módulo `shared/finance-utils.ts` con: amortización francesa, valor futuro, media móvil, regresión lineal simple. Reusable entre features. |
