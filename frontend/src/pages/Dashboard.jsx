import { useState, useMemo } from 'react'
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
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { formatWaktu, getInitials, getInitialColor, getStatusVariant, tanggalLokal, getGreeting } from '../utils/formatters'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#F43F5E', '#94A3B8']

const PERIOD_OPTIONS = [
  { value: 'harian', label: 'Hari Ini' },
  { value: 'mingguan', label: 'Minggu Ini' },
  { value: 'bulanan', label: 'Bulan Ini' },
  { value: 'tahunan', label: 'Tahun Ini' },
  { value: 'semua', label: 'Semua' }
]

// Menghitung batas awal tanggal berdasarkan periode yang dipilih
function getPeriodStart(period) {
  const now = new Date()

  switch (period) {
    case 'harian':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'mingguan': {
      const day = now.getDay() // 0 = Minggu
      const diffToMonday = day === 0 ? 6 : day - 1
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday)
      return monday
    }
    case 'bulanan':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'tahunan':
      return new Date(now.getFullYear(), 0, 1)
    default:
      return null // 'semua' -> tidak difilter
  }
}

export default function Dashboard() {
  const { siswaList = [], kunjunganList = [] } = useData()
  const { user } = useAuth()

  const [selectedVisit, setSelectedVisit] = useState(null)
  const [period, setPeriod] = useState('harian')

  // Data kunjungan yang sudah difilter sesuai periode terpilih
  const filteredKunjungan = useMemo(() => {
    const start = getPeriodStart(period)
    if (!start) return kunjunganList

    return kunjunganList.filter((k) => {
      if (!k.waktu_masuk) return false
      const waktu = new Date(k.waktu_masuk)
      return waktu >= start
    })
  }, [kunjunganList, period])

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Semua'

  // Metric computations (mengikuti periode terpilih)
  const totalSiswa = siswaList.length
  const totalKunjungan = filteredKunjungan.length
  const totalDarurat = filteredKunjungan.filter((k) => k.is_darurat).length
  const totalKembali = filteredKunjungan.filter((k) => k.status === 'Kembali ke Kelas').length

  const recentVisits = filteredKunjungan.slice(0, 5)

  // Top 5 keluhan pada periode terpilih
  const keluhanMap = {}
  filteredKunjungan.forEach((k) => {
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

  // Kunjungan per kelas (untuk donut chart) pada periode terpilih
  const kelasMap = {}
  filteredKunjungan.forEach((k) => {
    if (k.kelas) kelasMap[k.kelas] = (kelasMap[k.kelas] || 0) + 1
  })

  const kelasChartData = Object.entries(kelasMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  // Siswa paling sering ke UKS (bar chart) pada periode terpilih
  const siswaFrekuensiMap = {}
  filteredKunjungan.forEach((k) => {
    if (k.siswa_nama) siswaFrekuensiMap[k.siswa_nama] = (siswaFrekuensiMap[k.siswa_nama] || 0) + 1
  })

  const siswaBarData = Object.entries(siswaFrekuensiMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7)

  // Proporsi kunjungan per kelas (donut chart, dalam persentase)
  const kelasPieData = kelasChartData.map((item) => ({
    name: `Kelas ${item.name}`,
    total: item.total
  }))


  // Tren kunjungan 7 hari terakhir (tetap, tidak mengikuti filter periode).
  // Perbandingan tanggal memakai waktu LOKAL — toISOString() menghasilkan UTC,
  // sehingga di WIB (UTC+7) kunjungan sebelum pukul 07.00 akan terhitung
  // masuk ke hari sebelumnya.
  const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = tanggalLokal(date)
    const label = date.toLocaleDateString('id-ID', { weekday: 'short' })
    const total = kunjunganList.filter((k) => {
      if (!k.waktu_masuk) return false
      return tanggalLokal(k.waktu_masuk) === dateStr
    }).length
    return { name: label, total }
  })

  return (
    <div className="space-y-6">

      {/* Sapaan — getGreeting() sudah lama ada di formatters tapi belum dipakai */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {getGreeting()}, {user?.nama_lengkap || 'Dokter Kecil'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Ringkasan kunjungan UKS · {periodLabel}
        </p>
      </div>

      {/* Filter Periode & Aksi Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`
                px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer
                ${period === opt.value
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

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
          label={`Kunjungan (${periodLabel})`}
          variant="info"
        />
        <StatCard
          icon={AlertTriangle}
          value={totalDarurat}
          unit="kasus"
          label={`Kasus Darurat (${periodLabel})`}
          variant="warning"
        />
        <StatCard
          icon={CheckCircle2}
          value={totalKembali}
          unit="siswa"
          label={`Kembali ke Kelas (${periodLabel})`}
          variant="success"
        />
      </div>

      {/* Keluhan Terbanyak, Kunjungan per Kelas, & Proporsi Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              5 Keluhan Terbanyak
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: {periodLabel}
            </p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
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
                <p className="text-xs">Belum ada data keluhan pada periode ini</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Siswa Paling Sering ke UKS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: {periodLabel}
            </p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center">
            {siswaBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siswaBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      color: '#1E293B',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val} kunjungan`, 'Jumlah']}
                  />
                  <Bar dataKey="total" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Belum ada data kunjungan siswa pada periode ini</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Proporsi Kunjungan per Kelas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: {periodLabel}
            </p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center">
            {kelasPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kelasPieData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    label={({ total }) =>
                      totalKunjungan > 0 ? `${Math.round((total / totalKunjungan) * 100)}%` : ''
                    }
                    labelLine={false}
                  >
                    {kelasPieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      color: '#1E293B',
                      fontSize: '12px'
                    }}
                    formatter={(val, name) => [
                      `${val} kunjungan (${totalKunjungan > 0 ? Math.round((val / totalKunjungan) * 100) : 0}%)`,
                      name
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Belum ada data kunjungan pada periode ini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tren Mingguan & Aktivitas Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Tren Kunjungan 7 Hari Terakhir
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Jumlah siswa yang berkunjung ke UKS per hari
            </p>
          </div>

          <div className="h-[260px] w-full">
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
                <p className="text-xs">Belum ada kunjungan siswa tercatat pada periode ini</p>
              </div>
            )}
          </div>
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