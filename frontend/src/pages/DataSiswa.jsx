import { useState } from 'react'
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import CustomSelect from '../components/common/CustomSelect'
import { kelasOptions } from '../data/mockData'
import { getInitials, getInitialColor, formatTanggalPendek } from '../utils/formatters'
import { useToast } from '../components/common/Toast'
import { useData } from '../context/DataContext'

export default function DataSiswa() {
  const toast = useToast()
  const { siswaList, addSiswa, updateSiswa, deleteSiswa } = useData()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterKelas, setFilterKelas] = useState('')

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState(null)
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: '1',
    jenis_kelamin: 'Laki-laki',
    tanggal_lahir: '',
    nama_wali: '',
    telepon_wali: ''
  })

  // Delete Confirm Modal State
  const [deletingSiswa, setDeletingSiswa] = useState(null)

  // Options formatted for CustomSelect
  const kelasFilterOptions = [
    { value: '', label: 'Semua Kelas (1 - 6)' },
    ...kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))
  ]

  const kelasFormOptions = kelasOptions.map((k) => ({ value: k, label: `Kelas ${k}` }))

  const jkOptions = [
    { value: 'Laki-laki', label: 'Laki-laki' },
    { value: 'Perempuan', label: 'Perempuan' }
  ]

  // Filter logic
  const filteredSiswa = siswaList.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchQuery = !searchQuery || s.nama?.toLowerCase().includes(q) || s.nis?.includes(q)
    const matchKelas = !filterKelas || s.kelas === filterKelas
    return matchQuery && matchKelas
  })

  // Open modal for new student
  const handleOpenAdd = () => {
    setEditingSiswa(null)
    setFormData({
      nis: '',
      nama: '',
      kelas: '1',
      jenis_kelamin: 'Laki-laki',
      tanggal_lahir: '',
      nama_wali: '',
      telepon_wali: ''
    })
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = (siswa) => {
    setEditingSiswa(siswa)
    setFormData({
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenis_kelamin: siswa.jenis_kelamin,
      tanggal_lahir: siswa.tanggal_lahir || '',
      nama_wali: siswa.nama_wali || '',
      telepon_wali: siswa.telepon_wali || ''
    })
    setIsModalOpen(true)
  }

  // Save (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.nis || !formData.nama) {
      toast.error('NIS dan Nama Lengkap wajib diisi!')
      return
    }

    if (editingSiswa) {
      await updateSiswa(editingSiswa.id, formData)
      toast.success(`Data siswa ${formData.nama} berhasil diperbarui!`)
    } else {
      await addSiswa(formData)
      toast.success(`Siswa baru ${formData.nama} berhasil ditambahkan!`)
    }

    setIsModalOpen(false)
  }

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingSiswa) return
    await deleteSiswa(deletingSiswa.id)
    toast.success(`Data siswa ${deletingSiswa.nama} berhasil dihapus.`)
    setDeletingSiswa(null)
  }

  const columns = [
    {
      key: 'nis',
      label: 'NIS',
      width: '110px',
      render: (val) => <span className="font-mono text-xs font-bold text-slate-300">{val}</span>
    },
    {
      key: 'nama',
      label: 'Nama Siswa',
      render: (val) => {
        const color = getInitialColor(val)
        const initial = getInitials(val)
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-md"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <span className="font-bold text-white">{val}</span>
          </div>
        )
      }
    },
    {
      key: 'kelas',
      label: 'Kelas',
      width: '80px',
      render: (val) => (
        <span className="font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs">
          Kelas {val}
        </span>
      )
    },
    {
      key: 'jenis_kelamin',
      label: 'Jenis Kelamin',
      width: '120px',
      render: (val) => (
        <span className="text-xs text-slate-300 font-medium">{val}</span>
      )
    },
    {
      key: 'tanggal_lahir',
      label: 'Tgl Lahir',
      width: '120px',
      render: (val) => <span className="text-xs text-slate-400 font-mono">{val ? formatTanggalPendek(val) : '-'}</span>
    },
    {
      key: 'nama_wali',
      label: 'Orang Tua / Wali',
      render: (val, row) => (
        <div>
          <div className="text-xs font-semibold text-slate-200">{val || '-'}</div>
          {row.telepon_wali && (
            <div className="text-[11px] text-slate-400 font-mono">{row.telepon_wali}</div>
          )}
        </div>
      )
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
            title="Edit Data"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeletingSiswa(row)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 transition-colors"
            title="Hapus Siswa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Database Siswa">
        <button
          onClick={handleOpenAdd}
          className="
            inline-flex items-center gap-2 px-5 py-3 rounded-xl
            bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400
            text-white font-extrabold text-xs uppercase tracking-wide
            shadow-lg shadow-emerald-950/50 transition-all duration-200 cursor-pointer border border-emerald-400/30
          "
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Siswa</span>
        </button>
      </PageHeader>

      {/* Filter & Counter Bar */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIS siswa..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800
                bg-slate-950/80 text-xs text-white placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500
              "
            />
          </div>

          <div className="sm:col-span-4">
            <CustomSelect
              options={kelasFilterOptions}
              value={filterKelas}
              onChange={setFilterKelas}
              placeholder="Semua Kelas"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Total <strong className="text-white">{filteredSiswa.length}</strong> siswa terdaftar</span>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredSiswa}
        emptyMessage="Tidak ada data siswa yang cocok dengan filter."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                NIS <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Misal: 20241032"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                Kelas <span className="text-rose-400">*</span>
              </label>
              <CustomSelect
                options={kelasFormOptions}
                value={formData.kelas}
                onChange={(val) => setFormData({ ...formData, kelas: val })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">
              Nama Lengkap <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Nama lengkap siswa..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Jenis Kelamin</label>
              <CustomSelect
                options={jkOptions}
                value={formData.jenis_kelamin}
                onChange={(val) => setFormData({ ...formData, jenis_kelamin: val })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-800">
            <label className="font-bold text-slate-300">Nama Orang Tua / Wali</label>
            <input
              type="text"
              value={formData.nama_wali}
              onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
              placeholder="Nama ibu/ayah/wali..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">No. Telepon Wali</label>
            <input
              type="text"
              value={formData.telepon_wali}
              onChange={(e) => setFormData({ ...formData, telepon_wali: e.target.value })}
              placeholder="0812..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingSiswa}
        onClose={() => setDeletingSiswa(null)}
        title="Hapus Data Siswa"
        size="sm"
      >
        {deletingSiswa && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center gap-3 p-4 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-200">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus data siswa <strong>{deletingSiswa.nama}</strong> ({deletingSiswa.nis})? Action ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingSiswa(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-lg cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
