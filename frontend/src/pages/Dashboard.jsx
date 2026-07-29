import { Link } from 'react-router-dom'
import {
  Users,
  BedDouble,
  AlertTriangle,
  ClipboardPlus,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Sparkles,
  Inbox
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import { kunjunganList, siswaList } from '../data/mockData'
import { getGreeting, formatWaktu, getInitials, getInitialColor } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const greeting = getGreeting()

  // Calculate dashboard stats
  const totalToday = kunjunganList.filter((k) => {
    const todayStr = new Date().toISOString().split('T')[0]
    return k.waktu_masuk?.startsWith(todayStr)
  }).length

  const totalIstirahat = kunjunganList.filter((k) => k.status === 'Istirahat di UKS').length
  const totalDarurat = kunjunganList.filter((k) => k.is_darurat).length
  const totalSiswa = siswaList.length

  // Top 5 Keluhan data for chart
  const keluhanCount = {}
  kunjunganList.forEach((k) => {
    if (k.keluhan_utama) {
      keluhanCount[k.keluhan_utama] = (keluhanCount[k.keluhan_utama] || 0) + 1
    }
  })

  const chartData = Object.entries(keluhanCount)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const BAR_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899']

  // Latest 5 visits
  const recentVisits = [...kunjunganList].slice(0, 5)

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
    <div className="space-y-8">
      <PageHeader title="Dashboard Utama">
        <Link
          to="/pendaftaran"
          className="
            inline-flex items-center gap-2 px-5 py-3 rounded-xl
            bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
            text-white font-extrabold text-xs tracking-wide uppercase
            shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/80 transition-all duration-200 no-underline cursor-pointer
            border border-emerald-400/30
          "
        >
          <ClipboardPlus className="w-4 h-4" />
          <span>Kunjungan Baru</span>
        </Link>
      </PageHeader>

      {/* Hero Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem UKS Digital SDN 05 Parambahan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white leading-tight tracking-tight">
              {greeting}, {user?.nama_lengkap || 'Petugas UKS'} 👋
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              Sistem telah siap digunakan. Mulai daftarkan data siswa dan catat kunjungan sakit pertama hari ini.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              to="/pendaftaran"
              className="
                px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400
                text-white font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition-all duration-200
                flex items-center gap-2.5 no-underline border border-emerald-400/30 cursor-pointer
              "
            >
              <span>+ Catat Siswa Sakit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          value={totalToday}
          unit="siswa"
          label="Kunjungan Hari Ini"
          variant="default"
        />
        <StatCard
          icon={BedDouble}
          value={totalIstirahat}
          unit="siswa"
          label="Sedang Istirahat di UKS"
          variant="alert"
        />
        <StatCard
          icon={AlertTriangle}
          value={totalDarurat}
          unit="kasus"
          label="Kasus Darurat Bulan Ini"
          variant="warning"
          badge={totalDarurat > 0 ? 'Perhatian' : undefined}
        />
        <StatCard
          icon={UserCheck}
          value={totalSiswa}
          unit="siswa"
          label="Total Siswa Terdaftar"
          variant="info"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-white">
                5 Keluhan Terbanyak Bulan Ini
              </h3>
              <p className="text-xs text-slate-400">Statistik tren penyakit/keluhan teratas siswa</p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </span>
          </div>

          <div className="h-[280px] w-full pt-2 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val} siswa`, 'Jumlah']}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 mx-auto opacity-30 text-emerald-400" />
                <p className="text-xs">Belum ada data keluhan tercatat bulan ini</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Column (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold font-display text-white">
                Aktivitas Terkini
              </h3>
              <Link
                to="/riwayat"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 no-underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentVisits.length > 0 ? (
              <div className="space-y-3">
                {recentVisits.map((visit) => {
                  const color = getInitialColor(visit.siswa_nama)
                  const initial = getInitials(visit.siswa_nama)

                  return (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-md"
                          style={{ backgroundColor: color }}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white truncate">
                              {visit.siswa_nama}
                            </p>
                            <span className="text-[11px] text-slate-400 font-mono">({visit.kelas})</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {visit.keluhan_utama} {visit.is_darurat && <span className="text-rose-400 font-extrabold">· DARURAT</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <Badge variant={getStatusVariant(visit.status)}>
                          {visit.status}
                        </Badge>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          {formatWaktu(visit.waktu_masuk)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 mx-auto opacity-30 text-emerald-400" />
                <p className="text-xs">Belum ada kunjungan siswa hari ini</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <Link
              to="/pendaftaran"
              className="
                w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800
                text-slate-200 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 no-underline border border-slate-700
              "
            >
              <ClipboardPlus className="w-4 h-4 text-emerald-400" />
              <span>Input Kunjungan Baru</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
