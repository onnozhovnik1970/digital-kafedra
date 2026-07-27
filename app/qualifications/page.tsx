'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

type Qualification = {
  id: string
  title: string
  institution: string
  type: string
  date_start: string
  date_end: string
  hours: number
  is_international: boolean
  certificate_url: string
}

export default function QualificationsPage() {
  const [qualifications, setQualifications] = useState<Qualification[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    institution: '',
    type: '',
    date_start: '',
    date_end: '',
    hours: 0,
    is_international: false,
    file: null as File | null,
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      loadQualifications(user.id)
    }
    init()
  }, [])

  const loadQualifications = async (userId: string) => {
    const { data } = await supabase
      .from('qualifications')
      .select('*')
      .eq('profile_id', userId)
      .order('date_end', { ascending: false })
    if (data) setQualifications(data)
  }

  const getPoints = (qual: Qualification) => {
    let points = 0
    switch(qual.type) {
      case 'advanced_training': points = qual.is_international ? 700 : 300; break
      case 'internship': points = qual.is_international ? 700 : 300; break
      case 'foreign_language_cert': points = 1000; break
      case 'foreign_language_b1': points = 500; break
      case 'international_training': points = 700; break
      case 'online_course': points = 50; break
      default: points = 50
    }
    return points
  }

  const typeLabels: Record<string, string> = {
    advanced_training: 'Підвищення кваліфікації',
    internship: 'Стажування',
    foreign_language_cert: 'Сертифікат іноземної мови (TOEFL тощо)',
    foreign_language_b1: 'Сертифікат іноземної мови B1/B2',
    international_training: 'Міжнародне стажування',
    online_course: 'Онлайн курс',
    other: 'Інше',
  }

  const handleAdd = async () => {
    setLoading(true)

    let fileUrl = null
    if (form.file) {
      const fileExt = form.file.name.split('.').pop()
      const filePath = `${user.id}/qualifications/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, form.file)
      if (!uploadError) fileUrl = filePath
    }

    const { error } = await supabase
      .from('qualifications')
      .insert({
        title: form.title,
        institution: form.institution,
        type: form.type,
        date_start: form.date_start || null,
        date_end: form.date_end || null,
        hours: form.hours || null,
        is_international: form.is_international,
        certificate_url: fileUrl,
        profile_id: user.id
      })

    if (error) console.error(error)
    if (!error) {
      setShowForm(false)
      setForm({ title: '', institution: '', type: '', date_start: '', date_end: '', hours: 0, is_international: false, file: null })
      loadQualifications(user.id)
    }
    setLoading(false)
  }

  const handleEdit = (qual: Qualification) => {
    setEditingId(qual.id)
    setEditForm({
      title: qual.title,
      institution: qual.institution,
      type: qual.type,
      date_start: qual.date_start,
      date_end: qual.date_end,
      hours: qual.hours,
      is_international: qual.is_international,
    })
  }

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('qualifications')
      .update({
        title: editForm.title,
        institution: editForm.institution,
        type: editForm.type,
        date_start: editForm.date_start || null,
        date_end: editForm.date_end || null,
        hours: editForm.hours || null,
        is_international: editForm.is_international,
      })
      .eq('id', editingId)

    if (!error) {
      setEditingId(null)
      loadQualifications(user.id)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('qualifications').delete().eq('id', id)
    loadQualifications(user.id)
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">🏆 Підвищення кваліфікації</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Додати
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="font-semibold text-gray-800 mb-6">Нова запис</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Назва курсу/програми *</label>
                <input
                  type="text"
                  placeholder="Назва програми підвищення кваліфікації"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Установа</label>
                <input
                  type="text"
                  placeholder="Назва університету, організації тощо"
                  value={form.institution}
                  onChange={(e) => setForm({...form, institution: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Оберіть тип</option>
                  <option value="advanced_training">Підвищення кваліфікації</option>
                  <option value="internship">Стажування</option>
                  <option value="international_training">Міжнародне стажування</option>
                  <option value="foreign_language_cert">Сертифікат іноземної мови (TOEFL тощо)</option>
                  <option value="foreign_language_b1">Сертифікат іноземної мови B1/B2</option>
                  <option value="online_course">Онлайн курс</option>
                  <option value="other">Інше</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата початку</label>
                  <input
                    type="date"
                    value={form.date_start}
                    onChange={(e) => setForm({...form, date_start: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата закінчення</label>
                  <input
                    type="date"
                    value={form.date_end}
                    onChange={(e) => setForm({...form, date_end: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Годин</label>
                  <input
                    type="number"
                    placeholder="180"
                    value={form.hours || ''}
                    onChange={(e) => setForm({...form, hours: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_international}
                  onChange={(e) => setForm({...form, is_international: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Міжнародна програма (+коефіцієнт)</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сертифікат (PDF)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={loading || !form.title || !form.type}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        )}

        {editingId && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8 border-2 border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-6">✏️ Редагування</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Назва</label>
                <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Установа</label>
                <input type="text" value={editForm.institution || ''} onChange={(e) => setEditForm({...editForm, institution: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
                <select value={editForm.type || ''} onChange={(e) => setEditForm({...editForm, type: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Оберіть тип</option>
                  <option value="advanced_training">Підвищення кваліфікації</option>
                  <option value="internship">Стажування</option>
                  <option value="international_training">Міжнародне стажування</option>
                  <option value="foreign_language_cert">Сертифікат іноземної мови (TOEFL тощо)</option>
                  <option value="foreign_language_b1">Сертифікат іноземної мови B1/B2</option>
                  <option value="online_course">Онлайн курс</option>
                  <option value="other">Інше</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата початку</label>
                  <input type="date" value={editForm.date_start || ''} onChange={(e) => setEditForm({...editForm, date_start: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата закінчення</label>
                  <input type="date" value={editForm.date_end || ''} onChange={(e) => setEditForm({...editForm, date_end: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Годин</label>
                  <input type="number" value={editForm.hours || ''} onChange={(e) => setEditForm({...editForm, hours: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.is_international || false} onChange={(e) => setEditForm({...editForm, is_international: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Міжнародна програма</span>
              </label>
              <div className="flex gap-3">
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Зберегти</button>
                <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">Скасувати</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {qualifications.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              Записів ще немає. Додайте перший! 📝
            </div>
          )}
          {qualifications.map((qual) => (
            <div key={qual.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {typeLabels[qual.type] || qual.type}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      {getPoints(qual)} балів
                    </span>
                    {qual.is_international && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌍 Міжнародна</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{qual.title}</h3>
                  {qual.institution && <p className="text-sm text-gray-500">{qual.institution}</p>}
                  <div className="flex gap-4 mt-2">
                    {qual.date_start && <p className="text-xs text-gray-400">Початок: {new Date(qual.date_start).toLocaleDateString('uk-UA')}</p>}
                    {qual.date_end && <p className="text-xs text-gray-400">Кінець: {new Date(qual.date_end).toLocaleDateString('uk-UA')}</p>}
                    {qual.hours && <p className="text-xs text-gray-400">{qual.hours} год.</p>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleEdit(qual)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition">✏️</button>
                  <button onClick={() => handleDelete(qual.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}