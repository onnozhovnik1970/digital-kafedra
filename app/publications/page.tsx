'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

type Publication = {
  id: string
  title: string
  type: string
  year: number
  journal: string
  authors: string
  doi: string
  scopus: boolean
  wos: boolean
  verified: boolean
  verification_note: string
  foreign_language: boolean
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    type: 'article',
    year: new Date().getFullYear(),
    journal: '',
    authors: '',
    doi: '',
    url: '',
    scopus: false,
    wos: false,
    foreign_language: false,
  })

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }
        setUser(user)
      
        // Створюємо профіль якщо не існує
        await supabase
          .from('profiles')
          .upsert({ id: user.id, email: user.email })
      
        loadPublications(user.id)
      }
    init()
  }, [])

  const loadPublications = async (userId: string) => {
    const { data } = await supabase
      .from('publications')
      .select('*')
      .eq('profile_id', userId)
      .order('year', { ascending: false })
    if (data) setPublications(data)
  }

  const handleAdd = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('publications')
      .insert({ ...form, profile_id: user.id })
    if (!error) {
      setShowForm(false)
      setForm({ title: '', type: 'article', year: new Date().getFullYear(), journal: '', authors: '', doi: '', url: '', scopus: false, wos: false, foreign_language: false })
      loadPublications(user.id)
    }
    setLoading(false)
  }

  const handleVerify = async (pub: Publication) => {
    setVerifying(pub.id)
    try {
      const response = await fetch('/api/verify-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pub.title,
          journal: pub.journal,
          type: pub.type,
          scopus: pub.scopus,
          wos: pub.wos,
          ukrainian_professional: (pub as any).ukrainian_professional
        }),
      })
      const data = await response.json()
      await supabase
        .from('publications')
        .update({ verified: data.verified, verification_note: data.note })
        .eq('id', pub.id)
      loadPublications(user.id)
          } catch (e) {
      console.error(e)
    }
    setVerifying(null)
  }

  const getPoints = (pub: Publication) => {
    const p = pub as any
    let points = 0
    
    if (pub.scopus || pub.wos) points = 3000
    else if (p.ukrainian_professional) points = 350
    else if (pub.type === 'monograph') points = 1500
    else if (pub.type === 'textbook') points = 800
    else if (pub.type === 'thesis') points = 50
    else if (pub.type === 'article') points = 200
    else points = 50
  
    if (p.foreign_language && !pub.scopus && !pub.wos) 
      points = Math.round(points * 1.5)
  
    // Ділимо на кількість авторів
    if (pub.authors && pub.authors.trim() !== '') {
      const coAuthorsCount = pub.authors.split(',').length
      const totalAuthors = coAuthorsCount + 1 // +1 сам викладач
      points = Math.round(points / totalAuthors)
    }
  
    return points
  }
  const handleDelete = async (id: string) => {
    await supabase.from('publications').delete().eq('id', id)
    loadPublications(user.id)
  }

  const typeLabels: Record<string, string> = {
    article: 'Стаття',
    monograph: 'Монографія',
    thesis: 'Тези',
    patent: 'Патент',
    textbook: 'Підручник/посібник',
    other: 'Інше',
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
          <h2 className="text-2xl font-bold text-gray-800">📚 Мої публікації</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Додати
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h3 className="font-semibold text-gray-800 mb-6">Нова публікація</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Назва публікації *</label>
                <input
                  type="text"
                  placeholder="Повна назва статті, монографії тощо"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="article">Стаття у фаховому журналі</option>
                    <option value="scopus_wos">Стаття Scopus/WoS</option>
                    <option value="monograph">Монографія</option>
                    <option value="thesis">Тези конференції</option>
                    <option value="patent">Патент</option>
                    <option value="textbook">Підручник/посібник</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Рік</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({...form, year: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Журнал / Видавництво</label>
                <input
                  type="text"
                  placeholder="Назва журналу або видавництва"
                  value={form.journal}
                  onChange={(e) => setForm({...form, journal: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Співавтори</label>
                <input
                  type="text"
                  placeholder="ПІБ співавторів через кому"
                  value={form.authors}
                  onChange={(e) => setForm({...form, authors: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DOI або URL</label>
                <input
                  type="text"
                  placeholder="https://doi.org/..."
                  value={form.doi}
                  onChange={(e) => setForm({...form, doi: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={form.scopus} onChange={(e) => setForm({...form, scopus: e.target.checked})} className="w-4 h-4" />
    <span className="text-sm text-gray-700">Scopus</span>
  </label>
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={form.wos} onChange={(e) => setForm({...form, wos: e.target.checked})} className="w-4 h-4" />
    <span className="text-sm text-gray-700">Web of Science</span>
  </label>
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={form.foreign_language} onChange={(e) => setForm({...form, foreign_language: e.target.checked})} className="w-4 h-4" />
    <span className="text-sm text-gray-700">Іноземна мова (+50%)</span>
  </label>
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={(form as any).ukrainian_professional} onChange={(e) => setForm({...form, ukrainian_professional: e.target.checked} as any)} className="w-4 h-4" />
    <span className="text-sm text-gray-700">Фаховий журнал України (кат. А/Б)</span>
  </label>
</div>

              <button
                onClick={handleAdd}
                disabled={loading || !form.title}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Збереження...' : 'Зберегти публікацію'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {publications.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
              Публікацій ще немає. Додайте першу! 📝
            </div>
          )}
          {publications.map((pub) => (
            <div key={pub.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {typeLabels[pub.type] || pub.type}
                    </span>
                    <span className="text-xs text-gray-400">{pub.year}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
  {getPoints(pub)} балів
</span>
                    {pub.scopus && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Scopus</span>}
                    {pub.wos && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">WoS</span>}
                    {pub.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Верифіковано</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{pub.title}</h3>
                  {pub.journal && <p className="text-sm text-gray-500">{pub.journal}</p>}
                  {pub.authors && <p className="text-sm text-gray-400">Співавтори: {pub.authors}</p>}
                  {pub.verification_note && (
                    <p className="text-sm text-blue-600 mt-2 italic">{pub.verification_note}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleVerify(pub)}
                    disabled={verifying === pub.id}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition"
                  >
                    {verifying === pub.id ? '⏳' : '🤖 AI перевірка'}
                  </button>
                  <button
                    onClick={() => handleDelete(pub.id)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}