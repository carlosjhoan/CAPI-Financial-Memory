import React, { useEffect, useRef, useState } from 'react';

// ==========================================
// BeamSvg — SVG beam animado vía stroke-dashoffset
//
// 3 capas sincronizadas con MISMO dash (~20% del perímetro).
// La diferencia está en el grosor + blur para profundidad.
//
// ANIMA UN SOLO CICLO y llama onCycleComplete al terminar.
// ==========================================

interface BeamSvgProps {
  /** RGB string: "R,G,B" — ej: "96,165,250" */
  accentRgb: string;
  /** Se dispara cuando el beam completa UN ciclo (3500ms) */
  onCycleComplete?: () => void;
}

const RX = 12;
export const BEAM_DURATION_MS = 2800;

function perimeter(w: number, h: number): number {
  return 2 * (w + h) - 2 * RX * (4 - Math.PI);
}

let idCounter = 0;

function BeamSvg({ accentRgb, onCycleComplete }: BeamSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const [uid] = useState(() => `bf-${++idCounter}`);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const completeFiredRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const borderBox = entry.borderBoxSize?.[0];
        if (borderBox) {
          setDims({
            w: Math.round(borderBox.inlineSize),
            h: Math.round(borderBox.blockSize),
          });
        } else {
          setDims({
            w: Math.round(entry.contentRect.width),
            h: Math.round(entry.contentRect.height),
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (dims.w === 0 || dims.h === 0) return;

    const p = perimeter(dims.w, dims.h);

    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.id = `bf-style-${uid}`;
      document.head.appendChild(styleRef.current);
    }

    styleRef.current.textContent = `
      @keyframes bf-${uid} {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -${p}px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .bf-${uid} { animation: none !important; }
      }
    `;

    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, [dims.w, dims.h, uid]);

  // Timer que dispara onCycleComplete al completar UN ciclo.
  // No depende del CSS animation — funciona incluso si
  // prefers-reduced-motion la deshabilita.
  useEffect(() => {
    if (!onCycleComplete) return;
    if (dims.w === 0 || dims.h === 0) return;

    completeFiredRef.current = false;

    const timer = setTimeout(() => {
      if (completeFiredRef.current) return;
      completeFiredRef.current = true;
      onCycleComplete();
    }, BEAM_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onCycleComplete, dims.w, dims.h]);

  if (dims.w === 0 || dims.h === 0) {
    return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
  }

  const p = perimeter(dims.w, dims.h);
  // Un solo ciclo, no infinito
  const animStyle = `bf-${uid} ${BEAM_DURATION_MS}ms linear 1`;
  const dashPct = 0.20;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={`bf-blur-wash-${uid}`}>
            <feGaussianBlur stdDeviation="24" />
          </filter>
          <filter id={`bf-blur-glow-${uid}`}>
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id={`bf-blur-core-${uid}`}>
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Capa 1: Wash — gradiente borde→interior */}
        <rect
          width={dims.w}
          height={dims.h}
          rx={RX}
          fill="none"
          stroke={`rgba(${accentRgb},0.08)`}
          strokeWidth="60"
          strokeLinecap="round"
          strokeDasharray={`${p * dashPct} ${p * (1 - dashPct)}`}
          strokeDashoffset={0}
          filter={`url(#bf-blur-wash-${uid})`}
          style={{ animation: animStyle }}
          className={`bf-${uid}`}
        />

        {/* Capa 2: Glow — resplandor visible */}
        <rect
          width={dims.w}
          height={dims.h}
          rx={RX}
          fill="none"
          stroke={`rgba(${accentRgb},0.20)`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${p * dashPct} ${p * (1 - dashPct)}`}
          strokeDashoffset={0}
          filter={`url(#bf-blur-glow-${uid})`}
          style={{ animation: animStyle }}
          className={`bf-${uid}`}
        />

        {/* Capa 3: Core — haz nítido sobre el borde */}
        <rect
          width={dims.w}
          height={dims.h}
          rx={RX}
          fill="none"
          stroke={`rgba(${accentRgb},1.0)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${p * dashPct} ${p * (1 - dashPct)}`}
          strokeDashoffset={0}
          filter={`url(#bf-blur-core-${uid})`}
          style={{ animation: animStyle }}
          className={`bf-${uid}`}
        />

        {/*
          Connector dot — nodo de anclaje persistente en el borde izquierdo.
          Centrado verticalmente. Simula el punto de conexión entre la
          timeline y el card. El beam pasa por encima al recorrer el perímetro.
        */}
        <circle
          cx={3}
          cy={dims.h / 2}
          r={5}
          fill={`rgba(${accentRgb},0.20)`}
        />
        <circle
          cx={3}
          cy={dims.h / 2}
          r={3}
          fill={`rgba(${accentRgb},1.0)`}
        />
      </svg>
    </div>
  );
}

export default React.memo(BeamSvg);
