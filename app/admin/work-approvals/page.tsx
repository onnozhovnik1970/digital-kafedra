'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

type PendingEntry = {
  id: string
  quantity: number
  points_awarded: number
  description: string | null
  year: number | null
  certificate_url: string | null
  created_at: string
  work_types: { name: string; category: string; unit: string } | null
  profiles: { full_name: string } | null
}

export default function WorkApprovalsPage() {
  const [entries, setEntries] = useState<PendingEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'head') {
        router.push('/dashboard')
        return
      }

      loadEntries()
    }
    init()
  }, [])

  const loadEntries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('work_entries')
      .select('*, work_types(name, category, unit), profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (error) console.error(error)
    if (data) setEntries(data as any)
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('work_entries')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    await loadEntries()
    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('work_entries')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_note: rejectNote || null,
      })
      .eq('id', id)
    await loadEntries()
    setProcessingId(null)
    setRejectingId(null)
    setRejectNote('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
          ← Назад до кабінету
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">✅ Записи на розгляді</h2>

        {loading && <p className="text-gray-400">Завантаження...</p>}

        {!loading && entries.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
            Немає записів, що очікують на розгляд 🎉
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {entry.profiles?.full_name ?? 'Викладач'}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      {entry.points_awarded} балів
                    </span>
                    {entry.year && <span className="text-xs text-gray-400">{entry.year}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {entry.work_types?.name} × {entry.quantity}
                  </h3>
                  <p className="text-xs text-gray-400">{entry.work_types?.category}</p>
                  {entry.description && <p className="text-sm text-gray-500 mt-1">{entry.description}</p>}
                  {entry.certificate_url && (
                    <p className="text-xs text-blue-600 mt-1">📎 Є підтверджуючий документ</p>
                  )}

                  {rejectingId === entry.id && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Причина відхилення (необов'язково)"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {rejectingId === entry.id ? (
                    <>
                      <button
                        onClick={() => handleReject(entry.id)}
                        disabled={processingId === entry.id}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Підтвердити відхилення
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectNote('') }}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                      >
                        Скасувати
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(entry.id)}
                        disabled={processingId === entry.id}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition disabled:opacity-50"
                      >
                        ✅ Затвердити
                      </button>
                      <button
                        onClick={() => setRejectingId(entry.id)}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                      >
                        ❌ Відхилити
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
