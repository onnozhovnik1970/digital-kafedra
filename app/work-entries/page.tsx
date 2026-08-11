'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

type WorkType = {
  id: string
  code: string
  name: string
  category: string
  unit: string
  points: number
  polozhennya_ref: string | null
}

type WorkEntry = {
  id: string
  work_type_id: string
  quantity: number
  points_awarded: number
  description: string | null
  year: number | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
}

export default function WorkEntriesPage() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    work_type_id: '',
    quantity: 1,
    description: '',
    year: new Date().getFullYear(),
    file: null as File | null,
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      loadWorkTypes()
      loadEntries(user.id)
    }
    init()
  }, [])

  const loadWorkTypes = async () => {
    const { data } = await supabase
      .from('work_types')
      .select('*')
      .order('category', { ascending: true })
    if (data) setWorkTypes(data)
  }

  const loadEntries = async (userId: string) => {
    const { data } = await supabase
      .from('work_entries')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })
    if (data) setEntries(data)
  }

  const selectedType = workTypes.find((t) => t.id === form.work_type_id)

  const handleAdd = async () => {
    if (!selectedType) return
    setLoading(true)

    let fileUrl = null
    if (form.file) {
      const fileExt = form.file.name.split('.').pop()
      const filePath = `${user.id}/work-entries/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, form.file)
      if (!uploadError) fileUrl = filePath
    }

    const { error } = await supabase.from('work_entries').insert({
      profile_id: user.id,
      work_type_id: form.work_type_id,
      quantity: form.quantity,
      points_awarded: selectedType.points * form.quantity,
      description: form.description || null,
      year: form.year,
      certificate_url: fileUrl,
      status: 'pending',
    })

    if (error) console.error(error)
    if (!error) {
      setShowForm(false)
      setForm({ work_type_id: '', quantity: 1, description: '', year: new Date().getFullYear(), file: null })
      loadEntries(user.id)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('work_entries').delete().eq('id', id)
    loadEntries(user.id)
  }

  const statusLabel: Record<string, { text: string; className: string }> = {
    pending: { text: '⏳ На розгляді', className: 'bg-yellow-100 text-yellow-700' },
    approved: { text: '✅ Затверджено', className: 'bg-green-100 text-green-700' },
    rejected: { text: '❌ Відхилено', className: 'bg-red-100 text-red-700' },
  }

  const categories = Array.from(new Set(workTypes.map((t) => t.category)))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
          ← Назад до кабінету
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">📋 Інші види робіт</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Додати
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="font-semibold text-gray-800 mb-6">Новий запис</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Вид роботи *</label>
                <select
                  value={form.work_type_id}
                  onChange={(e) => setForm({ ...form, work_type_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Оберіть вид роботи</option>
                  {categories.map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {workTypes.filter((t) => t.category === cat).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.points} балів / {t.unit})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedType?.polozhennya_ref && (
                  <p className="text-xs text-gray-400 mt-1">Згідно з {selectedType.polozhennya_ref} Положення</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Кількість</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Рік</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {selectedType && (
                <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-2">
                  Разом: {selectedType.points * form.quantity} балів
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Опис / деталі</label>
                <textarea
                  placeholder="Короткий опис виконаної роботи"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Підтверджуючий документ (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Запис буде на розгляді у завкафа, доки не буде затверджений
                </p>
              </div>

              <button
                onClick={handleAdd}
                disabled={loading || !form.work_type_id}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Збереження...' : 'Надіслати на розгляд'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {entries.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              Записів ще немає. Додайте перший! 📝
            </div>
          )}
          {entries.map((entry) => {
            const type = workTypes.find((t) => t.id === entry.work_type_id)
            const status = statusLabel[entry.status]
            return (
              <div key={entry.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        {entry.points_awarded} балів
                      </span>
                      {entry.year && <span className="text-xs text-gray-400">{entry.year}</span>}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{type?.name ?? 'Вид роботи'}</h3>
                    {entry.description && <p className="text-sm text-gray-500">{entry.description}</p>}
                    {entry.status === 'rejected' && entry.review_note && (
                      <p className="text-sm text-red-500 mt-1">Причина відхилення: {entry.review_note}</p>
                    )}
                  </div>
                  {entry.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition ml-4"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
