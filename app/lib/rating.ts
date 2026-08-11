import { SupabaseClient } from '@supabase/supabase-js';

export type RatingStatus = 'red' | 'yellow' | 'green' | 'excellent';

export interface RatingThresholds {
  min_threshold: number;
  target_threshold: number;
  excellent_threshold: number | null;
}

interface PublicationRow {
  type: string;
  foreign_language: boolean | null;
  authors: string | null;
}

interface QualificationRow {
  type: string;
  is_international: boolean | null;
}

/** Same formula as getPoints() in app/publications/page.tsx */
export function calculatePublicationPoints(pub: PublicationRow): number {
  let points = 0;
  switch (pub.type) {
    case 'scopus_q1q2': points = 250; break;
    case 'scopus_q3q4': points = 200; break;
    case 'scopus_thesis': points = 100; break;
    case 'monograph_scopus': points = 120; break;
    case 'professional_b': points = 60; break;
    case 'dteu_journal': points = 70; break;
    case 'eu_oecd': points = 60; break;
    case 'monograph': points = 70; break;
    case 'textbook': points = 60; break;
    case 'popular': points = 10; break;
    case 'thesis_other': points = 50; break;
    default: points = 10;
  }

  if (pub.foreign_language) {
    points = Math.round(points * 1.5);
  }

  if (pub.authors && pub.authors.trim() !== '') {
    const coAuthorsCount = pub.authors.split(',').length;
    const totalAuthors = coAuthorsCount + 1;
    points = Math.round(points / totalAuthors);
  }

  return points;
}

/** Same formula as getPoints() in app/qualifications/page.tsx */
export function calculateQualificationPoints(qual: QualificationRow): number {
  switch (qual.type) {
    case 'advanced_training': return qual.is_international ? 700 : 300;
    case 'internship': return qual.is_international ? 700 : 300;
    case 'foreign_language_cert': return 1000;
    case 'foreign_language_b1': return 500;
    case 'international_training': return 700;
    case 'online_course': return 50;
    default: return 50;
  }
}

/**
 * Sum of points from publications + qualifications + approved work_entries
 * for one lecturer. v1: all-time total, not scoped to a single academic year.
 */
export async function getLecturerRatingPoints(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const [
    { data: pubs, error: pubsError },
    { data: quals, error: qualsError },
    { data: entries, error: entriesError },
  ] = await Promise.all([
    supabase
      .from('publications')
      .select('type, foreign_language, authors')
      .eq('profile_id', profileId),
    supabase
      .from('qualifications')
      .select('type, is_international')
      .eq('profile_id', profileId),
    supabase
      .from('work_entries')
      .select('points_awarded')
      .eq('profile_id', profileId)
      .eq('status', 'approved'),
  ]);

  if (pubsError) throw pubsError;
  if (qualsError) throw qualsError;
  if (entriesError) throw entriesError;

  const pubsTotal = (pubs ?? []).reduce((sum, row) => sum + calculatePublicationPoints(row), 0);
  const qualsTotal = (quals ?? []).reduce((sum, row) => sum + calculateQualificationPoints(row), 0);
  const entriesTotal = (entries ?? []).reduce((sum, row) => sum + (row.points_awarded ?? 0), 0);

  return pubsTotal + qualsTotal + entriesTotal;
}

/**
 * Fetches the configured threshold for a department/year.
 * Returns null if the department head hasn't set one yet.
 */
export async function getDepartmentThreshold(
  supabase: SupabaseClient,
  departmentId: string,
  academicYear: string
): Promise<RatingThresholds | null> {
  const { data, error } = await supabase
    .from('rating_thresholds')
    .select('min_threshold, target_threshold, excellent_threshold')
    .eq('department_id', departmentId)
    .eq('academic_year', academicYear)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Maps points -> a color-coded status given the department's thresholds.
 */
export function getRatingStatus(points: number, thresholds: RatingThresholds): RatingStatus {
  if (thresholds.excellent_threshold != null && points >= thresholds.excellent_threshold) {
    return 'excellent';
  }
  if (points >= thresholds.target_threshold) return 'green';
  if (points >= thresholds.min_threshold) return 'yellow';
  return 'red';
}

/** Percentage toward the target threshold, capped at 100 for bar width. */
export function getProgressPercent(points: number, thresholds: RatingThresholds): number {
  if (thresholds.target_threshold <= 0) return 0;
  return Math.min(100, Math.round((points / thresholds.target_threshold) * 100));
}
