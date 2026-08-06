import { Inbox } from 'lucide-react'

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'Belum ada data untuk ditampilkan.' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-8 h-8 opacity-80" />
        </div>
        <p className="text-slate-700 font-bold text-sm">{emptyMessage}</p>
        <p className="text-slate-400 text-xs mt-1">Gunakan tombol tambah di atas untuk memasukkan data baru</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50'}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
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