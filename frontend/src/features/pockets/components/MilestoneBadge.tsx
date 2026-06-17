import React from 'react';

export type MilestoneType =
  | 'first_deposit'
  | 'goal_25'
  | 'goal_50'
  | 'goal_75'
  | 'goal_100'
  | 'streak_30';

interface MilestoneBadgeProps {
  type: MilestoneType | null;
  onDismiss?: () => void;
}

interface MilestoneConfig {
  label: string;
  colorClass: string;
  glow?: boolean;
}

const MILESTONE_CONFIG: Record<MilestoneType, MilestoneConfig> = {
  first_deposit: {
    label: '🎯 ¡Primer aporte!',
    colorClass:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  goal_25: {
    label: '🎯 ¡25% de la meta!',
    colorClass:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  goal_50: {
    label: '⭐ ¡Mitad de camino!',
    colorClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    glow: true,
  },
  goal_75: {
    label: '🔥 ¡Casi llegas!',
    colorClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    glow: true,
  },
  goal_100: {
    label: '🎉 ¡Meta cumplida!',
    colorClass:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    glow: true,
  },
  streak_30: {
    label: '🔥 ¡Racha de 30 días!',
    colorClass:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  },
};

const MilestoneBadge: React.FC<MilestoneBadgeProps> = React.memo(({ type, onDismiss }) => {
  if (!type) return null;

  const config = MILESTONE_CONFIG[type];
  if (!config) return null;

  return (
    <div
      className={`milestone-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${
        config.colorClass
      } ${config.glow ? 'milestone-glow' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span>{config.label}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Descartar"
        >
          &times;
        </button>
      )}
    </div>
  );
});

MilestoneBadge.displayName = 'MilestoneBadge';

export default MilestoneBadge;
