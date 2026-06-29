import type { LinkItem } from '../types'
import LinkCard from './LinkCard'

interface Props {
  links: LinkItem[]
  authed: boolean
}

export default function LinkGrid({ links, authed }: Props) {
  const visible = links.filter(l => !(l.auth || l.rating === 'r18') || authed)

  if (visible.length === 0) {
    return (
      <div className="py-20 text-center text-text-muted ani-fade">
        <div className="text-4xl mb-4">🔍</div>
        <p>没有找到匹配的链接</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {visible.map((link, i) => (
        <LinkCard key={`${link.category}-${link.title}`} link={link} index={i} />
      ))}
    </div>
  )
}
