import type { Category } from '../types'

interface Props {
  categories: Category[]
  linkCounts: Record<string, number>
  active: string
  activeSub: string | null
  onChange: (id: string) => void
  onSubChange: (id: string | null) => void
}

export default function CategoryList({ categories, linkCounts, active, activeSub, onChange, onSubChange }: Props) {
  function handleParent(cat: Category) {
    onSubChange(null)
    onChange(cat.id)
  }

  function handleSub(catId: string, subId: string) {
    onChange(catId)
    onSubChange(subId)
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {categories.map(cat => {
        const isParentActive = active === cat.id && !activeSub
        const isParentHighlight = active === cat.id
        const hasChildren = cat.children && cat.children.length > 0
        const count = linkCounts[cat.id]

        return (
          <div key={cat.id}>
            <button
              onClick={() => handleParent(cat)}
              className="group relative flex items-center w-full px-4 py-2.5 text-sm rounded-lg text-left transition-all duration-200 cursor-pointer"
              style={{
                color: isParentActive ? 'var(--color-accent)' : isParentHighlight ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: isParentHighlight ? 'var(--color-accent-dim)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!isParentHighlight) e.currentTarget.style.background = 'rgba(250,69,140,0.06)'
              }}
              onMouseLeave={e => {
                if (!isParentHighlight) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="flex-shrink-0 text-base" style={{ filter: isParentHighlight ? 'none' : 'grayscale(0.4)' }}>
                {cat.icon}
              </span>
              <span className="font-medium flex-1 text-left">{cat.label}</span>
              {count !== undefined && (
                <span className="text-[10px] text-text-muted/50 ml-auto tabular-nums">{count}</span>
              )}
              {isParentActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-accent" />
              )}
            </button>

            {hasChildren && (active === cat.id || active === 'all') && (
              <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                {cat.children!.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSub(cat.id, sub.id)}
                    className="relative flex items-center w-full px-3 py-1.5 text-xs rounded-md text-left transition-all duration-200 cursor-pointer"
                    style={{
                      color: activeSub === sub.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      background: activeSub === sub.id ? 'var(--color-accent-dim)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (activeSub !== sub.id) e.currentTarget.style.background = 'rgba(250,69,140,0.06)'
                    }}
                    onMouseLeave={e => {
                      if (activeSub !== sub.id) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span className="text-text-muted/40">├</span>
                    <span className="flex-1 text-left">{sub.label}</span>
                    <span className="text-[10px] text-text-muted/50 tabular-nums">{linkCounts[sub.id] || 0}</span>
                    {activeSub === sub.id && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full bg-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
