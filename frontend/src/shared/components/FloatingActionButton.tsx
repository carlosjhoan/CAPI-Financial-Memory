import React from 'react';
import { cn } from '../../core/utils/format';
import { useTheme } from '../../core/hooks/useTheme';
import './FloatingActionButton.css';

export type FABAccentColor = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'primary';

export interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
  accentColor?: FABAccentColor;
  className?: string;
}

/* ---- Vitral color configuration (edge-intense radial gradient) ---- */
/* Each color defines RGB values for light mode and a lighter variant for dark mode */
interface VitralConfig {
  r: number; g: number; b: number;
  rDark: number; gDark: number; bDark: number;
  glowColor: string;
  threadColor: string;
}

const vitralColorMap: Record<FABAccentColor, VitralConfig> = {
  green:  { r: 22, g: 163, b: 74,   rDark: 74,  gDark: 222, bDark: 128,  glowColor: 'rgba(34,197,94,0.6)',  threadColor: '#22c55e' },
  orange: { r: 234, g: 88, b: 12,   rDark: 251, gDark: 146, bDark: 60,   glowColor: 'rgba(249,115,22,0.6)', threadColor: '#f97316' },
  red:    { r: 220, g: 38, b: 38,   rDark: 248, gDark: 113, bDark: 113,  glowColor: 'rgba(239,68,68,0.6)',  threadColor: '#ef4444' },
  blue:   { r: 37, g: 99, b: 235,  rDark: 96,  gDark: 165, bDark: 250,  glowColor: 'rgba(59,130,246,0.6)', threadColor: '#3b82f6' },
  purple: { r: 147, g: 51, b: 234, rDark: 192, gDark: 132, bDark: 252,  glowColor: 'rgba(147,51,234,0.6)', threadColor: '#9333ea' },
  primary:{ r: 37, g: 99, b: 235,  rDark: 96,  gDark: 165, bDark: 250,  glowColor: 'rgba(59,130,246,0.6)', threadColor: '#3b82f6' },
};

/* ---- Dot color by theme ---- */
const DOT_COLORS: Record<string, string> = {
  dark: '#ffffff',
  dim: '#7a5a3e',
};

/* ---- Icon color = accent threadColor con opacidad (vidrio esmerilado) ---- */

/* ────────────────────────────────────────────── */

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label,
  accentColor = 'primary',
  className,
}) => {
  const { theme } = useTheme();
  const config = vitralColorMap[accentColor];
  const isDark = theme === 'dark';
  const dotColor = DOT_COLORS[theme] ?? '#000000';
  const iconColor = `${config.threadColor}aa`; // threadColor al 67%, semi-transparente

  const vr = isDark ? config.rDark : config.r;
  const vg = isDark ? config.gDark : config.g;
  const vb = isDark ? config.bDark : config.b;

  const buttonStyle = {
    backgroundImage: [
      /* Glass reflection hotspot (top-left highlight) */
      `radial-gradient(circle at 35% 35%, rgba(255,255,255,${isDark ? '0.10' : '0.15'}) 0%, transparent 60%)`,
      /* Edge-intense vitral: transparent center → intense border */
      `radial-gradient(circle, transparent 20%, rgba(${vr},${vg},${vb},0.08) 35%, rgba(${vr},${vg},${vb},0.25) 50%, rgba(${vr},${vg},${vb},0.55) 65%, rgba(${vr},${vg},${vb},0.88) 80%, rgba(${vr},${vg},${vb},1) 100%)`,
    ].join(', '),
    '--glow-color': config.glowColor,
  } as React.CSSProperties;

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 group', className)}>
      {/* Tooltip + connection line — solo visible en hover */}
      <div className="fab-tooltip absolute right-full top-1/2 -translate-y-1/2 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out flex items-center">
        {/* Badge pill con outline (left side) */}
        <div
          className="fab-badge rounded-full shadow-lg"
          style={{
            backgroundColor: `${config.threadColor}33`,
            border: `1.5px solid ${config.threadColor}`,
            '--badge-glow-color': config.threadColor,
          } as React.CSSProperties}
        >
          <span className="block text-xs font-semibold px-2.5 py-1 whitespace-nowrap tracking-tight"
            style={{ color: config.threadColor }}>
            {label}
          </span>
        </div>

        {/* Connection SVG: dots + line between tooltip and FAB (right side, closest to FAB) */}
        <svg
          width="40"
          height="36"
          viewBox="0 0 40 36"
          className="block shrink-0"
          aria-hidden="true"
          style={{ color: dotColor } as React.CSSProperties}
        >
          <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Dot near tooltip (left side of SVG, closest to tooltip text) — aparece segundo */}
          <circle
            className="dot-tooltip"
            cx="4"
            cy="18"
            r="3"
            fill={dotColor}
            filter="url(#neon-glow)"
          />
          {/* Connection line: draws from right (FAB side, x=36) toward left (tooltip side, x=4) */}
          {/* No filter on the line — SVG blur makes it too diffuse on dark backgrounds. Dots handle the glow. */}
          <line
            className="conn-line"
            x1="36"
            y1="18"
            x2="4"
            y2="18"
            stroke={dotColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Dot near FAB (right side of SVG, closest to button) — aparece primero */}
          <circle
            className="dot-fab"
            cx="36"
            cy="18"
            r="3"
            fill={dotColor}
            filter="url(#neon-glow)"
          />
        </svg>
      </div>

      {/* FAB button */}
      <button
        onClick={onClick}
        className="fab-btn flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:scale-[1.35] active:scale-95 relative"
        style={{ ...buttonStyle, color: iconColor }}
        aria-label={label}
      >
        <svg
          className="w-6 h-6 transition-transform duration-300 ease-out group-hover:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton;
