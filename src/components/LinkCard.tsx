import { useCallback } from 'react'
import type { LinkItem, AgeRating } from '../types'

interface Props {
  link: LinkItem
  index: number
}

const RATING_STYLES: Record<AgeRating, { label: string; color: string; bg: string }> = {
  all: { label: '全龄', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  r12: { label: 'R12', color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  r15: { label: 'R15', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  r18: { label: 'R18', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

export default function LinkCard({ link, index }: Props) {
  const rating = link.rating || 'all'
  const rs = RATING_STYLES[rating]
  const isProxy = link.url.startsWith('/api/proxy/')

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    if (!isProxy) return
    e.preventDefault()
    try {
      const res = await fetch(link.url)
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = null }
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener')
      }
    } catch {}
  }, [link.url, isProxy])

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group relative block rounded-xl border border-border bg-bg-card/60 backdrop-blur-sm p-4 transition-all duration-300"
      style={{
        animation: 'float-bottom 0.6s ease both',
        animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-accent)'
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(250,69,140,0.25), 0 8px 32px rgba(0,0,0,0.3)'
        e.currentTarget.style.background = 'rgba(20,20,31,0.9)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.background = ''
      }}
    >
      {link.auth && (
        <span className="absolute top-2 right-2 text-[10px] opacity-60">🔒</span>
      )}
      <div className="flex items-start gap-3">
        {link.icon.startsWith('http')
          ? <img src={link.icon} alt="" className="w-5 h-5 rounded flex-shrink-0 mt-1" />
          : <span className="text-xl flex-shrink-0 mt-0.5">{link.icon}</span>
        }
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors">
              {link.title}
            </h3>
            <span className="text-[10px] text-text-muted/40 flex-shrink-0">↗</span>
            {link.rating && link.rating !== 'all' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none"
                style={{ color: rs.color, background: rs.bg }}
              >
                {rs.label}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1 line-clamp-1 leading-relaxed">{link.description}</p>
          {link.tags && link.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {link.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full text-accent" style={{ background: 'var(--color-accent-dim)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
