import { SupabaseClient } from '@supabase/supabase-js';
import {
  RatingStatus,
  RatingThresholds,
  getRatingStatus,
  getProgressPercent,
  calculatePublicationPoints,
  calculateQualificationPoints,
} from './rating';

export interface LecturerRating {
  profile_id: string;
  full_name: string;
  points: number;
  status: RatingStatus;
  percent: number;
}

export interface DepartmentRatingSummary {
  academicYear: string;
  thresholds: RatingThresholds | null;
  lecturers: LecturerRating[];
  totalPoints: number;
  averagePoints: number;
  countByStatus: Record<RatingStatus, number>;
}

/**
 * Points for every lecturer in a department, computed server-side from raw
 * publications/qualifications rows (v1: all-time total, not year-scoped).
 */
export async function getDepartmentRatingSummary(
  supabase: SupabaseClient,
  departmentId: string,
  academicYear: string
): Promise<DepartmentRatingSummary> {
  const [{ data: profiles, error: profilesError }, { data: thresholds, error: thresholdsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('department_id', departmentId),
      supabase
        .from('rating_thresholds')
        .select('min_threshold, target_threshold, excellent_threshold')
        .eq('department_id', departmentId)
        .eq('academic_year', academicYear)
        .maybeSingle(),
    ]);

  if (profilesError) throw profilesError;
  if (thresholdsError) throw thresholdsError;

  const profileIds = (profiles ?? []).map((p) => p.id);

  const [{ data: pubs, error: pubsError }, { data: quals, error: qualsError }] =
    await Promise.all([
      profileIds.length > 0
        ? supabase
            .from('publications')
            .select('profile_id, type, foreign_language, authors')
            .in('profile_id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      profileIds.length > 0
        ? supabase
            .from('qualifications')
            .select('profile_id, type, is_international')
            .in('profile_id', profileIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (pubsError) throw pubsError;
  if (qualsError) throw qualsError;

  const pointsByProfile = new Map<string, number>();

  for (const row of pubs ?? []) {
    const pts = calculatePublicationPoints(row);
    pointsByProfile.set(row.profile_id, (pointsByProfile.get(row.profile_id) ?? 0) + pts);
  }
  for (const row of quals ?? []) {
    const pts = calculateQualificationPoints(row);
    pointsByProfile.set(row.profile_id, (pointsByProfile.get(row.profile_id) ?? 0) + pts);
  }

  const countByStatus: Record<RatingStatus, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    excellent: 0,
  };

  const lecturers: LecturerRating[] = (profiles ?? []).map((p) => {
    const points = pointsByProfile.get(p.id) ?? 0;
    const status = thresholds ? getRatingStatus(points, thresholds) : 'red';
    const percent = thresholds ? getProgressPercent(points, thresholds) : 0;
    if (thresholds) countByStatus[status]++;
    return { profile_id: p.id, full_name: p.full_name, points, status, percent };
  });

  lecturers.sort((a, b) => b.points - a.points);

  const totalPoints = lecturers.reduce((sum, l) => sum + l.points, 0);
  const averagePoints = lecturers.length > 0 ? Math.round(totalPoints / lecturers.length) : 0;

  return {
    academicYear,
    thresholds: thresholds ?? null,
    lecturers,
    totalPoints,
    averagePoints,
    countByStatus,
  };
}

