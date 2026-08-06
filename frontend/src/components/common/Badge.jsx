const VARIANTS = {
  success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:  'bg-amber-50 text-amber-700 border border-amber-200',
  danger:   'bg-red-50 text-red-700 border border-red-200',
  info:     'bg-blue-50 text-blue-700 border border-blue-200',
  neutral:  'bg-slate-100 text-slate-600 border border-slate-200'
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-1
      rounded-full text-[11px] font-bold leading-none tracking-wide
      whitespace-nowrap select-none
      ${VARIANTS[variant] || VARIANTS.neutral}
      ${className}
    `}>
      <span>{children}</span>
    </span>
  )
}