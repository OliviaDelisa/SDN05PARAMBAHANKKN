export default function TagSelector({ options, selected = [], onChange, multiple = true }) {
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

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-semibold
              border transition-all duration-200 select-none cursor-pointer
              active:scale-95
              ${isSelected
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40 shadow-lg shadow-emerald-950/50'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
              }
            `}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
