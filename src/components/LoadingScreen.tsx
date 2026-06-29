import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'hidden'>('show')

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fade'), 700)
    const hideTimer = setTimeout(() => setPhase('hidden'), 1500)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#0a0a0f',
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}
    >
      <div className="text-center">
        <img src="/favicon.png" alt="Neko Nav" className="w-12 h-12 mx-auto mb-4" />
        <div className="text-accent text-lg font-bold tracking-widest">NEKO NAV</div>
        <div className="mt-4 flex gap-1.5 justify-center">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
