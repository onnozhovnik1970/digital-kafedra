import { SupabaseClient } from '@supabase/supabase-js';
import { calculatePublicationPoints, calculateQualificationPoints } from './rating';
import { getSurveyCoefficient } from './surveyCoefficient';

export interface ReportItem {
  category: string;
  description: string;
  detail: string;
  points: number;
}

export interface SurveyInfo {
  score: number;
  coefficient: number;
}

export interface ExpertEvaluationSummary {
  date: string;
  discipline: string | null;
  total: number;
  coefficient: number;
  evaluatorName: string | null;
}

export interface LecturerReportData {
  fullName: string;
  academicYear: string;
  items: ReportItem[];
  totalPoints: number;
  surveyInfo: SurveyInfo | null;
  expertEvaluations: ExpertEvaluationSummary[];
}

export interface DepartmentReportRow {
  fullName: string;
  totalPoints: number;
  status: string;
}

export interface DepartmentReportData {
  departmentName: string;
  academicYear: string;
  rows: DepartmentReportRow[];
  totalPoints: number;
  averagePoints: number;
}

const publicationTypeLabels: Record<string, string> = {
  scopus_q1q2: 'Стаття Scopus/WoS Q1-Q2',
  scopus_q3q4: 'Стаття Scopus/WoS Q3-Q4',
  scopus_thesis: 'Матеріали конференції Scopus/WoS',
  monograph_scopus: 'Монографія (Scopus/WoS)',
  dteu_journal: 'Стаття у журналі ДТЕУ',
  professional_b: 'Стаття у фаховому виданні України кат. Б',
  eu_oecd: 'Стаття у закордонному виданні ЄС/ОЕСР',
  monograph: 'Монографія',
  textbook: 'Підручник/посібник',
  thesis_other: 'Тези конференції',
  popular: 'Науково-популярна публікація',
};

const qualificationTypeLabels: Record<string, string> = {
  advanced_training: 'Підвищення кваліфікації',
  internship: 'Стажування',
  foreign_language_cert: 'Сертифікат іноземної мови (TOEFL тощо)',
  foreign_language_b1: 'Сертифікат іноземної мови B1/B2',
  international_training: 'Міжнародне стажування',
  online_course: 'Онлайн курс',
  other: 'Інше',
};

/** Builds the itemized report for a single lecturer: every publication, qualification, and approved work entry as one row, plus survey/expert evaluation info. */
export async function getLecturerReportData(
  supabase: SupabaseClient,
  profileId: string,
  fullName: string,
  academicYear: string
): Promise<LecturerReportData> {
  const [{ data: pubs }, { data: quals }, { data: entries }, { data: survey }, { data: evaluations }] =
    await Promise.all([
      supabase
        .from('publications')
        .select('title, type, year, foreign_language, authors')
        .eq('profile_id', profileId),
      supabase
        .from('qualifications')
        .select('title, type, is_international, date_end')
        .eq('profile_id', profileId),
      supabase
        .from('work_entries')
        .select('description, quantity, points_awarded, year, work_types(name, category)')
        .eq('profile_id', profileId)
        .eq('status', 'approved'),
      supabase
        .from('student_survey_scores')
        .select('score')
        .eq('profile_id', profileId)
        .eq('academic_year', academicYear)
        .maybeSingle(),
      supabase
        .from('expert_evaluations')
        .select('evaluation_date, discipline, competence_score, pedagogical_score, personal_score, coefficient, evaluator_name')
        .eq('profile_id', profileId)
        .eq('academic_year', academicYear)
        .order('evaluation_date', { ascending: false }),
    ]);

  const items: ReportItem[] = [];

  for (const p of pubs ?? []) {
    items.push({
      category: 'Наукова робота (публікації)',
      description: publicationTypeLabels[p.type] ?? p.type,
      detail: `${p.title}${p.year ? ` (${p.year})` : ''}`,
      points: calculatePublicationPoints(p),
    });
  }

  for (const q of quals ?? []) {
    items.push({
      category: 'Підвищення кваліфікації',
      description: qualificationTypeLabels[q.type] ?? q.type,
      detail: `${q.title}${q.date_end ? ` (до ${new Date(q.date_end).toLocaleDateString('uk-UA')})` : ''}`,
      points: calculateQualificationPoints(q),
    });
  }

  for (const e of entries ?? []) {
    const workType = (e as any).work_types;
    items.push({
      category: workType?.category ?? 'Інші види робіт',
      description: workType?.name ?? 'Вид роботи',
      detail: `${e.description ?? ''}${e.quantity > 1 ? ` (×${e.quantity})` : ''}${e.year ? ` (${e.year})` : ''}`.trim(),
      points: e.points_awarded,
    });
  }

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);

  const surveyInfo: SurveyInfo | null = survey
    ? { score: survey.score, coefficient: getSurveyCoefficient(survey.score) }
    : null;

  const expertEvaluations: ExpertEvaluationSummary[] = (evaluations ?? []).map((ev) => ({
    date: ev.evaluation_date,
    discipline: ev.discipline,
    total: ev.competence_score + ev.pedagogical_score + ev.personal_score,
    coefficient: ev.coefficient,
    evaluatorName: ev.evaluator_name,
  }));

  return { fullName, academicYear, items, totalPoints, surveyInfo, expertEvaluations };
}

/** Builds the department-wide summary report (one row per lecturer) for a завкаф export. */
export async function getDepartmentReportData(
  supabase: SupabaseClient,
  departmentId: string,
  departmentName: string,
  academicYear: string
): Promise<DepartmentReportData> {
  const { getDepartmentRatingSummary } = await import('./departmentRating');
  const summary = await getDepartmentRatingSummary(supabase, departmentId, academicYear);

  const statusLabels: Record<string, string> = {
    red: 'Нижче мінімуму',
    yellow: 'У межах норми',
    green: 'Ціль досягнута',
    excellent: 'Відмінно',
  };

  const rows: DepartmentReportRow[] = summary.lecturers.map((l) => ({
    fullName: l.full_name,
    totalPoints: l.points,
    status: statusLabels[l.status] ?? l.status,
  }));

  return {
    departmentName,
    academicYear,
    rows,
    totalPoints: summary.totalPoints,
    averagePoints: summary.averagePoints,
  };
}

