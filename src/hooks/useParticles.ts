import { useEffect, useRef } from 'react'

const COLORS = [
  'rgba(250, 69, 140, ALPHA)',
  'rgba(250, 69, 140, ALPHA)',
  'rgba(236, 236, 236, ALPHA)',
]

interface Particle {
  x: number
  y: number
  r: number
  dx: number
  dy: number
  alpha: number
  phase: number
  color: string
}

export function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const animRef = useRef<number>(0)
  const runningRef = useRef(true)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement!

    function resize() {
      const r = parent.getBoundingClientRect()
      canvas!.width = r.width * devicePixelRatio
      canvas!.height = r.height * devicePixelRatio
      ctx!.scale(devicePixelRatio, devicePixelRatio)
      canvas!.style.width = r.width + 'px'
      canvas!.style.height = r.height + 'px'
    }

    function createParticles() {
      const w = parent.getBoundingClientRect().width
      const h = parent.getBoundingClientRect().height
      const count = Math.min(40, Math.floor((w * h) / 25000))
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.5 + Math.random() * 3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3 - 0.08,
        alpha: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }

    function draw() {
      const w = parent.getBoundingClientRect().width
      const h = parent.getBoundingClientRect().height
      ctx!.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        p.x += p.dx
        p.y += p.dy
        p.dy -= 0.001
        p.alpha += (Math.sin(Date.now() * 0.001 + p.phase) * 0.002)

        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) { p.y = h + 10; p.dy = -0.05 - Math.random() * 0.1 }
        if (p.y > h + 10) { p.y = -10; p.dy = 0.05 + Math.random() * 0.1 }

        p.alpha = Math.max(0.1, Math.min(0.7, p.alpha))
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = p.color.replace('ALPHA', p.alpha.toFixed(3))
        ctx!.fill()
      }
    }

    function loop() {
      if (!runningRef.current) return
      draw()
      animRef.current = requestAnimationFrame(loop)
    }

    function onVisibilityChange() {
      if (document.hidden) {
        runningRef.current = false
        cancelAnimationFrame(animRef.current)
      } else {
        runningRef.current = true
        loop()
      }
    }

    let resizeTimer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        createParticles()
      }, 200)
    }

    resize()
    createParticles()
    loop()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', onResize)

    return () => {
      runningRef.current = false
      cancelAnimationFrame(animRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', onResize)
    }
  }, [canvasRef])
}
