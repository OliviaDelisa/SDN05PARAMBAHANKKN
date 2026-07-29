const VARIANTS = {
  default: {
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    border: 'hover:border-emerald-500/40',
    glow: 'from-emerald-500/10 to-transparent'
  },
  warning: {
    iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    border: 'hover:border-rose-500/40',
    glow: 'from-rose-500/10 to-transparent'
  },
  info: {
    iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    border: 'hover:border-sky-500/40',
    glow: 'from-sky-500/10 to-transparent'
  },
  alert: {
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    border: 'hover:border-amber-500/40',
    glow: 'from-amber-500/10 to-transparent'
  }
}

export default function StatCard({ icon: Icon, value, unit, label, variant = 'default', badge }) {
  const v = VARIANTS[variant] || VARIANTS.default

  return (
    <div className={`
      relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/80
      p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 ${v.border}
      group select-none
    `}>
      {/* Background Subtle Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${v.glow} rounded-bl-full pointer-events-none opacity-60`} />

      {badge && (
        <span className="absolute top-3.5 right-3.5 text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${v.iconBg} shadow-inner transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {unit}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-slate-400 mt-1.5 leading-snug">
        {label}
      </p>
    </div>
  )
}
