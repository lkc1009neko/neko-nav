import { useEffect, useRef } from 'react'

const EXPRESSIONS: Record<string, { params: Record<string, number>; msg: string }> = {
  blush:  { params: { Param31: 1 },                                        msg: '有点害羞呢~' },
  angry:  { params: { Param33: 1, ParamBrowLForm: -0.78, ParamBrowRForm: -0.75, ParamMouthForm: -0.57 }, msg: '哼！不理你了' },
  love:   { params: { Param37: 1 },                                        msg: '喜欢你哟~' },
  star:   { params: { Param36: 1 },                                        msg: '好厉害！' },
  cat:    { params: { Param53: 1 },                                        msg: '喵~' },
  crown:  { params: { Param40: 1 },                                        msg: '女王大人驾到' },
  doubt:  { params: { Param34: 1, ParamBrowLForm: 0.65, ParamBrowRForm: 0.62 }, msg: '嗯？怎么了' },
  shock:  { params: { JingYa: -1, ParamBrowLForm: 0.58, ParamBrowRForm: 0.60, ParamMouthForm: -0.55 }, msg: '哇！' },
}

const NEUTRAL: Record<string, number> = {
  Param31: 0, Param33: 0, Param36: 0, Param37: 0, Param34: 0, Param40: 0, Param53: 0, Param44: 0, Param52: 0,
  JingYa: 0, ParamBrowLForm: 0, ParamBrowRForm: 0, ParamMouthForm: 0,
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，还不睡吗'
  if (h < 9) return '早安！新的一天开始了'
  if (h < 12) return '上午好~'
  if (h < 14) return '中午好，吃了吗'
  if (h < 18) return '下午好~'
  if (h < 21) return '傍晚好~'
  return '晚上好~'
}

export default function Mascot() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const wrap = wrapRef.current!
    const bubble = bubbleRef.current!
    const bubbleText = textRef.current!
    const cursor = cursorRef.current!
    const container = canvasContainerRef.current
    if (!wrap || !bubble || !bubbleText || !cursor || !container) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state: any = {}
    state.cm = null
    state.session = 0
    state.typingCancel = 0
    state.activeExp = null
    state.isShowing = false
    state.msgQueue = [] as { msg: string; delay: number }[]
    state.wasDragging = false
    state.longPressFired = false

    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let bubbleTimer: ReturnType<typeof setTimeout> | undefined
    let clickTimer: ReturnType<typeof setTimeout> | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pixiApp: any = null

    function applyParams(params: Record<string, number>) {
      if (!state.cm) return
      for (const [id, val] of Object.entries(params)) {
        try { state.cm.setParameterValueById(id, val) } catch { /* noop */ }
      }
    }

    function clearExpression() { applyParams(NEUTRAL) }

    function pickExpression() {
      const keys = Object.keys(EXPRESSIONS).filter(k => k !== state.activeExp)
      const key = keys[Math.floor(Math.random() * keys.length)]
      state.activeExp = key
      return key
    }

    function getDisplayTime(text: string) { return Math.max(1800, text.length * 100 + 1200) }

    function typeText(text: string, callback?: () => void) {
      let i = 0
      const myTick = ++state.typingCancel
      bubbleText.textContent = ''
      cursor.style.display = 'inline'
      function step() {
        if (myTick !== state.typingCancel) return
        if (i < text.length) {
          bubbleText.textContent += text[i]
          i++
          window.setTimeout(step, 18 + Math.random() * 18)
        } else {
          cursor.style.display = 'none'
          callback?.()
        }
      }
      step()
    }

    function cancelAll() {
      if (bubbleTimer !== undefined) { window.clearTimeout(bubbleTimer); bubbleTimer = undefined }
      ++state.typingCancel
      bubble.classList.remove('show')
      state.isShowing = false
      state.msgQueue = []
    }

    function processQueue() {
      if (state.isShowing || state.msgQueue.length === 0) return
      state.isShowing = true
      const item = state.msgQueue.shift()
      if (!item) { state.isShowing = false; return }
      const { msg, delay } = item
      const mySession = state.session
      window.setTimeout(() => {
        if (mySession !== state.session) return
        if (bubbleTimer !== undefined) window.clearTimeout(bubbleTimer)
        bubble.classList.add('show')
        typeText(msg, () => {
          if (mySession !== state.session) return
          bubbleTimer = window.setTimeout(() => {
            if (mySession !== state.session) return
            bubble.classList.remove('show')
            state.isShowing = false
            clearExpression()
            window.setTimeout(processQueue, 200)
          }, getDisplayTime(msg))
        })
      }, delay)
    }

    function showBubbleDelayed(msg: string, delay: number) {
      state.msgQueue.push({ msg, delay })
      processQueue()
    }

    function updateBubblePosition() {
      const r = wrap.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2

      wrap.classList.remove('bubble-top', 'bubble-bottom', 'bubble-left', 'bubble-right')

      if (cy < vh * 0.4) {
        wrap.classList.add('bubble-bottom')
        wrap.classList.add(cx < vw / 2 ? 'bubble-right' : 'bubble-left')
      } else if (cx > vw * 0.6) {
        wrap.classList.add('bubble-top', 'bubble-left')
      } else if (cx < vw * 0.2) {
        wrap.classList.add('bubble-top', 'bubble-right')
      } else {
        wrap.classList.add('bubble-top', 'bubble-right')
      }
    }

    function showBubbleNow(msg: string, expressionKey?: string) {
      state.session++
      cancelAll()
      clearExpression()
      updateBubblePosition()
      if (expressionKey && EXPRESSIONS[expressionKey]) {
        state.activeExp = expressionKey
        applyParams(EXPRESSIONS[expressionKey].params)
      }
      const mySession = state.session
      window.setTimeout(() => {
        if (mySession !== state.session) return
        bubble.classList.add('show')
        typeText(msg, () => {
          if (mySession !== state.session) return
          if (bubbleTimer !== undefined) window.clearTimeout(bubbleTimer)
          bubbleTimer = window.setTimeout(() => {
            if (mySession !== state.session) return
            bubble.classList.remove('show')
            clearExpression()
          }, getDisplayTime(msg))
        })
      }, 200)
    }

    function resetIdleTimer() {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        const msgs = ['(。-ω-)zzz', '你好呀！', '今天也要加油哦！']
        showBubbleDelayed(msgs[Math.floor(Math.random() * msgs.length)], 0)
        resetIdleTimer()
      }, 25000)
    }

    // ── Click ──
    wrap.addEventListener('click', (e: MouseEvent) => {
      if (e.button !== 0 || state.wasDragging || state.longPressFired) return
      if (clickTimer !== undefined) {
        window.clearTimeout(clickTimer)
        clickTimer = undefined
        showBubbleNow('(。-ω-)zzz')
        return
      }
      clickTimer = window.setTimeout(() => {
        clickTimer = undefined
        const expKey = pickExpression()
        if (expKey && EXPRESSIONS[expKey]) {
          showBubbleNow(EXPRESSIONS[expKey].msg, expKey)
        }
        resetIdleTimer()
      }, 250)
    })

    // ── Drag ──
    let dragging = false
    let sx = 0, sy = 0, ox = 0, oy = 0
    function ds(cx: number, cy: number) {
      dragging = true; state.wasDragging = false; state.longPressFired = false
      if (longPressTimer !== undefined) { window.clearTimeout(longPressTimer); longPressTimer = undefined }
      sx = cx; sy = cy
      const r = wrap.getBoundingClientRect(); ox = r.left; oy = r.top
    }
    function dm(cx: number, cy: number) {
      if (!dragging) return
      state.wasDragging = true
      if (longPressTimer !== undefined) { window.clearTimeout(longPressTimer); longPressTimer = undefined }
      wrap.style.right = 'auto'; wrap.style.bottom = 'auto'
      wrap.style.left = (ox + cx - sx) + 'px'; wrap.style.top = (oy + cy - sy) + 'px'
    }
    function de() {
      if (!dragging) return; dragging = false
      if (longPressTimer !== undefined) { window.clearTimeout(longPressTimer); longPressTimer = undefined }
      try { localStorage.setItem('mascot-pos', JSON.stringify({ x: parseInt(wrap.style.left), y: parseInt(wrap.style.top) })) } catch { /* noop */ }
      updateBubblePosition()
      if (state.wasDragging) {
        const r = wrap.getBoundingClientRect()
        const vh = window.innerHeight, vw = window.innerWidth
        const cy = r.top + r.height / 2, cx = r.left + r.width / 2
        if (cy < vh * 0.15) showBubbleDelayed('要走了吗？不送~', 300)
        else if (cy > vh * 0.85) showBubbleDelayed('蹲在角落里舒服~', 300)
        else if (cx < vw * 0.1) showBubbleDelayed('藏在边边偷偷看你~', 300)
        else if (cx > vw * 0.85) showBubbleDelayed('这边视野不错~', 300)
        else showBubbleDelayed(['就放这里吧', '嗯，这个位置挺好', '这里也不错~'][Math.floor(Math.random() * 3)], 300)
      }
    }

    // ── Long press ──
    let longPressTimer: ReturnType<typeof setTimeout> | undefined
    function startLongPress() {
      if (longPressTimer !== undefined) window.clearTimeout(longPressTimer)
      state.longPressFired = false
      longPressTimer = window.setTimeout(() => {
        state.longPressFired = true
        showBubbleNow('🌸 Neko Nav · 次元导航，发现热爱')
      }, 800)
    }

    wrap.addEventListener('mousedown', (e) => { ds(e.clientX, e.clientY); startLongPress() })
    document.addEventListener('mousemove', (e) => dm(e.clientX, e.clientY))
    document.addEventListener('mouseup', de)
    wrap.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { ds(e.touches[0].clientX, e.touches[0].clientY); startLongPress() } }, { passive: true })
    document.addEventListener('touchmove', (e) => { if (e.touches.length) dm(e.touches[0].clientX, e.touches[0].clientY) }, { passive: true })
    document.addEventListener('touchend', de)

    // ── Saved position ──
    try {
      const s = localStorage.getItem('mascot-pos')
      if (s) {
        const { x, y } = JSON.parse(s)
        wrap.style.right = 'auto'; wrap.style.bottom = 'auto'
        wrap.style.left = x + 'px'; wrap.style.top = y + 'px'
      }
    } catch { /* noop */ }
    updateBubblePosition()

    // ── Resize / Scroll ──
    window.addEventListener('resize', updateBubblePosition)
    window.addEventListener('scroll', updateBubblePosition, { passive: true })

    // ── Visibility ──
    const onVisibility = () => {
      if (!document.hidden) {
        const backMsgs = ['欢迎回来~', '你回来啦！', '等你好久了~']
        showBubbleNow(backMsgs[Math.floor(Math.random() * backMsgs.length)])
        resetIdleTimer()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ── Copy ──
    const onCopy = () => showBubbleDelayed('复制了什么好东西？', 500)
    document.addEventListener('copy', onCopy)

    // ── Init Bubble ──
    window.setTimeout(() => {
      showBubbleDelayed(getTimeGreeting(), 0)
      window.setTimeout(() => showBubbleDelayed('欢迎来到 Neko Nav~', 300), 300)
    }, 200)
    resetIdleTimer()

    // ── Live2D ──
    let cancelled = false
    const PIXI = (window as any).PIXI
    if (PIXI?.live2d) {
      ;(async () => {
        try {
          const app = new PIXI.Application({
            width: 180, height: 260, backgroundAlpha: 0,
            antialias: true, preserveDrawingBuffer: true,
          })

          if (!canvasContainerRef.current || cancelled) return
          if (!app.stage || !app.view) return

          canvasContainerRef.current.appendChild(app.view as HTMLCanvasElement)
          pixiApp = app

          const model = await PIXI.live2d.Live2DModel.from(
            '/IceGirl_Live2d/IceGIrl Live2D/IceGirl.model3.json'
          )
          if (!model || cancelled) return
          model.anchor.set(0.5, 0.5)
          model.position.set(90, 130)
          model.scale.set(0.04)
          app.stage.addChild(model)

          state.cm = model.internalModel.coreModel
          let bt = 0, blink = false

          app.ticker.add(() => {
            if (!state.cm) return
            const t = app.ticker.lastTime / 1000
            bt += app.ticker.deltaMS
            try {
              state.cm.setParameterValueById('ParamBreath', Math.sin(t * 2) * 0.5 + 0.5)
              if (!blink && bt > 3500) {
                blink = true
                state.cm.setParameterValueById('ParamEyeLOpen', 0)
                state.cm.setParameterValueById('ParamEyeROpen', 0)
                window.setTimeout(() => {
                  try {
                    state.cm.setParameterValueById('ParamEyeLOpen', 1)
                    state.cm.setParameterValueById('ParamEyeROpen', 1)
                  } catch {}
                  blink = false; bt = 0
                }, 150)
              }
            } catch {}
          })
        } catch (e) {
          console.warn('[Mascot] Live2D init failed:', e)
        }
      })()
    } else {
      console.warn('[Mascot] PIXI.live2d not available')
    }

    return () => {
      cancelled = true
      if (idleTimer !== undefined) window.clearTimeout(idleTimer)
      if (bubbleTimer !== undefined) window.clearTimeout(bubbleTimer)
      if (clickTimer !== undefined) window.clearTimeout(clickTimer)
      if (longPressTimer !== undefined) window.clearTimeout(longPressTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('copy', onCopy)
      window.removeEventListener('resize', updateBubblePosition)
      window.removeEventListener('scroll', updateBubblePosition)
      if (pixiApp) {
        try { pixiApp.destroy(true) } catch {}
      }
    }
  }, [])

  return (
    <div ref={wrapRef} className="mascot-wrap">
      <div ref={bubbleRef} className="mascot-bubble">
        <span className="bubble-tail" />
        <span ref={textRef} className="bubble-text" />
        <span ref={cursorRef} className="typing-cursor">|</span>
      </div>
      <div className="mascot-body">
        <div ref={canvasContainerRef} className="mascot-canvas" />
      </div>

      <style>{`
        .mascot-wrap {
          position: fixed; bottom: 1rem; right: 1rem; z-index: 100;
          cursor: grab; user-select: none; -webkit-user-select: none;
          width: 180px; height: 260px;
          opacity: 0;
          animation: mascot-fade-in 0.35s ease forwards;
        }
        @keyframes mascot-fade-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) { .mascot-wrap { display: none; } }
        .mascot-wrap:active { cursor: grabbing; }

        .mascot-wrap.bubble-top .mascot-bubble { bottom: calc(100% + 0.75rem); top: auto; }
        .mascot-wrap.bubble-bottom .mascot-bubble { top: calc(100% + 0.75rem); bottom: auto; }
        .mascot-wrap.bubble-left .mascot-bubble { left: -0.5rem; right: auto; }
        .mascot-wrap.bubble-right .mascot-bubble { right: -0.5rem; left: auto; }
        .mascot-wrap.bubble-bottom .bubble-tail { top: -6px; bottom: auto; border-right: 1px solid var(--color-accent); border-bottom: none; border-top: 1px solid var(--color-accent-2); border-left: none; border-radius: 3px 0 0 0; }
        .mascot-wrap.bubble-top .bubble-tail { bottom: -6px; top: auto; border-right: 1px solid var(--color-accent); border-bottom: 1px solid var(--color-accent-2); border-radius: 0 0 3px 0; }
        .mascot-wrap.bubble-left .bubble-tail { right: auto; left: 18px; }
        .mascot-wrap.bubble-right .bubble-tail { left: auto; right: 18px; }
        .mascot-wrap.bubble-bottom .mascot-bubble.show { animation: bubble-float-down 4s ease-in-out infinite 1s, border-flow 3s ease-in-out infinite; }

        .mascot-canvas { width: 100%; height: 100%; }
        .mascot-canvas canvas { width: 100% !important; height: 100% !important; display: block; }

        .mascot-bubble {
          position: absolute;
          bottom: calc(100% + 0.75rem);
          right: -0.5rem;
          padding: 0.7rem 1rem;
          min-width: 100px;
          max-width: 180px;
          background: rgba(16,16,26,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 14px;
          font-size: 0.8rem;
          color: var(--color-text-primary);
          line-height: 1.5;
          opacity: 0;
          transform: scale(0.85) translateY(10px);
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.4),
            inset 0 0 0 1px var(--color-accent),
            inset 0 0 0 2px var(--color-accent-2),
            0 0 20px rgba(250,69,140,0.08),
            0 0 40px rgba(0,212,255,0.04);
          z-index: 1;
        }

        @keyframes border-flow {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px var(--color-accent), inset 0 0 0 2px transparent, 0 0 20px rgba(250,69,140,0.08), 0 0 40px rgba(0,212,255,0.04); }
          50% { box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px var(--color-accent-2), inset 0 0 0 2px transparent, 0 0 20px rgba(250,69,140,0.08), 0 0 40px rgba(0,212,255,0.04); }
        }

        .mascot-bubble.show {
          opacity: 1;
          transform: scale(1) translateY(0);
          animation: bubble-float 4s ease-in-out infinite 1s, border-flow 3s ease-in-out infinite;
        }

        .bubble-tail {
          position: absolute;
          bottom: -6px;
          right: 18px;
          width: 12px;
          height: 12px;
          background: rgba(16,16,26,0.92);
          border-right: 1px solid var(--color-accent);
          border-bottom: 1px solid var(--color-accent-2);
          transform: rotate(45deg);
          border-radius: 0 0 3px 0;
          z-index: -1;
        }

        .mascot-bubble.show .bubble-tail {
          animation: tail-glow 3s ease-in-out infinite;
        }

        @keyframes tail-glow {
          0%, 100% { border-color: var(--color-accent) var(--color-accent-2); }
          50% { border-color: var(--color-accent-2) var(--color-accent); }
        }

        @keyframes bubble-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes bubble-float-down {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        .typing-cursor {
          display: none;
          color: var(--color-accent);
          font-weight: 700;
          animation: cursor-blink 0.7s step-end infinite;
          margin-left: 1px;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
