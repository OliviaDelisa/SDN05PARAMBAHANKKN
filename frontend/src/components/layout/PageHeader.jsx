export default function PageHeader({ title, children }) {
  return (
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>
      {children && (
        <div className="shrink-0 flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}