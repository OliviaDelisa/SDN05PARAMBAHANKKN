import { useState, useEffect } from 'react'
import { Building2, Save, Loader2, Info } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { useToast } from '../components/common/Toast'
import { api } from '../utils/api'

const KOSONG = {
  nama_sekolah: '',
  npsn: '',
  telepon_sekolah: '',
  kepala_sekolah: '',
  kepala_nip: '',
  alamat: ''
}

export default function AdminSekolah() {
  const toast = useToast()

  const [sekolah, setSekolah] = useState(KOSONG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let dibatalkan = false

    async function muat() {
      setLoading(true)
      try {
        const res = await api.get('/pengaturan')
        if (dibatalkan) return
        if (res?.success && res.data?.sekolah) {
          setSekolah({ ...KOSONG, ...res.data.sekolah })
        }
      } catch (err) {
        if (!dibatalkan) toast.error(`Gagal memuat data sekolah: ${err.message}`)
      } finally {
        if (!dibatalkan) setLoading(false)
      }
    }

    muat()
    return () => {
      dibatalkan = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ubah = (kolom) => (e) => setSekolah((s) => ({ ...s, [kolom]: e.target.value }))

  const hanyaAngka = (kolom) => (e) =>
    setSekolah((s) => ({ ...s, [kolom]: e.target.value.replace(/\D/g, '') }))

  const handleSimpan = async (e) => {
    e.preventDefault()
    if (saving) return

    if (!sekolah.nama_sekolah.trim()) {
      toast.error('Nama sekolah wajib diisi!')
      return
    }

    setSaving(true)
    try {
      await api.put('/pengaturan/sekolah', sekolah)
      toast.success('Identitas sekolah berhasil diperbarui!')
    } catch (err) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400'
  const inputMono = `${inputClass} font-mono`

  return (
    <div className="space-y-6">
      <PageHeader title="" />

      <form
        onSubmit={handleSimpan}
        className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Data Identitas Sekolah</h3>
            <p className="text-xs text-slate-400">
              Informasi identitas sekolah yang dicetak pada kepala surat laporan.
            </p>
          </div>
        </div>

        {/* Perubahan di sini terlihat di setiap laporan resmi yang dicetak —
            itu sebabnya halaman ini dibatasi untuk admin. */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Data ini tercetak di kop surat setiap laporan kunjungan. Pastikan penulisannya
            sesuai dokumen resmi sekolah sebelum menyimpan.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memuat data sekolah...</span>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">
                Nama Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sekolah.nama_sekolah}
                onChange={ubah('nama_sekolah')}
                placeholder="Misal: SDN 05 Parambahan"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">NPSN</label>
                <input
                  type="text"
                  value={sekolah.npsn}
                  onChange={hanyaAngka('npsn')}
                  placeholder="10301599"
                  className={inputMono}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">No. Telepon Sekolah</label>
                <input
                  type="text"
                  value={sekolah.telepon_sekolah}
                  onChange={hanyaAngka('telepon_sekolah')}
                  placeholder="0751234567"
                  className={inputMono}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Kepala Sekolah</label>
                <input
                  type="text"
                  value={sekolah.kepala_sekolah}
                  onChange={ubah('kepala_sekolah')}
                  placeholder="Nama lengkap beserta gelar"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={sekolah.kepala_nip}
                  onChange={hanyaAngka('kepala_nip')}
                  placeholder="198510082010011013"
                  className={inputMono}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Alamat Lengkap Sekolah</label>
              <textarea
                value={sekolah.alamat}
                onChange={ubah('alamat')}
                rows={3}
                placeholder="Jalan, nagari, kecamatan, kabupaten..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
