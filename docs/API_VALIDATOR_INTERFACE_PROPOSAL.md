# Propuesta: API Validator — Interfaz de Prueba para Providers Financieros

> **Propósito:** Validar visualmente qué providers traen data real-time y verídica, comparando side-by-side.
> **Fecha:** 20 de mayo de 2026
> **Stack objetivo:** React 18 + Vite + TailwindCSS + NestJS 10
> **Disclaimer:** Esto NO es el módulo de inversiones final — es un banco de pruebas para decidir qué providers usar.

---

## 1. Concepto General

Una SPA mínima (una sola página/ruta) dentro de PFM que permite:

1. **Buscar** un activo por ticker o nombre de compañía
2. **Seleccionar** qué provider API usar (o comparar varios)
3. **Visualizar** el quote actual + históricos
4. **Comparar** resultados entre providers para el mismo activo

El objetivo NO es tener datos bonitos — es **detectar inconsistencias**: qué API se cae, cuál da datos absurdos, cuál se queda con datos stale.

---

## 2. Layout de la UI

```
┌────────────────────────────────────────────────────────────────────┐
│  [Provider Selector ▼]  [Buscador: ticker o nombre...]  [🔍 Buscar] │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ 📊 Quote Actual      │  │ 📈 Gráfico de Histórico              │ │
│  │                     │  │                                      │ │
│  │  AAPL                │  │     ╱╲     ╱╲                        │ │
│  │  $299.93 ▲ +0.32%    │  │   ╱  ╲   ╱  ╲    ╱╲                 │ │
│  │  Apple Inc.          │  │  ╱    ╲ ╱    ╲  ╱  ╲                │ │
│  │  NASDAQ • Mercado abierto│  │ ╱      ╲      ╲╱    ╲               │ │
│  │                     │  │                                      │ │
│  │  Open:  $298.18     │  │  1S   1M   3M   6M   1A   YTD       │ │
│  │  High:  $302.34     │  │                                      │ │
│  │  Low:   $298.12     │  └──────────────────────────────────────┘ │
│  │  Close: $299.93     │                                           │
│  │  Vol:   1,389,352   │                                           │
│  │  Mkt Cap: $4.4T    │                                           │
│  │  52w: $193.46-$303.20│                                          │
│  └─────────────────────┘                                           │
├────────────────────────────────────────────────────────────────────┤
│  📋 Tabla de Registros Recientes (últimos 5-10 días)              │
│  ┌──────┬───────┬───────┬───────┬───────┬────────┬────────┐      │
│  │ Fecha│ Open  │ High  │ Low   │ Close │ Volume  │ Source  │      │
│  ├──────┼───────┼───────┼───────┼───────┼────────┼────────┤      │
│  │20-May│298.18 │302.34 │298.12 │299.93 │1.38M   │TD      │      │
│  │20-May│298.20 │302.28 │298.15 │299.89 │1.35M   │YF      │      │
│  │19-May│297.50 │300.10 │296.80 │298.97 │1.42M   │TD      │      │
│  └──────┴───────┴───────┴───────┴───────┴────────┴────────┘      │
├────────────────────────────────────────────────────────────────────┤
│  ⚡ Comparación Side-by-Side (provider A vs provider B)            │
│                                                                   │
│  ┌─────────────┬──────────┬──────────┬────────┐                  │
│  │ Campo       │ Twelve D │ FMP      │ Yahoo  │                  │
│  ├─────────────┼──────────┼──────────┼────────┤                  │
│  │ Open        │ 298.18   │ 298.20   │ 298.16 │  ← discrepancia │
│  │ High        │ 302.34   │ 302.30   │ 302.33 │                  │
│  │ Close       │ 299.93   │ 300.01   │ 299.89 │  ← discrepancia │
│  │ Market Cap  │ 4.4T     │ 4.38T    │ N/A    │  ← FMP gana     │
│  │ P/E         │ 36.32    │ 35.98    │ N/A    │  ← FMP gana     │
│  │ Delay       │ real-time│ ~15min   │ ~20min │                  │
│  │ Status      │ ✅       │ ⚠️ delay  │ ⚠️ delay │                  │
│  └─────────────┴──────────┴──────────┴────────┘                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Arquitectura Propuesta

### Opción A: Todo Frontend (recomendada para pruebas)

Cada provider se llama DIRECTAMENTE desde el frontend. Sin backend intermedio.

```
┌──────────┐
│ React UI │──→ Twelve Data API (https://api.twelvedata.com)
│          │──→ Yahoo Finance v8 (https://query1.finance.yahoo.com)
│          │──→ Financial Modeling Prep (https://financialmodelingprep.com)
│          │──→ Tiingo (https://api.tiingo.com)
│          │──→ Finnhub (https://finnhub.io/api/v1)
└──────────┘
```

**Pros:** Rápido de implementar, sin tocar backend, resultados inmediatos
**Contras:** API keys expuestas en el frontend (CORS), sin caché

Para solucionar el problema de las API keys y CORS, se pueden hacer dos cosas:
1. **Keys desde el backend existente** — un endpoint `/api/market/proxy` que recibe `{ provider, endpoint, params }` y redirige
2. **Proxy inverso de Vite** — en dev, Vite puede redirigir a APIs externas

### Opción B: Backend + Frontend (para producción eventual)

```
┌──────────┐     ┌─────────────────┐     ┌─────────────┐
│ React UI │────→│ NestJS Proxy    │────→│ Twelve Data │
│          │     │ (cache + proxy) │     │ Yahoo Fin   │
│          │     │ /api/market/*   │     │ FMP         │
│          │     │                 │     │ Tiingo      │
│          │     │ market_snapshots│     │ Finnhub     │
└──────────┘     └─────────────────┘     └─────────────┘
```

Para la PRUEBA, Opción A es mejor. Si después querés que quede como feature del módulo de inversiones, migramos a Opción B.

---

## 4. Providers a Incluir en el Selector

| Provider | Free? | Lo que testearíamos | Cómo se conecta |
|----------|-------|-------------------|-----------------|
| **Twelve Data** | ✅ 800/día | Quote + time_series (5 días) | API key `Twelve_data_API` |
| **Yahoo Finance v8** | ✅ Ilimitado | Quote + chart histórico | `query1.finance.yahoo.com` (sin key) |
| **FMP** | ✅ 250/día | Quote + perfil + market cap | API key (registro gratis) |
| **Tiingo** | ✅ 1,000/día | EOD precios | API key (registro gratis) |
| **Finnhub** | ✅ 60/min | Quote + WebSocket | API key (registro gratis) |
| **Polygon.io** | ✅ 5/min | Quote (delayed) | API key (registro gratis) |

### APIs que NO incluiríamos

| API | Motivo |
|-----|--------|
| Alpha Vantage | Solo 25 req/día — no sirve ni para pruebas |
| IEX Cloud | Servicio en retiro |
| SEC EDGAR | No tiene quotes — solo fundamentals |

---

## 5. Tickers de Prueba Recomendados

Para cubrir todos los casos de borde:

### US Stocks (funcionan en TODOS los providers)

| Ticker | Compañía | Por qué |
|--------|---------|---------|
| `AAPL` | Apple | Alto volumen, datos estables, valor de referencia |
| `KO` | Coca-Cola | Value stock clásico, buen caso de P/E |
| `SPY` | S&P 500 ETF | ETF de referencia para índice |
| `BRK.B` | Berkshire Hathaway | Value stock de referencia |
| `JPM` | JPMorgan | Bancario US |

### Colombian ADRs (funcionan en Twelve Data + Yahoo + FMP)

| Ticker | Compañía | Exchange |
|--------|---------|----------|
| `CIB` | Bancolombia ADR | NYSE |
| `EC` | Ecopetrol ADR | NYSE |

### BVC Directo (requieren plan pago en Twelve Data, gratis en Yahoo Finance)

| Ticker (YF) | Ticker (TD) | Compañía |
|-------------|-------------|---------|
| `ECOPETROL.CL` | `ECO` (XBOG) | Ecopetrol |
| `GRUPOAVAL.CL` | `GAA` (XBOG) | Grupo Aval |
| `ETB.CL` | `ETB` (XBOG) | ETB |
| `BCOLOMBIA.CL` | `BIC` (XBOG) | Bancolombia (no encontrado en YF) |

---

## 6. Datos a Comparar por Provider

| Dato | Twelve Data | Yahoo Fin | FMP | Tiingo | Finnhub | Polygon |
|------|:-----------:|:---------:|:---:|:------:|:-------:|:-------:|
| Quote (open/high/low/close) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ delayed |
| Volumen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Market Cap | ❌ free | ❌ | ✅ | ❌ | ✅ | ✅ |
| P/E Ratio | ❌ free | ✅ | ✅ | ❌ | ❌ | ⚠️ |
| 52-Week Range | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Histórico diario (5d) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nombre compañía | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Hora última cotización | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Precio en tiempo real | ✅ near | ⚠️ 15min | ⚠️ 15min | ⚠️ 15min | ✅ near | ❌ delayed |

**💰 Market Cap es el dato más diferencial** — Twelve Data no lo da en free tier. FMP y Finnhub sí.

---

## 7. Plan de Implementación

### 7.1 Backend (solo si elegimos Opción B)

**Endpoint único de proxy:**
```
POST /api/market/proxy
Body: { provider: "twelvedata" | "yfinance" | "fmp" | "tiingo" | "finnhub",
        endpoint: "quote" | "history" | "search",
        symbol: "AAPL" }
```

Esto resuelve:
- API keys del lado del servidor (seguras)
- CORS unificado
- Logging de qué provider responde qué

### 7.2 Frontend — Componentes a Crear

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `ProviderSelector` | `features/market-test/components/ProviderSelector.tsx` | Dropdown con los 5-6 providers + opción "Todos" |
| `SymbolSearch` | `features/market-test/components/SymbolSearch.tsx` | Input con búsqueda por ticker + nombre, autocomplete |
| `QuoteCard` | `features/market-test/components/QuoteCard.tsx` | Card con open/high/low/close + market cap + P/E |
| `HistoryChart` | `features/market-test/components/HistoryChart.tsx` | SVG chart interactivo con selector de rango (1S, 1M, etc.) |
| `RecentTable` | `features/market-test/components/RecentTable.tsx` | Tabla de últimos 5-10 días OHLCV |
| `ProviderComparison` | `features/market-test/components/ProviderComparison.tsx` | Tabla side-by-side + status indicators |
| `MarketTestPage` | `features/market-test/pages/MarketTestPage.tsx` | Página principal que orquesta todo |
| `useMarketData` | `features/market-test/hooks/useMarketData.ts` | Hook React Query que gestiona fetching multi-provider |

### 7.3 Servicios de Datos (Frontend)

```
features/market-test/
├── pages/
│   └── MarketTestPage.tsx
├── components/
│   ├── ProviderSelector.tsx
│   ├── SymbolSearch.tsx
│   ├── QuoteCard.tsx
│   ├── HistoryChart.tsx
│   ├── RecentTable.tsx
│   └── ProviderComparison.tsx
├── hooks/
│   ├── useMarketData.ts
│   └── useSymbolSearch.ts
├── services/
│   ├── twelvedata.service.ts
│   ├── yahoo.service.ts
│   ├── fmp.service.ts
│   └── types.ts
└── types/
    └── market.types.ts
```

### 7.4 Ruta

Agregar en `App.tsx`:
```tsx
<Route path="market-test" element={<MarketTestPage />} />
```

Protegida por `ProtectedRoute` como las demás.

---

## 8. Charting: SVG vs Librería

### Alternativa A: SVG nativo (como MiniLineChart existente)
- **Ventaja:** 0 dependencias, sigue el patrón del proyecto
- **Desventaja:** Más código, menos interactivo, sin tooltips nativos
- **Esfuerzo:** ~150 líneas

### Alternativa B: Librería liviana
- **Recharts** — 300KB, popular, se integra con React Query
- **Lightweight Charts** (TradingView) — Gratuito, profesional, charts financieros reales
- **Elegiría:** Lightweight Charts de TradingView (solo 40KB gzipped, diseñado para OHLCV, ideal para gráficos de velas)

### Alternativa C: Chart.js + react-chartjs-2
- **Ventaja:** Muy flexible, muchos tipos de chart
- **Desventaja:** ~200KB, no está diseñado específicamente para financieros

**Recomendación:** Arrancar con SVG nativo para la tabla de línea simple, y si el gráfico de velas es necesario, agregar Lightweight Charts.

---

## 9. Casos de Borde a Probar Explícitamente

| Escenario | Qué esperamos | Cómo lo probamos |
|-----------|--------------|------------------|
| **Ticker inválido** | Error 404 del provider | Buscar "ASDF123" |
| **Mercado cerrado** | Último precio del día hábil anterior | Buscar el sábado/domingo |
| **BVC con .CL** | Quote en COP | Buscar ECOPETROL.CL |
| **BVC sin cobertura** | Error o null | Bancolombia en Yahoo (sabemos que no está) |
| **Rate limit excedido** | Error 429 | Hacer 10 requests rápidos |
| **Provider caído** | Timeout o 5xx | Desactivar temporalmente la red |
| **Ticker cross-exchange** | ETB en NYSE ≠ ETB en XBOG | Buscar ETB sin exchange filter |
| **Múltiples providers mismo ticker** | Discrepancias en precios | Side-by-side AAPL en todos |
| **Sin API key** | Error de autenticación | Probar Twelve Data sin key |
| **Empresa privada** | Error: no cotiza | Buscar "Anthropic" |

---

## 10. Entregables y Esfuerzo Estimado

### Fase 1 — MVP funcional (~3-4 horas)

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Proxy backend (o servicio frontend directo) | 1h | — |
| ProviderSelector + SymbolSearch | 30min | — |
| QuoteCard con datos de Twelve Data | 30min | Proxy |
| HistoryChart con SVG básico | 45min | QuoteCard |
| RecentTable | 30min | QuoteCard |
| Hook useMarketData (React Query) | 30min | Proxy |
| Ruta + Page | 15min | Todo lo anterior |
| **TOTAL** | **~4h** | |

### Fase 2 — Comparación multi-provider (~2h adicionales)

| Tarea | Esfuerzo |
|-------|----------|
| Integrar Yahoo Finance service | 30min |
| Integrar FMP service | 30min |
| Integrar Tiingo service | 30min |
| ProviderComparison table side-by-side | 30min |

### Fase 3 — Pulido (~2h adicionales)

| Tarea | Esfuerzo |
|-------|----------|
| Autocomplete en SymbolSearch | 30min |
| Lightweight Charts (velas) | 45min |
| Dark mode consistente | 15min |
| Indicador de delay/status por provider | 30min |

---

## 11. Lo Que Vamos a Descubrir

Después de construir esta interfaz, vas a poder responder:

1. **¿Cuál provee market cap en free tier?** → FMP, Finnhub, Polygon
2. **¿Cuál tiene datos más actualizados?** → Twelve Data vs Yahoo (delay)
3. **¿Coinciden los precios entre providers?** → Discrepancias normales
4. **¿Cuál cubre BVC sin pagar?** → Yahoo Finance (.CL) vs Twelve Data (solo pagado)
5. **¿Cuál da mejores fundamentals?** → FMP gana en free tier
6. **¿Cuál es más rápido?** → Latencia de respuesta
7. **¿Cuál se cae más seguido?** → Rate limits, timeouts, 429s

---

## 12. Lo Que NO Hace Esta Interfaz (a propósito)

| No hace | Por qué |
|---------|---------|
| Autenticación de usuario | Es una herramienta de desarrollo, no un feature de PFM como tal |
| Persistencia de búsquedas | No necesitamos historial de búsquedas para el test |
| Alertas o notificaciones | Esto es un banco de pruebas, no el módulo final |
| Cálculo de valor intrínseco | Eso viene en el Sprint 3 del módulo de inversiones |
| Trading o ejecución | No vamos a comprar/vender desde acá |

---

## 13. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:-----------:|:-------:|-----------|
| CORS bloquea llamadas directas a APIs | Alta | Alto | Usar proxy backend (NestJS) o Vite proxy |
| API keys expuestas en frontend | Alta | Medio | Keys en variables de entorno VITE_*, solo para dev |
| Rate limits durante pruebas | Alta | Medio | Cachear respuestas con React Query (staleTime alto) |
| Discrepancias normales asustan | Media | Bajo | Documentar que diferencias de centavos son esperables |
| Yahoo Finance cambia su API | Media | Alto | No es oficial, puede romperse. No depender de ella en producción |

---

## 14. Preguntas para Decidir

1. **¿Opción A (frontend directo) o B (backend proxy)?** — A es más rápida para la prueba. B es más segura.
2. **¿Incluimos BVC desde el día 1 o solo US stocks primero?** — BVC requiere más providers (Yahoo + .CL).
3. **¿Gráfico de velas (candlestick) o línea simple?** — Vela es más informativa pero requiere librería externa.
4. **¿Esta página queda como feature permanente o la borramos después de la validación?** — Si queda, hay que migrarla a Opción B.
5. **¿Cuántos providers测试amos de entrada?** — Recomiendo 3: Twelve Data + Yahoo + FMP. Después agregamos Tiingo y Finnhub.

---

## Resumen

Una página, 6 componentes, un hook de React Query, servicios para 3-5 providers, y ruta protegida. En ~4h tenés una herramienta visual que te dice **qué API miente, cuál se cae, y cuál da datos reales**.

La decisión más importante es Opción A (frontend directo, más rápido) vs Opción B (backend proxy, más seguro). El resto es implementación.

---

*— Fin de la propuesta —*
