import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ==========================================
// TYPES
// ==========================================

export interface KebabAction {
  label: string;
  onClick: () => void;
  /** If true, renders in red (danger variant) */
  danger?: boolean;
  icon?: React.ReactNode;
}

export interface KebabPopoverProps {
  actions: KebabAction[];
}

// ==========================================
// ICONS
// ==========================================

const KebabIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const POPOVER_WIDTH = 160;
const POPOVER_GAP = 4;
const ITEM_HEIGHT = 44;

// ==========================================
// COMPONENT
// ==========================================

/** Shared instance counter — ensures only one kebab popover is open at a time */
let openKebabId: string | null = null;
let closeOtherKebab: (() => void) | null = null;

const KebabPopover: React.FC<KebabPopoverProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const uid = useRef(`kebab-${Math.random().toString(36).slice(2, 8)}`);

  const close = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
    if (openKebabId === uid.current) {
      openKebabId = null;
      closeOtherKebab = null;
    }
  }, []);

  // Register close handler for cross-instance tracking
  useEffect(() => {
    if (!isOpen) return;
    // Close any previously open kebab
    if (closeOtherKebab && openKebabId !== uid.current) {
      closeOtherKebab();
    }
    openKebabId = uid.current;
    closeOtherKebab = close;
  }, [isOpen, close]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
      return;
    }

    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = actions.length * ITEM_HEIGHT + 8;
    const shouldFlip = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    if (shouldFlip) {
      setPosition({
        top: rect.top - estimatedHeight - POPOVER_GAP,
        left: Math.max(VIEWPORT_MARGIN, rect.right - POPOVER_WIDTH),
      });
    } else {
      setPosition({
        top: rect.bottom + POPOVER_GAP,
        left: Math.max(VIEWPORT_MARGIN, rect.right - POPOVER_WIDTH),
      });
    }

    setIsOpen(true);
  }, [isOpen, close, actions.length]);

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
      close();
    };
    // Defer to avoid same-click that opened it from closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const handleAction = useCallback((action: KebabAction) => {
    close();
    action.onClick();
  }, [close]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors cursor-pointer"
        aria-label="Acciones"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <KebabIcon />
      </button>

      {isOpen && position && createPortal(
        <div
          ref={popoverRef}
          role="menu"
          className="fixed z-[100] bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            minWidth: POPOVER_WIDTH,
          }}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              role="menuitem"
              onClick={() => handleAction(action)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                action.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              }`}
              style={{ minHeight: ITEM_HEIGHT }}
            >
              {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

const VIEWPORT_MARGIN = 8;

export default React.memo(KebabPopover);