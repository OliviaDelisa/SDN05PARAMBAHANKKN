import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

const AVATAR_COLORS = [
  '#059669', '#0EA5E9', '#F59E0B', '#F43F5E',
  '#8B5CF6', '#14B8A6', '#EC4899', '#6366F1'
]

function getAvatarColor(name) {
  const charCode = name ? name.charCodeAt(0) : 0
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length]
}

export default function SearchAutocomplete({
  items = [],
  onSelect,
  placeholder = 'Cari nama / NIS siswa...',
  displayKey = 'nama',
  subtitleKey = 'nis',
  badgeKey = 'kelas'
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = query.length >= 1
    ? items.filter((item) => {
        const q = query.toLowerCase()
        return (
          item[displayKey]?.toLowerCase().includes(q) ||
          item[subtitleKey]?.toLowerCase().includes(q)
        )
      }).slice(0, 10)
    : []

  useEffect(() => {
    setHighlighted(-1)
  }, [query])

  const handleSelect = (item) => {
    onSelect(item)
    setQuery(item[displayKey] + (item[badgeKey] ? ` - ${item[badgeKey]}` : ''))
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((prev) => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const clearInput = () => {
    setQuery('')
    setIsOpen(false)
    onSelect(null)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-2.5 rounded-lg
            border border-slate-200 bg-white text-sm text-slate-800
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
            transition-colors
          "
        />
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="
            absolute z-30 left-0 right-0 mt-2
            bg-white border border-slate-200 rounded-lg
            shadow-lg max-h-[300px] overflow-y-auto p-1.5 space-y-1
          "
        >
          {filtered.map((item, idx) => {
            const initial = item[displayKey]?.[0]?.toUpperCase() || '?'
            const color = getAvatarColor(item[displayKey])

            return (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => handleSelect(item)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
                  transition-colors duration-150 cursor-pointer
                  ${highlighted === idx ? 'bg-emerald-50 text-slate-900 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700 border border-transparent'}
                `}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">
                    {item[displayKey]}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    NIS: {item[subtitleKey]}
                  </div>
                </div>
                {item[badgeKey] && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    {item[badgeKey]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}