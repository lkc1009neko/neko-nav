import { useMemo } from 'react'
import type { LinkItem } from '../types'

export function useFilteredLinks(links: LinkItem[], searchQuery: string, activeCategory: string, activeSubCategory: string | null) {
  return useMemo(() => {
    let filtered = links

    if (activeCategory !== 'all') {
      filtered = filtered.filter(l => l.category === activeCategory)
    }

    if (activeSubCategory) {
      filtered = filtered.filter(l => l.subCategory === activeSubCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(l => {
        if (l.title.toLowerCase().includes(q)) return true
        if (l.description.toLowerCase().includes(q)) return true
        if (l.category.toLowerCase().includes(q)) return true
        if (l.tags?.some(t => t.toLowerCase().includes(q))) return true
        return false
      })
    }

    return filtered
  }, [links, searchQuery, activeCategory, activeSubCategory])
}
