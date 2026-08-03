const VARIANTS = {
  default: {
    iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600'
  },
  warning: {
    iconBg: 'bg-red-50 border-red-100 text-red-600'
  },
  info: {
    iconBg: 'bg-sky-50 border-sky-100 text-sky-600'
  },
  alert: {
    iconBg: 'bg-amber-50 border-amber-100 text-amber-600'
  }
}

export default function StatCard({ icon: Icon, value, unit, label, variant = 'default', badge }) {
  const v = VARIANTS[variant] || VARIANTS.default

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 p-5 transition hover:shadow-sm select-none">

      {badge && (
        <span className="absolute top-3.5 right-3.5 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${v.iconBg}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {unit}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-slate-500 mt-1.5 leading-snug">
        {label}
      </p>
    </div>
  )
}