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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt
    }
    return { value: opt, label: opt }
  })

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  const MENU_MAX_HEIGHT = 260

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const openUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow

      setCoords({
        top: openUpward
          ? rect.top + window.scrollY - 6
          : rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 180),
        openUpward
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

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
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
          border bg-white text-sm font-medium text-slate-800
          transition-colors cursor-pointer
          ${isOpen
            ? 'border-emerald-400 ring-2 ring-emerald-200'
            : 'border-slate-200 hover:border-slate-300'
          }
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              transform: coords.openUpward ? 'translateY(-100%)' : 'none',
              zIndex: 99999
            }}
            className="
              bg-white border border-slate-200 rounded-lg
              shadow-lg max-h-[260px] overflow-y-auto p-1.5 space-y-1
              text-sm
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
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-medium
                    transition-colors cursor-pointer
                    ${isSelected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}