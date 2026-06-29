import { useState } from 'react'
import SearchBar from './SearchBar'
import CategoryList from './CategoryList'
import type { Category } from '../types'
import { site } from '../config/site'

interface Props {
  categories: Category[]
  linkCounts: Record<string, number>
  activeCategory: string
  activeSubCategory: string | null
  searchQuery: string
  authed: boolean
  loading: boolean
  onLogin: () => void
  onLogout: () => void
  onCategoryChange: (id: string) => void
  onSubCategoryChange: (id: string | null) => void
  onSearchChange: (val: string) => void
}

export default function Sidebar({ categories, linkCounts, activeCategory, activeSubCategory, searchQuery, authed, loading, onLogin, onLogout, onCategoryChange, onSubCategoryChange, onSearchChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-8 pb-6">
        <div className="text-center mb-6">
          <img src="/favicon.png" alt="Neko Nav" className="w-9 h-9 mx-auto mb-2" />
          <div
            className="text-base font-black tracking-widest"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), #ff8eb5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {site.title}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">{site.subtitle}</div>
        </div>
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <CategoryList
          categories={categories}
          linkCounts={linkCounts}
          active={activeCategory}
          activeSub={activeSubCategory}
          onChange={onCategoryChange}
          onSubChange={id => { onSubCategoryChange(id); setMobileOpen(false) }}
        />
      </div>

      <div className="border-t border-border px-4 py-3">
        {!loading && (
          authed ? (
            <button
              onClick={onLogout}
              className="w-full text-xs text-text-muted hover:text-accent transition-colors text-center cursor-pointer"
            >
              🔓 已解锁 · 退出
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full text-xs text-text-muted hover:text-accent transition-colors text-center cursor-pointer"
            >
              🔒 解锁隐私链接及 R18 内容
            </button>
          )
        )}
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-bg-sidebar border border-border text-text-primary cursor-pointer"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <aside className="hidden md:flex w-[260px] flex-shrink-0 h-screen bg-bg-sidebar border-r border-border overflow-hidden">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <aside
            className="w-[260px] h-full bg-bg-sidebar border-r border-border overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'float-left 0.25s ease both' }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
