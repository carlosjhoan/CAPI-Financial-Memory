# GENTLE AGENT INVESTOR — API Research Report

> **Descubridor:** Gentle Orchestrator (PFM Agent System)  
> **Fecha:** 20 de mayo de 2026  
> **Propósito:** Validar APIs financieras gratuitas para un módulo de recomendación de inversiones con filosofía Value Investing, operable desde Colombia.
> **Visión:** Evolucionar hacia un **Agent Investor** autónomo que analice, recomiende y eventualmente ejecute estrategias value.

---

## Tabla de Contenido

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Metodología](#2-metodología)
3. [Hallazgos — APIs del Documento Original](#3-hallazgos--apis-del-documento-original)
4. [Discrepancias Críticas con INVESTMENT_SUGGESTION.md](#4-discrepancias-críticas-con-investment_suggestionmd)
5. [Matriz Completa de APIs Gratuitas (2026)](#5-matriz-completa-de-apis-gratuitas-2026)
6. [APIs Colombianas y LatAm](#6-apis-colombianas-y-latam)
7. [Trii como Referencia de Mercado](#7-trii-como-referencia-de-mercado)
8. [Arquitectura de Providers Recomendada](#8-arquitectura-de-providers-recomendada)
9. [Roadmap de Integración](#9-roadmap-de-integración)
10. [Recomendaciones Finales](#10-recomendaciones-finales)

---

## 1. Resumen Ejecutivo

Se revisó el documento `INVESTMENT_SUGGESTION.md` y se contrastaron las 8 APIs de mercado mencionadas contra su estado real en mayo de 2026. Se consultaron fuentes oficiales (páginas de pricing, documentación), comparativas de terceros, y se hicieron llamados directos a los endpoints de prueba.

**Hallazgo principal:** El documento original contiene **4 imprecisiones significativas** sobre tiers gratuitos que impactan directamente la viabilidad del MVP. La más crítica: Alpha Vantage —presentado como "500 req/día gratis"— hoy ofrece solo **25 req/día**, lo cual lo descarta como fuente principal para un módulo de inversiones.

Adicionalmente, se identificaron **2 APIs no contempladas** en el doc original (Twelve Data, SimFin) que ofrecen tiers gratuitos superiores y cubren mejor las necesidades del proyecto, incluyendo cobertura de la Bolsa de Valores de Colombia (BVC).

Finalmente, se realizó una investigación específica de fuentes de datos financieros colombianos, que confirma la **ausencia de una API pública gratuita y dedicada** para la BVC, pero identifica 5 alternativas viables mediante fuentes indirectas.

---

## 2. Metodología

Para cada API se realizaron los siguientes pasos:

1. **Lectura de documentación oficial** — Páginas de pricing, FAQs, términos de servicio
2. **Consulta de fuentes terciarias** — Reviews 2026, comparativas actualizadas, reports de comunidad
3. **Prueba directa de endpoints** — Llamados HTTP a APIs con keys demo/free para verificar comportamiento
4. **Verificación cruzada** — Contraste entre lo que promete el provider y lo que reportan usuarios activos
5. **Evaluación de cobertura Colombia** — Verificación de soporte para la BVC y tickers colombianos

---

## 3. Hallazgos — APIs del Documento Original

### 3.1 Alpha Vantage

| Atributo | Valor |
|----------|-------|
| **URL** | https://www.alphavantage.co |
| **Free tier (según doc)** | 5 req/min, 500 req/día |
| **Free tier (real 2026)** | 5 req/min, **25 req/día** |
| **Premium** | $49.99/mes (75 req/min) |
| **Cobertura US** | Quotes, fundamentals, forex, crypto, technical indicators |
| **Cobertura Colombia** | No tiene datos BVC |
| **Fundamentals gratis** | Income statement, balance sheet, cash flow, P/E, EPS |
| **WebSocket** | No disponible en ningún tier |
| **Demo funcional** | Sí, endpoint de prueba con API key demo |

**Conclusión:** El free tier es **insuficiente** para un MVP de inversiones. 25 requests/día permiten consultar ~5 tickers una vez al día (quote + fundamentals). El dato actualizado de 25/día está confirmado por la documentación oficial y múltiples fuentes (PulseSignal, FindMyMoat, dev.to). Apt solo como fuente secundaria para forex/crypto. No recomendado como provider principal.

---

### 3.2 Financial Modeling Prep (FMP)

| Atributo | Valor |
|----------|-------|
| **URL** | https://site.financialmodelingprep.com |
| **Free tier (según doc)** | Limitado, Free tier |
| **Free tier (real 2026)** | **250 req/día**, 150+ endpoints, ~5 años históricos |
| **Premium** | $22/mes (Starter, 300 req/min), $59/mes (Premium, 750 req/min) |
| **Cobertura US** | Quotes, fundamentals, SEC filings, news, earnings transcripts |
| **Cobertura Colombia** | Sí, vía endpoints globales (70+ países) |
| **Fundamentals gratis** | Income statement, balance sheet, cash flow, ratios, DCF |
| **WebSocket** | No disponible |
| **Bandwidth gratis** | 500 MB/mes (trailing 30 días) |

**Conclusión:** **Mejor free tier** entre todos los proveedores evaluados. 250 req/día cubren un universo de ~50 tickers con 5 calls cada uno (quote + perfil + fundamentals + ratios). 150+ endpoints accesibles gratis. Ideal como **provider principal** para la Fase 1 del MVP. El plan Starter ($22/mes) es el salto más barato a producción y desbloquea 300 req/min sin límite diario.

---

### 3.3 Polygon.io

| Atributo | Valor |
|----------|-------|
| **URL** | https://polygon.io |
| **Free tier (según doc)** | No tiene gratis ($29/mes) |
| **Free tier (real 2026)** | **5 calls/min**, delayed data, 2 años históricos, fundamentals incluidos |
| **Premium** | $29/mes (Starter, unlimited calls, delayed), $79/mes (Developer, real-time) |
| **Cobertura US** | Quotes, options, forex, crypto, indices, fundamentals |
| **Cobertura Colombia** | No tiene datos BVC |
| **Fundamentals gratis** | Sí, incluidos en free tier (corporate actions, reference data) |
| **WebSocket** | Sí (en planes Starter+, no en free) |

**Conclusión:** El documento original se equivoca: **Polygon.io SÍ tiene free tier**. Aunque es limitado (5 calls/min), permite development y pruebas. No recomendado como principal por su rate limit restrictivo. Bueno como **fallback técnico** o si en el futuro se necesita WebSocket para tiempo real (Starter $29/mes o Developer $79/mes).

---

### 3.4 Finnhub

| Atributo | Valor |
|----------|-------|
| **URL** | https://finnhub.io |
| **Free tier (según doc)** | Limitado, Free tier |
| **Free tier (real 2026)** | **60 calls/min**, WebSocket gratis (50 símbolos), datos de mercado US |
| **Premium** | $49.99/mes (Basic, 150 calls/min), $129.99/mes (Standard, 300 calls/min) |
| **Cobertura US** | Quotes, fundamentals básicos, news, WebSocket |
| **Cobertura Colombia** | No confirmada directamente |
| **Fundamentals gratis** | Limitados — muchos endpoints pasaron a premium |
| **WebSocket** | **Sí, en free tier** (único provider que lo ofrece gratis) |
| **Documentación** | Buena. SDKs oficiales para Python, JS, Go, Java |

**Conclusión:** **Único provider con WebSocket gratis** del mercado. Los 60 calls/min son generosos para market data. La limitación está en los fundamentals (muchos endpoints se volvieron premium desde 2020). Ideal para **streaming de precios en vivo** y como complemento a FMP para datos de mercado en tiempo real. No apto como fuente única de fundamentals.

---

### 3.5 IEX Cloud

| Atributo | Valor |
|----------|-------|
| **URL** | https://iexcloud.io |
| **Free tier (según doc)** | 50K mensajes/mes, $9/mes |
| **Free tier (real 2026)** | **50,000 messages/mes** (Launch plan), datos delayed |
| **Premium** | $9/mes (Creator), $49/mes (Grow) |
| **Cobertura US** | Quotes, IEX real-time, fundamentals, news |
| **Cobertura Colombia** | No |
| **Estado del servicio** | **⚠️ EN RETIRO** — IEX Cloud está siendo discontinuado |

**Conclusión:** **No recomendado para proyectos nuevos.** IEX Cloud fue comprado/absorbido por IEX Group y está en proceso de migración a un nuevo modelo. Los mensajes "IEX Cloud retired Aug 2024" confirmados por TradingToolsHub (2026). No invertir tiempo en integrarlo.

---

### 3.6 Tiingo

| Atributo | Valor |
|----------|-------|
| **URL** | https://www.tiingo.com |
| **Free tier (según doc)** | Limitado, $10/mes |
| **Free tier (real 2026)** | **Starter (gratis): 1,000 req/día, 50 req/hora, 500 símbolos/mes** |
| **Premium** | $30/mes (Power: 10,000 req/hora, 100,000 req/día) |
| **Cobertura US** | EOD prices, crypto, IEX real-time feed, news |
| **Cobertura Colombia** | No (solo US + China stocks en cobertura global) |
| **Fundamentals gratis** | **Solo DOW 30** — el resto es add-on pago |
| **Historial** | 30+ años de precios EOD en free tier |
| **WebSocket** | Sí (IEX + Crypto firehose en paid tiers) |
| **Licencia** | Free: solo uso interno personal. Power: solo uso interno individual |

**Conclusión:** **Excelente para precios históricos EOD.** 1,000 req/día y 30+ años de historia lo hacen ideal para backtesting y análisis histórico. La limitación grande: los fundamentals (solo DOW 30 gratis). Para un motor de value investing que necesita P/E, EPS, BVPS, FCF, etc., el free tier se queda corto. Recomendado como **fuente de precios históricos** y complemento, no como principal para fundamentals.

---

### 3.7 Twelve Data (NO ESTABA EN EL DOC)

| Atributo | Valor |
|----------|-------|
| **URL** | https://twelvedata.com |
| **Free tier** | **800 req/día, 8/min**, WebSocket trial, real-time US equities |
| **Premium** | $29/mes (Grow), $99/mes (Pro), $329/mes (Ultra) |
| **Cobertura US** | Quotes, time series, fundamentals, technical indicators (130+), forex, crypto |
| **Cobertura Colombia** | **✅ BVC (XBOG)** — Bolsa de Valores de Colombia disponible |
| **Fundamentals gratis** | Limitados a símbolos de prueba en free tier |
| **WebSocket** | Sí, desde plan Pro ($99/mes) |
| **SDKs** | Python, JavaScript, PHP, Go, Excel, Google Sheets |
| **Uptime SLA** | 99.95% en planes pagos |

**Conclusión:** **Omisión importante del documento original.** Twelve Data ofrece el free tier más generoso (800 req/día) y es el único provider grande que **cubre explícitamente la BVC** (Bolsa de Valores de Colombia) como exchange (XBOG). Ideal como provider principal para quotes de mercado US + Colombia en Fase 1. Los fundamentals son limitados en free tier, pero 800 req/día dan mucho margen para development y monitoreo de watchlist.

---

### 3.8 SEC EDGAR

| Atributo | Valor |
|----------|-------|
| **URL** | https://www.sec.gov/edgar.shtml |
| **Free tier** | **Ilimitado y gratuito** (datos públicos del gobierno US) |
| **Cobertura** | 10-K, 10-Q, 8-K, proxy statements, registrations |
| **Formato** | XBRL (XML estandarizado), raw HTML, JSON |
| **Rate limit** | 10 req/segundo (recomendado), sin límite diario |
| **Fundamentals** | Income statement, balance sheet, cash flow COMPLETOS |
| **Cobertura Colombia** | No aplica (solo companies registradas en SEC) |

**Conclusión:** La fuente más completa y confiable para estados financieros de empresas US. No requiere parseo adivinatorio — XBRL es un estándar contable. El costo es **ingeniería**: hay que construir un pipeline de descarga, parseo y normalización. Para un MVP, FMP da datos ya normalizados. Para producción seria, combinar SEC EDGAR (estados financieros crudos) + FMP (ratios normalizados) es la combinación óptima.

---

### 3.9 SimFin (NO ESTABA EN EL DOC)

| Atributo | Valor |
|----------|-------|
| **URL** | https://www.simfin.com |
| **Free tier** | **5,000 stocks US, 5 años de fundamentals, 500 credits/mes** |
| **Premium** | $15/mes (Start), $35/mes (Basic), $71/mes (Pro) |
| **Cobertura** | 5,000+ US stocks (estados financieros normalizados manualmente) |
| **Cobertura Colombia** | No |
| **Fundamentals gratis** | 5 años de income statement, balance sheet, cash flow + 80+ ratios |
| **Calidad de datos** | Superior — curada manualmente, no automática como FMP |
| **Rate limit** | 2 req/segundo (free), 5 req/segundo (paid) |
| **Licencia** | Free: solo personal/académico. Paid: uso comercial |

**Conclusión:** La **mejor calidad de datos fundamentals** del mercado. A diferencia de FMP que parsea automáticamente, SimFin tiene revisión manual QA. 5,000 stocks con 5 años de historia es suficiente para un screener value. Los 500 credits/mes pueden ser limitantes — hay que calcular cuánto consume cada query. Ideal como fuente de fundamentals curados para el motor de Value Investing.

---

## 4. Discrepancias Críticas con INVESTIGATION_SUGGESTION.md

### 4.1 Tabla de Correcciones

| # | Lo que dice el doc | Realidad (2026) | Impacto |
|---|-------------------|-----------------|---------|
| 1 | "Alpha Vantage: gratis, 500/día" | **25 req/día** | **ALTO** — Inviable como fuente principal para MVP |
| 2 | "Polygon.io: No gratis, $29/mes" | **Sí tiene free** (5 calls/min) | **BAJO** — El free existe pero es lento |
| 3 | "IEX Cloud: 50K/mes, $9/mes" | **Servicio en retiro** | **ALTO** — No integrar |
| 4 | "Tiingo: Limitado, $10/mes" | **$0/mes con 1,000 req/día** | **MEDIO** — Tiene free tier mejor de lo estimado |
| 5 | APIs no mencionadas: Twelve Data, SimFin | — | **ALTO** — Son las mejores opciones para el MVP |

### 4.2 Estrategia de Fase 1 del Doc (DESACTUALIZADA)

El documento propone:
> **Fase 1 — MVP**: Alpha Vantage (gratis, 500 req/día) + SEC EDGAR

Esto **NO es viable** porque Alpha Vantage ya no ofrece 500 req/día.

**Estrategia corregida:**

> **Fase 1 — MVP (revisado):** Twelve Data (800 req/día gratis, quotes US + BVC) + Financial Modeling Prep (250 req/día gratis, fundamentals completos)  
> **Opcional:** SimFin (5,000 stocks, fundamentals curados) para datos de mayor calidad

---

## 5. Matriz Completa de APIs Gratuitas (2026)

### 5.1 Proveedores Globales

| Provider | Free req/día | Calls/min | Quotes | Fundam. | Historial | WebSocket | Colombia | Inicio Premium |
|----------|:-----------:|:---------:|:------:|:-------:|:---------:|:---------:|:--------:|:--------------:|
| **Twelve Data** | 800 | 8 | ✅ | ✅ trial | 1+ año | trial | ✅ BVC | $29/mes |
| **Tiingo** | 1,000 | 50/hora | ✅ | ❌ (solo DOW30) | 30+ años | ❌ | ❌ | $30/mes |
| **Financial Modeling Prep** | 250 | — | ✅ | ✅ | 5 años | ❌ | ✅ global | $22/mes |
| **Finnhub** | ~86,400* | 60 | ✅ | ❌ limitado | 1 año | ✅ gratis | ❌ | $49.99/mes |
| **Alpha Vantage** | 25 | 5 | ✅ | ✅ | 20+ años | ❌ | ❌ | $49.99/mes |
| **Polygon.io** | ~7,200* | 5 | ✅ | ✅ | 2 años | ❌ | ❌ | $29/mes |
| **SimFin** | 500 credits/mes | 2/seg | ✅ | ✅ | 5 años | ❌ | ❌ | $15/mes |
| **SEC EDGAR** | Ilimitado | 10/seg | ❌ | ✅ crudo | Ilimitado | ❌ | ❌ | — |

*\* Cálculo estimado: calls/min × 60 × 24, asumiendo uso continuo. En la práctica, otros factores (límites diarios, bandwidth) aplican.*

### 5.2 Lo que cada API aporta al Value Engine

| Componente del Value Engine | APIs recomendadas |
|----------------------------|-------------------|
| Precio actual (quote) | Twelve Data (free), Finnhub (free), FMP (free) |
| P/E, P/B, EV/EBITDA | FMP (free), SimFin (free, 500 credits) |
| EPS, BVPS, FCF | FMP (free), SEC EDGAR (DIY) |
| Income / Balance / Cash Flow | FMP (free), SimFin (free), SEC EDGAR (DIY) |
| ROIC, ROE, Márgenes | SimFin (free, curado), FMP (free) |
| Beta, volatilidad | FMP (free), Twelve Data (trial) |
| Dividendos | FMP (free), Twelve Data (trial) |
| Sector, industria | FMP (free), Twelve Data (trial) |
| Precios históricos (backtesting) | Tiingo (free, 30+ años), Twelve Data (free) |
| Streaming en vivo | Finnhub (free, 50 símbolos WebSocket) |

---

## 6. APIs Colombianas y LatAm

### 6.1 Realidad del Mercado Colombiano

No existe una API pública, gratuita y bien mantenida que exponga datos de la Bolsa de Valores de Colombia (BVC) de forma similar a lo que Alpha Vantage hace para US. La BVC vende market data institucional a través de **ICE Data Services** (antes Interactive Data), con costos que comienzan en miles de dólares al año.

### 6.2 Fuentes Identificadas para Datos Colombia

| Fuente | Tipo | Cobertura | Gratis? | Dificultad |
|--------|------|-----------|---------|------------|
| **Twelve Data** (XBOG) | REST API | ~60+ acciones BVC (prueba gratis) | 800 req/día | Baja |
| **Yahoo Finance** (yfinance) | Python library | BCOLOMBIA.SN, ECOPETROL.SN, GRUPOARGOS.SN, etc. | Ilimitado | Baja |
| **Superfinanciera de Colombia** | SOAP WebServices (XBRL) | Precios, órdenes, derivados, índices | Gratis | Alta |
| **Grupo Aval — Portal Financiero** | Web scraping | Precios diarios BVC, 20min delay | Gratis | Media |
| **macrocol (R package)** | R library | BVC historical, TRM, IBR, IPC, BanRep | Open Source | Media |
| **BanRepública (TRM)** | REST/CSV | Tasa Representativa del Mercado COP/USD | Gratis | Baja |

### 6.3 Detalle de Cada Fuente Colombia

#### Twelve Data (XBOG)
- **Cómo funciona:** Registrarse en twelvedata.com, API key free, consultar símbolos del exchange XBOG
- **Ejemplo de tickers:** `ECOPETROL`, `BCOLOMBIA`, `GRUPOARGOS`, `NUTRESA`, `PFBCOLOM`
- **Qué devuelve:** Time series (OHLCV), EOD, quote, market state
- **Limitación:** Símbolos de prueba en free tier. Planes pagos necesarios para acceso completo
- **URL exchange:** https://twelvedata.com/exchanges/XBOG

#### Yahoo Finance (yfinance)
- **Cómo funciona:** `pip install yfinance`, luego `yf.Ticker("BCOLOMBIA.SN")`
- **Ejemplo de tickers:** `BCOLOMBIA.SN`, `ECOPETROL.SN`, `GRUPOARGOS.SN`, `GRUPOSURA.SN`, `NUTRESA.SN`, `PFBCOLOM.SN`
- **Qué devuelve:** info (perfil, ratios), history (precios históricos), financials (estados financieros), dividends
- **Limitación:** No oficial, puede dejar de funcionar en cualquier momento. Datos con 15-20 min de delay.
- **Suffix:** Las acciones colombianas usan el sufijo `.SN` en Yahoo Finance

#### Superfinanciera de Colombia
- **Cómo funciona:** WebServices SOAP públicos para proveedores del mercado de valores
- **Endpoints disponibles:**
  - `ValorCierresWS` — Precios de cierre
  - `VlrOrdenesAccDerivadosWS` — Órdenes de acciones y derivados
  - `DerivadosEstandarizadosWS` — Derivados estandarizados
  - `AnulacionesWS` — Anulaciones
- **URL base:** https://www.superfinanciera.gov.co/xbrl/webservices/proveedores/
- **Limitación:** SOAP/XML, requiere generar cliente WSDL. Documentación técnica limitada.

#### Grupo Aval — Portal Financiero
- **Cómo funciona:** Portal público con datos de la BVC en tabla HTML
- **URL:** https://www.grupoaval.com/wps/portal/grupo-aval/aval/portal-financiero/renta-variable/acciones-bolsa-colombia/resumen-dia
- **Qué ofrece:** Precios de apertura, máximo, mínimo, cierre, variación, volumen, monto negociado
- **Delay:** 20 minutos
- **Cobertura:** ~40+ acciones colombianas + índices (COLCAP, ICOLCAP, ICAP)
- **Limitación:** No es API — requiere web scraping. Sin datos históricos masivos.

### 6.4 TRM (Tasa Representativa del Mercado)

La TRM COP/USD es indispensable para convertir precios de activos US a pesos colombianos.

- **Fuente oficial:** Banco de la República (BanRepública)
- **URL API:** https://www.banrep.gov.co/es/estadisticas/trm
- **Método:** Descarga CSV o JSON con datos históricos
- **Free:** Sí, datos públicos del gobierno colombiano

---

## 7. Trii como Referencia de Mercado

### 7.1 Perfil de la Plataforma

| Atributo | Información |
|----------|-------------|
| **Tipo** | Fintech colombiana, comisionista de bolsa digital |
| **Fundación** | 2021 |
| **Fundador** | Esteban Peñaloza (CEO) |
| **Usuarios** | 600,000+ (2026) |
| **Inversionistas** | Y Combinator, Bancolombia Ventures, Global Founders Capital, Harvard University |
| **Presencia** | Colombia, Perú, Chile |
| **Comisión** | $12,500 + IVA por operación (o 0.25% para montos > $5M) |
| **Comisionista respaldo** | Acciones y Valores S.A. (vigilado SFC) |

### 7.2 Activos Disponibles en Trii

- ~60 acciones colombianas (BVC)
- ETFs internacionales (SPY, QQQ, VOO, IEMG, etc.)
- Acciones globales vía Mercado Global Colombiano (NVIDIA, Amazon, Meta, Microsoft, Coca-Cola, etc.)
- Fondos de Inversión Colectiva
- CDTs

### 7.3 Lo que Trii NO Expone

| Aspecto | Situación |
|---------|-----------|
| API de datos | No tiene API pública para consumir precios |
| API de trading | No expone endpoints para trading algorítmico |
| WebSocket público | No disponible |
| Datos históricos bulk | No disponibles |

### 7.4 Implicación para el Proyecto

Trii es un **competidor indirecto como plataforma**, pero un **complemento ideal como broker**. La arquitectura correcta sería:

- **PFM Investment Intelligence** → Analiza, calcula valor intrínseco, genera oportunidades
- **Trii (o broker similar)** → Ejecuta las órdenes de compra/venta (el usuario decide)

No compite con Trii porque PFM no pretende ser un bróker — es un **analista inteligente**.

---

## 8. Arquitectura de Providers Recomendada

### 8.1 Para Fase 1 (MVP — $0/mes en APIs)

```
                    ┌─────────────────────────────────────┐
                    │        MarketDataService             │
                    │  (caché en market_snapshots table)   │
                    └──────────────────┬──────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   ┌────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
   │ Twelve Data    │    │ Financial Modeling    │    │ Tiingo             │
   │ (800 req/día)  │    │ Prep (250 req/día)    │    │ (1,000 req/día)    │
   │                │    │                      │    │                    │
   │ Quotes US +    │    │ Fundamentals primary │    │ EOD historical     │
   │ Quotes BVC     │    │ P/E, EPS, BVPS, FCF  │    │ 30+ años data      │
   │ Real-time free │    │ Income/Balance/CF    │    │ Backtesting data   │
   └───────┬────────┘    └──────────┬───────────┘    └────────┬───────────┘
           │                       │                         │
           ▼                       ▼                         ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                    Fallback Chain                                │
   │                                                                  │
   │  Twelve Data → FMP (si Twelve rate-limit) → Tiingo (si ambos)    │
   └──────────────────────────────────────────────────────────────────┘
```

### 8.2 Para Fase 2 (Producción — ~$22-29/mes)

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    MarketDataService                         │
   └──────────┬──────────────────────┬──────────────────┬─────────┘
              ▼                      ▼                  ▼
   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
   │ FMP Starter $22/mo │  │ Twelve Data Grow   │  │ Finnhub WebSocket  │
   │ 300 req/min        │  │ $29/mo, 55/min     │  │ (free, 60 calls)   │
   │ Fundamentals full  │  │ 20+ markets, fund. │  │ Streaming 50 symbs │
   │ 30+ años históricos│  │ Coverage global     │  │ News & alt data    │
   └────────────────────┘  └────────────────────┘  └────────────────────┘
```

### 8.3 Para Fase 3 — Agent Investor (Evolucionado)

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    Agent Investor Core                       │
   │  • Market Data Aggregator                                   │
   │  • Value Investing Engine (DCF, Graham, Multiples)          │
   │  • Portfolio Optimizer                                      │
   │  • Signal Generator (compra/venta/watch)                    │
   │  • Risk Manager (stop-loss, rebalanceo)                     │
   └──────────┬──────────────────────┬──────────────────┬─────────┘
              ▼                      ▼                  ▼
   ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
   │ FMP Ultimate       │  │ Polygon Advanced   │  │ SEC EDGAR +        │
   │ $149/mo            │  │ $199/mo            │  │ SimFin Pro $71/mo  │
   │ Global coverage    │  │ Real-time ticks    │  │ Fundamentals       │
   │ Earnings transcripts│  │ WebSocket ilimitado│  │ curados + raw      │
   │ 13F holdings       │  │ Options chains      │  │ 20+ años           │
   └────────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 9. Roadmap de Integración

### Sprint 1: Data Pipeline (Semana 1)

- [ ] Registrar API keys gratuitas: Twelve Data + FMP + Tiingo
- [ ] Implementar `MarketDataService` con provider abstraction
- [ ] Crear tabla `market_snapshots` (ya diseñada en INVESTMENT_SUGGESTION.md)
- [ ] Implementar Twelve Data provider primario (quotes US + BVC)
- [ ] Implementar fallback chain
- [ ] Cache con TTL: quotes 1 hora, fundamentals 1 día

### Sprint 2: Watchlist + Screener (Semana 2)

- [ ] CRUD de watchlist personal
- [ ] Consultar quotes de watchlist desde Twelve Data
- [ ] Screener value básico: P/E < 15, D/E < 1, FCF positivo
- [ ] Dashboard widget: tabla de watchlist con precios

### Sprint 3: Value Engine (Semana 3)

- [ ] Implementar FMP provider para fundamentals
- [ ] Calcular valor intrínseco (DCF simplificado)
- [ ] Calcular margen de seguridad
- [ ] Calcular quality score (ROIC, márgenes, deuda)
- [ ] Calcular risk score (beta, drawdown, liquidez)

### Sprint 4: Recomendaciones + UI (Semana 4)

- [ ] Cruzar oportunidades vs perfil económico del usuario
- [ ] Generar señales (Fuerte / Moderada / Watchlist)
- [ ] Dashboard: tabla de oportunidades con scores
- [ ] Explicación legible de cada oportunidad

### Sprint 5: Alertas + WebSocket (Semana 5+)

- [ ] Integrar Finnhub WebSocket (gratis, 50 símbolos)
- [ ] Alertas configurables: precio objetivo, margen de seguridad
- [ ] Notificaciones push/in-app

---

## 10. Recomendaciones Finales

### Para el MVP (ahora)

| Prioridad | API | Uso | Costo |
|:---------:|-----|-----|:-----:|
| 🥇 | **Twelve Data** | Quotes US + Colombia (BVC). 800 req/día. | $0 |
| 🥇 | **Financial Modeling Prep** | Fundamentals: ratios, income, balance, cash flow. 250 req/día. | $0 |
| 🥈 | **Tiingo** | Precios históricos EOD para backtesting. 1,000 req/día. | $0 |
| 🥉 | **Finnhub** | WebSocket streaming. 60 calls/min. | $0 |

### Para Producción (cuando despeguen)

| API | Plan | Costo | Qué desbloquea |
|-----|------|:-----:|----------------|
| FMP Starter | $22/mes | 300 req/min, 30+ años, sin límite diario |
| Twelve Data Grow | $29/mes | 55 req/min, 20+ markets, fundamentals |
| Finnhub Basic | $49.99/mes | 150 calls/min, fundamentals completos |

### Lo que NO haría

- ❌ **Alpha Vantage** como fuente principal — 25 req/día no alcanzan
- ❌ **IEX Cloud** — Servicio en retiro
- ❌ **Dependencia exclusiva de un provider** — Implementar fallback chain desde el día 1
- ❌ **Confiar en datos de mercado colombianos sin verificar** — Probar cada ticker de la BVC manualmente antes de asumir que funciona

### Para la visión Agent Investor

El salto de "recomendador pasivo" a **Agente Activo** requiere:

1. **Alimentación continua**: Pipeline diario de datos (no on-demand)
2. **Backtesting riguroso**: Validar estrategias value con datos históricos (Tiingo)
3. **Machine Learning**: Refinar ponderaciones de quality/risk scores con datos reales
4. **Fuentes alternativas**: News sentiment (Finnhub), insider trading, SEC filings
5. **Ejecución**: Integración con bróker (Trii o similar) vía API cuando exista

---

## Apéndice A: Enlaces Rápidos

| Provider | Registro Free | Documentación |
|----------|:-------------:|:-------------:|
| Twelve Data | https://twelvedata.com/pricing | https://twelvedata.com/docs |
| Financial Modeling Prep | https://site.financialmodelingprep.com/developer/docs/dashboard | https://site.financialmodelingprep.com/developer/docs |
| Tiingo | https://www.tiingo.com/account/signup | https://www.tiingo.com/documentation |
| Finnhub | https://finnhub.io/register | https://finnhub.io/docs/api |
| SimFin | https://simfin.com/register | https://simfin.readme.io/reference |
| SEC EDGAR | No requiere registro | https://www.sec.gov/edgar.shtml |
| Polygon.io | https://polygon.io/ | https://polygon.io/docs |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key | https://www.alphavantage.co/documentation |

## Apéndice B: Tickers Colombianas en Yahoo Finance

| Empresa | Ticker Yahoo | Sector |
|---------|:------------:|--------|
| Bancolombia | `BCOLOMBIA.SN` | Financiero |
| Bancolombia Pref | `PFBCOLOM.SN` | Financiero |
| Ecopetrol | `ECOPETROL.SN` | Energía |
| Grupo Argos | `GRUPOARGOS.SN` | Conglomerado |
| Grupo Argos Pref | `GRUPOARGOSP.SN` | Conglomerado |
| Grupo Sura | `GRUPOSURA.SN` | Financiero |
| Grupo Sura Pref | `GRUPOSURAP.SN` | Financiero |
| Grupo Aval | `GRUPOAVAL.SN` | Financiero |
| Grupo Aval Pref | `GRUPOAVALP.SN` | Financiero |
| Nutresa | `NUTRESA.SN` | Alimentos |
| Celsia | `CELSIA.SN` | Utilities/Energía |
| Promigas | `PROMIGAS.SN` | Gas/Energía |
| ISA | `ISA.SN` | Energía/Infraestructura |
| Éxito | `EXITO.SN` | Retail |
| Corficolombiana | `CORFICOL.SN` | Financiero |
| Corficolombiana Pref | `CORFICOLP.SN` | Financiero |
| Davivienda Pref | `DAVIVIENDAP.SN` | Financiero |
| Banco de Bogotá | `BOGOTA.SN` | Financiero |
| Bolsa de Valores de Colombia | `BVC.SN` | Financiero/Bolsa |
| Mineros | `MINEROS.SN` | Minería |
| Cementos Argos | `CEMARGOS.SN` | Construcción |
| Cementos Argos Pref | `CEMARGOSP.SN` | Construcción |
| ETB | `ETB.SN` | Telecomunicaciones |
| Enka | `ENKA.SN` | Manufactura |
| Fabricato | `FABRICATO.SN` | Manufactura textil |
| Grupo Energía Bogotá | `GEB.SN` | Energía |
| Canacol Energy | `CNE.SN` | Energía |

> **Nota sobre el sufijo `.SN`**: En Yahoo Finance, las acciones que cotizan en bolsas fuera de US tienen un sufijo que identifica la bolsa. `.SN` corresponde a la Bolsa de Valores de Colombia (BVC).

---

*— Fin del reporte —*
