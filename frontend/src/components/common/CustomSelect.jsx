import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  icon: Icon,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  // Normalize options array: handles array of strings or array of { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt
    }
    return { value: opt, label: opt }
  })

  // Selected option label
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  // Update position relative to window on open / scroll / resize
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 180)
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

  // Close dropdown on outside click or window resize/scroll
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleScrollOrResize() {
      if (isOpen) {
        updatePosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen])

  const handleSelect = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between px-4 py-2.5 rounded-xl
          border bg-slate-950/90 text-xs font-bold text-white
          transition-all duration-200 cursor-pointer shadow-inner
          ${isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 text-white'
            : 'border-slate-800 hover:border-slate-700 text-slate-200'
          }
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Floating Custom Dropdown List Rendered in React Portal to body (never clipped by parent overflow) */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999
            }}
            className="
              bg-slate-900 border border-slate-700 rounded-xl
              shadow-2xl max-h-[260px] overflow-y-auto backdrop-blur-2xl p-1.5 space-y-1
              animate-modal-in text-xs
            "
          >
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value)

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-semibold
                    transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}
