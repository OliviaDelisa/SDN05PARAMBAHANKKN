import { Inbox } from 'lucide-react'

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'Belum ada data untuk ditampilkan.' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-12 text-center shadow-xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/30">
          <Inbox className="w-8 h-8 opacity-80" />
        </div>
        <p className="text-slate-300 font-bold text-sm">{emptyMessage}</p>
        <p className="text-slate-500 text-xs mt-1">Gunakan tombol tambah di atas untuk memasukkan data baru</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-slate-800/60' : 'hover:bg-slate-800/40'}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-slate-200 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
