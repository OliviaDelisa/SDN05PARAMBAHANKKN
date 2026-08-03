import { Link } from 'react-router-dom'
import {
  Users,
  BedDouble,
  AlertTriangle,
  ClipboardPlus,
  ArrowRight,
  UserCheck,
  Inbox
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import { kunjunganList, siswaList } from '../data/mockData'
import { formatWaktu, getInitials, getInitialColor } from '../utils/formatters'

export default function Dashboard() {
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

  // Latest 5 visits
  const recentVisits = [...kunjunganList].slice(0, 5)

  // Tren kunjungan 7 hari terakhir
  const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const label = date.toLocaleDateString('id-ID', { weekday: 'short' })
    const total = kunjunganList.filter((k) => k.waktu_masuk?.startsWith(dateStr)).length
    return { name: label, total }
  })

  // Kunjungan berdasarkan kelas
  const kelasCount = {}
  kunjunganList.forEach((k) => {
    if (k.kelas) {
      kelasCount[k.kelas] = (kelasCount[k.kelas] || 0) + 1
    }
  })

  const kelasOrder = ['I', 'II', 'III', 'IV', 'V', 'VI']
  const kelasData = Object.entries(kelasCount)
    .map(([kelas, total]) => ({ name: kelas, total }))
    .sort((a, b) => {
      const ia = kelasOrder.indexOf(a.name)
      const ib = kelasOrder.indexOf(b.name)
      if (ia === -1 || ib === -1) return a.name.localeCompare(b.name)
      return ia - ib
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
            <ClipboardPlus className="w-4 h-4" />
            <span>Kunjungan Baru</span>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Chart Column */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                5 Keluhan Terbanyak Bulan Ini
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tren penyakit / keluhan teratas siswa
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
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
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
                              {visit.keluhan_utama} {visit.is_darurat && <span className="text-red-600 font-semibold">· Darurat</span>}
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
                  <p className="text-xs">Belum ada kunjungan siswa hari ini</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tren Kunjungan & Kunjungan per Kelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

          {/* Kunjungan Berdasarkan Kelas */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Kunjungan Berdasarkan Kelas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Jumlah kunjungan UKS per tingkat kelas
              </p>
            </div>

            <div className="h-[220px] w-full flex items-center justify-center">
              {kelasData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kelasData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(14,165,233,0.06)' }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        color: '#1E293B',
                        fontSize: '12px'
                      }}
                      formatter={(val) => [`${val} siswa`, 'Kunjungan']}
                    />
                    <Bar dataKey="total" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Belum ada data kunjungan per kelas</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}