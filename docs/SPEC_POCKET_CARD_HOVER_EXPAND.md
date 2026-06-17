# Especificación Técnica: PocketCard con Hover Expandido

## 1. Estrategia de reversibilidad

### Principio
El componente existente `PocketCard.tsx` **NO se modifica**. Se crea un nuevo componente paralelo. El cambio se activa mediante un **feature flag** de una línea en `PocketList.tsx`. Volver atrás = cambiar una línea.

### Mecanismo de toggle

```typescript
// Archivo: frontend/src/features/pockets/components/PocketList.tsx (línea 4)

// Modo actual (producción):
import PocketCard from './PocketCard';

// Modo nuevo (hover expandido) — DESCOMENTAR para activar:
// import PocketCard from './PocketCardExpanded';
```

Para deshacer: volver a comentar la línea nueva y descomentar la original.

### Archivos involucrados

| Archivo | Acción | Riesgo |
|---------|--------|--------|
| `PocketCard.tsx` | **Ninguna** — se conserva intacto | ✅ Nulo |
| `PocketCardExpanded.tsx` | **Crear nuevo** — componente completo | ✅ Nulo (archivo nuevo) |
| `PocketCardGoalExpanded.tsx` | **Crear nuevo** — contenido expandido para Goal | ✅ Nulo (archivo nuevo) |
| `PocketCardDepositExpanded.tsx` | **Crear nuevo** — contenido expandido para Deposit | ✅ Nulo (archivo nuevo) |
| `PocketList.tsx` | **1 línea modificada** — cambiar import | ⚠️ Bajo (1 línea, fácil revertir) |
| `components/index.ts` | **Agregar** export del nuevo componente | ✅ Nulo (solo agregar) |

---

## 2. Árbol de archivos resultante

```
frontend/src/features/pockets/components/
├── PocketCard.tsx              ← Intacto (200 líneas, versión actual)
├── PocketCardExpanded.tsx      ← NUEVO: contenedor con hover expand
├── PocketCardGoalExpanded.tsx  ← NUEVO: contenido expandido para Goal
├── PocketCardDepositExpanded.tsx ← NUEVO: contenido expandido para Deposit
├── PocketList.tsx              ← Modificado: 1 línea (el import)
├── DeletePocketModal.tsx       ← Intacto
├── TransferModal.tsx           ← Intacto
└── index.ts                    ← Agregar export
```

---

## 3. Contrato de Props

```typescript
// PocketCardExpanded.tsx — IDÉNTICAS a PocketCard.tsx
export interface PocketCardExpandedProps {
  pocket: Pocket;
  onEdit?: (pocket: Pocket) => void;
  onDelete?: (pocket: Pocket) => void;
  onDeposit?: (pocket: Pocket) => void;
}
```

Esto garantiza que `PocketList.tsx` pueda intercambiar los imports sin cambiar ninguna prop.

---

## 4. Layout de PocketCardExpanded (contenedor)

### Dimensiones

```css
/* Estado colapsado (normal) */
.h-[210px]  /* idéntico al PocketCard actual */

/* Estado expandido (hover) */
/* La altura crece dinámicamente con max-h-0 → max-h-96 */
```

### Transición CSS

```css
/* En el contenedor principal: */
transition: max-height 0.35s ease-in-out, box-shadow 0.2s;
overflow: hidden;
```

### Estructura del contenedor

```
┌───────────────────────────────────────┐
│  [TypeBadge]              [✏️ 🗑️ 💰] │ ← Cabecera (idéntica a PocketCard actual)
│                                       │
│         $7,350.00 ← monto acumulado   │ ← Siempre visible
│       Ahorro Vacaciones ← nombre      │ ← Siempre visible
│                                       │
│  ═══════ Área expandible ═══════      │ ← max-h-0 en colapso
│                                       │    max-h-96 en hover
│  ┌─────────────────────────────────┐  │
│  │  Render condicional:            │  │
│  │  • pocket.type === 'goal'       │  │
│  │    → <PocketCardGoalExpanded /> │  │
│  │  • pocket.type === 'deposit'    │  │
│  │    → <PocketCardDepositExpanded />│  │
│  └─────────────────────────────────┘  │
│                                       │
│         👁️ (eye icon footer)         │ ← Siempre visible
└───────────────────────────────────────┘
```

### Pseudocódigo del componente contenedor

```tsx
const PocketCardExpanded: React.FC<PocketCardExpandedProps> = (props) => {
  const { pocket } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white dark:bg-secondary-800 rounded-lg shadow-md
                 border border-secondary-200 dark:border-secondary-700
                 hover:shadow-lg hover:ring-2 hover:ring-purple-300
                 dark:hover:ring-purple-600 transition-all duration-200
                 cursor-pointer flex flex-col overflow-hidden
                 h-[210px] hover:h-auto hover:max-h-96" // ← LA CLAVE
    >
      {/* ═══ SIEMPRE VISIBLE ═══ */}
      <div className="p-4 pb-0 flex-1 flex flex-col justify-between min-h-[210px]">
        {/* Type Badge + Action Buttons (idéntico al actual, lines 49-103) */}
        {/* Amount + Name (idéntico, lines 111-125) */}
        {/* Progress bar (si goal) o MiniLineChart actual (lines 128-167) */}
      </div>

      {/* ═══ EXPANSIBLE EN HOVER ═══ */}
      <div
        className={`transition-all duration-350 ease-in-out overflow-hidden ${
          isHovered ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-secondary-200 dark:border-secondary-700">
          {pocket.type === 'goal'
            ? <PocketCardGoalExpanded pocket={pocket} />
            : <PocketCardDepositExpanded pocket={pocket} />
          }
        </div>
      </div>

      {/* Footer eye (idéntico al actual) */}
    </div>
  );
};
```

### Comportamiento de transición

```
Estado colapsado (normal):
┌──────────────────┐
│  $7,350          │
│  Vacaciones      │
│  ████████░░ 73%  │ ← barra visible siempre (goal)
│                  │
│        👁️        │
└──────────────────┘
         │ mouseenter
         ▼
Estado expandido (hover):
┌──────────────────┐
│  $7,350          │ ← se mantiene fijo arriba
│  Vacaciones      │
│  ████████░░ 73%  │ ← se mantiene
│ ════════════════ │ ← aparece smooth
│  Meta: $10,000   │
│  Timeline...     │
│  Sugerencia...   │
│        👁️        │
└──────────────────┘
```

---

## 5. Componente: PocketCardGoalExpanded

```
┌─────────────────────────────────────┐
│ 📊 Progreso hacia la meta          │
│                                     │
│  Meta: $10,000.00                   │
│  Acumulado: $7,350.00               │
│  Restante: $2,650.00 ← rojo/saliente│ ← Loss Aversion
│  ████████░░░░ 73.5%                 │
│                                     │
│ ─── Historial de aportes ───        │
│  15 MAY  · +$500  → $7,350         │
│  01 MAY  · +$300  → $6,850         │
│  20 ABR  · +$1,000 → $6,550        │
│                                     │
│ 💡 Sugerencia: $500 en 7 días       │ ← Nudge conductual
└─────────────────────────────────────┘
```

### Datos necesarios
- `pocket.goal` — monto meta
- `pocket.accumulatedAmount` — acumulado actual
- `pocket.deposits[]` — array de depósitos con `{ amount, date }`
- Cálculo: `remaining = goal - accumulatedAmount`
- Cálculo: `percentage = (accumulated / goal) * 100`

### Comportamiento de timeline
- Mostrar máximo **5 depósitos** más recientes (ordenados por fecha descendente).
- Cada fila: `DD MMM · +$amount → $accumulatedAtThatPoint`
- Si hay más de 5: mostrar "y N más..." al final.
- Sin scroll interno (todo visible dentro del área expandida).

### Sugerencia conductual
- Si `remaining > 0`: "Aporta $X en N días para alcanzar tu meta"
  - `X = remaining / 4` (sugerencia semanal para 1 mes)
  - `N = 7` (próximo domingo)
- Si `remaining === 0` (meta alcanzada): mostrar badge 🎉 "¡Meta cumplida!" + "¿Quieres establecer una nueva meta?"

---

## 6. Componente: PocketCardDepositExpanded

```
┌─────────────────────────────────────┐
│ 📈 Tendencia de ahorro             │
│                                     │
│  [sparkline SVG de 280x30]  ↑ +23% │ ← Tendencia del período
│                                     │
│ ─── Últimos movimientos ───        │
│  12 MAY  · +$200  → $3,200         │
│  05 MAY  · +$500  → $3,000         │
│  28 ABR  · +$100  → $2,500         │
│                                     │
│ ⚡ Racha: 3 semanas consecutivas    │ ← Status Quo Bias
└─────────────────────────────────────┘
```

### Datos necesarios
- `pocket.accumulatedAmount` — acumulado actual
- `pocket.deposits[]` — array de depósitos con `{ amount, date }`
- `pocket.initialAmount` — monto inicial
- Cálculo de racha: semanas consecutivas con al menos 1 depósito
- Cálculo de tendencia: comparar acumulado actual vs. hace 30 días

### Sparkline
- SVG inline, 100% de ancho, ~30px de alto.
- Sin tooltips, sin etiquetas, sin ejes.
- Solo la polyline + área fill.
- Color: verde si `currentValue >= initialValue`, rojo si no.
- Implementación simplificada (tomar los últimos 30 puntos como máximo, no es necesario el algoritmo completo de buildDataPoints).

### Racha conductual
- Definición: "semana con al menos un depósito".
- Contar hacia atrás desde la semana actual.
- Si `racha >= 2`: mostrar con emoji ⚡ + texto "Racha: N semanas consecutivas".
- Si `racha === 1`: "¡Primera semana! Sigue así 💪".
- Si `racha === 0`: "Esta semana aún no has ahorrado" (FOMO / pérdida).

---

## 7. Modificaciones a PocketList.tsx

### Cambio exacto (1 línea)

**Antes** (línea 4):
```typescript
import PocketCard from './PocketCard';
```

**Después** (para activar hover expandido):
```typescript
import PocketCard from './PocketCardExpanded';
```

Para **deshacer**: revertir esta línea al estado anterior.

### Sin otros cambios
- Las props `onEditPocket`, `onDeletePocket`, `onDepositPocket` pasan igual.
- El tipado `PocketListProps` NO cambia.
- El resto del archivo NO se toca.

---

## 8. Modificaciones a index.ts (barrel export)

Agregar al final:

```typescript
export { default as PocketCardExpanded } from './PocketCardExpanded';
```

---

## 9. Pruebas de humo para verificar reversibilidad

| Prueba | Acción | Resultado esperado |
|--------|--------|-------------------|
| **Revertir cambio** | Volver `PocketList.tsx` a `import PocketCard from './PocketCard'` | El sistema funciona exactamente como antes del cambio |
| **Activar hover** | Cambiar a `import PocketCard from './PocketCardExpanded'` | Tarjetas se expanden en hover con contenido según `pocket.type` |
| **Goal expandido** | Hover sobre Pocket con `type: 'goal'` | Muestra meta, progreso, timeline y sugerencia |
| **Deposit expandido** | Hover sobre Pocket con `type: 'deposit'` | Muestra sparkline, últimos movimientos y racha |
| **Sin depósitos** | Pocket con `deposits: []` | Área expandida muestra mensaje "Sin movimientos aún" |
| **Dark mode** | Alternar tema | Colores y contrastes correctos (uso de clases `dark:`) |

---

## 10. Resumen de esfuerzo

| Componente | Líneas estimadas | Dependencias |
|------------|-----------------|--------------|
| `PocketCardExpanded.tsx` | ~120 | `PocketCardGoalExpanded`, `PocketCardDepositExpanded` |
| `PocketCardGoalExpanded.tsx` | ~80 | `pocket` prop |
| `PocketCardDepositExpanded.tsx` | ~100 | `pocket` prop, mini sparkline SVG |
| Modificación `PocketList.tsx` | 1 línea | - |
| Modificación `index.ts` | 1 línea | - |

**Total estimado:** ~300 líneas nuevas, 2 líneas modificadas.
**Tiempo estimado:** 2-3 horas de desarrollo.
**Riesgo de reverse:** Mínimo — cambiar 1 línea de import revierte todo al estado actual.
