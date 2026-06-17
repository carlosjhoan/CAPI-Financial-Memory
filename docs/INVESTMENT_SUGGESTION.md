# INVESTMENT_SUGGESTION.md — Módulo de Inteligencia de Inversiones (Value Investing)

> **Propósito del documento:** Definir la arquitectura, los flujos y las reglas de negocio para un módulo de **Investment Intelligence** en PFM que, basado en los registros financieros del usuario y datos de mercado, genere oportunidades de inversión personalizadas con criterios de **Value Investing**.

---

## 1. Concepto General

El módulo **Investment Intelligence** analiza:

1. **Los registros financieros del usuario** (ingresos, gastos, deudas, préstamos, flujo de caja) → para determinar su **perfil económico** y **capacidad de inversión**.
2. **Datos de mercado** (precios, fundamentales, estados financieros, dividendos, múltiplos) → para evaluar activos con criterios de **Value Investing**.
3. **Reglas de valor** (margen de seguridad, valor intrínseco, calidad del negocio, solidez financiera) → para generar **oportunidades personalizadas**.

> ⚠️ **Aviso legal:** El sistema no da consejos financieros. Presenta **asistencia educativa de análisis**: scores, oportunidades para investigar, watchlist sugerida, margen de seguridad calculado. Nunca "compra esto ahora".

---

## 2. Flujo General del Sistema

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                    INVESTMENT INTELLIGENCE MODULE                        │
 └─────────────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
 ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │  1. Perfil      │  │  2. Datos de     │  │  3. Motor Value      │
 │  Económico      │  │  Mercado         │  │  Investing           │
 │                 │  │                  │  │                      │
 │  - Ingresos     │  │  - Precios       │  │  - Valor Intrínseco  │
 │  - Gastos       │  │  - Fundamentales │  │  - Margen Seguridad  │
 │  - Deudas       │  │  - Estados Fin.  │  │  - Score Calidad     │
 │  - Flujo Caja   │  │  - Ratios        │  │  - Score Riesgo      │
 │  - Capacidad    │  │  - Dividendos    │  │  - Señales Oportunidad│
 │  de Inversión   │  │  - Noticias      │  │                      │
 └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘
          │                    │                        │
          └────────────────────┼────────────────────────┘
                               ▼
          ┌─────────────────────────────────────────────┐
          │            OPORTUNIDADES                     │
          │    Personalizadas según perfil + mercado     │
          │                                              │
          │  Ticker: KO     Precio: $58                  │
          │  Valor Intrínseco: $72   Margen: 19.4%      │
          │  Score Value: 78/100    Riesgo: Bajo         │
          │  Señal: "Watchlist - comprar bajo $54"       │
          └─────────────────────────────────────────────┘
```

---

## 3. Arquitectura de Módulos

```
backend/src/
└── application/
    ├── auth/                          ← (existente)
    ├── debt/                          ← (existente)
    ├── expense/                       ← (existente)
    ├── income/                        ← (existente)
    └── loan/                          ← (existente)
    └── investment/                    ← NUEVO
        ├── investment.module.ts
        ├── investment.controller.ts
        ├── investment.service.ts
        │
        ├── profile/                   ← Perfil económico del usuario
        │   ├── investment-profile.service.ts
        │   ├── dto/
        │   │   ├── investment-profile.dto.ts
        │   │   └── investment-capacity.dto.ts
        │   └── interfaces/
        │       └── investor-risk-profile.interface.ts
        │
        ├── market/                    ← Conexión a APIs de mercado
        │   ├── market-data.service.ts
        │   ├── providers/
        │   │   ├── financial-modeling-prep.provider.ts
        │   │   ├── polygon-io.provider.ts
        │   │   └── alpha-vantage.provider.ts
        │   └── interfaces/
        │       ├── asset-quote.interface.ts
        │       └── asset-fundamentals.interface.ts
        │
        ├── engine/                    ← Motor de Value Investing
        │   ├── value-investing-engine.service.ts
        │   ├── calculators/
        │   │   ├── intrinsic-value-calculator.ts
        │   │   ├── margin-of-safety-calculator.ts
        │   │   └── financial-health-calculator.ts
        │   ├── scorers/
        │   │   ├── quality-scorer.ts
        │   │   ├── valuation-scorer.ts
        │   │   └── risk-scorer.ts
        │   └── interfaces/
        │       └── value-score.interface.ts
        │
        ├── recommendation/            ← Generación de oportunidades
        │   ├── recommendation.service.ts
        │   ├── dto/
        │   │   └── recommendation.dto.ts
        │   └── interfaces/
        │       └── opportunity.interface.ts
        │
        ├── portfolio/                 ← Watchlist y holdings
        │   ├── portfolio.service.ts
        │   ├── entities/
        │   │   ├── watchlist.entity.ts
        │   │   └── holding.entity.ts
        │   └── dto/
        │       └── watchlist.dto.ts
        │
        └── alerts/                    ← Alertas de precio/oportunidad
            ├── investment-alerts.service.ts
            └── interfaces/
                └── price-alert.interface.ts
```

---

## 4. Flujo de Procesamiento Diario

```
                        DÍA 1 (cada 24h — datos diarios)
                               │
                               ▼
           ┌───────────────────────────────────────┐
           │  MARKET DATA FETCHER                   │
           │                                       │
           │  1. Obtener quotes de tickers          │
           │     en watchlist + screener universe   │
           │  2. Obtener fundamentales (trimestral) │
           │  3. Cachear en DB local                │
           └──────────────────┬────────────────────┘
                              │
                              ▼
           ┌───────────────────────────────────────┐
           │  USER PROFILE CALCULATOR               │
           │                                       │
           │  1. Leer ingresos/gastos/deudas        │
           │     de los últimos 12 meses            │
           │  2. Calcular capacidad mensual de      │
           │     inversión                          │
           │  3. Calcular fondo de emergencia       │
           │  4. Calcular ratio deuda/ingreso       │
           │  5. Determinar perfil de riesgo        │
           └──────────────────┬────────────────────┘
                              │
                              ▼
           ┌───────────────────────────────────────┐
           │  VALUE INVESTING ENGINE                │
           │                                       │
           │  1. Para cada ticker en el universo:   │
           │     a) Calcular valor intrínseco       │
           │     b) Calcular margen de seguridad    │
           │     c) Calcular quality score          │
           │     d) Calcular risk score             │
           │     e) Combinar en value score (0-100) │
           │  2. Filtrar por:                       │
           │     - Margen de seguridad > 15%        │
           │     - Quality score > 60               │
           │     - Risk score < 40                  │
           └──────────────────┬────────────────────┘
                              │
                              ▼
           ┌───────────────────────────────────────┐
           │  RECOMMENDATION GENERATOR              │
           │                                       │
           │  1. Cruzar oportunidades vs perfil:    │
           │     - Capacidad de inversión           │
           │     - Tolerancia al riesgo             │
           │     - Horizonte temporal               │
           │  2. Asignar señal:                     │
           │     - "Fuerte" (score > 80)            │
           │     - "Moderada" (score 60-80)         │
           │     - "Watchlist" (score 40-60)        │
           │  3. Generar explicación legible        │
           └──────────────────┬────────────────────┘
                              │
                              ▼
           ┌───────────────────────────────────────┐
           │  ALERTS + DASHBOARD                    │
           │                                       │
           │  1. Si precio objetivo alcanzado →     │
           │     notificación push/in-app           │
           │  2. Si nuevo ticker cruza umbral →     │
           │     sugerir agregar a watchlist        │
           │  3. Actualizar widgets en Dashboard    │
           └───────────────────────────────────────┘
```

> **Nota:** Los datos fundamentales se actualizan **trimestralmente** (cuando las empresas reportan).  
> Los precios se actualizan **diariamente** (cierre de mercado).  
> El perfil del usuario se recalcula **en cada nuevo registro financiero** (gasto, ingreso, pago de deuda).

---

## 5. Cálculo del Perfil Económico del Usuario

### 5.1 Datos de entrada

Todos obtenidos de los registros **ya existentes** en PFM:

| Dato | Origen en PFM |
|------|---------------|
| Ingresos mensuales promedio (12 meses) | `GET /incomes/summary/yearly?year=N` |
| Gastos mensuales promedio (12 meses) | `GET /expenses/summary/yearly?year=N` |
| Pagos mensuales de deudas | `Debt.installAmount` |
| Pagos mensuales de préstamos | `Loan.installment` |
| Deuda activa total | `Debt.remainingAmount` (sum) + `Loan.remainingAmount` (sum) |
| Historial de pagos | `Debt.payments`, `Loan.payments` |
| Edad del usuario | `UserEntity.createdAt` |

### 5.2 Métricas calculadas

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          PERFIL DE INVERSIÓN                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INGRESO_PROMEDIO_MENSUAL = Σ ingresos_12meses / 12                         │
│  GASTO_PROMEDIO_MENSUAL   = Σ gastos_12meses / 12                           │
│  FLUJO_NETO_MENSUAL       = INGRESO_PROM - GASTO_PROM                       │
│                                                                             │
│  PAGO_DEUDA_MENSUAL       = Σ(debt.installAmount) + Σ(loan.installment)     │
│  RATIO_DEUDA_INGRESO      = PAGO_DEUDA_MENSUAL / INGRESO_PROMEDIO_MENSUAL  │
│                                                                             │
│  FONDO_EMERGENCIA_MESES   = (ahorros / GASTO_PROMEDIO)        ¹            │
│  META_FONDO_EMERGENCIA    = 6 meses                                        │
│                                                                             │
│  CAPACIDAD_INVERSION      = FLUJO_NETO_MENSUAL - PAGO_DEUDA_MENSUAL        │
│                              - (mínimo: 10% del flujo para ahorro)          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
   ¹ Requiere nueva entidad `Account` o `SavingsGoal`. Por defecto se asume 0
     hasta que el usuario registre ahorros.
```

### 5.3 Perfil de riesgo inferido

```
RATIO_DEUDA_INGRESO + FONDO_EMERGENCIA + ESTABILIDAD_INGRESOS
                │
                ▼
┌──────────────┬──────────────────┬──────────────────┬──────────────────┐
│  Perfil      │  Conservador     │  Moderado        │  Agresivo        │
├──────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Deuda/Ingr.  │  > 40%           │  20% - 40%       │  < 20%           │
│ Fondo Emerg. │  < 3 meses       │  3 - 6 meses     │  > 6 meses       │
│ Ingresos     │  Variables       │  Mixtos          │  Estables        │
│ Horizonte    │  Corto (< 1 año) │  Medio (1-3)     │  Largo (> 3)     │
│ Acción rec.  │  Pagar deuda     │  ETFs/Blue chips │  Value equities  │
│              │  + Fondo emerg.  │  + Dividendos    │  + Crecimiento   │
└──────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 6. Motor de Value Investing — Criterios

### 6.1 Valor Intrínseco

Se calculan múltiples métodos y se usa el **menor** (enfoque conservador):

```
MÉTODO 1 — DCF Simplificado
  Valor = FCF_ttm × (1 + g) / (WACC - g)
  Donde:
    FCF_ttm = Free Cash Flow (últimos 12 meses)
    g = tasa de crecimiento estimada (promedio 5 años, máximo 5%)
    WACC = 10% (default, configurable)

MÉTODO 2 — Múltiplo Histórico
  Valor = EPS_ttm × P/E_promedio_5años

MÉTODO 3 — Graham Number
  Valor = √(22.5 × EPS_ttm × BVPS)
  Donde:
    EPS_ttm = Earnings Per Share (últimos 12 meses)
    BVPS = Book Value Per Share

VALOR_INTRINSECO = min(DCF, Múltiplo_Histórico, Graham_Number)
```

### 6.2 Margen de Seguridad

```
MARGEN_SEGURIDAD = (VALOR_INTRINSECO - PRECIO_ACTUAL) / VALOR_INTRINSECO

Interpretación:
  > 40% → Oportunidad fuerte (si calidad también es buena)
  25% - 40% → Oportunidad moderada
  15% - 25% → Watchlist
  < 15% → Sobrevalorado / Sin interés
```

### 6.3 Score de Calidad (0-100)

```
CALIDAD = Promedio ponderado de:

  1. ROIC (Return on Invested Capital)      peso: 25%
     Score = min(ROIC / 20%, 100) × 0.25

  2. Crecimiento EPS (5 años)               peso: 15%
     Score = min(CAGR_EPS / 15%, 100) × 0.15

  3. Márgenes operativos estables           peso: 20%
     Score = (desviación_estándar_margen < 5%) ? 100 : 50

  4. Deuda / Equity                         peso: 20%
     Score = D/E < 0.5 → 100
             D/E 0.5-1.0 → 70
             D/E 1.0-2.0 → 40
             D/E > 2.0 → 0

  5. FCF positivo (últimos 5 años)          peso: 20%
     Score = (años_FCF_positivo / 5) × 100
```

### 6.4 Score de Riesgo (0-100)

```
RIESGO = Promedio ponderado de:

  1. Beta (volatilidad vs mercado)          peso: 30%
     Score = Beta × 25 (máximo 100)

  2. Drawdown máximo (12 meses)             peso: 25%
     Score = maxDrawdown × 1.5 (máximo 100)

  3. Liquidez (volumen diario promedio)     peso: 25%
     Score = volumen < 100K → 80
             volumen 100K-1M → 50
             volumen > 1M → 20

  4. Concentración sectorial                peso: 20%
     Score = sector volátil (tech, crypto) → 70
             sector defensivo (utilities, healthcare) → 30
```

### 6.5 Value Score Final

```
VALUE_SCORE = (CALIDAD × 0.50) + (MARGEN_SEGURIDAD_NORMALIZADO × 0.35) - (RIESGO × 0.15)

Donde:
  MARGEN_SEGURIDAD_NORMALIZADO = min(margenSeguridad / 50%, 100)

Señal según score:
  > 80 → Oportunidad Fuerte
  60-80 → Oportunidad Moderada
  40-60 → Watchlist
  < 40 → No recomendado
```

---

## 7. Flujo de Recomendación Personalizada

```
          PERFIL USUARIO                    OPORTUNIDADES MERCADO
               │                                   │
               ▼                                   ▼
     ┌───────────────────┐           ┌──────────────────────────┐
     │ Conservador       │           │ KO — Score: 78           │
     │ Capacidad: $500/m │           │     Margen: 19.4%        │
     │ Horizonte: corto  │           │     Calidad: 85/100      │
     │ Fondo emerg.: 2m  │           │     Riesgo: 20/100       │
     └────────┬──────────┘           │     Sector: Consumo      │
              │                      │     Dividendos: 3.2%     │
              │                      └──────────┬───────────────┘
              │                                 │
              └──────────────┬──────────────────┘
                             ▼
              ┌─────────────────────────────────┐
              │    FILTROS DE PERSONALIZACIÓN    │
              │                                  │
              │  ¿Capacidad > precio unidad?      │
              │  ¿Horizonte compatible?           │
              │  ¿Riesgo match con perfil?        │
              │  ¿Sector adecuado?                │
              │  ¿Dividendos si perfil conserva?  │
              └────────────────┬─────────────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
     ┌──────────────────────┐  ┌──────────────────────────┐
     │ OPORTUNIDAD APROBADA │  │  OPORTUNIDAD RECHAZADA   │
     │                      │  │                          │
     │ KO — Señal:          │  │  TSLA — Señal: N/A       │
     │ Watchlist            │  │  Motivo:                 │
     │ Price target: $54    │  │  Beta > 2.0             │
     │ Explicación:         │  │  Sin dividendos          │
     │ "Negocio sólido con  │  │  Perfil conservador no   │
     │  deuda baja y FCF    │  │  compatible              │
     │  consistente. Espera │  │                          │
     │  mejor precio."      │  │                          │
     └──────────────────────┘  └──────────────────────────┘
```

---

## 8. Endpoints del Módulo

| Método | Endpoint | Propósito | Frecuencia |
|--------|----------|-----------|------------|
| `GET` | `/investments/profile` | Perfil económico del usuario calculado desde sus registros | Por demanda |
| `GET` | `/investments/capacity` | Capacidad mensual de inversión recomendada | Por demanda |
| `GET` | `/investments/profile/risk` | Perfil de riesgo inferido (conservador/moderado/agresivo) | Por demanda |
| `GET` | `/market/assets/:ticker/quote` | Precio actual + variación diaria | Tiempo real |
| `GET` | `/market/assets/:ticker/fundamentals` | Estados financieros, ratios, dividendos | Diario |
| `GET` | `/market/assets/:ticker/intrinsic-value` | Valor intrínseco + margen de seguridad | Por demanda |
| `GET` | `/market/screener/value` | Screener value con filtros configurables | Diario |
| `GET` | `/investments/recommendations` | Oportunidades personalizadas para el usuario | Diario |
| `GET` | `/investments/recommendations/:id/rationale` | Explicación legible de una oportunidad | Por demanda |
| `POST` | `/investments/watchlist` | Agregar ticker a watchlist | — |
| `DELETE` | `/investments/watchlist/:ticker` | Remover de watchlist | — |
| `GET` | `/investments/watchlist` | Listar watchlist con scores actualizados | Diario |
| `POST` | `/investments/alerts` | Configurar alerta: precio objetivo, margen, dividendo | — |
| `GET` | `/investments/alerts` | Alertas activas y disparadas | Por demanda |
| `POST` | `/loans/:id/simulate-payoff` | Simular: ¿invertir o pagar deuda primero? | Por demanda |

---

## 9. Componentes Frontend — Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD — Investment Intelligence                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ Mi Perfil Financiero  │  │ Capacidad de Inversión                  │ │
│  │                       │  │                                         │ │
│  │  Perfil: Moderado     │  │  $500.000/mes disponibles               │ │
│  │  Deuda/Ingreso: 25%   │  │  [████████░░░░] 50% utilizado           │ │
│  │  Fondo emerg.: 4 meses│  │  Recomendación: invertir $250.000/mes   │ │
│  │  Score: 72/100        │  │  El resto: pagar deuda + ahorrar        │ │
│  └───────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Oportunidades Value Investing  (3 nuevas)                        │ │
│  │                                                                    │ │
│  │  Ticker │ Precio │ V.Intrínseco │ Margen │ Score │ Señal           │ │
│  │  ───────┼────────┼──────────────┼────────┼───────┼─────────────   │ │
│  │  KO     │  $58   │    $72       │  19%   │  78   │ 🔍 Watchlist   │ │
│  │  JPM    │  $165  │    $220      │  25%   │  85   │ ✅ Moderada    │ │
│  │  PEP    │  $175  │    $210      │  17%   │  72   │ 🔍 Watchlist   │ │
│  │                                                                    │ │
│  │  [Ver detalle →]                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────┐ │
│  │ Watchlist Activa      │  │ Alertas                                 │ │
│  │                       │  │                                         │ │
│  │  KO  → $54 (target)   │  │  🔔 KO alcanzó precio objetivo         │ │
│  │  JPM → $150 (target)  │  │  🔔 JPM reportó resultados trimestrales│ │
│  │  AAPL→ $170 (target)  │  │  🔔 Nueva oportunidad: JNJ score 82    │ │
│  └───────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Pagar Deuda vs Invertir  (calculadora comparativa)                │ │
│  │                                                                    │ │
│  │  Si pagas $50K extra/mes en tu préstamo → ahorras $320K en        │ │
│  │  intereses y terminas 8 meses antes.                               │ │
│  │                                                                    │ │
│  │  Si inviertes $50K/mes en KO → estimado: +$420K en 2 años         │ │
│  │  (basado en rendimiento histórico + dividendos).                   │ │
│  │                                                                    │ │
│  │  [Conclusión: Pagar deuda tiene mejor retorno libre de riesgo]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. APIs de Mercado — Proveedores

### 10.1 Tabla comparativa

| Proveedor | Precios | Fundamentales | Estados Fin. | WebSocket | Gratis | Costo |
|-----------|---------|---------------|-------------|-----------|--------|-------|
| **Polygon.io** | ✅ | ✅ | ✅ | ✅ | No | $29/mes |
| **Finnhub** | ✅ | ✅ | ✅ | ✅ | Limitado | Free tier |
| **Financial Modeling Prep** | ✅ | ✅ | ✅ | ❌ | Limitado | Free tier |
| **Alpha Vantage** | ✅ | ✅ | ✅ | ❌ | 5 req/min | Gratis |
| **IEX Cloud** | ✅ | ✅ | ❌ | ❌ | 50K/mes | $9/mes |
| **Tiingo** | ✅ | ✅ | ❌ | ❌ | Limitado | $10/mes |
| **Twelve Data** | ✅ | ❌ | ❌ | ✅ | Limitado | Free tier |
| **SEC EDGAR** | ❌ | ❌ | ✅ (USA) | ❌ | Ilimitado | Gratis |

### 10.2 Arquitectura de proveedores

```
 ┌────────────────────────────────────────────────────┐
 │              MarketDataService                     │
 │                                                    │
 │  getQuote(ticker): Promise<AssetQuote>             │
 │  getFundamentals(ticker): Promise<Fundamentals>    │
 │  getFinancialStatements(ticker, period): Promise<> │
 └──────────────────┬─────────────────────────────────┘
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
 ┌────────────┐ ┌────────┐ ┌──────────┐
 │ FMP        │ │Polygon │ │ Alpha    │
 │ Provider   │ │Provider │ │ Vantage  │
 │            │ │        │ │ Provider │
 │ (primario) │ │(fallo1)│ │ (fallo2) │
 └────────────┘ └────────┘ └──────────┘
```

> La implementación tiene un **provider principal** y al menos 2 **fallbacks**. Si el principal falla (rate limit, caída), intenta el siguiente.

### 10.3 Datos requeridos por el motor

| Dato | API | Frecuencia |
|------|-----|------------|
| Precio actual | Quote endpoint | Diaria (o real-time) |
| Market Cap | Quote endpoint | Diaria |
| P/E, P/B, EV/EBITDA | Ratios endpoint | Trimestral |
| EPS, BVPS, FCF | Financial Statements | Trimestral |
| Revenue, Net Income | Income Statement | Trimestral |
| Total Debt, Equity | Balance Sheet | Trimestral |
| ROIC, ROE, Márgenes | Fundamental endpoint | Trimestral |
| Beta, volatilidad | Risk endpoint | Diaria |
| Dividendos | Dividend endpoint | Trimestral |
| Sector, industria | Profile endpoint | Anual |

---

## 11. Flujo de Calidad de Datos (Data Quality Pipeline)

```
        API EXTERNA
             │
             ▼
    ┌────────────────┐
    │  RAW DATA       │   ← Datos crudos tal cual vienen de la API
    │  (sin procesar) │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  VALIDACIÓN     │   ← ¿Datos nulos? ¿Fuera de rango? ¿Fechas coherentes?
    │                 │
    │  ❌ Inválido → │   → Reintentar con fallback provider
    │  ✅ Válido   → │   → Pasar a normalización
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  NORMALIZACIÓN  │   ← Unificar nombres de campos, formato numérico,
    │                 │     convertir monedas a USD, manejar splits
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  CACHÉ LOCAL    │   ← Guardar en tabla `market_snapshots`
    │  (PostgreSQL)   │     con timestamp para saber frescura
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  MOTOR VALUE    │   ← Usa datos limpios y frescos
    └────────────────┘
```

---

## 12. Criterios para evitar Value Traps

El engine debe detectar señales de alerta que invaliden incluso un score alto:

```
🚩 FLAGS ROJOS (cualquiera → descartar automáticamente):

  □ Deuda/Equity > 3.0
  □ FCF negativo por 3+ años consecutivos
  □ Revenue decreciente 3+ años
  □ Payout ratio > 100% (dividendo no sostenible)
  □ Auditoría con salvedades (going concern)
  □ Litigios materiales pendientes
  □ Cuentas por cobrar creciendo más rápido que revenue

⚠️ FLAGS AMARILLOS (puntuar negativo pero no descartar):

  □ CEO vendiendo acciones consistentemente
  □ Insider selling > buying en 12 meses
  □ Insiders vendieron > 20% de sus holdings
  □ Short interest > 15% del float
  □ Revenue crece pero FCF no (cobranza lenta)
  □ Dilución de shares outstanding > 5% anual
```

---

## 13. Estrategia de Datos y Consumo de APIs

### 13.1 Plan de suscripciones por fase

```
Fase 1 — MVP
├── Alpha Vantage (gratis, 5 req/min, 500/día)
│   → Quotes + fundamentales básicos (P/E, EPS)
│   → Universe: S&P 500 solamente
└── SEC EDGAR (gratis)
    → Estados financieros completos

Fase 2 — Producción
├── Financial Modeling Prep ($49/mes)
│   → Quotes + fundamentales + estados financieros
│   → 250 req/día
└── Polygon.io ($79/mes)
    → Websockets real-time + más tickers

Fase 3 — Escalado
├── Intrinio (desde $100/mes)
│   → Datos financieros profesionales + SEC filings
└── Bloomberg Terminal API (enterprise)
```

### 13.2 Cache y frescura de datos

| Dato | Cache en DB | TTL | Recalcular |
|------|-------------|-----|------------|
| Quote | `market_quotes` | 1 hora (intraday) | Cada hora en horario de mercado |
| Fundamentales | `market_fundamentals` | 1 día | 1 vez al día (post-market) |
| Estados financieros | `market_financials` | 90 días | Al cierre trimestral |
| Perfil usuario | `investment_profile` | Por demanda | Cada vez que el usuario crea un registro financiero |
| Value Score | `value_scores` | 24 horas | 1 vez al día |

---

## 14. Dashboard — Mockup de Investment Intelligence

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Investment Intelligence                          [Perfil: Moderado] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐ │
│  │ Capacidad Mensual   │  │ Fondo Emergencia   │  │ Deuda/Ingreso  │ │
│  │ $500,000            │  │ 4 meses ████░░░░   │  │ 25% ██░░░░░░  │ │
│  │ Recomendado: $250K  │  │ Meta: 6 meses      │  │ Healthy        │ │
│  └────────────────────┘  └────────────────────┘  └────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  🔥 Oportunidades para ti                                      │ │
│  │                                                                 │ │
│  │  ┌──────┬────────┬──────────┬────────┬───────┬──────────┬─────┐ │ │
│  │  │Ticker│ Precio │V.Intrín. │Margen  │Score  │ Señal    │Acc. │ │ │
│  │  ├──────┼────────┼──────────┼────────┼───────┼──────────┼─────┤ │ │
│  │  │ JPM  │ $165   │ $220     │ 25% ▲  │ 85/100│ ✅ Fuerte │ 📋  │ │ │
│  │  │ KO   │ $58    │ $72      │ 19% ▲  │ 78/100│ 🔍 Watch  │ 📋  │ │ │
│  │  │ PEP  │ $175   │ $210     │ 17% ▲  │ 72/100│ 🔍 Watch  │ 📋  │ │ │
│  │  │ AAPL │ $178   │ $195     │ 9% ▼   │ 55/100│ ❌ Caro   │ —   │ │ │
│  │  └──────┴────────┴──────────┴────────┴───────┴──────────┴─────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  💡 Explicación — JPMorgan Chase (JPM)                         │ │
│  │                                                                 │ │
│  │  JPM cotiza a $165, pero nuestro modelo estima un valor         │ │
│  │  intrínseco de $220 por acción (método DCF). Esto da un         │ │
│  │  margen de seguridad del 25%.                                   │ │
│  │                                                                 │ │
│  │  ✅ ROIC: 14% (sólido, supera WACC)                             │ │
│  │  ✅ D/E: 0.65 (deuda manejable)                                 │ │
│  │  ✅ FCF positivo 5 años consecutivos                            │ │
│  │  ✅ Beta: 0.89 (volatilidad baja para el sector)                │ │
│  │  ⚠️  Sector cíclico — diversificar con otros sectores          │ │
│  │                                                                 │ │
│  │  Price target: $150 (10% debajo del actual) para entrada segura │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  📈 Watchlist — 3 activos                                      │ │
│  │                                                                 │ │
│  │  JPM │ Target: $150 │ Actual: $165 │ 🔔 Alerta: -9%            │ │
│  │  KO  │ Target: $54  │ Actual: $58  │ 🔔 Alerta: -7%            │ │
│  │  JNJ │ Target: $145 │ Actual: $160 │ ⏸ Pausado                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Comparador: ¿Invertir o Pagar Deuda?                          │ │
│  │                                                                 │ │
│  │  Tu préstamo: $10M al 12% anual, quedan 18 meses               │ │
│  │  Cuota actual: $611,000/mes                                     │ │
│  │                                                                 │ │
│  │  Opción A: Pagar $100K extra/mes                                │ │
│  │    → Ahorras $1.2M en intereses, terminas 7 meses antes        │ │
│  │                                                                 │ │
│  │  Opción B: Invertir $100K/mes en JPM (rendim. estimado 10%)    │ │
│  │    → Ganas $1.8M estimados (sin garantía)                      │ │
│  │                                                                 │ │
│  │  ✅ Recomendación: Pagar deuda (retorno libre de riesgo 12%)   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 15. Roadmap de Implementación

```
Fase 1 — MVP Seguro (Semanas 1-4)
├── Leer perfil económico desde datos PFM existentes
│   └── GET /investments/profile (capacidad, deuda/ingreso)
├── Watchlist manual
│   └── CRUD de watchlist sin datos de mercado
├── Integración Alpha Vantage (gratis)
│   └── Quotes diarias + P/E, EPS para S&P 500
├── Screener value básico
│   └── Filtros: P/E < 15, D/E < 1, FCF positivo
├── Endpoints implementados:
│   ├── GET /investments/profile
│   ├── GET /investments/capacity
│   ├── GET /market/assets/:ticker/quote
│   ├── GET /market/screener/value
│   ├── POST /investments/watchlist
│   └── GET /investments/watchlist
└── Dashboard widget: capacidad de inversión + watchlist

Fase 2 — Recomendaciones (Semanas 5-8)
├── Motor de valor intrínseco (DCF + Graham + Múltiplos)
├── Margen de seguridad
├── Score de calidad (ROIC, márgenes, crecimiento)
├── Score de riesgo (beta, drawdown, liquidez)
├── Recomendaciones personalizadas por perfil
├── Explicación legible de cada oportunidad
├── Endpoints nuevos:
│   ├── GET /market/assets/:ticker/intrinsic-value
│   ├── GET /investments/recommendations
│   └── GET /investments/recommendations/:id/rationale
└── Dashboard widget: oportunidades + explicación

Fase 3 — Alertas y Tiempo Real (Semanas 9-12)
├── WebSockets de precios (Polygon.io)
├── Recalcular margen de seguridad en vivo
├── Alertas configurables:
│   └─ Precio objetivo alcanzado
│   └─ Margen de seguridad cruza umbral
│   └─ Nuevo ticker con score alto
├── Detección de value traps
├── Endpoints nuevos:
│   ├── POST /investments/alerts
│   ├── GET /investments/alerts
│   └── WebSocket /ws/market/prices
└── Dashboard widget: alertas en tiempo real

Fase 4 — Avanzado (Semanas 13-16)
├── Calculadora: pagar deuda vs invertir
├── Simulador de escenarios
├── Portfolio tracking con asignación por sector
├── Backtesting de estrategias value
├── Rebalanceo sugerido de cartera
├── Tax-aware recommendations
└── Dashboard completo de Investment Intelligence
```

---

## 16. Prerrequisitos Técnicos

| Prerrequisito | Para qué | Fase |
|---------------|----------|------|
| `@nestjs/schedule` | Jobs diarios para actualizar quotes y scores | Fase 1 |
| `@nestjs/websockets` | WebSockets para precios en tiempo real | Fase 3 |
| `nestjs-cache-manager` | Cache de respuestas de APIs externas | Fase 1 |
| `axios` | Llamadas a APIs de mercado (ya existe en frontend, igual en backend) | Fase 1 |
| Tabla `market_snapshots` | Cache de datos de mercado | Fase 1 |
| Tabla `watchlist_items` | Watchlist persistente por usuario | Fase 1 |
| Tabla `investment_alerts` | Alertas configurables por usuario | Fase 3 |
| Tabla `portfolio_holdings` | Holdings reales del usuario | Fase 4 |
| Módulo `shared/finance-utils.ts` | Fórmulas: DCF, Graham, amortización francesa | Fase 2 |

---

## 17. Reglas de Negocio — Guardrails

```
🚫 No recomendar inversión si:
   □ El usuario NO tiene fondo de emergencia (0 meses)
   □ El ratio deuda/ingreso > 50%
   □ El usuario no ha registrado ingresos en los últimos 3 meses
   □ La capacidad de inversión es negativa
   → En todos estos casos: recomendar primero estabilizar finanzas personales

🚫 No incluir en resultados si el activo:
   □ Es un value trap (ver flags rojos en sección 12)
   □ Tiene margen de seguridad < 15%
   □ Tiene market cap < $1B (evitar microcaps)
   □ Tiene volumen diario < 50K acciones (ilíquido)

✅ Siempre incluir en cada recomendación:
   □ Explicación legible ("por qué este activo")
   □ Riesgo claramente identificado
   □ Price target sugerido (no precio de compra)
   □ Fecha del cálculo (los datos se vuelven obsoletos)
```

---

## 18. Diccionario de Datos — Nuevas Tablas

### 18.1 `watchlist_items`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID (FK) | Usuario propietario |
| ticker | VARCHAR(10) | Símbolo (KO, JPM, etc.) |
| targetPrice | DECIMAL(12,2) | Precio objetivo de compra |
| notes | TEXT | Notas personales |
| isActive | BOOLEAN | Watchlist activa o archivada |
| createdAt | TIMESTAMP | — |
| updatedAt | TIMESTAMP | — |

### 18.2 `market_snapshots`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| ticker | VARCHAR(10) | Símbolo |
| price | DECIMAL(12,2) | Último precio |
| change | DECIMAL(6,2) | Cambio % diario |
| peRatio | DECIMAL(8,2) | P/E actual |
| pbRatio | DECIMAL(8,2) | P/B actual |
| evEbitda | DECIMAL(8,2) | EV/EBITDA |
| eps | DECIMAL(8,2) | EPS |
| bvps | DECIMAL(8,2) | Book value per share |
| fcf | BIGINT | Free cash flow |
| debtEquity | DECIMAL(6,2) | Deuda/Equity |
| roic | DECIMAL(6,2) | ROIC % |
| beta | DECIMAL(6,2) | Beta |
| dividendYield | DECIMAL(6,2) | Dividend yield % |
| marketCap | BIGINT | Market cap |
| sector | VARCHAR(50) | Sector |
| industry | VARCHAR(50) | Industria |
| intrinsicValue | DECIMAL(12,2) | Valor intrínseco calculado |
| marginOfSafety | DECIMAL(6,2) | Margen de seguridad % |
| valueScore | DECIMAL(5,2) | Score final (0-100) |
| snapshotAt | TIMESTAMP | Cuándo se tomó el snapshot |

### 18.3 `investment_alerts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID (FK) | Usuario |
| ticker | VARCHAR(10) | Símbolo |
| type | ENUM('price_target', 'margin_safety', 'new_opportunity', 'dividend') | Tipo de alerta |
| threshold | DECIMAL(12,2) | Umbral configurado |
| isTriggered | BOOLEAN | Ya se disparó |
| triggeredAt | TIMESTAMP | Cuándo se disparó |
| isActive | BOOLEAN | Alerta activa |
| createdAt | TIMESTAMP | — |

---

## 19. Stack Tecnológico Sugerido (adicional)

| Herramienta | Para qué |
|-------------|----------|
| **`@nestjs/schedule`** | Jobs cron para actualización diaria |
| **`@nestjs/websockets` + `socket.io`** | WebSockets para precios en tiempo real |
| **`cache-manager`** | Cache de respuestas de APIs externas |
| **`recharts`** | Gráficos de valor intrínseco, margen de seguridad, scores |
| **`react-hook-form` + `zod`** | Formularios de watchlist, alertas (ya existe) |
| **`react-query`** | Cache y refetch de datos de mercado (ya existe) |
| **`d3-scale`** | Escalas y formateo de valores financieros |

---

## 20. Compliance y Consideraciones Legales

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚖️  Marco Legal — Colombia                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Ley 964 de 2005 (Mercado de Valores)                              │
│    - Art. 1: Definición de "asesoría en valores"                   │
│    - Art. 7: Quien dé recomendaciones personalizadas debe          │
│              estar registrado como asesor de valores                │
│                                                                     │
│  Decreto 2555 de 2010                                              │
│    - Capítulo 3: Requisitos para asesores de inversión             │
│                                                                     │
│  Circular Externa 007 de 2022 (SFC)                                │
│    - Regulación de roboadvisors y plataformas digitales            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ✅ Estrategia de Cumplimiento para PFM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. El sistema presenta "candidatos para análisis" — nunca          │
│     dice "compra", "vende", "es bueno para ti".                     │
│                                                                     │
│  2. Todas las oportunidades incluyen disclaimer:                    │
│     "Esto es un análisis educativo basado en datos históricos.     │
│      No es una recomendación de inversión. Consulte a un           │
│      profesional certificado antes de invertir."                    │
│                                                                     │
│  3. Las alertas son por price target personal, no por orden de     │
│     compra. "KO alcanzó tu precio objetivo de $54" ≠ "compra KO".  │
│                                                                     │
│  4. El cálculo de capacidad de inversión es informativo:           │
│     "Basado en tus registros, podrías considerar hasta $250K/mes".  │
│                                                                     │
│  5. Datos de mercado con delay de 15 min (evita regulación de     │
│     datos en tiempo real para no-profesionales).                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
