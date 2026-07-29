import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const HARI_LABEL = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BULAN_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function DatePicker({ value, onChange, label = 'Waktu Masuk' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse input datetime string (YYYY-MM-THH:mm) into Date object
  const currentDate = value ? new Date(value) : new Date()

  const [viewYear, setViewYear] = useState(currentDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth())

  const [selectedDay, setSelectedDay] = useState(currentDate.getDate())
  const [selectedHour, setSelectedHour] = useState(String(currentDate.getHours()).padStart(2, '0'))
  const [selectedMinute, setSelectedMinute] = useState(String(currentDate.getMinutes()).padStart(2, '0'))

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setSelectedDay(d.getDate())
      setSelectedHour(String(d.getHours()).padStart(2, '0'))
      setSelectedMinute(String(d.getMinutes()).padStart(2, '0'))
    }
  }, [value])

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()

  const handleSelectDay = (day) => {
    setSelectedDay(day)
    updateParentValue(viewYear, viewMonth, day, selectedHour, selectedMinute)
  }

  const handleHourChange = (e) => {
    const h = e.target.value
    setSelectedHour(h)
    updateParentValue(viewYear, viewMonth, selectedDay, h, selectedMinute)
  }

  const handleMinuteChange = (e) => {
    const m = e.target.value
    setSelectedMinute(m)
    updateParentValue(viewYear, viewMonth, selectedDay, selectedHour, m)
  }

  const updateParentValue = (y, m, d, hour, minute) => {
    const pad = (n) => String(n).padStart(2, '0')
    const formatted = `${y}-${pad(m + 1)}-${pad(d)}T${hour}:${minute}`
    onChange(formatted)
  }

  const setNow = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')

    setViewYear(y)
    setViewMonth(m)
    setSelectedDay(d)
    setSelectedHour(h)
    setSelectedMinute(min)
    updateParentValue(y, m, d, h, min)
    setIsOpen(false)
  }

  // Formatted preview display
  const displayFormatted = () => {
    if (!value) return 'Pilih Tanggal & Waktu...'
    const d = new Date(value)
    const dayName = HARI_LABEL[d.getDay()]
    const dateNum = d.getDate()
    const monthName = BULAN_LABEL[d.getMonth()]
    const year = d.getFullYear()
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return `${dayName}, ${dateNum} ${monthName} ${year} — Pukul ${time} WIB`
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
      </label>

      {/* Main Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex-1 flex items-center justify-between px-4 py-3 rounded-xl
            border border-slate-800 bg-slate-950/90 text-sm text-white font-medium
            hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
            transition-all duration-200 cursor-pointer shadow-inner
          "
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate text-xs font-bold text-emerald-300">
              {displayFormatted()}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md shrink-0 ml-2">
            Ubah
          </span>
        </button>

        <button
          type="button"
          onClick={setNow}
          className="
            px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800
            text-emerald-400 font-bold text-xs transition-colors shrink-0 cursor-pointer
          "
          title="Set Ke Waktu Sekarang"
        >
          Sekarang
        </button>
      </div>

      {/* Calendar Popup Dropdown */}
      {isOpen && (
        <div className="absolute z-40 top-full left-0 mt-2 w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl animate-modal-in space-y-4 text-slate-100">
          {/* Header Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold font-display text-white">
              {BULAN_LABEL[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-500 uppercase">
            {HARI_LABEL.map((h) => (
              <div key={h} className="py-1">{h}</div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const isSelected =
                dayNum === selectedDay &&
                viewMonth === currentDate.getMonth() &&
                viewYear === currentDate.getFullYear()

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`
                    py-2 rounded-lg font-bold transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-950/50'
                      : 'hover:bg-slate-800 text-slate-300'
                    }
                  `}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          {/* Time Picker Bar */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300">Jam:</span>
              <select
                value={selectedHour}
                onChange={handleHourChange}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = String(i).padStart(2, '0')
                  return <option key={h} value={h}>{h}</option>
                })}
              </select>
              <span>:</span>
              <select
                value={selectedMinute}
                onChange={handleMinuteChange}
                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono font-bold"
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const m = String(i).padStart(2, '0')
                  return <option key={m} value={m}>{m}</option>
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
