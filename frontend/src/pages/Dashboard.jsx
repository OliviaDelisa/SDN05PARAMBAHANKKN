import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  PlusCircle,
  FileText,
  Activity,
  Calendar,
  ChevronRight,
  Sparkles,
  Inbox,
  BarChart2,
  HeartPulse
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { getGreeting, formatWaktu, getInitials, getInitialColor } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { siswaList = [], kunjunganList = [] } = useData()

  // Selected visit for quick detail modal
  const [selectedVisit, setSelectedVisit] = useState(null)

  const greeting = getGreeting()
  const namaPetugas = user?.nama_lengkap || 'Petugas UKS'

  // Metric computations
  const totalSiswa = siswaList ? siswaList.length : 0
  const totalKunjungan = kunjunganList ? kunjunganList.length : 0
  const totalDarurat = kunjunganList ? kunjunganList.filter((k) => k.is_darurat).length : 0
  const totalKembali = kunjunganList ? kunjunganList.filter((k) => k.status === 'Kembali ke Kelas').length : 0

  const recentVisits = kunjunganList ? kunjunganList.slice(0, 5) : []

  // Top 5 Keluhan Bulan Ini Computation
  const keluhanMap = {}
  if (kunjunganList && kunjunganList.length > 0) {
    kunjunganList.forEach((k) => {
      if (k.keluhan_utama) {
        const parts = k.keluhan_utama.split(',').map((p) => p.trim())
        parts.forEach((keluhan) => {
          if (keluhan) {
            keluhanMap[keluhan] = (keluhanMap[keluhan] || 0) + 1
          }
        })
      }
    })
  }

  const top5KeluhanData = Object.entries(keluhanMap)
    .map(([name, count]) => ({ name, total: count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const hasKeluhanData = top5KeluhanData.length > 0

  // Palette 5 warna berbeda untuk setiap batang chart
  const BAR_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#F43F5E', '#8B5CF6']

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
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0F223D] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              SDN 05 Parambahan · UKS Digital
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              {greeting}, <span className="text-emerald-400">{namaPetugas}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Selamat bertugas hari ini. Kelola rekam medis dan data kunjungan siswa UKS dengan cepat dan akurat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/pendaftaran"
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-xl
                bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
                text-white font-extrabold text-xs uppercase tracking-wide
                shadow-lg shadow-emerald-950/50 transition-all duration-200 cursor-pointer border border-emerald-400/30
              "
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Kunjungan</span>
            </Link>
            <Link
              to="/siswa"
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-xl
                bg-slate-800 hover:bg-slate-700 text-slate-200
                font-bold text-xs transition-all duration-200 shadow-md border border-slate-700
              "
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Siswa</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Main Grid: Chart 5 Keluhan Terbanyak & Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Area (8 cols): Chart + Recent Visits */}
        <div className="lg:col-span-8 space-y-8">
          {/* CHART: 5 Keluhan Terbanyak Bulan Ini */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold font-display text-white">
                    Chart 5 Keluhan Terbanyak Bulan Ini
                  </h3>
                  <p className="text-xs text-slate-400">
                    Statistik peringkat keluhan kesehatan siswa yang paling sering tercatat
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Chart Graphic Render dengan Warna Beda-Beda */}
            <div className="min-h-[220px] w-full flex items-center justify-center">
              {hasKeluhanData ? (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={top5KeluhanData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#F8FAFC', fontWeight: 700 }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(val) => [`${val} siswa`, 'Jumlah']}
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={22}>
                        {top5KeluhanData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <HeartPulse className="w-8 h-8 opacity-70" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Belum ada data keluhan bulan ini</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Gunakan menu <strong>Pendaftaran Kunjungan</strong> untuk mencatat siswa yang berkunjung ke UKS. Chart keluhan terbanyak akan otomatis muncul di sini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed: Recent Visits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-emerald-400" />
                <span>Aktivitas Kunjungan Terbaru</span>
              </h3>
              <Link
                to="/riwayat"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-2 shadow-xl backdrop-blur-md overflow-hidden">
              {recentVisits.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {recentVisits.map((visit) => {
                    const initial = getInitials(visit.siswa_nama)
                    const color = getInitialColor(visit.siswa_nama)
                    return (
                      <div
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit)}
                        className="p-4 hover:bg-slate-800/50 transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 rounded-xl"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md"
                            style={{ backgroundColor: color }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">
                                {visit.siswa_nama}
                              </h4>
                              {visit.is_darurat && (
                                <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 rounded">
                                  DARURAT
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              Kelas {visit.kelas} · Keluhan: <span className="text-slate-200">{visit.keluhan_utama}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge variant={getStatusVariant(visit.status)}>
                            {visit.status}
                          </Badge>
                          <span className="block text-[11px] text-slate-500 font-mono mt-1">
                            {formatWaktu(visit.waktu_masuk)} WIB
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-500 space-y-3">
                  <Inbox className="w-10 h-10 mx-auto text-emerald-500/30" />
                  <p className="text-xs font-bold text-slate-300">Belum ada kunjungan terbaru hari ini</p>
                  <p className="text-[11px] text-slate-500">Gunakan tombol 'Tambah Kunjungan' di atas untuk mencatat siswa sakit</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area (4 cols): Quick Actions Menu */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Akses Cepat UKS</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5 text-xs font-bold">
              <Link
                to="/pendaftaran"
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Kunjungan Sakit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </Link>

              <Link
                to="/riwayat"
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Riwayat Kunjungan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </Link>

              <Link
                to="/siswa"
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Database Siswa</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </Link>

              <Link
                to="/laporan"
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-200 hover:text-white flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Laporan PDF & Analitik</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </Link>
            </div>
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
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: getInitialColor(selectedVisit.siswa_nama) }}
              >
                {getInitials(selectedVisit.siswa_nama)}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{selectedVisit.siswa_nama}</h4>
                <p className="text-[11px] text-slate-400">NIS: {selectedVisit.siswa_nis} · Kelas {selectedVisit.kelas}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-medium">Keluhan Utama:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedVisit.keluhan_utama}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Tindakan:</span>
                <p className="text-slate-200 mt-0.5">{selectedVisit.tindakan || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status Penanganan:</span>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(selectedVisit.status)}>
                    {selectedVisit.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
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
