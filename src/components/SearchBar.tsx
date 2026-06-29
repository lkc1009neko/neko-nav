import { useRef } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="搜索链接..."
        className="w-full h-10 pl-9 pr-8 rounded-lg text-sm text-text-primary bg-bg-card border border-border outline-none transition-all duration-200 placeholder:text-text-muted/50 focus:border-accent focus:shadow-[0_0_8px_rgba(250,69,140,0.3)]"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  )
}
