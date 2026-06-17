# Especificación Técnica: Animación Narrativa del Historial

> Documento basado en los principios de Storytelling with Data (Knaflic), Data-Ink Ratio (Tufte), y Behavioral Design.

## 1. Resumen Ejecutivo

Se implementará una **animación de fondo** en `PocketDetailPage.tsx` que narre la historia del bolsillo desde su creación hasta el día actual, junto con **micro-celebraciones** en hitos clave.

**Regla irrompible:** NO modificar el Header (CAPI + nombre + monto), ni el Financial Strip (KPIs), ni el Activity Feed existente.

---
## 2. Estrategia de reversibilidad

### Mecanismo de toggle
- Los nuevos componentes se crean en **archivos separados**.
- La integración se realiza mediante **un flag `featureToggle` simple** o un cambio de import.

```typescript
// En PocketDetailPage.tsx
// Descomentar para activar la animación narrativa:
// import { HistoryAnimation } from './components/HistoryAnimation';
```

Para deshacer: volver a comentar la línea.

---

## 3. Arquitectura de componentes

```
frontend/src/features/pockets/components/
├── HistoryAnimation.tsx        ← NUEVO: Contenedor principal de la animación de fondo
├── HistorySparkline.tsx       ← NUEVO: Sparkline SVG animado para Deposit pockets
├── HistoryProgressArc.tsx       ← NUEVO: Progress bar animada para Goal pockets
├── MilestoneBadge.tsx          ← NUEVO: Badge de celebración para hitos
└── ... (resto de componentes existentes)
```

---

## 4. Opción A: Gráfico de fondo animado (Implementación principal)

### 4.1. Para Goal pockets (Progress Bar animada)

#### Comportamiento
- Al cargar la página, una barra de progreso **se llena desde 0% hasta el progreso actual**.
- Duración de la animación: **1.5 segundos** con `ease-out` (aceleración inicial, desaceleración al final).
- La barra usa un gradiente: `from-purple-500 to-amber-500`.

#### Especificación visual

```text
┌────────────────────────────────────────────┐
│  📊 Progreso hacia la meta                │
│                                            │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 65% │ ← Animación de 0 → 65%
│  ╰─────────────────────╯                   │
│          $6,500 de $10,000                 │
│                                            │
│  🚀 Ritmo actual: $900/mes                 │
│  📅 Proyección de meta: Nov 2026          │
└────────────────────────────────────────────┘
```

#### Implementación técnica

```tsx
// HistoryProgressArc.tsx
interface HistoryProgressArcProps {
  currentAmount: number;
  goal: number;
  monthlyAverage?: number; // calculado de los depósitos
}

// Animación CSS pura (0KB extra)
<div className="relative w-full h-3 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
  <div
    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-500
               transition-all duration-[1500ms] ease-out"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### 4.2. Para Deposit pockets (Sparkline SVG animado)

#### Comportamiento
- Un sparkline SVG que **se dibuja** desde la fecha de creación hasta hoy.
- Animación mediante `stroke-dashoffset` (técnica de "drawing line").
- Línea de color `text-purple-500` (marca) con área fill semitransparente.
- Opcional: marcar los retiros como puntos rojos en la línea.

#### Especificación visual

```text
┌────────────────────────────────────────────┐
│  📈 Tendencia de acumulación              │
│                                            │
│     ╱╲     ╱╲                              │
│    ╱  ╲   ╱  ╲    ╱╲     Crecimiento:     │
│   ╱    ╲ ╱    ╲  ╱  ╲    ↑ $3,200        │
│  ╱      ╲      ╲╱    ╲                    │
│  ╲      ╱              ╲                   │
│   ╲····╱      (rojos = retiros)           │
│                                            │
│  🟢 ↑ Último aporte: 15 MAY ($500)         │
│  📅 Activo desde: 01 ENE 2026             │
└────────────────────────────────────────────┘
```

#### Implementación técnica

```tsx
// HistorySparkline.tsx
interface HistorySparklineProps {
  dataPoints: { date: Date; value: number; isWithdrawal?: boolean }[];
  currentValue: number;
}

// SVG nativo con animación stroke-dashoffset
const pathLength = useMemo(() => {
  // calcular longitud total del path
}, [dataPoints]);

const [offset, setOffset] = useState(pathLength);

useEffect(() => {
  // Animar desde pathLength → 0 al montar
  requestAnimationFrame(() => setOffset(0));
}, []);

return (
  <svg className="w-full h-24 opacity-30" viewBox="0 0 100 40" preserveAspectRatio="none">
    <polyline
      fill="none"
      stroke="currentColor"
      className="text-purple-500"
      strokeWidth="2"
      strokeDasharray={pathLength}
      strokeDashoffset={offset}
      style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      points={pointsString}
    />
  </svg>
);
```

---

## 5. Micro-celebraciones (Hitos)

### 5.1. Tipos de hitos

| Hito | Condición | Animación | Color |
|:---|:---|:---|:---|
| **Primer depósito** | `deposits.length === 1` | Badge + fade-in | 🟣 Púrpura |
| **25% de meta** | `progress >= 25 && progress < 50` | Badge + scale-up | 🟣 Púrpura |
| **50% de meta** | `progress >= 50 && progress < 75` | Badge + scale-up + glow | 🟡 Ámbar |
| **75% de meta** | `progress >= 75 && progress < 100` | Badge + scale-up + glow | 🟡 Ámbar |
| **Meta alcanzada** | `progress >= 100` | Badge + confetti (CSS) | 🟢 Verde |
| **30 días sin retiros** | `daysSinceLastWithdrawal >= 30` | Badge "Racha" | 🟢 Verde |

### 5.2. Implementación de MilestoneBadge

```tsx
// MilestoneBadge.tsx
interface MilestoneBadgeProps {
  type: 'first_deposit' | 'goal_25' | 'goal_50' | 'goal_75' | 'goal_100' | 'streak_30';
  onDismiss?: () => void;
}

// Animación con CSS keyframes (0KB extra)
@keyframes badge-enter {
  0% { opacity: 0; transform: scale(0.8); }
  70% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
.milestone-badge {
  animation: badge-enter 0.5s ease-out forwards;
}
```

---

## 6. Integración en PocketDetailPage.tsx

### 6.1. Ubicación

```
[Header CAPI + nombre + monto + motivación]  ← Intacto
[Financial Strip]                            ← Intacto
[ ── Animación de Historia (NUEVA) ── ]      ← Insertar aquí
  - Goal: HistoryProgressArc
  - Deposit: HistorySparkline
  - MilestoneBadge (si aplica)
[ ── KPIs de Voluntad (existente) ── ]       ← Intacto
[ ── Activity Feed (existente) ── ]          ← Intacto
```

### 6.2. Código de integración

```tsx
// Dentro de PocketDetailPage.tsx, entre Financial Strip y Activity Feed:

{/* ═══ Animación Narrativa ═══ */}
<div className="relative overflow-hidden rounded-lg border border-secondary-100 dark:border-secondary-700 p-4 my-4">
  {isGoal ? (
    <HistoryProgressArc
      currentAmount={pocket.accumulatedAmount}
      goal={pocket.goal}
      monthlyAverage={monthlyAverage}
    />
  ) : (
    <HistorySparkline
      dataPoints={buildSparklineData(pocket)}
      currentValue={pocket.accumulatedAmount}
    />
  )}
  
  {/* Micro-celebraciones */}
  <MilestoneBadge type={detectMilestone(pocket)} />
</div>
```

---

## 7. Lógica de datos

### 7.1. buildSparklineData

```typescript
function buildSparklineData(pocket: Pocket): Point[] {
  const points: Point[] = [];
  let runningTotal = pocket.initialAmount || 0;
  
  // Punto inicial (fecha de creación)
  points.push({ date: new Date(pocket.createdAt), value: runningTotal });
  
  // Depósitos (↑) y retiros (↓) ordenados cronológicamente
  const allMovements = [
    ...(pocket.deposits || []).map(d => ({ ...d, type: 'deposit' })),
    ...(pocket.expenses || []).map(e => ({ ...e, type: 'expense' })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (const m of allMovements) {
    runningTotal += m.type === 'deposit' ? m.amount : -m.amount;
    points.push({
      date: new Date(m.date),
      value: runningTotal,
      isWithdrawal: m.type === 'expense',
    });
  }
  
  return points;
}
```

### 7.2. detectMilestone

```typescript
function detectMilestone(pocket: Pocket): string | null {
  const deposits = pocket.deposits || [];
  const progress = pocket.goal > 0 
    ? (pocket.accumulatedAmount / pocket.goal) * 100 
    : 0;
  
  if (progress >= 100) return 'goal_100';
  if (progress >= 75) return 'goal_75';
  if (progress >= 50) return 'goal_50';
  if (progress >= 25) return 'goal_25';
  if (deposits.length === 1) return 'first_deposit';
  
  return null;
}
```

---

## 8. Consideraciones de rendimiento

| Técnica | Costo | Notas |
|:---|:---|:---|
| SVG nativo | 0 KB extra | GPU-accelerated, sin librerías |
| CSS transitions | 0 KB extra | Nativo del browser |
| Framer Motion | ~30 KB gzipped | Solo si se necesita easing avanzado |
| Canvas | 0 KB extra | Alternativa para sparklines complejos |

**Recomendación:** Usar SVG nativo + CSS transitions. **No incluir Framer Motion.** Si en el futuro se necesita easing avanzado, se puede agregar Motion (core) que pesa ~16KB gzipped.

---

## 9. Pruebas de humo

| Escenario | Acción | Resultado esperado |
|:---|:---|:---|
| Goal pocket con progreso | Cargar página | Barra se llena de 0→X% en 1.5s |
| Deposit pocket con datos | Cargar página | Línea se dibuja desde origen→hoy |
| Sin movimientos | Pocket vacío | Texto "Sin movimientos aún" + línea plana |
| Primer depósito | pocket.deposits.length === 1 | Badge "¡Primer aporte!" aparece |
| Meta alcanzada | progress >= 100 | Badge "¡Meta cumplida!" con animación |
| Modo oscuro | Alternar tema | Colores se adaptan (dark: prefijos) |

---

## 10. Resumen de esfuerzo

| Componente | Líneas estimadas | Dependencias |
|:---|:---|:---|
| `HistoryAnimation.tsx` | 40 (orquestador) | Ninguna |
| `HistoryProgressArc.tsx` | 60 | Ninguna (CSS puro) |
| `HistorySparkline.tsx` | 100 | Ninguna (SVG nativo) |
| `MilestoneBadge.tsx` | 50 | Ninguna (CSS keyframes) |
| Modificación `PocketDetailPage.tsx` | 15 líneas insertadas | - |
| **Total** | **~265 líneas nuevas** | **0 nuevas dependencias** |
