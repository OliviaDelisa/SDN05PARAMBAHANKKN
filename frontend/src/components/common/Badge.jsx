const VARIANTS = {
  success:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  warning:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  danger:   'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  info:     'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  neutral:  'bg-slate-800/80 text-slate-300 border border-slate-700'
}

const DOT_COLORS = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-400'
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const dotColor = DOT_COLORS[variant] || DOT_COLORS.neutral

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1
      rounded-full text-[11px] font-bold leading-none tracking-wide
      whitespace-nowrap select-none shadow-sm
      ${VARIANTS[variant] || VARIANTS.neutral}
      ${className}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{children}</span>
    </span>
  )
}
