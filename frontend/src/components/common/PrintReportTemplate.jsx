import { useRef, useState } from 'react'
import { Printer, Download, FileText, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import { formatTanggal, formatTanggalWaktu } from '../../utils/formatters'
import { useToast } from './Toast'

// Batas baris agar browser tidak membeku saat data mencapai ribuan.
// html2canvas merender seluruh tabel menjadi satu gambar — tanpa batas ini,
// laporan setahun bisa menggantung tab selama puluhan detik.
const MAKS_BARIS = 500

export default function PrintReportTemplate({
  title = 'LAPORAN REKAPITULASI KESEHATAN UKS',
  periodeLabel = 'Juli 2026',
  dataKunjungan = [],
  sekolah = null,
  kepalaSekolah = 'Muswar Dedi, S.Pd.',
  kepalaNip = '198510082010011013'
}) {
  const toast = useToast()
  const printRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const todayStr = formatTanggal(new Date())

  // Identitas sekolah diambil dari database bila tersedia, dengan nilai
  // bawaan sebagai cadangan supaya kop surat tidak pernah kosong.
  const namaSekolah = sekolah?.nama_sekolah || 'SD NEGERI 05 PARAMBAHAN'
  const alamatSekolah =
    sekolah?.alamat || 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok'
  const npsnSekolah = sekolah?.npsn
  const teleponSekolah = sekolah?.telepon_sekolah
  const namaKepala = sekolah?.kepala_sekolah || kepalaSekolah
  const nipKepala = sekolah?.kepala_nip || kepalaNip

  const dipotong = dataKunjungan.length > MAKS_BARIS
  const barisTampil = dipotong ? dataKunjungan.slice(0, MAKS_BARIS) : dataKunjungan

  // Ringkasan dihitung dari SELURUH data, bukan hanya yang tampil, supaya
  // angka rekapitulasi tetap benar walau tabelnya dipotong.
  const totalKunjungan = dataKunjungan.length
  const totalDarurat = dataKunjungan.filter((k) => k.is_darurat).length
  const totalKembali = dataKunjungan.filter((k) => k.status === 'Kembali ke Kelas').length
  const totalIstirahat = dataKunjungan.filter((k) => k.status === 'Istirahat di UKS').length
  const totalWali = dataKunjungan.filter((k) => k.status === 'Dijemput Wali').length
  const totalRujuk = dataKunjungan.filter((k) => k.status === 'Dirujuk ke Klinik').length

  // Trigger Direct PDF Download via jspdf + html2canvas-pro (mendukung warna oklch Tailwind terbaru)
  const handleDownloadPDF = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    toast.info('Meng-generate file PDF resmi...')

    // Beri jeda 1 frame agar UI (spinner/disable button) sempat ter-render sebelum proses berat berjalan
    await new Promise((resolve) => setTimeout(resolve, 50))

    try {
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const marginX = 12
      const marginY = 10
      const usableWidth = pageWidth - marginX * 2
      const usableHeight = pageHeight - marginY * 2

      const imgWidth = usableWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = marginY

      // Halaman pertama
      pdf.addImage(imgData, 'JPEG', marginX, position, imgWidth, imgHeight)
      heightLeft -= usableHeight

      // Tambahkan halaman berikutnya jika konten lebih panjang dari 1 halaman A4
      while (heightLeft > 0) {
        position -= usableHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', marginX, position + marginY, imgWidth, imgHeight)
        heightLeft -= usableHeight
      }

      const safeFileName = periodeLabel.replace(/[/\s]+/g, '_')
      pdf.save(`Laporan_UKS_SDN05_${safeFileName}.pdf`)

      toast.success('File PDF berhasil diunduh!')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Gagal meng-generate file PDF. Coba periksa console untuk detail error.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Trigger Browser Print Dialog
  const handlePrintView = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Interactive Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Ekspor Laporan Resmi (Format PDF & Cetak)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white
              font-semibold text-xs transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed
            "
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Memproses PDF...' : 'Unduh File PDF (.pdf)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintView}
            disabled={isGenerating}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700
              font-semibold text-xs transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed border border-slate-200
            "
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Cetak Layout A4</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Layout */}
      <div className="print-area shadow-2xl rounded-2xl bg-white text-black p-8 sm:p-10 border border-slate-300">
        <div ref={printRef} className="print-document font-serif text-black leading-normal bg-white p-4">
          {/* Official Kop Surat (Institutional Letterhead) */}
          <div className="text-center pb-3 border-b-4 border-black relative">
            <h3 className="text-sm font-bold uppercase tracking-wide">PEMERINTAH KABUPATEN SOLOK</h3>
            <h3 className="text-sm font-bold uppercase tracking-wide">DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA</h3>
            <h1 className="text-xl font-black uppercase tracking-wider text-black mt-0.5">{namaSekolah}</h1>
            <p className="text-[11px] font-sans italic text-slate-800 mt-1">
              Alamat: {alamatSekolah}
              {npsnSekolah && ` · NPSN: ${npsnSekolah}`}
              {teleponSekolah && ` · Telp: ${teleponSekolah}`}
            </p>
            {/* Double Horizontal Line */}
            <div className="w-full h-0.5 bg-black mt-2" />
            <div className="w-full h-1.5 bg-black mt-0.5" />
          </div>

          {/* Document Title */}
          <div className="text-center py-5 space-y-1">
            <h2 className="text-base font-bold uppercase underline tracking-wide">
              {title}
            </h2>
            <p className="text-xs font-sans font-semibold text-slate-700">
              Periode: {periodeLabel}
            </p>
          </div>

          {/* Executive Summary Cards / Metrics Table */}
          <div className="mb-6 font-sans text-xs">
            <table className="w-full border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-900 p-2">Total Kunjungan</th>
                  <th className="border border-slate-900 p-2">Kasus Darurat</th>
                  <th className="border border-slate-900 p-2">Kembali ke Kelas</th>
                  <th className="border border-slate-900 p-2">Istirahat di UKS</th>
                  <th className="border border-slate-900 p-2">Dijemput Wali</th>
                  <th className="border border-slate-900 p-2">Dirujuk ke Klinik</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-sm">
                  <td className="border border-slate-900 p-2">{totalKunjungan}</td>
                  <td className="border border-slate-900 p-2 text-rose-700">{totalDarurat}</td>
                  <td className="border border-slate-900 p-2">{totalKembali}</td>
                  <td className="border border-slate-900 p-2">{totalIstirahat}</td>
                  <td className="border border-slate-900 p-2">{totalWali}</td>
                  <td className="border border-slate-900 p-2">{totalRujuk}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Main Data Table */}
          <div className="mb-8 font-sans text-xs">
            <h4 className="font-bold mb-2 text-xs uppercase tracking-wider font-serif">
              A. Rincian Rekam Kunjungan Siswa
            </h4>
            <table className="w-full border-collapse border border-slate-900 text-left">
              <thead>
                <tr className="bg-slate-200 text-black font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-2 text-center w-8">No</th>
                  <th className="border border-slate-900 p-2 w-32">Waktu Masuk</th>
                  <th className="border border-slate-900 p-2 w-20">NIS</th>
                  <th className="border border-slate-900 p-2">Nama Siswa</th>
                  <th className="border border-slate-900 p-2 text-center w-14">Kelas</th>
                  <th className="border border-slate-900 p-2">Keluhan Utama</th>
                  <th className="border border-slate-900 p-2">Tindakan</th>
                  <th className="border border-slate-900 p-2 w-28">Status Akhir</th>
                </tr>
              </thead>
              <tbody>
                {barisTampil.length > 0 ? (
                  barisTampil.map((k, idx) => (
                    <tr key={k.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                      <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 font-mono text-[11px]">{formatTanggalWaktu(k.waktu_masuk)}</td>
                      <td className="border border-slate-900 p-2 font-mono">{k.siswa_nis}</td>
                      <td className="border border-slate-900 p-2 font-bold">
                        {k.siswa_nama} {k.is_darurat && <span className="text-rose-700 font-extrabold text-[10px]">(DARURAT)</span>}
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold">Kelas {k.kelas}</td>
                      <td className="border border-slate-900 p-2">{k.keluhan_utama}</td>
                      <td className="border border-slate-900 p-2">{k.tindakan || '-'}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{k.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="border border-slate-900 p-4 text-center text-slate-500 italic">
                      Belum ada data rekam kunjungan siswa pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {dipotong && (
              <p className="mt-2 text-[11px] italic text-slate-700">
                Catatan: tabel menampilkan {MAKS_BARIS} kunjungan pertama dari total{' '}
                {totalKunjungan} kunjungan pada periode ini. Angka rekapitulasi di atas
                dihitung dari seluruh data. Persempit rentang tanggal untuk laporan yang
                lebih rinci.
              </p>
            )}
          </div>

          {/* Official Signature Block (Tanda Tangan & Pengesahan) — hanya Kepala Sekolah */}
          <div className="print-signature pt-6 font-sans text-xs">
            <div className="flex justify-end text-center">
              <div className="space-y-16 w-64">
                <div>
                  <p className="font-semibold">Parambahan, {todayStr}</p>
                  <p className="font-bold">Mengetahui,</p>
                  <p className="font-bold">Kepala {namaSekolah}</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">{namaKepala}</p>
                  {nipKepala && (
                    <p className="text-[11px] font-mono text-slate-700">NIP. {nipKepala}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS Rules */}
      <style>{`
        @media print {
          /* Sembunyikan seluruh isi halaman, lalu tampilkan kembali HANYA
             jalur dari <body> sampai area cetak.

             Memakai display:none, bukan visibility:hidden — visibility
             menyisakan ruang elemen tersembunyi, sehingga sidebar & topbar
             masih memakan tinggi halaman dan PDF sering diawali halaman
             kosong. Aturan ':not(:has())' menjaga elemen leluhur tetap
             tampil tanpa perlu tahu kedalaman sarangnya. */
          body :not(:has(.print-area)):not(.print-area):not(.print-area *) {
            display: none !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Ulangi header tabel di setiap halaman, dan jangan potong baris
             di tengah — penting untuk laporan yang lebih dari satu halaman. */
          .print-document thead {
            display: table-header-group;
          }
          .print-document tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-signature {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  )
}