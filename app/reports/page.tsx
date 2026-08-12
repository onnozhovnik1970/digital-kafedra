'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { getLecturerReportData, LecturerReportData } from '@/lib/exportData'
import { exportLecturerReportExcel } from '@/lib/exportExcel'

function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export default function LecturerReportPage() {
  const [report, setReport] = useState<LecturerReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const academicYear = getCurrentAcademicYear()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const data = await getLecturerReportData(
        supabase,
        user.id,
        profile?.full_name ?? user.email,
        academicYear
      )
      setReport(data)
      setLoading(false)
    }
    init()
  }, [])

  if (loading || !report) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження звіту...</div>
  }

  const groupedByCategory = report.items.reduce<Record<string, typeof report.items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-container { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <nav className="no-print bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <div className="flex gap-3">
          <button
            onClick={() => exportLecturerReportExcel(report)}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            📊 Excel
          </button>
          <button
            onClick={() => window.print()}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            🖨️ Друк / PDF
          </button>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
            ← Назад
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="print-container bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">Звіт про рейтингову діяльність</h2>
          <p className="text-gray-500 mb-6">{report.fullName} — {report.academicYear} н.р.</p>

          {Object.entries(groupedByCategory).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-2">{category}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <div className="font-medium text-gray-800">{item.description}</div>
                        {item.detail && <div className="text-gray-400 text-xs">{item.detail}</div>}
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-700 w-20">{item.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {report.items.length === 0 && (
            <p className="text-gray-400 text-center py-8">Записів для звіту ще немає.</p>
          )}

          <div className="flex justify-between items-center border-t-2 border-gray-800 pt-4 mt-6">
            <span className="font-bold text-gray-800">РАЗОМ</span>
            <span className="font-bold text-xl text-gray-800">{report.totalPoints} балів</span>
          </div>
        </div>
      </main>
    </div>
  )
}
