export type AgeRating = 'all' | 'r12' | 'r15' | 'r18'

export interface SubCategory {
  id: string
  label: string
}

export interface Category {
  id: string
  label: string
  icon: string
  children?: SubCategory[]
}

export interface LinkItem {
  title: string
  url: string
  description: string
  icon: string
  category: string
  subCategory?: string
  tags?: string[]
  auth?: boolean
  rating?: AgeRating
}
