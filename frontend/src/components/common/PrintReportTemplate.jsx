import { useRef } from 'react'
import { Printer, Download, FileText } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { formatTanggal, formatTanggalWaktu } from '../../utils/formatters'
import { useToast } from './Toast'

export default function PrintReportTemplate({
  title = 'LAPORAN REKAPITULASI KESEHATAN UKS',
  periodeLabel = 'Juli 2026',
  dataKunjungan = [],
  petugasName = 'Ibu Siti Rahmawati',
  petugasNip = '198507152010012003',
  kepalaSekolah = 'Bapak Ahmad Fauzi, S.Pd.',
  kepalaNip = '197508122005011002'
}) {
  const toast = useToast()
  const printRef = useRef(null)

  const todayStr = formatTanggal(new Date().toISOString())

  // Calculate summary metrics
  const totalKunjungan = dataKunjungan.length
  const totalDarurat = dataKunjungan.filter((k) => k.is_darurat).length
  const totalKembali = dataKunjungan.filter((k) => k.status === 'Kembali ke Kelas').length
  const totalIstirahat = dataKunjungan.filter((k) => k.status === 'Istirahat di UKS').length
  const totalWali = dataKunjungan.filter((k) => k.status === 'Dijemput Wali').length
  const totalRujuk = dataKunjungan.filter((k) => k.status === 'Dirujuk ke Klinik').length

  // Trigger Direct PDF Download via html2pdf.js
  const handleDownloadPDF = () => {
    toast.info('Meng-generate file PDF resmi...')

    const element = printRef.current
    const opt = {
      margin: [10, 12, 12, 12],
      filename: `Laporan_UKS_SDN05_${periodeLabel.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success('File PDF berhasil diunduh!')
      })
      .catch((err) => {
        console.error('PDF generation error:', err)
        toast.error('Gagal meng-generate file PDF.')
      })
  }

  // Trigger Browser Print Dialog
  const handlePrintView = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Interactive Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-white">Ekspor Laporan Resmi (Format PDF & Cetak)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-emerald-600 hover:bg-emerald-500 text-white
              font-extrabold text-xs transition-all duration-200 shadow-lg shadow-emerald-950/50 cursor-pointer border border-emerald-400/30
            "
          >
            <Download className="w-4 h-4" />
            <span>Unduh File PDF (.pdf)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintView}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-slate-800 hover:bg-slate-700 text-slate-200
              font-bold text-xs transition-all duration-200 shadow-md cursor-pointer border border-slate-700
            "
          >
            <Printer className="w-4 h-4 text-emerald-400" />
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
            <h1 className="text-xl font-black uppercase tracking-wider text-black mt-0.5">SD NEGERI 05 PARAMBAHAN</h1>
            <p className="text-[11px] font-sans italic text-slate-800 mt-1">
              Alamat: Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok. Kode Pos 27371
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
                {dataKunjungan.length > 0 ? (
                  dataKunjungan.map((k, idx) => (
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
          </div>

          {/* Official Signatures Block (Tanda Tangan & Pengesahan) */}
          <div className="pt-6 font-sans text-xs">
            <div className="grid grid-cols-2 gap-8 text-center">
              {/* Left Column: Kepala Sekolah */}
              <div className="space-y-16">
                <div>
                  <p className="font-semibold">Mengetahui,</p>
                  <p className="font-bold">Kepala SD Negeri 05 Parambahan</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">{kepalaSekolah}</p>
                  <p className="text-[11px] font-mono text-slate-700">NIP. {kepalaNip}</p>
                </div>
              </div>

              {/* Right Column: Petugas UKS Utama */}
              <div className="space-y-16">
                <div>
                  <p className="font-semibold">Parambahan, {todayStr}</p>
                  <p className="font-bold">Petugas UKS Utama</p>
                </div>
                <div>
                  <p className="font-bold underline text-sm">{petugasName}</p>
                  <p className="text-[11px] font-mono text-slate-700">NIP. {petugasNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS Rules */}
      <style>{`
        @media print {
          /* Hide non-print UI elements */
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }

          /* Force printable container visible */
          .print-area, .print-area * {
            visibility: visible !important;
          }

          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
        }
      `}</style>
    </div>
  )
}
