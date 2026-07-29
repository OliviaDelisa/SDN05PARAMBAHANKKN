import { CalendarDays, Sparkles } from 'lucide-react'

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function formatTanggalHariIni() {
  const now = new Date()
  return `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`
}

export default function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800/60">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
          <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase font-display">
            SISTEM UKS DIGITAL
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 text-slate-400 text-xs font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatTanggalHariIni()}</span>
        </div>
      </div>
      {children && (
        <div className="shrink-0 flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
