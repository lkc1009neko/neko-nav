import { useState, useCallback, useMemo } from 'react'
import LoadingScreen from './components/LoadingScreen'
import BgVideo from './components/BgVideo'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import LinkGrid from './components/LinkGrid'
import Footer from './components/Footer'
import Mascot from './components/Mascot'
import { useFilteredLinks } from './hooks/useFilteredLinks'
import { useAuth } from './hooks/useAuth'
import { links } from './data/links'
import { categories } from './data/categories'

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null)

  const { authed, loading: authLoading, login, logout } = useAuth()

  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = { all: links.length }
    for (const link of links) {
      counts[link.category] = (counts[link.category] || 0) + 1
      if (link.subCategory) {
        counts[link.subCategory] = (counts[link.subCategory] || 0) + 1
      }
    }
    return counts
  }, [links])

  const filtered = useFilteredLinks(links, searchQuery, activeCategory, activeSubCategory)

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id)
  }, [])

  const handleSubCategoryChange = useCallback((id: string | null) => {
    setActiveSubCategory(id)
  }, [])

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val)
  }, [])

  return (
    <>
      <LoadingScreen />
      <BgVideo />

      <div
        className="relative z-10 flex h-screen overflow-hidden animate-main-fade-in"
      >
        <Sidebar
          categories={categories}
          linkCounts={linkCounts}
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          searchQuery={searchQuery}
          authed={authed}
          loading={authLoading}
          onLogin={login}
          onLogout={logout}
          onCategoryChange={handleCategoryChange}
          onSubCategoryChange={handleSubCategoryChange}
          onSearchChange={handleSearchChange}
        />

        <main className="flex-1 overflow-y-auto">
          <Hero />
          <div className="px-4 md:px-8 pb-8">
            <LinkGrid links={filtered} authed={authed} />
            <Footer />
          </div>
        </main>
      </div>

      <Mascot />
    </>
  )
}
