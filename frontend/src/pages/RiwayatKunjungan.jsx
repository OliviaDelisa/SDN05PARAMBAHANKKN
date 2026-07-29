import { useState } from 'react'
import {
  Search,
  Eye,
  Printer,
  AlertTriangle,
  Clock,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import CustomSelect from '../components/common/CustomSelect'
import PrintReportTemplate from '../components/common/PrintReportTemplate'
import { kunjunganList, kelasOptions, statusOptions, dataSekolah, petugasUks } from '../data/mockData'
import { formatTanggalWaktu, getInitials, getInitialColor } from '../utils/formatters'
import { useToast } from '../components/common/Toast'
import { useAuth } from '../context/AuthContext'

export default function RiwayatKunjungan() {
  const toast = useToast()
  const { user } = useAuth()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDarurat, setFilterDarurat] = useState(false)
  const [showPrintTemplate, setShowPrintTemplate] = useState(false)

  // Selected visit for modal detail
  const [selectedVisit, setSelectedVisit] = useState(null)

  // Options formatted for CustomSelect
  const kelasSelectOptions = [
    { value: '', label: 'Semua Kelas (1 - 6)' },
    ...kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))
  ]

  const statusSelectOptions = [
    { value: '', label: 'Semua Status Penanganan' },
    ...statusOptions.map((s) => ({ value: s, label: s }))
  ]

  // Filter logic
  const filteredData = kunjunganList.filter((k) => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !searchQuery ||
      k.siswa_nama?.toLowerCase().includes(q) ||
      k.siswa_nis?.includes(q) ||
      k.keluhan_utama?.toLowerCase().includes(q)

    const matchKelas = !filterKelas || k.kelas === filterKelas
    const matchStatus = !filterStatus || k.status === filterStatus
    const matchDarurat = !filterDarurat || k.is_darurat

    return matchSearch && matchKelas && matchStatus && matchDarurat
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

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['ID', 'NIS', 'Nama Siswa', 'Kelas', 'Waktu Masuk', 'Keluhan', 'Tindakan', 'Status', 'Darurat']
    const rows = filteredData.map((k) => [
      k.id,
      k.siswa_nis,
      `"${k.siswa_nama}"`,
      k.kelas,
      `"${k.waktu_masuk}"`,
      `"${k.keluhan_utama}"`,
      `"${k.tindakan || '-'}"`,
      `"${k.status}"`,
      k.is_darurat ? 'Ya' : 'Tidak'
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `riwayat_kunjungan_uks_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Data riwayat berhasil diunduh (Format CSV)!')
  }

  const columns = [
    {
      key: 'waktu_masuk',
      label: 'Waktu',
      width: '150px',
      render: (val) => (
        <span className="font-mono text-xs text-slate-300">
          {formatTanggalWaktu(val)}
        </span>
      )
    },
    {
      key: 'siswa_nama',
      label: 'Nama Siswa',
      render: (_, row) => {
        const color = getInitialColor(row.siswa_nama)
        const initial = getInitials(row.siswa_nama)
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{row.siswa_nama}</span>
                {row.is_darurat && (
                  <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    DARURAT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">NIS: {row.siswa_nis}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'kelas',
      label: 'Kelas',
      width: '80px',
      render: (val) => (
        <span className="font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs">
          Kelas {val}
        </span>
      )
    },
    {
      key: 'keluhan_utama',
      label: 'Keluhan Utama',
      render: (val) => <span className="font-semibold text-slate-200">{val}</span>
    },
    {
      key: 'tindakan',
      label: 'Tindakan / Terapi',
      render: (val) => <span className="text-slate-400 text-xs">{val || '-'}</span>
    },
    {
      key: 'status',
      label: 'Status Akhir',
      width: '150px',
      render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge>
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '80px',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedVisit(row)
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-all duration-200"
          title="Lihat Detail"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Riwayat Kunjungan Digital">
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handleExportCSV}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200
              font-bold text-xs transition-all duration-200 shadow-md cursor-pointer
            "
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => setShowPrintTemplate(!showPrintTemplate)}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-emerald-600 hover:bg-emerald-500 text-white
              font-bold text-xs transition-all duration-200 shadow-lg shadow-emerald-950/50 cursor-pointer border border-emerald-400/30
            "
          >
            <Printer className="w-4 h-4" />
            <span>{showPrintTemplate ? 'Tutup Format Cetak' : 'Cetak / Unduh PDF'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Toggle Printable PDF Document View */}
      {showPrintTemplate && (
        <PrintReportTemplate
          title="LAPORAN REKAPITULASI RIWAYAT KUNJUNGAN UKS"
          periodeLabel="Tahun 2026"
          dataKunjungan={filteredData}
          petugasName={user?.nama_lengkap || petugasUks.nama_lengkap}
          petugasNip={user?.nip || petugasUks.nip}
          kepalaSekolah={dataSekolah.kepala_sekolah}
        />
      )}

      <div className="space-y-8 no-print">
        {/* Filter Panel */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search query */}
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIS, atau keluhan..."
                className="
                  w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800
                  bg-slate-950/80 text-xs text-white placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
                "
              />
            </div>

            {/* Filter Kelas (CustomSelect) */}
            <div className="lg:col-span-3">
              <CustomSelect
                options={kelasSelectOptions}
                value={filterKelas}
                onChange={setFilterKelas}
                placeholder="Semua Kelas"
              />
            </div>

            {/* Filter Status (CustomSelect) */}
            <div className="lg:col-span-4">
              <CustomSelect
                options={statusSelectOptions}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Semua Status"
              />
            </div>
          </div>

          {/* Second Filter Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-300">
              <input
                type="checkbox"
                checked={filterDarurat}
                onChange={(e) => setFilterDarurat(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-700 focus:ring-rose-500 bg-slate-950"
              />
              <AlertTriangle className={`w-3.5 h-3.5 ${filterDarurat ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Hanya tampilkan KASUS DARURAT</span>
            </label>

            <span className="text-slate-400 font-medium">
              Menampilkan <strong className="text-white">{filteredData.length}</strong> dari {kunjunganList.length} kunjungan
            </span>
          </div>
        </div>

        {/* Main Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => setSelectedVisit(row)}
          emptyMessage="Tidak ada riwayat kunjungan yang sesuai dengan filter."
        />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title="Detail Rekam Kunjungan Siswa"
        size="md"
      >
        {selectedVisit && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-lg"
                style={{ backgroundColor: getInitialColor(selectedVisit.siswa_nama) }}
              >
                {getInitials(selectedVisit.siswa_nama)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-display text-white truncate">
                    {selectedVisit.siswa_nama}
                  </h3>
                  {selectedVisit.is_darurat && (
                    <Badge variant="danger">DARURAT</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  NIS: <span className="font-mono font-bold text-white">{selectedVisit.siswa_nis}</span> · Kelas: <span className="font-bold text-emerald-400">Kelas {selectedVisit.kelas}</span>
                </p>
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Waktu Masuk
                </span>
                <p className="font-mono font-bold text-white text-sm">
                  {formatTanggalWaktu(selectedVisit.waktu_masuk)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Status Penanganan
                </span>
                <div>
                  <Badge variant={getStatusVariant(selectedVisit.status)}>
                    {selectedVisit.status}
                  </Badge>
                </div>
              </div>

              <div className="col-span-2 space-y-1 pt-3 border-t border-slate-800">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                  Keluhan Utama
                </span>
                <p className="font-bold text-white text-sm bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                  {selectedVisit.keluhan_utama}
                </p>
              </div>

              {selectedVisit.keterangan && (
                <div className="col-span-2 space-y-1">
                  <span className="text-slate-400 font-medium">Catatan / Keterangan</span>
                  <p className="text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                    "{selectedVisit.keterangan}"
                  </p>
                </div>
              )}

              <div className="col-span-2 space-y-1 pt-3 border-t border-slate-800">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  Tindakan Diberikan
                </span>
                <p className="font-semibold text-slate-200 text-sm">
                  {selectedVisit.tindakan || 'Tidak ada tindakan khusus'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
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
