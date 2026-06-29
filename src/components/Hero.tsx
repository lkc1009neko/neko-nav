import { useRef } from 'react'
import { useParticles } from '../hooks/useParticles'
import { site } from '../config/site'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useParticles(canvasRef)

  return (
    <section className="relative min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 float-glow"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 float-glow-delayed"
          style={{ background: 'radial-gradient(circle, var(--color-accent-2), transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 ani-bottom">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider mb-4"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {site.title}
        </h1>
        <p className="text-base md:text-lg text-text-muted mb-8 ani-bottom ani-delay-2">{site.subtitle}</p>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 ani-fade ani-delay-4" style={{ zIndex: 10 }}>
        <div className="w-5 h-8 rounded-full border border-text-muted/50 flex justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-accent" style={{ animation: 'scroll-hint 2s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  )
}
