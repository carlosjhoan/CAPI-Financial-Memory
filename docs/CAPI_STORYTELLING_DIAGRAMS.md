# CAPI — Storytelling & Visual Communication Guide

> Documento de arquitectura visual para Personal Finance Manager (PFM).
> Basado en: Storytelling with Data (Knaflic), Behavioral Economics (Kahneman, Thaler, BIT),
> Financial Data Visualization research y WCAG accessibility standards.
> Fecha: 2026-05-12 | Versión: 1.0

---

## 1. Principios de Storytelling (basado en Cole Nussbaumer Knaflic)

### 1.1 Los 6 Principios (5+1) de Storytelling with Data

Knaflic establece un proceso iterativo de 6 lecciones que se aplican directamente al diseño visual de un PFM:

| # | Principio | Traducción a PFM |
|---|-----------|-------------------|
| 1 | **Understand the context** | Antes de graficar, definir: ¿quién es el usuario? (asalariado, freelancer, familia). ¿Qué necesita saber o hacer? (¿estoy gastando mucho? ¿voy bien con mis metas?). Cada gráfico debe responder UNA pregunta específica. |
| 2 | **Choose an appropriate display** | No todos los datos merecen un gráfico. Una KPI card basta para el net worth. Un waterfall es necesario para el flujo ingresos → bolsillos → gastos. Seleccionar el tipo según la historia que se cuenta. |
| 3 | **Eliminate clutter** | Maximizar el "data-ink ratio" (Tufte). En PFM: quitar bordes de tablas, fondos de gradiente innecesarios, gridlines redundantes, etiquetas en cada barra si el valor es obvio por la longitud. |
| 4 | **Draw attention where you want it** | Usar atributos pre-atencionales (color, tamaño, posición) para dirigir la mirada. Ej: en un dashboard de gastos, que el color rojo resalte solo la categoría con mayor desviación vs presupuesto, no todo. |
| 5 | **Think like a designer** | Affordance (que el UI comunique su uso), accesibilidad (WCAG), estética (consistencia visual). En PFM: un progress bar "afforda" progreso; un gauge circular no. |
| 6 | **Tell a story** | Todo dashboard debe tener: inicio (resumen), conflicto (dónde está el problema financiero), resolución (qué hacer al respecto). Ej: "Gastaste 20% más este mes → Aquí está dónde → Sugerencia: reducir restaurantes." |

### 1.2 Clutter (Ruido Visual) — Lo que DEBES eliminar

Basado en Knaflic y Tufte, estos son elementos que SATURAN sin aportar información:

- **Gridlines excesivas**: solo mantener la línea base (y quizás una referencia del target).
- **Bordes de tabla**: en React, usar `border-collapse: collapse` con `border: none` y separar filas con sombras suaves o `row backgrounds` alternados.
- **Efectos 3D**: en finanzas personales, nunca. Zero contexto, puro ruido.
- **Leyendas separadas**: mejor etiquetar directamente sobre las barras/áreas.
- **Ejes redundantes**: si usas sparklines, no necesitas ejes X/Y.
- **Saturación de colores**: más de 5 colores diferentes en un mismo gráfico es señal de alerta.

### 1.3 Atributos Pre-Atencionales (Preattentive Attributes)

Son propiedades visuales que el cerebro procesa en <500ms sin esfuerzo consciente (Ware, 2004; Knaflic, 2015). Los más relevantes para PFM:

| Atributo | Cómo usarlo en PFM |
|----------|---------------------|
| **Color (hue/saturación)** | Categorizar gastos, señalar déficit (rojo), superávit (verde). NO usar color como único canal (problema de daltonismo). |
| **Posición 2D** | El método más preciso para comparar cantidades. Barras alineadas a un eje común son mejores que áreas/pastel. |
| **Longitud** | Comparar magnitudes: gasto de este mes vs anterior. Barras verticales/horizontales. |
| **Tamaño/Área** | Útil en treemaps para mostrar proporción de gastos. Segundo mejor después de posición/longitud. |
| **Forma** | Diferenciar tipos de transacción (ícono de supermercado vs restaurante) sin depender de color. |
| **Intensidad** | Resaltar valores atípicos: un gasto muy alto en una categoría se muestra con saturación más intensa. |

**Regla de oro**: Usar atributos pre-atencionales para crear jerarquía visual. Lo más importante debe "pop out" sin que el usuario tenga que buscarlo.

### 1.4 Estructura Narrativa para PFM

Knaflic recomienda estructura de 3 actos (Aristóteles) para datos:

1. **Setup** (Contexto): "Este mes tus ingresos fueron $5,000 y tus gastos $4,200."
2. **Conflict** (Problema): "Tus gastos en restaurantes subieron 30% vs el mes pasado."
3. **Resolution** (Acción): "Reducir salidas a comer te ahorraría $200 este mes."

**Implementación en React**: Usar `aria-live` regions para narrativa textual que acompaña los gráficos. Ejemplo:
```tsx
// Componente narrativo que cambia según datos
<Card aria-live="polite">
  <p className="text-slate-300 text-sm">
    {narrative.setup} — <span className="text-red-400">{narrative.conflict}</span>.
    {narrative.resolution && ` ${narrative.resolution}`}
  </p>
</Card>
```

---

## 2. Psicología del Comportamiento Aplicada

### 2.1 Principios Clave de Behavioral Economics para PFM

#### Loss Aversion (Kahneman & Tversky, 1979)
Las pérdidas duelen ~2.25× más que lo que las ganancias equivalentes satisfacen.

**Aplicación en PFM**:
- Mostrar **lo que se pierde** si no se ahorra, no solo lo que se gana.
- Alertas visuales: "Este mes perdiste $50 en intereses por no pagar tu tarjeta a tiempo."
- **Contrato de comportamiento**: usar red backgrounds suaves para gastos excesivos, no para gastos normales.
- **Cuidado con sobre-uso de rojo**: según Nielsen Norman Group, demasiado rojo causa "app avoidance". Usar solo para alertas reales.

#### Mental Accounting (Thaler, 1985)
Las personas categorizan mentalmente el dinero en "bolsillos virtuales" con reglas distintas.

**Aplicación en PFM** (directa al sistema de Pockets):
- El sistema de **Pockets** es literalmente un mental accounting tool.
- **Nombrar los pockets activa el efecto**: un pocket llamado "Viaje a Japón 2027" tiene mayor tasa de ahorro que uno llamado "Ahorro general" (Soman & Cheema, 2011).
- **Visualizar progreso con barra de cumplimiento** incrementa la adherencia en varios puntos porcentuales.
- **Framing de ingresos**: un ingreso etiquetado como "Bonus" se gasta más rápido que el mismo monto etiquetado como "Salario". Al asignar ingresos a pockets, sugerir automáticamente: "¿Quieres asignar este bono a tu pocket de Meta?"

#### Salience Bias
La gente tiende a sobredimensionar la información más prominente.

**Aplicación**:
- Hacer visible el **gasto diario total** en el dashboard (prominente, grande, sin scroll).
- Mostrar el **impacto acumulado** de pequeños gastos: "50 cafés al mes = $1,500."

#### Status Quo Bias
La gente tiende a no cambiar la opción por defecto.

**Aplicación**:
- **Defaults poderosos**: al registrar un ingreso, pre-seleccionar el pocket de "Ahorro" con 10% como default.
- **Auto-asignación**: "Guardar $X automáticamente cada mes" como opción por defecto.

#### Present Bias
La gente sobrevalora el presente vs el futuro.

**Aplicación**:
- **Compromiso previo**: permitir al usuario programar ahorros futuros (commitment device).
- **Visualización de largo plazo**: sparkline de net worth a 12 meses es más efectivo que el valor puntual.

### 2.2 Framework EAST (Behavioral Insights Team)

El marco EAST del BIT (2014, actualizado 2024) es el estándar para aplicar behavioral insights:

| Principio | Aplicación en PFM |
|-----------|-------------------|
| **Easy** | Registro de gastos en <2 taps. Pre-categorización automática por recurrencia. Sugerencias de asignación a pockets. |
| **Attractive** | Visualizaciones coloridas pero semánticas. Uso de colores emocionales (verde = bien, rojo = alerta, azul = meta). Personalización del dashboard. |
| **Social** | (Futuro) Comparación anónima: "Los usuarios como tú ahorran 15% de sus ingresos." Normas sociales descriptivas. |
| **Timely** | Alertas en el momento correcto: "Llegó tu salario — asigna a tus pockets AHORA." No molestar a las 2am. |

### 2.3 Framing (Encuadre) y Colores Emocionales

| Color | Emoción/Significado | Uso en PFM | Referencia |
|-------|---------------------|------------|------------|
| **Verde** (`#22C55E`) | Ganancia, crecimiento, salud | Ingresos, superávit, metas cumplidas | Color emocional universal (Machin, 2007) |
| **Rojo** (`#EF4444`) | Pérdida, alerta, peligro | Gastos sobre presupuesto, deuda, déficit | Aversión a pérdida; usar con moderación |
| **Azul** (`#3B82F6`) | Confianza, estabilidad, meta | Pockets, proyecciones, net worth | Confianza institucional financiera (ColorArchive) |
| **Ámbar/Amber** (`#F59E0B`) | Precaución, atención | Gastos cerca del límite, renovación de suscripción | BIT: alerta media antes de rojo |
| **Púrpura** (`#A855F7`) | Proyección, futuro, planes | Metas a largo plazo, proyecciones de ahorro | Forecast colors (ColorArchive) |
| **Gris neutro** (`#6B7280`) | Histórico, pasado, baseline | Datos de meses anteriores, comparativos sin énfasis | De-emphasis (Knaflic) |

**Importante**: El rojo/verde para pérdida/ganancia es un convention universal en finanzas, respaldado por investigación (Gilad et al., 2012 — "Red light, green light: Color priming in financial decisions"). Sin embargo, ~8% de hombres tienen deuteranopia. **NUNCA usar color como único canal informativo**.

---

## 3. Catálogo de Gráficos Recomendados

### 3.1 Tabla de Decisiones

| Tipo | Uso Principal | Ejemplo en PFM | Prioridad | Alternativa si no disponible |
|------|---------------|----------------|-----------|------------------------------|
| **Waterfall** | Flujo de dinero: ingresos → bolsillos → gastos → remanente | Dashboard mensual: "Tu sueldo de $5,000 se distribuyó así" | 🔴 Alta | Stacked bar chart (menos informativo) |
| **Bullet Graph** | Progreso de meta vs target (pockets tipo "goal") | Página de Bolsillos: "Ahorro viaje: $740 de $1,000 (74%)" | 🔴 Alta | Progress bar simple (menos contexto) |
| **Sparkline** | Tendencia compacta en espacio reducido | KPI cards de net worth, gasto mensual, ingreso promedio | 🔴 Alta | Mini line chart (más ancho) |
| **Treemap** | Distribución de gastos por categoría (teselado) | Página de Gastos: dónde se fue el dinero | 🟡 Media | Donut chart (máx 5 categorías) |
| **Heatmap (calendar)** | Patrones de gasto por día/semana/mes | Vista de calendario: qué días gastas más | 🟡 Media | Bar chart por día de semana |
| **Line Chart** | Tendencia de net worth / cash flow a lo largo del tiempo | Dashboard: evolución del patrimonio neto 12 meses | 🔴 Alta | Área chart |
| **Donut (simple)** | Composición con ≤5 categorías | "Composición de gastos fijos vs variables" | 🟡 Baja | Reemplazar con treemap o barras |
| **Gauge/Speedometer** | NO RECOMENDADO | NO USAR | ❌ | Reemplazar con bullet graph (Few, 2006) |
| **Pie chart (>5 slices)** | NO RECOMENDADO | NO USAR | ❌ | Reemplazar con treemap o barras |

### 3.2 Waterfall Chart — El estándar para flujo de dinero

**Por qué funciona**: Muestra visualmente cómo un valor inicial (ingreso total) se descompone en componentes positivos (asignaciones a pockets) y negativos (gastos) hasta llegar a un valor final (remanente).

**Implementación**:
- Librería: `recharts` tiene `<WaterfallChart>` no nativo, pero se puede emular con `<BarChart>` usando `stackId` y colores condicionales.
- Alternativa: implementar con CSS flexbox + divs con altura proporcional (simulación).
- **Story**: "Tu ingreso se asignó así este mes" — la barra inicial es alta (ingreso), bajan los gastos en rojo, se ve el remanente en verde/azul.

**Datos necesarios desde la API**: `GET /api/dashboard/cashflow` devuelve `{ income, allocations, expenses, remaining }`.

### 3.3 Bullet Graph (Stephen Few, 2006) — Meta vs Progreso

**Por qué funciona mejor que gauge**: Ocupa menos espacio, comunica más información (valor actual, target, rangos cualitativos), y es lineal (más preciso perceptual que angular).

**Componentes del Bullet Graph** (según Few):
1. **Barra principal**: valor actual (ej: $740 ahorrado).
2. **Notch/marcador**: target (ej: $1,000).
3. **Rangos cualitativos de fondo**: gradiente de grises (poor → satisfactory → good).

**Implementación en React + Tailwind**:
```tsx
// BulletGraph component
<div className="w-full space-y-1">
  <div className="flex justify-between text-sm">
    <span>Progreso</span>
    <span>$740 / $1,000</span>
  </div>
  <div className="relative h-6 bg-slate-700 rounded" role="progressbar"
       aria-valuenow={740} aria-valuemin={0} aria-valuemax={1000}>
    {/* Qualitative ranges */}
    <div className="absolute inset-y-0 left-0 w-1/3 bg-red-900/30 rounded-l" />
    <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-900/30" />
    <div className="absolute inset-y-0 left-2/3 w-1/3 bg-green-900/30 rounded-r" />
    {/* Actual bar */}
    <div className="absolute inset-y-1 left-1 w-[74%] bg-blue-500 rounded"
         style={{ width: '74%' }} />
    {/* Target marker */}
    <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: '82%' }} />
  </div>
</div>
```

### 3.4 Sparklines — Tendencia en espacio compacto

**Definición** (Tufte, 2006): gráfico pequeño, denso en datos, sin ejes ni coordenadas, diseñado para integrarse en texto o tablas.

**Uso en PFM**:
- Junto al net worth: pequeña línea de 12 meses.
- Junto al total de gastos del mes: tendencia diaria.
- En la tabla de pockets: sparkline de contribuciones del último mes vs el anterior.

**Implementación con Recharts**:
```tsx
<ResponsiveContainer width={120} height={32}>
  <LineChart data={trendData}>
    <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} strokeWidth={1.5} />
  </LineChart>
</ResponsiveContainer>
```

### 3.5 Treemap — Distribución teselada de gastos

**Por qué**: Mejor que pie chart para >5 categorías. Usa área (segundo mejor atributo pre-atencional) para mostrar proporciones.

**Limitación**: Área no es tan precisa como longitud para comparación. Útil para **scannability** (golpe de vista).

**Implementación**: Recharts `<Treemap>`. Colorear por categoría con tonos de una misma familia (azules para vivienda, verdes para alimentos, etc.).

### 3.6 Heatmap Calendar — Patrón diario/semanal

**Uso**: Identificar días de la semana con mayor gasto. Por ejemplo, "los sábados gastas 40% más que el promedio."

**Implementación**: Usar CSS grid (7 columnas × ~5 filas) con celdas coloreadas por intensidad. Sin librería externa necesaria.
```tsx
<div className="grid grid-cols-7 gap-1">
  {days.map(day => (
    <div key={day.date}
         className="aspect-square rounded"
         style={{ backgroundColor: intensityToColor(day.amount) }}
         title={`${day.date}: $${day.amount}`} />
  ))}
</div>
```

---

## 4. Paleta de Colores (Dark Mode Optimized)

### 4.1 Principios para Dark Mode en Data Viz

Basado en investigación de Chameleon (MIT/Google, 2025), Observable (2026) y Material Design 3:

1. **No usar negro puro** → usar grises profundos (`#0F172A`, `#18181B`).
2. **Reducir saturación 15-25%** vs light mode (los colores se ven más intensos en fondo oscuro).
3. **Subir luminosidad de rojos** (L:50 → L:65-70%) para evitar que se vean "fangosos".
4. **Desplazar verdes hacia teal** para evitar el efecto "neon" en fondos oscuros.
5. **Mantener consistencia semántica**: rojo = pérdida en ambos modos, no cambiar significado.
6. **WCAG 4.5:1 mínimo para texto**, 3:1 para elementos gráficos.

### 4.2 Paleta Base para PFM (Dark Mode)

| Token | Uso | Hex (Dark) | Hex (Light) | WCAG Contraste vs bg |
|-------|-----|------------|-------------|---------------------|
| `--color-bg-canvas` | Fondo general | `#0F172A` | `#F8FAFC` | — |
| `--color-bg-surface` | Cards, contenedores | `#1E293B` | `#FFFFFF` | — |
| `--color-bg-elevated` | Modals, tooltips | `#334155` | `#F1F5F9` | — |
| `--color-text-primary` | Texto principal | `#F1F5F9` | `#0F172A` | 14.5:1 |
| `--color-text-muted` | Labels, secundario | `#94A3B8` | `#64748B` | 7:1 |
| `--color-income` | Ingresos, ganancia | `#4ADE80` | `#22C55E` | 5.1:1 |
| `--color-expense` | Gastos, pérdida | `#FB7185` | `#EF4444` | 5.5:1 |
| `--color-goal` | Metas, ahorro | `#60A5FA` | `#3B82F6` | 5.8:1 |
| `--color-warning` | Alerta media | `#FBBF24` | `#F59E0B` | 4.8:1 |
| `--color-danger` | Alerta crítica | `#F87171` | `#DC2626` | 5.2:1 |
| `--color-projection` | Forecas/proyección | `#A78BFA` | `#8B5CF6` | 5.6:1 |
| `--color-neutral` | Histórico, baseline | `#64748B` | `#94A3B8` | 4.5:1 |
| `--color-success-bg` | Fondo de éxito (sutil) | `rgba(74,222,128,0.12)` | `rgba(34,197,94,0.08)` | — |
| `--color-danger-bg` | Fondo de alerta (sutil) | `rgba(251,113,133,0.12)` | `rgba(239,68,68,0.08)` | — |

### 4.3 Paleta Categórica para Gráficos (Dark Mode)

Basada en Observable 10 palette adaptada para dark mode (saturación reducida, luminosidad ajustada):

| Índice | Hex Dark | Uso |
|--------|----------|-----|
| 1 | `#60A5FA` | Categoría primaria (azul) |
| 2 | `#FB923C` | Categoría secundaria (naranja) |
| 3 | `#F87171` | Categoría gasto alto (rojo suave) |
| 4 | `#67E8F9` | Categoría especial (cian) |
| 5 | `#A78BFA` | Proyecciones (púrpura) |
| 6 | `#4ADE80` | Metas alcanzadas (verde) |
| 7 | `#FDE047` | Alertas/atención (amarillo) |
| 8 | `#E2E8F0` | Línea de base (blanco suave) |

### 4.4 Accesibilidad para Daltonismo

- **8% de hombres** tienen deuteranopia (rojo-verde). Solución:
  - **Símbolos redundantes**: flechas ▲/▼, signos +/−, paréntesis para negativos.
  - **Patrones**: en gráficos de barras, usar patrones de rayado en lugar de solo relleno de color.
  - **Etiquetas directas**: siempre mostrar el valor numérico.
- **Herramientas de verificación**: simular con Color Oracle o Chrome DevTools → Rendering → Emulate vision deficiencies.
- **Contraste mínimo**: WCAG AA (4.5:1 texto, 3:1 gráficos). Verificar con contrast-checker.

**Implementación en React**:
```tsx
// Ejemplo de encoding redundante para ingreso/gasto
<span className={cn(
  "inline-flex items-center gap-1",
  amount >= 0 ? "text-income" : "text-expense"
)}>
  {amount >= 0 ? "▲" : "▼"}
  {amount >= 0 ? "+" : "-"}
  ${Math.abs(amount).toFixed(2)}
</span>
```

---

## 5. Diseño de Dashboard por Sección

### 5.1 Dashboard Principal — Sin Scroll (Above the Fold)

**Historia que debe contar**: "¿Estás mejor que el mes pasado? ¿Dónde está tu dinero? ¿Vas bien con tus metas?"

**Layout recomendado** (4 secciones, sin scroll en 1920×1080):

```
┌──────────────────────────────────────────────────┐
│  ▲ Net Worth: $45,230      ▲ +2.3% vs last mo   │
│  ───────────────────── sparkline 12m ─────────   │
├─────────────┬───────────────────┬────────────────┤
│ Cash Flow   │ Gastos por Cat.   │ Top Alertas    │
│ this month  │ (Treemap compacto)│                │
│             │                   │ • Rest. +30%   │
│ ██ Income   │ [visual]          │ • Suscrip. $45 │
│ ██ Expenses │                   │ • Pocket 74%   │
│ Remaining   │                   │                │
│ ▲ $800      │                   │                │
├─────────────┴───────────────────┴────────────────┤
│ Pockets Progress (3-4 mini bullet graphs)         │
│ Viaje ████████░░░░ 74% │ Fondo ████░░░░░░ 40%    │
│ Auto  ██░░░░░░░░░░ 18% │ Seguro ██████████ 95%   │
└──────────────────────────────────────────────────┘
```

**KPIs principales** (3-5, grandes, con delta):
1. **Net Worth** — número + sparkline 12 meses + % cambio vs mes anterior.
2. **Cash Flow Mensual** — ingreso total vs gasto total + remanente destacado.
3. **Tasa de Ahorro** — (ahorro/ingreso) × 100%.
4. **Gasto vs Presupuesto** — semáforo: verde (≤90%), ámbar (90-100%), rojo (>100%).
5. **Próximos Pagos** — monto total de suscripciones/gastos recurrentes próximos 7 días.

**Gráficos clave**:
- **Waterfall** (flujo ingresos → gastos → remanente) — el gráfico estrella del dashboard.
- **Treemap compacto** (top 5-6 categorías de gasto) — el resto como "otros".
- **Bullet graphs** (mini bullet de los 3-4 pockets principales).
- **Sparklines** (net worth trend, gasto diario del mes).

### 5.2 Página de Ingresos

**Historia**: "Tus fuentes de ingreso y cómo se asignaron a tus bolsillos."

**Gráficos recomendados**:

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Timeline de ingresos | **Bar chart** (mensual 12 meses) | Evolución del total de ingresos. |
| Por fuente | **Donut** (≤5 fuentes) | Composición: salario, freelance, inversiones. |
| Asignación a pockets | **Sankey / Alluvial** (si disponible) o **Stacked bar** | Cómo cada ingreso se distribuyó en pockets. |
| Ingreso promedio | **KPI Card** + sparkline 3 meses | Valor actual vs histórico. |

**Consideraciones de mental accounting**:
- Al mostrar la asignación, usar framing: "Asignaste $500 a Viaje → buen trabajo protegiendo tu meta."
- Permitir re-asignación drag & drop si es necesario.

### 5.3 Página de Gastos

**Historia**: "¿Dónde se fue tu dinero? ¿Estás gastando más de lo debido en algo?"

**Gráficos recomendados**:

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Distribución por categoría | **Treemap** | Visualización teselada: el área = monto gastado. |
| Evolución mensual | **Line chart** (12 meses, por categoría) | Líneas suaves con puntos solo en meses clave. |
| Gasto promedio diario | **Bar chart** (días del mes) | Barra por día, color rojo si excede presupuesto diario. |
| Concentración por comercio | **Horizontal bar chart** | Top 10 comercios por monto. |
| Patrón semanal | **Calendar heatmap** | Días de la semana con mayor gasto. |

**Principio Knaflic**: No mostrar todos los gastos. **Agrupar por categoría**. Usar atributo pre-atencional (color rojo) solo en categorías que exceden el presupuesto.

### 5.4 Página de Bolsillos (Pockets)

**Modelo de datos**: `accumulatedAmount`, `goal`, `targetDate`, `monthlyContribution`

**Historia**: "¿Vas bien con tus metas? ¿Estás a tiempo?"

**Gráficos recomendados**:

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Progreso de cada pocket | **Bullet graph** | Barra actual + notch target + rangos cualitativos. |
| Timeline de contribuciones | **Sparkline** (por pocket) | Tendencia de aportes recientes. |
| Proyección de cumplimiento | **Gantt simplificado** | Línea desde hoy hasta targetDate con proyección vs plan. |
| Distribución total | **Stacked bar** | Total ahorrado vs total meta. |
| Alertas visuales | **Color + ícono** | Verde si on-track, ámbar si necesita acelerar, rojo si está atrasado. |

**Implementación**: Cada Pocket Card debe mostrar:
```
┌──────────────────────────────┐
│ ✈️ Viaje a Japón            │
│                              │
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 74%   │
│ $740 de $1,000               │
│ 🎯 Dic 2026 (7 meses)        │
│ 📈 $110/mes (necesitas $130) │
│ ⚠️ Necesitas +$20/mes        │
└──────────────────────────────┘
```

### 5.5 Página de Deudas

**Modelo**: `paidAmount`, `remainingAmount`, `totalAmount`, `interestRate`

**Historia**: "¿Cuánto debes? ¿Estás reduciendo tu deuda?"

**Gráficos recomendados**:

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Progreso de pago | **Progress bar** con segmentos | Paid (verde) vs remaining (rojo). |
| Deuda total | **KPI Card** | Monto total + cambio vs mes anterior. |
| Snowball effect | **Horizontal bar chart** | Deudas ordenadas por menor saldo (método bola de nieve). |
| Interés acumulado | **Donut** (si ≤3 deudas) | Proporción de deuda por tarjeta/préstamo. |
| Tiempo estimado | **Texto + indicador** | "Al ritmo actual, pagarás en 14 meses." |

### 5.6 Página de Préstamos (Loans)

**Modelo**: `remainingAmount`, `monthlyPayment`, `totalInstallments`, `paidInstallments`

**Gráficos recomendados**:

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| Progreso del préstamo | **Progress bar** | Paid installments / total installments. |
| Amortización | **Waterfall chart** | Descomposición de cada pago: interés vs capital. |
| Proyección | **Line chart** | Saldo restante proyectado mes a mes. |

---

## 6. Contrato de Comportamiento Visual

El Contrato de Comportamiento Visual es la promesa que el sistema PFM hace al usuario sobre cómo se comunicarán visualmente los datos financieros para generar conciencia sin causar ansiedad.

### 6.1 Principios del Contrato

1. **Los colores tienen significado fijo y no cambian entre pantallas.** Rojo = gasto/pérdida/alerta. Verde = ingreso/ganancia/salud. Azul = meta/proyección. Sin excepciones.

2. **Nunca se usa color como único canal informativo.** Toda señal cromática va acompañada de: texto, símbolo (+/−, ▲/▼), o patrón. Esto garantiza accesibilidad para daltónicos y usuarios con baja visión.

3. **Las alertas visuales son progresivas.** Tres niveles de intensidad:
   - **Nivel 1 (ámbar)**: información — "Gastos en restaurantes +15% este mes." Sin alarma.
   - **Nivel 2 (naranja)**: advertencia — "Estás al 90% de tu presupuesto mensual."
   - **Nivel 3 (rojo)**: acción requerida — "Has excedido tu presupuesto. Revisa tus gastos."

4. **Las animaciones deben ser funcionales, no decorativas.** Transiciones suaves (<300ms) para cambios de estado (ej: barra que crece al añadir un gasto). Sin animaciones cíclicas, parpadeos, o movimientos distractivos.

5. **Cada gráfico responde UNA pregunta.** Si un gráfico no tiene una respuesta clara para el usuario en <5 segundos, está mal diseñado.

### 6.2 Generación de Conciencia (Evitar Evasión Financiera)

El PFM opera bajo un contrato de comportamiento: el usuario se compromete a registrar su realidad financiera. El sistema debe hacer que esa realidad sea ineludible visualmente.

| Técnica | Mecanismo Psicológico | Implementación |
|---------|----------------------|----------------|
| **Gasto diario visible** | Salience bias + Loss aversion | Barra de "Hoy gastaste: $X" siempre visible en la cabecera. |
| **Impacto acumulado** | Mental accounting | "Este mes has gastado $X en café. Eso es equivalente a Y." |
| **Proyección de déficit** | Present bias | "Al ritmo actual, gastarás $X más de tu ingreso este mes." |
| **Meta visible constantemente** | Status quo + Compromiso | Pocket destacado siempre visible, bullet graph de progreso. |
| **Celebración de logros** | Dopamine reward | Animación sutil + texto cuando se alcanza un hito de ahorro. |
| **Comparación temporal** | Framing | "Tu net worth creció 5% este trimestre. Sigue así." NO comparaciones sociales. |

### 6.3 Lo que NO se debe hacer

- ❌ **No mostrar grandes bloques de números sin contexto** (evitar "data dump").
- ❌ **No usar rojo para gastos normales** — solo para gastos que exceden presupuesto o son anómalos.
- ❌ **No animar gráficos continuamente** — causa fatiga visual y ansiedad innecesaria.
- ❌ **No mostrar deudas sin plan de acción** — cada deuda debe tener su progress bar y proyección de pago.
- ❌ **No saturar el dashboard con más de 7 métricas simultáneas** — el usuario debe procesar en <10 segundos.

### 6.4 Checklist de Implementación para Developers

```tsx
// Checklist para cada nuevo gráfico en PFM:
// [ ] ¿Responde una sola pregunta clara?
// [ ] ¿Usa color semántico según la paleta definida?
// [ ] ¿Tiene encoding redundante (color + texto + símbolo)?
// [ ] ¿Funciona en dark y light mode?
// [ ] ¿Cumple WCAG AA (4.5:1 texto, 3:1 gráficos)?
// [ ] ¿Tiene aria-label descriptivo?
// [ ] ¿Muestra el valor numérico (no solo representación visual)?
// [ ] ¿Tiene contraste suficiente en ambos modos?
// [ ] ¿La animación es <300ms y no cíclica?
// [ ] ¿Está dentro del límite de 7 métricas en dashboard?
```

---

## Fuentes Verificables

### Libros y Papers Académicos
1. Knaflic, C. N. (2015). *Storytelling with Data: A Data Visualization Guide for Business Professionals*. Wiley. — Principios 5+1, preattentive attributes, clutter elimination.
2. Tufte, E. (2001). *The Visual Display of Quantitative Information*. Graphics Press. — Data-ink ratio, sparklines, chartjunk.
3. Few, S. (2006). *Information Dashboard Design*. O'Reilly. — Bullet graph design specification, dashboard KPI design.
4. Kahneman, D. & Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk." *Econometrica*, 47(2), 263-291. — Loss aversion, framing effects.
5. Thaler, R. (1985). "Mental Accounting and Consumer Choice." *Marketing Science*, 4(3), 199-214. — Mental accounting theory.
6. Thaler, R. & Sunstein, C. (2008). *Nudge: Improving Decisions About Health, Wealth, and Happiness*. Yale University Press. — Nudge theory, choice architecture.
7. Benartzi, S. & Thaler, R. (1995). "Myopic Loss Aversion and the Equity Premium Puzzle." *Quarterly Journal of Economics*, 110(1), 73-92. — Myopic loss aversion.
8. Gilad, D. et al. (2012). "Red light, green light: Color priming in financial decisions." *Journal of Behavioral and Experimental Economics*, 41(5), 738-745. — Color effects in financial decision-making.
9. Soman, D. & Cheema, A. (2011). "Earmarking and Partitioning: Increasing Saving by Low-Income Households." *Journal of Marketing Research*, 48, S14-S22. — Digital mental accounting, labeled savings.

### Frameworks y Guías
10. Behavioural Insights Team (2014, updated 2024). *EAST: Four Simple Ways to Apply Behavioural Insights*. — Easy, Attractive, Social, Timely framework. https://www.bi.team/publications/east
11. Material Design 3 (2024). *Data Visualization Accessibility Guidelines*. Google. https://m3.material.io/blog/data-visualization-accessibility
12. Material Design 2 (2022). *Data Visualization — Charts and Dashboards*. Google. https://m2.material.io/design/communication/data-visualization.html
13. WCAG 2.2 (2024). *Web Content Accessibility Guidelines*. W3C. https://www.w3.org/TR/WCAG22/

### Artículos y Blogs Técnicos
14. Knaflic, C. N. (2017). "My Guiding Principles." Storytelling with Data Blog. https://www.storytellingwithdata.com/blog/2017/8/9/my-guiding-principles
15. Knaflic, C. N. (2014). "Lead with Story." Storytelling with Data Blog. https://www.storytellingwithdata.com/blog/2014/07/lead-with-story
16. Nussbaumer, C. (2011). "A Google Example: Preattentive Attributes." Storytelling with Data. https://www.storytellingwithdata.com/blog/2011/10/google-example-preattentive-attributes
17. Cisneros, M. (2021). "Colors and Emotions in Data Visualization." Storytelling with Data. https://www.storytellingwithdata.com/blog/2021/6/8/colors-and-emotions-in-data-visualization
18. Nielsen Norman Group (2017). "Dashboards: Making Charts and Graphs Easier to Understand." https://www.nngroup.com/articles/dashboards-preattentive/
19. Nielsen Norman Group (2016). "Prospect Theory and Loss Aversion: How Users Make Decisions." https://www.nngroup.com/articles/prospect-theory/
20. Few, S. (2006/2013). "Bullet Graph Design Specification." Perceptual Edge. https://perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf

### Visualización Financiera
21. CleanChart (2026). "Financial Data Visualization: The Complete Guide." https://www.cleanchart.app/blog/financial-data-visualization
22. FusionCharts (2018). "All You Need to Know About Bullet, Spark, and Waterfall Charts." https://www.fusioncharts.com/blog/what-why-how-bullet-spark-waterfall-charts/
23. Syncfusion (2025). "7 Essential Financial Charts for Personal Finance Visualization." https://www.syncfusion.com/blogs/post/financial-charts-visualization
24. Finance Alliance (2026). "16 of the Best Financial Charts and Graphs." https://www.financealliance.io/financial-charts-and-graphs/

### Color y Dark Mode
25. ColorArchive (2024). "Color in Financial UI: Trust, Data Visualization, and the Red/Green Convention." https://colorarchive.org/guides/financial-ui-color-guide/
26. ColorArchive Notes. "Color in Financial Data Visualization: Beyond the Red-Green Traffic Light." https://colorarchive.me/notes/jan-2028-color-financial-data-viz/
27. Observable (2026). "Crafting an Effective Data Visualization Color Palette." https://observablehq.com/blog/crafting-data-colors
28. Deka, A. (2025). "Implementing Dark Mode for Data Visualizations: Design Considerations." Medium / CanvasJS. https://ananyadeka.medium.com/implementing-dark-mode-for-data-visualizations-design-considerations-66cd1ff2ab67
29. Chameleon (2025). "Automated Color Palette Adaptation for Dark Mode Data Visualizations." arXiv:2512.00516. https://arxiv.org/html/2512.00516v2
30. Garanord (2025). "Dark Mode Dashboards: Data Visualization Color Palettes." https://garanord.md/high-contrast-dark-theme-palettes-for-dashboards-and-data-visualization/

### Behavioral Design en Fintech
31. UXDA (2025). "Applying Neuromarketing to Elevate the Digital Banking User Experience." UX Planet. https://uxplanet.org/applying-neuromarketing-to-elevate-the-digital-banking-user-experience-f66f87cd613e/
32. Vanguard (2024). "Unlocking Better Outcomes with Behavioral Design." https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/unlocking-better-outcomes-with-behavioral-design.html
33. Daffodil Software (2024). "Integrating Behavioral Economics with Fintech UX Design." https://insights.daffodilsw.com/blog/integrating-behavioral-economics-with-fintech-ux-design
34. Decode the Future (2026). "Mental Accounting Explained — Thaler's 4 Hidden Wallets." https://decodethefuture.org/en/mental-accounting-explained/
35. Sue Behavioural Design (2026). "Mental Accounting Explained: Why You Keep Money in Mental Buckets." https://www.suebehaviouraldesign.com/en/blog/mental-accounting-explained/

### Dashboards PFM
36. Clarity (2026). "Building a Personal Finance Dashboard That Actually Works." https://useclarity.app/blog/personal-finance-dashboard
37. Senki (2026). "Personal Finance Dashboard: The Ultimate 2026 Guide." https://www.senki.io/post/personal-finance-dashboard
38. Thalvi (2026). "How to Create a Personal Financial Dashboard." https://thalvi.app/resources/guides/personal-financial-dashboard-guide
39. Finance Fundamentals (2026). "Open Banking Evolves: Designing Whole-of-Life Dashboards." https://financefundamentals.io/open-banking-whole-of-life-dashboards/
40. Designpixil (2026). "Fintech Dashboard Design: Patterns and Best Practices." https://designpixil.com/blog/fintech-dashboard-design
41. Smashing Magazine (2024). "How Accessibility Standards Can Empower Better Chart Visual Design." https://smashingmagazine.com/2024/02/accessibility-standards-empower-better-chart-visual-design/
42. Morningstar Design System. "Making Charts Accessible." https://designsystem.morningstar.com/charts/making-charts-accessible/
43. Interaction Design Foundation (2016). "Preattentive Visual Properties and How to Use Them in Information Visualization." https://www.interaction-design.org/literature/article/preattentive-visual-properties-and-how-to-use-them-in-information-visualization
44. Tiller (2022). "Visualize Your Money Trends With a Waterfall Chart." https://tiller.com/visualize-your-money-trends-with-a-waterfall-chart-in-google-sheets/
45. Bricks (2025). "How to Create a Personal Finance Dashboard with AI." https://www.thebricks.com/resources/how-to-create-a-personal-finance-dashboard-with-ai

---

## 7. Regla de Oro: Negativo es Prohibido

### Principio
Ningún bolsillo (Pocket) puede quedar con saldo negativo. Esta regla deriva del método de **Presupuesto por Sobres (Envelope Budgeting)** y es la piedra angular de la integridad financiera del PFM.

### Blindaje en Tres Capas

| Capa | Responsable | Acción |
|------|-------------|--------|
| **Backend** | `CreateExpenseUseCase` | Valida PRE-transacción: cada `allocation.amount` ≤ `pocket.accumulatedAmount`. Si falla, retorna HTTP 400 con mensaje descriptivo. |
| **Frontend (Formulario)** | `ExpenseForm.tsx` | Valida en tiempo real: al seleccionar un bolsillo y escribir un monto, si este supera el saldo disponible, muestra advertencia naranja inline y deshabilita el botón de envío. |
| **Frontend (API Fallback)** | `useCreateExpense` (React Query) | Si el backend rechaza la solicitud (400), muestra el mensaje del servidor en un toast global de error. |

### Mood CAPI (Indicador Emocional)

El estado de ánimo de la mascota CAPI refleja el ratio de ahorro del bolsillo:

| Ratio de Aporte | Mood | Imagen | Mensaje |
|:---|---:|:---|:---|
| Sin movimientos | — | `CAPI_Dudoso.svg` | ¡Empieza a usar tu bolsillo! |
| ≥ 70% | Saludable | `CAPI_Feliz.svg` | ¡Tu Capi está muy feliz con tu ahorro! |
| 60–69% | Alerta | `CAPI_Dudoso.svg` | Cuidado: tus gastos están creciendo. |
| < 60% | Crítico | `CAPI_Enojado.svg` | ¡Tu Capi está enojado! Reduce los retiros. |

**Nota:** `CAPI_Furia.svg` está reservado exclusivamente para el módulo de gestión de deudas innecesarias (no se usa en bolsillos).

### Cálculo del Ratio
```
totalMovement = sum(deposits) + sum(expenses)
ratio = (sum(deposits) / totalMovement) × 100   // si totalMovement > 0
```

---

*Documento generado el 2026-05-12 para el proyecto PFM (Personal Finance Manager).*
*Stack: NestJS + React + TailwindCSS + Recharts.*
*Próxima revisión sugerida: dentro de 6 meses o al cambiar la librería de gráficos.*
