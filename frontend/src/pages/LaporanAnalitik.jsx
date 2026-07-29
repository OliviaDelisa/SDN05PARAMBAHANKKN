import { useState } from 'react'
import {
  Printer,
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Home,
  UserX,
  Stethoscope,
  Inbox
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import StatCard from '../components/common/StatCard'
import CustomSelect from '../components/common/CustomSelect'
import PrintReportTemplate from '../components/common/PrintReportTemplate'
import { kunjunganList, dataSekolah, petugasUks } from '../data/mockData'
import { getBulanOptions, getTahunOptions } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

export default function LaporanAnalitik() {
  const { user } = useAuth()

  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1)
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear())
  const [showPrintTemplate, setShowPrintTemplate] = useState(false)

  const bulanOptions = getBulanOptions()
  const tahunOptions = getTahunOptions()

  const bulanSelectOptions = bulanOptions.map((b) => ({ value: b.value, label: b.label }))
  const tahunSelectOptions = tahunOptions.map((t) => ({ value: t, label: String(t) }))

  // Calculate analytics metrics
  const totalKunjungan = kunjunganList.length
  const totalDarurat = kunjunganList.filter((k) => k.is_darurat).length

  // Count by kelas
  const kelasCount = {}
  kunjunganList.forEach((k) => {
    if (k.kelas) {
      kelasCount[k.kelas] = (kelasCount[k.kelas] || 0) + 1
    }
  })
  const kelasData = Object.entries(kelasCount).map(([name, value]) => ({ name: `Kelas ${name}`, value }))
  const hasKelasData = Object.keys(kelasCount).length > 0
  const topKelas = hasKelasData ? `Kelas ${Object.entries(kelasCount).sort((a, b) => b[1] - a[1])[0][0]}` : '-'

  // Count by keluhan
  const keluhanCount = {}
  kunjunganList.forEach((k) => {
    if (k.keluhan_utama) {
      keluhanCount[k.keluhan_utama] = (keluhanCount[k.keluhan_utama] || 0) + 1
    }
  })
  const keluhanData = Object.entries(keluhanCount)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
  const hasKeluhanData = keluhanData.length > 0
  const topKeluhan = hasKeluhanData ? keluhanData[0].name : '-'

  // Status breakdown
  const statusCount = {
    'Kembali ke Kelas': 0,
    'Istirahat di UKS': 0,
    'Dijemput Wali': 0,
    'Dirujuk ke Klinik': 0
  }
  kunjunganList.forEach((k) => {
    if (statusCount[k.status] !== undefined) {
      statusCount[k.status]++
    }
  })

  const PIE_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899']

  const selectedBulanLabel = bulanOptions.find((b) => Number(b.value) === Number(selectedBulan))?.label || 'Juli'
  const periodeText = `${selectedBulanLabel} ${selectedTahun}`

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan & Analitik Kesehatan">
        <button
          onClick={() => setShowPrintTemplate(!showPrintTemplate)}
          className="
            inline-flex items-center gap-2 px-5 py-3 rounded-xl
            bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
            text-white font-extrabold text-xs uppercase tracking-wide
            shadow-lg shadow-emerald-950/50 transition-all duration-200 no-print cursor-pointer border border-emerald-400/30
          "
        >
          <Printer className="w-4 h-4" />
          <span>{showPrintTemplate ? 'Tutup Format Cetak PDF' : 'Cetak / Unduh PDF Resmi'}</span>
        </button>
      </PageHeader>

      {/* Filter Bar (CustomSelect) */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-md no-print">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-300">Periode Laporan:</span>
          
          <div className="w-36">
            <CustomSelect
              options={bulanSelectOptions}
              value={selectedBulan}
              onChange={(val) => setSelectedBulan(Number(val))}
            />
          </div>

          <div className="w-28">
            <CustomSelect
              options={tahunSelectOptions}
              value={selectedTahun}
              onChange={(val) => setSelectedTahun(Number(val))}
            />
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Laporan Rekapitulasi Periode <strong className="text-white">{periodeText}</strong>
        </span>
      </div>

      {/* Toggle Formal Printable Document View */}
      {showPrintTemplate && (
        <PrintReportTemplate
          title="LAPORAN REKAPITULASI KESEHATAN DAN KUNJUNGAN UKS"
          periodeLabel={periodeText}
          dataKunjungan={kunjunganList}
          petugasName={user?.nama_lengkap || petugasUks.nama_lengkap}
          petugasNip={user?.nip || petugasUks.nip}
          kepalaSekolah={dataSekolah.kepala_sekolah}
        />
      )}

      {/* Screen Interactive View */}
      <div className="space-y-8 no-print">
        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={Users}
            value={totalKunjungan}
            unit="kunjungan"
            label="Total Kunjungan Siswa"
            variant="default"
          />
          <StatCard
            icon={AlertTriangle}
            value={totalDarurat}
            unit="kasus"
            label="Kasus Darurat"
            variant="warning"
          />
          <StatCard
            icon={Home}
            value={topKelas}
            label="Kelas Terbanyak Berkunjung"
            variant="info"
          />
          <StatCard
            icon={FileText}
            value={topKeluhan}
            label="Keluhan Paling Sering"
            variant="alert"
          />
        </div>

        {/* Ringkasan Naratif Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 space-y-3 shadow-xl">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Ringkasan Naratif Kesehatan Siswa</span>
          </h3>
          {totalKunjungan > 0 ? (
            <p className="text-xs text-slate-300 leading-relaxed">
              Pada bulan <strong className="text-white">{periodeText}</strong>, tercatat sebanyak <strong className="text-emerald-400">{totalKunjungan} kunjungan</strong> siswa ke UKS. Mayoritas kunjungan berasal dari <strong className="text-emerald-400">{topKelas}</strong> dengan keluhan tersering berupa <strong className="text-emerald-400">{topKeluhan}</strong>. Sebanyak <strong className="text-rose-400">{totalDarurat} kasus</strong> dikategorikan sebagai kasus darurat yang membutuhkan penanganan khusus. Sebanyak <strong className="text-emerald-400">{statusCount['Kembali ke Kelas']} siswa</strong> berhasil kembali belajar di kelas setelah penanganan.
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic leading-relaxed">
              Belum ada data kunjungan siswa yang tercatat pada periode <strong className="text-slate-200">{periodeText}</strong>. Silakan tambahkan kunjungan siswa melalui menu Pendaftaran Kunjungan.
            </p>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pie Chart: Kelas Breakdown (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>Distribusi Kunjungan per Kelas</span>
            </h3>

            <div className="h-[240px] w-full flex items-center justify-center">
              {hasKelasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kelasData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {kelasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} kunjungan`, name]}
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto opacity-30 text-emerald-400" />
                  <p className="text-xs">Belum ada data kelas tercatat</p>
                </div>
              )}
            </div>

            {hasKelasData && (
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800 text-xs">
                {kelasData.map((k, idx) => (
                  <div key={k.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-300 truncate">{k.name}: <strong className="text-white">{k.value}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Horizontal Bar Chart: Top Keluhan (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Peringkat Keluhan Utama</span>
            </h3>

            <div className="h-[280px] w-full pt-2 flex items-center justify-center">
              {hasKeluhanData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={keluhanData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#F8FAFC', fontWeight: 600 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(val) => [`${val} siswa`, 'Jumlah']}
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill="#10B981" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto opacity-30 text-emerald-400" />
                  <p className="text-xs">Belum ada keluhan siswa tercatat</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Status Penanganan Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-bold font-display text-white">
            Rincian Status Penanganan Siswa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/30 p-5 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Kembali ke Kelas</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-400 font-display">
                  {statusCount['Kembali ke Kelas']}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {totalKunjungan > 0 ? Math.round((statusCount['Kembali ke Kelas'] / totalKunjungan) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-amber-500/30 p-5 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Istirahat di UKS</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400 font-display">
                  {statusCount['Istirahat di UKS']}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {totalKunjungan > 0 ? Math.round((statusCount['Istirahat di UKS'] / totalKunjungan) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-sky-500/30 p-5 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <UserX className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200">Dijemput Wali</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-sky-400 font-display">
                  {statusCount['Dijemput Wali']}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {totalKunjungan > 0 ? Math.round((statusCount['Dijemput Wali'] / totalKunjungan) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-rose-500/30 p-5 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <Stethoscope className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">Dirujuk ke Klinik</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-rose-400 font-display">
                  {statusCount['Dirujuk ke Klinik']}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {totalKunjungan > 0 ? Math.round((statusCount['Dirujuk ke Klinik'] / totalKunjungan) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center pt-8 text-xs text-slate-500 border-t border-slate-800 no-print">
        UKS Digital © 2026 — SDN 05 Parambahan. Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok.
      </div>
    </div>
  )
}
