import React from 'react';

export interface MessageRevealProps {
  /** Texto a mostrar en el overlay */
  message: string;
  /** Label del mensaje (ej: "Motivo", "Intención") */
  label: string;
  /** Contenido del card que se blurrea al hacer hover */
  children: React.ReactNode;
  /** Controla si el overlay de revelación está visible */
  isHovered: boolean;
  /** Clases adicionales para el contenedor root (permite flex-1 desde el padre) */
  className?: string;
}

const MessageReveal: React.FC<MessageRevealProps> = ({ message, label, children, isHovered, className }) => {
  return (
    <div className={`relative ${className || ''}`}>
      {/* Card content — blurred when hovered */}
      <div className={`relative z-0 transition-all duration-200 flex-1 flex flex-col ${isHovered ? 'blur-md' : ''}`}>
        {children}
      </div>

      {/* Blur overlay — más oscuro para que el mensaje ámbar contraste fuerte */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md rounded-lg z-10" />
      )}

      {/* Message overlay centered — pointer-events-none para que el icono reciba mouse events */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-400/60 rounded-lg p-4 max-w-[85%] [box-shadow:0_0_10px_rgba(251,191,36,0.3),0_0_20px_rgba(251,191,36,0.15),0_0_40px_rgba(251,191,36,0.05)] dark:[box-shadow:0_0_12px_rgba(251,191,36,0.6),0_0_24px_rgba(251,191,36,0.3),0_0_48px_rgba(251,191,36,0.15)]">
              <p className="text-[14px] text-amber-700 dark:text-amber-400 mb-1 font-medium">{label}:</p>
              <p className="text-[16px] italic text-amber-900 dark:text-amber-200 text-center leading-snug">
                &ldquo;{message}&rdquo;
              </p>
            </div>
            {/* Flechita hacia abajo */}
            <div className="w-3 h-3 bg-amber-50 dark:bg-amber-900/20 border-r-2 border-b-2 border-amber-400 dark:border-amber-400/60 transform rotate-45 -mt-[6px] [filter:drop-shadow(0_0_4px_rgba(251,191,36,0.4))] dark:[filter:drop-shadow(0_0_6px_rgba(251,191,36,0.6))]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MessageReveal);
