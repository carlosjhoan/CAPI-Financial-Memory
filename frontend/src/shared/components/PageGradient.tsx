import { useState, useEffect } from 'react'

interface PageGradientProps {
  r: number
  g: number
  b: number
  isDark?: boolean
  /** Si true, no hace entrance animation al montar (útil para gradientes de página que van tapando al de App) */
  static?: boolean
}

const PageGradient = ({ r, g, b, isDark = false, static: isStatic = false }: PageGradientProps) => {
  const alpha = isDark ? '0.23' : '0.20'
  const [animate, setAnimate] = useState(!isStatic)

  // Entrance animation: pulsa ~1.2s al montar la página, luego se asienta.
  // Cuando static=true (gradiente de página), no hay animación.
  useEffect(() => {
    if (isStatic) return
    const timer = setTimeout(() => setAnimate(false), 1200)
    return () => clearTimeout(timer)
  }, [isStatic])

  return (
    <>
      <style>{`
        @keyframes gradient-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes gradient-sweep {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.12) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .animate-gradient-pulse {
          animation: gradient-pulse 2s ease-in-out infinite;
        }
        .animate-gradient-sweep {
          animation: gradient-sweep 4s ease-in-out infinite;
          transform-origin: calc(85% + 70px) calc(20% - 70px);
        }
      `}</style>

      {/* Full-page gradient layer — desktop (hotspot preciso en monto+badge) */}
      <div
        className={`hidden lg:block fixed inset-0 -z-10 pointer-events-none transition-all duration-1000 ${
          animate ? 'animate-gradient-sweep opacity-100' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `radial-gradient(ellipse 53% 53% at calc(85% + 70px) calc(20% - 70px), rgba(${r},${g},${b},${alpha}) 0%, transparent 40%)`,
        }}
      />
      {/* Full-page gradient layer — tablet & mobile (posicionado desde borde derecho, ellipse más amplia) */}
      <div
        className={`block lg:hidden fixed inset-0 -z-10 pointer-events-none transition-all duration-1000 ${
          animate ? 'animate-gradient-pulse opacity-100' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `radial-gradient(ellipse 83% 83% at right 60px top 60px, rgba(${r},${g},${b},${alpha}) 0%, transparent 50%)`,
        }}
      />
    </>
  )
}

export default PageGradient
