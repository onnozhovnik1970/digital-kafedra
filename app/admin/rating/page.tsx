import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getDepartmentThreshold } from '@/lib/rating';
import { getDepartmentRatingSummary } from '@/lib/departmentRating';
import { RatingThresholdsForm } from '@/components/RatingThresholdsForm';
import { DepartmentRatingTable } from '@/components/DepartmentRatingTable';

/** Ukrainian academic year runs Sept 1 - Aug 31. Sept 2026 -> '2026-2027'. */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function AdminRatingPage({ searchParams }: PageProps) {
  const { year } = await searchParams;
  const academicYear = year ?? getCurrentAcademicYear();

  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, department_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'head') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">
          Доступ до цієї сторінки має лише завідувач кафедри.
        </p>
      </div>
    );
  }

  if (!profile.department_id) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">
          Вашому профілю не призначено кафедру. Зверніться до адміністратора.
        </p>
      </div>
    );
  }

  const [thresholds, summary] = await Promise.all([
    getDepartmentThreshold(supabase, profile.department_id, academicYear),
    getDepartmentRatingSummary(supabase, profile.department_id, academicYear),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Рейтинг кафедри</h1>
        <p className="text-sm text-gray-500">{academicYear} навчальний рік</p>
      </div>

      <RatingThresholdsForm
        departmentId={profile.department_id}
        academicYear={academicYear}
        initial={thresholds}
      />

      <DepartmentRatingTable summary={summary} />
    </div>
  );
}
