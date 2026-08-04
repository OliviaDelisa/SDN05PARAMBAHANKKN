import { useState } from 'react'
import { Search, X } from 'lucide-react'

export default function TagSelector({ options, selected = [], onChange, multiple = true }) {
  const [query, setQuery] = useState('')

  const handleToggle = (value) => {
    if (multiple) {
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
      onChange(next)
    } else {
      onChange(selected.includes(value) ? [] : [value])
    }
  }

  const q = query.trim().toLowerCase()
  const filteredOptions = q
    ? options.filter((opt) => opt.toLowerCase().includes(q))
    : options

  const selectedOptions = options.filter((opt) => selected.includes(opt))
  const unselectedFiltered = filteredOptions.filter((opt) => !selected.includes(opt))

  const tagClass = (isSelected) => `
    w-full px-3.5 py-2 rounded-lg text-xs font-medium text-center
    border transition-colors select-none cursor-pointer truncate
    ${isSelected
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }
  `

  return (
    <div className="space-y-2.5">
      {options.length > 8 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari..."
            className="
              w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200
              bg-white text-xs text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
            "
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pb-2.5 border-b border-slate-100">
          {selectedOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              className={tagClass(true)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {unselectedFiltered.length > 0 ? (
          unselectedFiltered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              className={tagClass(false)}
            >
              {option}
            </button>
          ))
        ) : (
          q && (
            <p className="col-span-full text-xs text-slate-400 italic py-1">
              Tidak ada hasil untuk "{query}"
            </p>
          )
        )}
      </div>
    </div>
  )
}