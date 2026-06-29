import { useEffect, useState } from 'react'

interface Props {
  onDone?: () => void
}

export default function LoadingScreen({ onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: '#0a0a0f',
        animation: 'loading-fade 0.8s ease 0.7s forwards',
      }}
    >
      <div className="text-center">
        <img src="/favicon.png" alt="Neko Nav" className="w-12 h-12 mx-auto mb-4" />
        <div className="text-accent text-lg font-bold tracking-widest">NEKO NAV</div>
        <div className="mt-4 flex gap-1.5 justify-center">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              style={{
                animation: `dot-bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
