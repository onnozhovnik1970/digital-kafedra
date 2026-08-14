'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { getSurveyCoefficient } from '@/lib/surveyCoefficient'

function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

type Lecturer = { id: string; full_name: string }
type ExpertEvaluation = {
  id: string
  evaluation_date: string
  discipline: string | null
  competence_score: number
  pedagogical_score: number
  personal_score: number
  coefficient: number
  evaluator_name: string | null
  notes: string | null
}

export default function EvaluationsPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [surveyScore, setSurveyScore] = useState('')
  const [savingSurvey, setSavingSurvey] = useState(false)
  const [surveySaved, setSurveySaved] = useState(false)

  const [evaluations, setEvaluations] = useState<ExpertEvaluation[]>([])
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [savingEval, setSavingEval] = useState(false)
  const [evalForm, setEvalForm] = useState({
    discipline: '',
    competence_score: 30,
    pedagogical_score: 22,
    personal_score: 22,
    coefficient: 1.0,
    evaluator_name: '',
    notes: '',
  })

  const router = useRouter()
  const academicYear = getCurrentAcademicYear()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'head' || !profile.department_id) {
        router.push('/dashboard')
        return
      }

      const { data: deptLecturers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('department_id', profile.department_id)
        .order('full_name')

      if (deptLecturers) setLecturers(deptLecturers)
      if (deptLecturers && deptLecturers.length > 0) setSelectedId(deptLecturers[0].id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    loadSurveyScore()
    loadEvaluations()
  }, [selectedId])

  const loadSurveyScore = async () => {
    const { data } = await supabase
      .from('student_survey_scores')
      .select('score')
      .eq('profile_id', selectedId)
      .eq('academic_year', academicYear)
      .maybeSingle()
    setSurveyScore(data?.score != null ? String(data.score) : '')
  }

  const loadEvaluations = async () => {
    const { data } = await supabase
      .from('expert_evaluations')
      .select('*')
      .eq('profile_id', selectedId)
      .eq('academic_year', academicYear)
      .order('evaluation_date', { ascending: false })
    if (data) setEvaluations(data)
  }

  const handleSaveSurvey = async () => {
    setSavingSurvey(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('student_survey_scores').upsert(
        {
          profile_id: selectedId,
          academic_year: academicYear,
          score: parseFloat(surveyScore),
          entered_by: user?.id,
        },
        { onConflict: 'profile_id,academic_year' }
      )
      if (!error) {
        setSurveySaved(true)
        setTimeout(() => setSurveySaved(false), 3000)
      }
    } finally {
      setSavingSurvey(false)
    }
  }

  const handleAddEvaluation = async () => {
    setSavingEval(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('expert_evaluations').insert({
        profile_id: selectedId,
        academic_year: academicYear,
        discipline: evalForm.discipline || null,
        competence_score: evalForm.competence_score,
        pedagogical_score: evalForm.pedagogical_score,
        personal_score: evalForm.personal_score,
        coefficient: evalForm.coefficient,
        evaluator_name: evalForm.evaluator_name || null,
        notes: evalForm.notes || null,
        entered_by: user?.id,
      })
      if (!error) {
        setShowEvalForm(false)
        setEvalForm({
          discipline: '', competence_score: 30, pedagogical_score: 22, personal_score: 22,
          coefficient: 1.0, evaluator_name: '', notes: '',
        })
        loadEvaluations()
      }
    } finally {
      setSavingEval(false)
    }
  }

  const parsedScore = parseFloat(surveyScore)
  const coefficient = !isNaN(parsedScore) ? getSurveyCoefficient(parsedScore) : null
  const evalTotal = evalForm.competence_score + evalForm.pedagogical_score + evalForm.personal_score

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎓 Цифровий завкаф</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
          ← Назад до кабінету
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📝 Анкетування та оцінка занять</h2>
        <p className="text-gray-500 mb-8">{academicYear} навчальний рік</p>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Викладач</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </div>

        {/* Student survey */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Анкетування студентів «Якість викладання»</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Середня оцінка (0–5)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={surveyScore}
                onChange={(e) => setSurveyScore(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSurvey}
              disabled={savingSurvey || surveyScore === ''}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {savingSurvey ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
          {coefficient !== null && (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-2 mt-3">
              Коефіцієнт за таблицею Положення: <strong>{coefficient}</strong> (довідково, не впливає на бали рейтингу)
            </p>
          )}
          {surveySaved && <p className="text-green-600 text-sm mt-2">✅ Збережено</p>}
        </div>

        {/* Expert evaluations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Експертна оцінка занять (Додаток 2)</h3>
            <button
              onClick={() => setShowEvalForm(!showEvalForm)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Додати
            </button>
          </div>

          {showEvalForm && (
            <div className="border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Дисципліна"
                value={evalForm.discipline}
                onChange={(e) => setEvalForm({ ...evalForm, discipline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Компетентність (0-40)</label>
                  <input
                    type="number" min={0} max={40}
                    value={evalForm.competence_score}
                    onChange={(e) => setEvalForm({ ...evalForm, competence_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Майстерність (0-30)</label>
                  <input
                    type="number" min={0} max={30}
                    value={evalForm.pedagogical_score}
                    onChange={(e) => setEvalForm({ ...evalForm, pedagogical_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Особисті якості (0-30)</label>
                  <input
                    type="number" min={0} max={30}
                    value={evalForm.personal_score}
                    onChange={(e) => setEvalForm({ ...evalForm, personal_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">Разом: {evalTotal} / 100</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Коефіцієнт (вручну)</label>
                  <input
                    type="number" step="0.05" min={0} max={2}
                    value={evalForm.coefficient}
                    onChange={(e) => setEvalForm({ ...evalForm, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Експерт (ПІБ)</label>
                  <input
                    type="text"
                    value={evalForm.evaluator_name}
                    onChange={(e) => setEvalForm({ ...evalForm, evaluator_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <textarea
                placeholder="Примітки"
                value={evalForm.notes}
                onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                rows={2}
              />
              <button
                onClick={handleAddEvaluation}
                disabled={savingEval}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingEval ? 'Збереження...' : 'Зберегти оцінку'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {evaluations.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Оцінок ще немає.</p>
            )}
            {evaluations.map((ev) => {
              const total = ev.competence_score + ev.pedagogical_score + ev.personal_score
              return (
                <div key={ev.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {ev.discipline || 'Заняття'} — {new Date(ev.evaluation_date).toLocaleDateString('uk-UA')}
                    </span>
                    <span className={`font-semibold ${total < 80 ? 'text-red-600' : 'text-green-600'}`}>
                      {total} / 100
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Коефіцієнт: {ev.coefficient} {ev.evaluator_name && `· Експерт: ${ev.evaluator_name}`}
                  </p>
                  {ev.notes && <p className="text-gray-500 text-xs mt-1">{ev.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
