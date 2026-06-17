import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatCurrency } from '../../../core/utils/format';

interface HistoryProgressArcProps {
  currentAmount: number;
  goal: number;
  animate?: boolean;
  onGoalReached?: () => void;
  onReady?: () => void;
}

const HistoryProgressArc: React.FC<HistoryProgressArcProps> = React.memo(({
  currentAmount,
  goal,
  animate = true,
  onReady,
}) => {
  const percentage = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.min(Math.round((currentAmount / goal) * 100), 100);
  }, [currentAmount, goal]);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);
  const [barComplete, setBarComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Saltar animación en visitas repetidas
    if (!animate) {
      setDisplayProgress(percentage);
      setAnimProgress(percentage);
      setBarComplete(true);
      if (percentage >= 100) setShowConfetti(true);
      return;
    }

    if (percentage <= 0) {
      setDisplayProgress(0);
      setAnimProgress(0);
      setBarComplete(true);
      setShowConfetti(false);
      return;
    }

    // Reset: muestra glow desde el inicio del fade-in
    setDisplayProgress(0);
    setAnimProgress(0);
    setBarComplete(false);

    // Delay mínimo para que el DOM pinte el 0% antes de animar
    const startTimer = setTimeout(() => {
      setDisplayProgress(percentage);
    }, 50);

    // Tiempo total: 50ms delay + 1500ms transición + margen
    const endTimer = setTimeout(() => {
      setBarComplete(true);
      if (percentage >= 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5500);
      }
    }, 1700);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [percentage, animate]);

  // Animación del glow: arranca desde 0 y viaja con la barra
  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(displayProgress), 50);
    return () => clearTimeout(timer);
  }, [displayProgress]);

  // ── Disparar onReady cuando la barra termina ──
  const readyFiredRef = useRef(false);
  useEffect(() => {
    if (readyFiredRef.current || !onReady) return;
    if (barComplete) {
      readyFiredRef.current = true;
      onReady();
    }
  }, [barComplete, onReady]);

  return (
    <div className="space-y-3">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
        <span className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
          Progreso hacia la meta
        </span>
      </div>

      {/* Barra de progreso animada */}
      <div className="relative w-full h-2 overflow-visible">
        <div className="w-full h-full bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-[1500ms] ease-out relative"
            style={{
              width: `${animProgress}%`,
            }}
          >
            {/* ── Glow viajero: hijo de la barra, se mueve con ella ── */}
            {!barComplete && animProgress > 0 && (
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 z-10 pointer-events-none">
                <div
                  className="w-3 h-3 rounded-full bg-white"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(245,158,11,0.5))',
                    animation: 'progress-tip-pulse 0.35s ease-in-out infinite',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Etiquetas de progreso */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-secondary-500 dark:text-secondary-400">
          {formatCurrency(currentAmount)} de {formatCurrency(goal)}
        </span>
        <span className="font-bold text-purple-600 dark:text-purple-400">
          {percentage}%
        </span>
      </div>

      {/* ── Confetti al alcanzar la meta ── */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              className={`absolute ${i % 2 === 0 ? 'w-3 h-1' : 'w-1 h-2.5'}`}
              style={{
                left: `${(i * 17) % 100}%`,
                top: `-10px`,
                backgroundColor: ['#A855F7', '#F59E0B', '#22C55E', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'][i % 7],
                animation: `confetti-fall-${i % 5} ${4 + (i % 3)}s cubic-bezier(0.1, 0.8, 0.3, 1) ${(i % 5) * 0.12}s forwards`,
                transform: `rotate(${i * 53}deg) skew(${(i % 5) * 3}deg, ${(i % 3) * 2}deg)`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Keyframes para pulso de alta frecuencia en la barra */}
      <style>{`
        @keyframes progress-tip-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.6); }
        }
        @keyframes confetti-fall-0 {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) translateX(-40px) rotate(720deg); }
        }
        @keyframes confetti-fall-1 {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) translateX(50px) rotate(-540deg); }
        }
        @keyframes confetti-fall-2 {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) translateX(-20px) rotate(900deg); }
        }
        @keyframes confetti-fall-3 {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) translateX(35px) rotate(-360deg); }
        }
        @keyframes confetti-fall-4 {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) translateX(-60px) rotate(1080deg); }
        }
      `}</style>
    </div>
  );
});

HistoryProgressArc.displayName = 'HistoryProgressArc';

export default HistoryProgressArc;
