import React from 'react';
import { cn } from '../../core/utils/format';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional RGB accent for top glow line, e.g. "34,197,94" for green */
  accentColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, accentColor }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-xl px-4 py-3',
      'bg-white/15 dark:bg-secondary-900/60 backdrop-blur-xl',
      'border border-white/25 dark:border-white/10',
      'shadow-2xl shadow-secondary-900/10',
      className,
    )}
  >
    {/* Edge glow — radial gradient from center-out matching modal/RecordFocusCard */}
    <div
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse farthest-corner at 50% 50%, transparent 30%, rgba(255,255,255,0.08) 100%)',
      }}
    />

    {/* Accent top border glow */}
    {accentColor && (
      <div
        className="absolute top-0 left-0 right-0 rounded-t-xl pointer-events-none"
        style={{
          height: 2,
          zIndex: 1,
          background: `rgba(${accentColor}, 0.35)`,
          boxShadow: `0 0 10px rgba(${accentColor}, 0.2)`,
        }}
      />
    )}

    {/* Content */}
    <div className="relative z-10">{children}</div>
  </div>
);

export default GlassCard;
