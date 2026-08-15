import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  calculatePublicationPoints,
  calculateQualificationPoints,
  getRatingStatus,
} from '@/lib/rating';
import { getCurrentAcademicYear } from '@/lib/academicYear';
import { buildReminderEmail } from '@/lib/reminderEmail';

const INACTIVITY_THRESHOLD_DAYS = 42; // ~6 weeks
const REMINDER_COOLDOWN_DAYS = 42;    // don't remind the same person more than once per ~6 weeks

export async function GET(request: NextRequest) {
  // Vercel automatically sends `Authorization: Bearer $CRON_SECRET` for scheduled
  // invocations when the CRON_SECRET env var is set — this rejects any other caller.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://digital-kafedra.vercel.app';
  const academicYear = getCurrentAcademicYear();

  const { data: departments, error: deptError } = await supabase.from('departments').select('id');
  if (deptError) return NextResponse.json({ error: deptError.message }, { status: 500 });

  const results: { profileId: string; sent: boolean; reason: string }[] = [];

  for (const dept of departments ?? []) {
    const { data: threshold } = await supabase
      .from('rating_thresholds')
      .select('min_threshold, target_threshold, excellent_threshold')
      .eq('department_id', dept.id)
      .eq('academic_year', academicYear)
      .maybeSingle();

    if (!threshold) continue; // no threshold configured for this department yet

    const { data: lecturers } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('department_id', dept.id);

    for (const lecturer of lecturers ?? []) {
      const [{ data: pubs }, { data: quals }, { data: entries }] = await Promise.all([
        supabase
          .from('publications')
          .select('type, foreign_language, authors, created_at')
          .eq('profile_id', lecturer.id),
        supabase
          .from('qualifications')
          .select('type, is_international, created_at')
          .eq('profile_id', lecturer.id),
        supabase
          .from('work_entries')
          .select('points_awarded, status, created_at')
          .eq('profile_id', lecturer.id)
          .eq('status', 'approved'),
      ]);

      const points =
        (pubs ?? []).reduce((s, p) => s + calculatePublicationPoints(p), 0) +
        (quals ?? []).reduce((s, q) => s + calculateQualificationPoints(q), 0) +
        (entries ?? []).reduce((s, e) => s + (e.points_awarded ?? 0), 0);

      const status = getRatingStatus(points, threshold);
      if (status === 'green' || status === 'excellent') {
        results.push({ profileId: lecturer.id, sent: false, reason: 'above threshold' });
        continue;
      }

      const activityDates = [
        ...(pubs ?? []).map((p) => p.created_at),
        ...(quals ?? []).map((q) => q.created_at),
        ...(entries ?? []).map((e) => e.created_at),
      ];
      const lastActivity =
        activityDates.length > 0
          ? new Date(Math.max(...activityDates.map((d) => new Date(d).getTime())))
          : new Date(lecturer.created_at);

      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < INACTIVITY_THRESHOLD_DAYS) {
        results.push({ profileId: lecturer.id, sent: false, reason: 'recently active' });
        continue;
      }

      const { data: lastReminder } = await supabase
        .from('reminder_log')
        .select('sent_at')
        .eq('profile_id', lecturer.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReminder) {
        const daysSinceReminder = (Date.now() - new Date(lastReminder.sent_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceReminder < REMINDER_COOLDOWN_DAYS) {
          results.push({ profileId: lecturer.id, sent: false, reason: 'reminded recently' });
          continue;
        }
      }

      if (!lecturer.email) {
        results.push({ profileId: lecturer.id, sent: false, reason: 'no email' });
        continue;
      }

      const { subject, html } = buildReminderEmail({
        fullName: lecturer.full_name ?? 'колего',
        points,
        targetThreshold: threshold.target_threshold,
        academicYear,
        siteUrl,
      });

      await resend.emails.send({
        from: 'Цифровий завкаф <noreply@yourdomain.com>', // replace with your verified Resend sending domain
        to: lecturer.email,
        subject,
        html,
      });

      await supabase.from('reminder_log').insert({
        profile_id: lecturer.id,
        points_at_send: points,
        target_at_send: threshold.target_threshold,
      });

      results.push({ profileId: lecturer.id, sent: true, reason: 'reminder sent' });
    }
  }

  return NextResponse.json({ academicYear, results });
}
