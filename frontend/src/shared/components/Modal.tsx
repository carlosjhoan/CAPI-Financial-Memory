import React, { useEffect } from 'react';
import { cn } from '../../core/utils/format';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  preventCloseOnBackdrop?: boolean;
  glassBackdrop?: boolean;
  glass?: boolean;
  accentColor?: string; // "R,G,B" format, e.g. "239,68,68" for red accent border
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  preventCloseOnBackdrop = false,
  glassBackdrop = false,
  glass = false,
  accentColor,
}) => {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Manejar cierre con Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventCloseOnBackdrop) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={cn('fixed inset-0 bg-black/50 transition-all', glassBackdrop && 'backdrop-blur-sm')}
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={cn(
              'relative w-full transform overflow-hidden rounded-lg transition-all',
              glass
                ? 'bg-white/20 dark:bg-secondary-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl'
                : 'bg-white dark:bg-secondary-800 shadow-xl',
              sizes[size]
            )}
          >
            {/* White-edge glow — glass edge effect matching RecordFocusCard */}
            {glass && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse farthest-corner at 50% 50%, transparent 30%, rgba(255,255,255,0.08) 100%)',
                }}
              />
            )}

            {/* Accent top border — glassmorphism detail matching RecordFocusCard */}
            {glass && accentColor && (
              <div
                className="absolute top-0 left-0 right-0 rounded-t-lg pointer-events-none"
                style={{
                  height: 3,
                  zIndex: 1,
                  background: `rgba(${accentColor}, 0.35)`,
                  boxShadow: `0 0 12px rgba(${accentColor}, 0.25)`,
                }}
              />
            )}

            {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="border-b border-secondary-200 dark:border-secondary-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {title && (
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
                    aria-label="Cerrar"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;