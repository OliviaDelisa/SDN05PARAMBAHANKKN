import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Inbox,
  Plus
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { formatWaktu, getInitials, getInitialColor } from '../utils/formatters'
import { useData } from '../context/DataContext'

export default function Dashboard() {
  const { siswaList = [], kunjunganList = [] } = useData()

  const [selectedVisit, setSelectedVisit] = useState(null)

  // Metric computations
  const totalSiswa = siswaList.length
  const totalKunjungan = kunjunganList.length
  const totalDarurat = kunjunganList.filter((k) => k.is_darurat).length
  const totalKembali = kunjunganList.filter((k) => k.status === 'Kembali ke Kelas').length

  const recentVisits = kunjunganList.slice(0, 5)

  // Top 5 keluhan bulan ini
  const keluhanMap = {}
  kunjunganList.forEach((k) => {
    if (k.keluhan_utama) {
      k.keluhan_utama.split(',').forEach((raw) => {
        const keluhan = raw.trim()
        if (keluhan) keluhanMap[keluhan] = (keluhanMap[keluhan] || 0) + 1
      })
    }
  })

  const chartData = Object.entries(keluhanMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Tren kunjungan 7 hari terakhir
  const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const label = date.toLocaleDateString('id-ID', { weekday: 'short' })
    const total = kunjunganList.filter((k) => k.waktu_masuk?.startsWith(dateStr)).length
    return { name: label, total }
  })

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Kembali ke Kelas': return 'success'
      case 'Istirahat di UKS': return 'warning'
      case 'Dijemput Wali': return 'info'
      case 'Dirujuk ke Klinik': return 'danger'
      default: return 'neutral'
    }
  }

  return (
    <div className="space-y-6">

      {/* Aksi Cepat */}
      <div className="flex justify-end">
        <Link
          to="/pendaftaran"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition no-underline"
        >
          <Plus className="w-4 h-4" />
          <span>Kunjungan Baru</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          value={totalSiswa}
          unit="siswa"
          label="Total Siswa Terdaftar"
          variant="default"
        />
        <StatCard
          icon={Activity}
          value={totalKunjungan}
          unit="kunjungan"
          label="Total Rekam Kunjungan"
          variant="info"
        />
        <StatCard
          icon={AlertTriangle}
          value={totalDarurat}
          unit="kasus"
          label="Kasus Darurat"
          variant="warning"
        />
        <StatCard
          icon={CheckCircle2}
          value={totalKembali}
          unit="siswa"
          label="Kembali ke Kelas"
          variant="success"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart Column */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              5 Keluhan Terbanyak Bulan Ini
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Statistik keluhan kesehatan siswa yang paling sering tercatat
            </p>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      color: '#1E293B',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val} siswa`, 'Jumlah']}
                  />
                  <Bar dataKey="total" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Belum ada data keluhan tercatat bulan ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Column */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Aktivitas Terkini
              </h3>
              <Link
                to="/riwayat"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 no-underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentVisits.length > 0 ? (
              <div className="space-y-2.5">
                {recentVisits.map((visit) => {
                  const color = getInitialColor(visit.siswa_nama)
                  const initial = getInitials(visit.siswa_nama)

                  return (
                    <div
                      key={visit.id}
                      onClick={() => setSelectedVisit(visit)}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {visit.siswa_nama}
                            </p>
                            <span className="text-[11px] text-slate-400">({visit.kelas})</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {visit.keluhan_utama}
                            {visit.is_darurat && <span className="text-red-600 font-semibold"> · Darurat</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <Badge variant={getStatusVariant(visit.status)}>
                          {visit.status}
                        </Badge>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatWaktu(visit.waktu_masuk)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Belum ada kunjungan siswa tercatat</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tren Kunjungan Mingguan */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Tren Kunjungan 7 Hari Terakhir
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Jumlah siswa yang berkunjung ke UKS per hari
          </p>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  color: '#1E293B',
                  fontSize: '12px'
                }}
                formatter={(val) => [`${val} siswa`, 'Kunjungan']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Detail Modal */}
      <Modal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title="Detail Kunjungan Siswa"
        size="sm"
      >
        {selectedVisit && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: getInitialColor(selectedVisit.siswa_nama) }}
              >
                {getInitials(selectedVisit.siswa_nama)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedVisit.siswa_nama}</h4>
                <p className="text-[11px] text-slate-500">
                  NIS: {selectedVisit.siswa_nis} · Kelas {selectedVisit.kelas}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500 font-medium">Keluhan Utama:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedVisit.keluhan_utama}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tindakan:</span>
                <p className="text-slate-700 mt-0.5">{selectedVisit.tindakan || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Status Penanganan:</span>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(selectedVisit.status)}>
                    {selectedVisit.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}