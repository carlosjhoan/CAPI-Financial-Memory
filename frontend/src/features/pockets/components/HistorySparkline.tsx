/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Pocket } from '../types/pocket.types';
import { formatCurrency } from '../../../core/utils/format';

interface HistorySparklineProps {
  pocket: Pocket;
  animate?: boolean;
  onReady?: () => void;
}

interface Segment {
  start: number;
  end: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const SVG_WIDTH = 100;
const SVG_HEIGHT = 40;
const PADDING_TOP = 2;
const PADDING_BOTTOM = 2;

// ── Auto-play card constants ──
const AUTO_PLAY_CARD_DELAY = 1500;      // ms before card starts fading out (último card ~1.8s total)
const AUTO_PLAY_CARD_FADE_DURATION = 300; // ms of opacity transition
const AUTO_PLAY_MAX_CARDS = 7;          // max simultaneously visible cards

export interface PointMovement {
  type: 'deposit' | 'expense' | 'transfer_in' | 'transfer_out';
  amount: number;
  reason?: string;
}

export interface Point {
  date: Date;
  value: number;
  isWithdrawal?: boolean;
  movements: PointMovement[];
}

interface RawMovement {
  date: string;
  amount: number;
  type: 'deposit' | 'expense';
  displayType: PointMovement['type'];
  reason?: string;
}

export function buildHistoryDataPoints(
  pocket: Pocket,
  isFirst24h: boolean,
): Point[] {
  const points: Point[] = [];
  let runningTotal = 0;

  // Punto inicial (fecha de creación)
  points.push({ date: new Date(pocket.createdAt), value: runningTotal, movements: [] });

  // Combinar y ordenar movimientos cronológicamente
  const allMovements: RawMovement[] = [
    ...(pocket.incomes || []).map(i => ({
      date: i.date,
      amount: i.amount,
      type: 'deposit' as const,
      displayType: 'deposit' as const,
      reason: i.reason,
    })),
    ...(pocket.expenses || []).map(e => ({
      date: e.date,
      amount: e.amount,
      type: 'expense' as const,
      displayType: 'expense' as const,
      reason: e.reason,
    })),
    // Transferencias entrantes → suman al balance
    ...(pocket.transfers || [])
      .filter(t => t.direction === 'incoming')
      .map(t => ({
        date: t.date,
        amount: t.amount,
        type: 'deposit' as const,
        displayType: 'transfer_in' as const,
        reason: t.reason,
      })),
    // Transferencias salientes → restan del balance
    ...(pocket.transfers || [])
      .filter(t => t.direction === 'outgoing')
      .map(t => ({
        date: t.date,
        amount: t.amount,
        type: 'expense' as const,
        displayType: 'transfer_out' as const,
        reason: t.reason,
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (isFirst24h) {
    // ── Primeras 24h: cada movimiento individual con hora ──
    for (const m of allMovements) {
      runningTotal += m.type === 'deposit' ? m.amount : -m.amount;
      const netAmount = m.type === 'deposit' ? m.amount : -m.amount;
      points.push({
        date: new Date(m.date),
        value: Math.max(0, runningTotal),
        isWithdrawal: m.type === 'expense',
        movements: [{ type: m.displayType, amount: netAmount, reason: m.reason }],
      });
    }
  } else {
    // ── Después de 24h: agrupar por día, acumulado al cierre ──
    const dailyMovements = new Map<string, PointMovement[]>();
    for (const m of allMovements) {
      const dayKey = m.date.split('T')[0];
      if (!dailyMovements.has(dayKey)) {
        dailyMovements.set(dayKey, []);
      }
      const netAmount = m.type === 'deposit' ? m.amount : -m.amount;
      dailyMovements.get(dayKey)!.push({
        type: m.displayType,
        amount: netAmount,
        reason: m.reason,
      });
    }

    const sortedDays = Array.from(dailyMovements.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [_dayKey, movements] of sortedDays) {
      const netChange = movements.reduce((sum, pm) => sum + pm.amount, 0);
      runningTotal += netChange;
      points.push({
        date: new Date(_dayKey + 'T23:59:59'),
        value: Math.max(0, runningTotal),
        isWithdrawal: netChange < 0,
        movements,
      });
    }
  }

  // ── Extender a hoy (línea plana) ──
  const lastRealDate = points[points.length - 1].date;
  const todayDate = new Date();
  if (lastRealDate.toDateString() !== todayDate.toDateString()) {
    const lastValue = points[points.length - 1].value;
    points.push({ date: todayDate, value: lastValue, movements: [] });
  } else if (points.length === 1 && points[0].value > 0) {
    // Solo punto de creación hoy con saldo inicial → duplicar para mostrar sparkline
    points.push({ date: todayDate, value: points[0].value, movements: [] });
  }

  return points;
}

/** True si la fecha cae en el día de hoy */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

const HistorySparkline: React.FC<HistorySparklineProps> = React.memo(({ pocket, animate = true, onReady }) => {
  // ── ¿Primeras 24h desde la creación? ──
  const isFirst24h = useMemo(() => {
    const createdAt = new Date(pocket.createdAt);
    const now = new Date();
    return now.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000;
  }, [pocket.createdAt]);

  // ── Construir puntos de datos ──
  const dataPoints = useMemo<Point[]>(() => {
    return buildHistoryDataPoints(pocket, isFirst24h);
  }, [pocket, isFirst24h]);

  // ── Normalizar puntos a coordenadas SVG ──
  const { pointsString, areaPointsString, totalLength, segments, lastX, lastY, svgPoints } = useMemo(() => {
    if (dataPoints.length < 2) {
      const midY = SVG_HEIGHT / 2;
      return {
        pointsString: `0,${midY} ${SVG_WIDTH},${midY}`,
        areaPointsString: `0,${SVG_HEIGHT} 0,${midY} ${SVG_WIDTH},${midY} ${SVG_WIDTH},${SVG_HEIGHT}`,
        totalLength: SVG_WIDTH,
        segments: [{ start: 0, end: SVG_WIDTH, x1: 0, y1: midY, x2: SVG_WIDTH, y2: midY }],
        lastX: SVG_WIDTH,
        lastY: midY,
        svgPoints: [{ x: 0, y: midY }, { x: SVG_WIDTH, y: midY }],
      };
    }

    const values = dataPoints.map(p => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    const availableHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    // When all values are equal (e.g. pocket with initial amount only),
    // expand the range so the line renders centered, not at y=38 bottom.
    if (max === min) {
      min = min - availableHeight / 2;
      max = max + availableHeight / 2;
    }
    const range = max - min;

    const svgPoints = dataPoints.map((p, i) => {
      const x = (i / (dataPoints.length - 1)) * SVG_WIDTH;
      const y = SVG_HEIGHT - PADDING_BOTTOM - ((p.value - min) / range) * availableHeight;
      return { x, y };
    });

    const pts = svgPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    const linePts = pts.join(' ');
    const areaPts = `0,${SVG_HEIGHT} ${linePts} ${SVG_WIDTH},${SVG_HEIGHT}`;

    // Calcular segmentos con longitud real acumulada
    const segs: Segment[] = [];
    let cumLen = 0;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const dx = svgPoints[i + 1].x - svgPoints[i].x;
      const dy = svgPoints[i + 1].y - svgPoints[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segs.push({
        start: cumLen,
        end: cumLen + len,
        x1: svgPoints[i].x,
        y1: svgPoints[i].y,
        x2: svgPoints[i + 1].x,
        y2: svgPoints[i + 1].y,
      });
      cumLen += len;
    }

    const last = svgPoints[svgPoints.length - 1];

    return {
      pointsString: linePts,
      areaPointsString: areaPts,
      totalLength: cumLen || SVG_WIDTH,
      segments: segs,
      lastX: last.x,
      lastY: last.y,
      svgPoints,
    };
  }, [dataPoints]);

  // ── Animación JS-driven (RAF) para dibujo + glow viajero ──
  const [offset, setOffset] = useState(totalLength);
  const animStartRef = useRef<number | null>(null);

  useEffect(() => {
    // Saltar animación en visitas repetidas
    if (!animate) {
      setOffset(0);
      return;
    }

    // Resetear estados por si totalLength cambió (nuevos datos)
    setOffset(totalLength);
    animStartRef.current = null;

    const duration = 2000;

    const runAnimation = (timestamp: number) => {
      if (animStartRef.current === null) {
        animStartRef.current = timestamp;
      }

      const elapsed = timestamp - animStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out aproximación: cubic-bezier(0, 0, 0.58, 1)
      const eased = 1 - Math.pow(1 - progress, 1.5);
      const newOffset = totalLength * (1 - eased);

      setOffset(newOffset);

      if (progress < 1) {
        requestAnimationFrame(runAnimation);
      } else {
        setOffset(0);
      }
    };

    const rafId = requestAnimationFrame(runAnimation);
    return () => cancelAnimationFrame(rafId);
  }, [totalLength, animate]);

  // ── Disparar onReady cuando termina el dibujo (o no hay animación) ──
  const readyFiredRef = useRef(false);
  useEffect(() => {
    if (readyFiredRef.current || !onReady) return;
    // Sin movimientos — no hay animación, ready inmediato
    if (dataPoints.length < 2) {
      readyFiredRef.current = true;
      onReady();
      return;
    }
    // Animación completada (offset llegó a 0)
    if (offset === 0 && totalLength > 0 && dataPoints.length >= 2) {
      readyFiredRef.current = true;
      onReady();
    }
  }, [dataPoints.length, offset, totalLength, onReady]);

  // ── Posición interpolada de la punta viajera ──
  const tipPosition = useMemo<{ x: number; y: number }>(() => {
    if (segments.length === 0) return { x: lastX, y: lastY };

    const drawn = totalLength - offset;
    if (drawn <= 0) return { x: segments[0].x1, y: segments[0].y1 };
    if (drawn >= totalLength) return { x: segments[segments.length - 1].x2, y: segments[segments.length - 1].y2 };

    for (const seg of segments) {
      if (drawn >= seg.start && drawn <= seg.end) {
        const t = totalLength > 0 ? (drawn - seg.start) / (seg.end - seg.start) : 0;
        return {
          x: seg.x1 + (seg.x2 - seg.x1) * t,
          y: seg.y1 + (seg.y2 - seg.y1) * t,
        };
      }
    }

    return { x: lastX, y: lastY };
  }, [segments, totalLength, offset, lastX, lastY]);

  // ── Hover state para tooltip ──
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ── Auto-play card state (un card visible a la vez) ──
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isCardFading, setIsCardFading] = useState(false);
  const cardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRevealedRef = useRef<number | null>(null);

  // ── Indices elegibles para cards (punto inicial con apertura + movimientos + último punto = hoy) ──
  const cardEligibleIndices = useMemo<number[]>(() => {
    const indices: number[] = [];
    // Punto inicial con monto de apertura
    if (dataPoints[0]?.value > 0) {
      indices.push(0);
    }
    for (let i = 1; i < dataPoints.length - 1; i++) {
      if (dataPoints[i].movements.length > 0) {
        indices.push(i);
      }
    }
    // Siempre incluir el último punto (hoy) aunque no tenga movimientos
    const lastIdx = dataPoints.length - 1;
    if (!indices.includes(lastIdx)) {
      indices.push(lastIdx);
    }
    return indices;
  }, [dataPoints]);

  // ── Selección aleatoria estable (máximo MAX_CARDS, ordenado por índice) ──
  const cardSelectedIndices = useMemo<number[]>(() => {
    if (cardEligibleIndices.length <= AUTO_PLAY_MAX_CARDS) {
      return cardEligibleIndices; // ya viene ordenado ascendente
    }
    // Fisher-Yates partial shuffle
    const shuffled = [...cardEligibleIndices];
    const k = Math.min(AUTO_PLAY_MAX_CARDS, shuffled.length);
    for (let i = shuffled.length - 1; i > shuffled.length - 1 - k; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(-k).sort((a, b) => a - b);
  }, [cardEligibleIndices]);

  // ── Revelar UN card a la vez, sincronizado con el dibujo ──
  useEffect(() => {
    // Sin animación: no mostrar cards auto-play
    if (!animate) return;

    const drawProgress = 1 - offset / totalLength;

    // Reseteo de animación: limpiar todo
    if (offset === totalLength && totalLength > 0) {
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current);
      cardTimerRef.current = null;
      lastRevealedRef.current = null;
      setActiveCardIndex(null);
      setIsCardFading(false);
      return;
    }

    const pointCount = svgPoints.length - 1;

    // Encontrar el primer punto seleccionado que el dibujo ya pasó
    let nextIdx: number | null = null;
    for (const idx of cardSelectedIndices) {
      const pointProgress = idx / pointCount;
      if (drawProgress >= pointProgress) {
        nextIdx = idx;
      } else {
        break; // los siguientes están más lejos
      }
    }

    // Si cambió vs el último revelado, reemplazar el card
    if (nextIdx !== null && nextIdx !== lastRevealedRef.current) {
      lastRevealedRef.current = nextIdx;

      // Cancelar timer pendiente del card anterior
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current);

      // Mostrar el nuevo card (reemplaza al anterior inmediatamente)
      setActiveCardIndex(nextIdx);
      setIsCardFading(false);

      // Programar fade-out en dos fases
      const timer = setTimeout(() => {
        // Fase 1: empezar fade-out
        setIsCardFading(true);

        // Fase 2: remover después del fade
        const removeTimer = setTimeout(() => {
          setActiveCardIndex(null);
          setIsCardFading(false);
          cardTimerRef.current = null;
        }, AUTO_PLAY_CARD_FADE_DURATION);
        cardTimerRef.current = removeTimer;
      }, AUTO_PLAY_CARD_DELAY);
      cardTimerRef.current = timer;
    }
  }, [offset, cardSelectedIndices, totalLength, svgPoints.length, animate]);

  // ── Cleanup al desmontar ──
  useEffect(() => {
    return () => {
      if (cardTimerRef.current) clearTimeout(cardTimerRef.current);
    };
  }, []);

  // ── Helpers tooltip ──
  const getMovLabel = (type: PointMovement['type']): string => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'expense': return 'Gasto';
      case 'transfer_in': return 'Transferencia recibida';
      case 'transfer_out': return 'Transferencia enviada';
    }
  };

  const getMovIcon = (type: PointMovement['type']): string => {
    switch (type) {
      case 'deposit': return '↑';
      case 'expense': return '↓';
      case 'transfer_in': return '→';
      case 'transfer_out': return '←';
    }
  };

  const getMovColor = (type: PointMovement['type']): string => {
    switch (type) {
      case 'deposit': return 'text-green-500';
      case 'expense': return 'text-red-500';
      case 'transfer_in': return 'text-green-500';
      case 'transfer_out': return 'text-red-500';
    }
  };

  // ── Sin movimientos (solo punto inicial) ──
  if (dataPoints.length < 2) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.766 5.431" />
          </svg>
          <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
            Tendencia de acumulación
          </span>
        </div>
        <div className="w-full h-24 flex items-center justify-center text-secondary-400 dark:text-secondary-500 text-sm">
          Sin movimientos aún
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.766 5.431" />
          </svg>
          <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
            Tendencia de acumulación
          </span>
        </div>

        {/* ── Badge "Nuevo bolsillo" (≤3 días de creado) ── */}
        {(() => {
          const daysOld = Math.floor((Date.now() - new Date(pocket.createdAt).getTime()) / 86400000);
          return daysOld <= 3;
        })() && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
            bg-gradient-to-r from-purple-100 to-amber-100
            dark:from-purple-900/40 dark:to-amber-900/30
            text-purple-700 dark:text-purple-300
            border border-purple-200 dark:border-purple-700/40
            shadow-sm">
            <svg className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Nuevo bolsillo
          </span>
        )}
      </div>

      {/* SVG Sparkline */}
      <div className="relative w-full h-32 overflow-visible mb-12">
        <svg
          className="w-full h-full overflow-visible text-purple-500"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          aria-label="Sparkline de acumulación"
        >
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2={SVG_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="areaFadeMask" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.18" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="areaMask">
              <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#areaFadeMask)" />
            </mask>
            <clipPath id="areaReveal">
              <rect x="0" y="0" width={Math.min(SVG_WIDTH, (1 - offset / totalLength) * SVG_WIDTH)} height={SVG_HEIGHT} />
            </clipPath>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes endpoint-pulse {
                0%, 100% { box-shadow: 0 0 8px 4px rgba(168,85,247,0.4), 0 0 24px 12px rgba(168,85,247,0.15); }
                50% { box-shadow: 0 0 12px 6px rgba(168,85,247,0.5), 0 0 32px 16px rgba(168,85,247,0.2); }
              }
              @keyframes fade-in-card {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </defs>

          {/* Área de fill con degradado horizontal + fade vertical + reveal */}
          <polygon
            fill="url(#sparklineGradient)"
            mask="url(#areaMask)"
            clipPath="url(#areaReveal)"
            points={areaPointsString}
          />

          {/* Línea principal con animación de dibujo vía RAF */}
          <polyline
            fill="none"
            stroke="url(#sparklineGradient)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLength}
            strokeDashoffset={offset}
            style={{ transition: 'none' }}
            points={pointsString}
          />

          {/* ── Dots característicos en cada punto ── */}
          {svgPoints.map((pt, i) => {
            // Skip first dot if no initial amount, skip last (today extension)
            if ((i === 0 && (dataPoints[i]?.value ?? 0) <= 0) || i === svgPoints.length - 1) return null;
            const delay = (i / (svgPoints.length - 1)) * 2000;
            return (
              <g key={i} style={{ animation: `fade-in 0.4s ease-out ${delay}ms forwards`, opacity: 0 }}>
                <line
                  x1={pt.x} y1={pt.y}
                  x2={pt.x} y2={SVG_HEIGHT - PADDING_BOTTOM}
                  stroke="#A855F7"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.25}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Punto viajero: sombra infinita con pulse decelerado ── */}
        <div
          className="absolute w-[3.6px] h-[3.6px] rounded-full bg-white"
          style={{
            left: `${(tipPosition.x / SVG_WIDTH) * 100}%`,
            top: `${(tipPosition.y / SVG_HEIGHT) * 100}%`,
            transform: 'translate(-50%, -50%)',
            animation: `endpoint-pulse ${0.35 + (3 - 0.35) * (totalLength > 0 ? Math.min(1 - offset / totalLength, 1) : 1)}s ease-in-out infinite`,
          }}
        />

        {/* ── Dots HTML + fechas ── */}
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {svgPoints.map((pt, i) => {
            // Skip first dot if no initial amount, skip last (today extension)
            if ((i === 0 && (dataPoints[i]?.value ?? 0) <= 0) || i === svgPoints.length - 1) return null;
            const drawProgress = 1 - offset / totalLength;
            const pointProgress = i / (svgPoints.length - 1);
            const isVisible = drawProgress >= pointProgress;
            const pctX = (pt.x / SVG_WIDTH) * 100;
            const pctY = (pt.y / SVG_HEIGHT) * 100;
            const d = new Date(dataPoints[i].date);
            const label = isToday(d) ? 'Hoy' : isFirst24h
              ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
              : `${d.getDate()} ${d.toLocaleDateString('es', { month: 'short' }).toUpperCase()}`;
            return (
              <div key={i}>
                {/* Dot */}
                <div
                  className="absolute w-[2px] h-[2px] rounded-full border transition-opacity duration-200 border-black dark:border-white [.dim_&]:border-amber-900 bg-white dark:bg-black [.dim_&]:bg-white"
                  style={{
                    left: `${pctX}%`,
                    top: `${pctY}%`,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                  }}
                />
                {/* Fecha / Hora */}
                <span
                  className="absolute text-[9px] leading-none text-secondary-400 dark:text-secondary-500 transition-opacity duration-200 whitespace-nowrap"
                  style={{
                    left: `${pctX}%`,
                    top: `${(SVG_HEIGHT - PADDING_BOTTOM + 4) / SVG_HEIGHT * 100}%`,
                    transform: 'translate(-50%, 0)',
                    opacity: isVisible ? 0.7 : 0,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Tooltip ── */}
        {hoveredIndex !== null && dataPoints[hoveredIndex] && (() => {
          const pt = svgPoints[hoveredIndex];
          const p = dataPoints[hoveredIndex];
          const pctX = (pt.x / SVG_WIDTH) * 100;
          const pctY = (pt.y / SVG_HEIGHT) * 100;
          const isRightHalf = pctX > 60;
          const d = new Date(p.date);
          const dateStr = isToday(d) ? 'HOY' : d.toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
          }).toUpperCase();
          return (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: isRightHalf ? `${pctX - 2}%` : `${pctX + 2}%`,
                top: `${Math.max(pctY - 38, 2)}%`,
                transform: isRightHalf ? 'translate(-100%, 0)' : 'translate(0, 0)',
              }}
            >
              <div className="bg-secondary-900/95 dark:bg-black/90 text-white rounded-lg px-3 py-2.5 shadow-xl border border-secondary-700/50 min-w-[180px] max-w-[260px]">
                {/* Fecha */}
                <div className="text-[10px] font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wider mb-1.5">
                  {dateStr}
                </div>
                {/* Valor acumulado — siempre verde porque negativo es prohibido */}
                <div className="text-sm font-extrabold text-green-500 mb-2">
                  {formatCurrency(p.value)}
                </div>
                {/* Separador */}
                {p.movements.length > 0 && (
                  <div className="border-t border-secondary-700/50 dark:border-secondary-700/80 mb-1.5" />
                )}
                {/* Movimientos */}
                <div className="space-y-1">
                  {p.movements.map((pm, mi) => (
                    <div key={mi} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className={`${getMovColor(pm.type)} font-bold flex-shrink-0`}>
                          {getMovIcon(pm.type)}
                        </span>
                        <span className="text-secondary-300 dark:text-secondary-300 truncate">
                          {pm.reason || getMovLabel(pm.type)}
                        </span>
                      </span>
                      <span className={`font-semibold flex-shrink-0 ${pm.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pm.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(pm.amount))}
                      </span>
                    </div>
                  ))}
                </div>
                {p.movements.length === 0 && (
                  <div className="text-[11px] text-secondary-500 italic">Sin movimientos</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Auto-play card (uno a la vez) ── */}
        {activeCardIndex !== null && (() => {
          const svgPt = svgPoints[activeCardIndex];
          const dataPt = dataPoints[activeCardIndex];
          const pctX = (svgPt.x / SVG_WIDTH) * 100;
          const pctY = (svgPt.y / SVG_HEIGHT) * 100;
          const isRightHalf = pctX > 60;
          const d = new Date(dataPt.date);
          const dateStr = isToday(d) ? 'HOY' : d.toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
          }).toUpperCase();
          return (
            <div
              className="absolute z-40 pointer-events-none"
              style={{
                left: isRightHalf ? `${pctX - 2}%` : `${pctX + 2}%`,
                top: `${Math.max(pctY - 38, 2)}%`,
                transform: isRightHalf ? 'translate(-100%, 0)' : 'translate(0, 0)',
                opacity: isCardFading ? 0 : 1,
                transition: `opacity ${AUTO_PLAY_CARD_FADE_DURATION}ms ease-out`,
                animation: 'fade-in-card 0.2s ease-out',
              }}
            >
              <div className="bg-secondary-900/80 dark:bg-black/80 text-white rounded-lg px-2.5 py-2 shadow-lg border border-secondary-700/40 min-w-[150px] max-w-[220px] backdrop-blur-sm">
                <div className="text-[9px] font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wider mb-1">
                  {dateStr}
                </div>
                <div className="text-xs font-extrabold text-green-500 mb-1.5">
                  {formatCurrency(dataPt.value)}
                </div>
                {dataPt.movements.length > 0 ? (
                  <>
                    <div className="border-t border-secondary-700/30 mb-1" />
                    <div className="space-y-0.5">
                      {dataPt.movements.slice(0, 3).map((pm, mi) => (
                        <div key={mi} className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="flex items-center gap-1 min-w-0">
                            <span className={`${getMovColor(pm.type)} font-bold flex-shrink-0`}>
                              {getMovIcon(pm.type)}
                            </span>
                            <span className="text-secondary-300 truncate max-w-[100px]">
                              {pm.reason || getMovLabel(pm.type)}
                            </span>
                          </span>
                          <span className={`font-semibold flex-shrink-0 ${pm.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pm.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(pm.amount))}
                          </span>
                        </div>
                      ))}
                      {dataPt.movements.length > 3 && (
                        <div className="text-[9px] text-secondary-500 text-center">
                          +{dataPt.movements.length - 3} más
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-[9px] text-secondary-500 italic text-center mt-1">
                    Sin movimientos hoy
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Hover targets (desktop-only hit areas) — above auto-play card for reliable hit-testing ── */}
        <div className="absolute inset-0 overflow-visible block z-[45]">
          {svgPoints.map((pt, i) => {
            if (i === 0 && (dataPoints[i]?.value ?? 0) <= 0) return null; // skip initial point without initial amount
            const pctX = (pt.x / SVG_WIDTH) * 100;
            const pctY = (pt.y / SVG_HEIGHT) * 100;
            const drawProgress = 1 - offset / totalLength;
            const pointProgress = i / (svgPoints.length - 1);
            const isVisible = drawProgress >= pointProgress;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="absolute rounded-full cursor-pointer transition-colors"
                style={{
                  left: `${pctX}%`,
                  top: `${pctY}%`,
                  width: '20px',
                  height: '20px',
                  transform: 'translate(-50%, -50%)',
                  opacity: isVisible ? 1 : 0,
                   pointerEvents: isVisible ? 'auto' : 'none',
                  background: hoveredIndex === i ? 'rgba(168,85,247,0.15)' : 'transparent',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

HistorySparkline.displayName = 'HistorySparkline';

export default HistorySparkline;
