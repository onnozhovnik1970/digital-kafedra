'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Props {
  departmentId: string;
  academicYear: string;
  initial?: {
    min_threshold: number;
    target_threshold: number;
    excellent_threshold: number | null;
  } | null;
}

export function RatingThresholdsForm({ departmentId, academicYear, initial }: Props) {
  const router = useRouter();
  const [minThreshold, setMinThreshold] = useState(initial?.min_threshold ?? 0);
  const [targetThreshold, setTargetThreshold] = useState(initial?.target_threshold ?? 1000);
  const [excellentThreshold, setExcellentThreshold] = useState<number | ''>(
    initial?.excellent_threshold ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: upsertError } = await supabase.from('rating_thresholds').upsert(
        {
          department_id: departmentId,
          academic_year: academicYear,
          min_threshold: minThreshold,
          target_threshold: targetThreshold,
          excellent_threshold: excellentThreshold === '' ? null : excellentThreshold,
        },
        { onConflict: 'department_id,academic_year' }
      );

      if (upsertError) {
        setError(upsertError.message);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Невідома помилка');
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="max-w-md space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-gray-800">
        Порогові значення рейтингу — {academicYear} н.р.
      </h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Мінімум (червона зона нижче)</label>
        <input
          type="number"
          value={minThreshold}
          onChange={(e) => setMinThreshold(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Ціль (зелена зона від)</label>
        <input
          type="number"
          value={targetThreshold}
          onChange={(e) => setTargetThreshold(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Відмінно (необов'язково)
        </label>
        <input
          type="number"
          value={excellentThreshold}
          onChange={(e) =>
            setExcellentThreshold(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {success && <p className="text-green-600 text-sm">✅ Збережено</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? 'Збереження...' : 'Зберегти'}
      </button>
    </div>
  );
}
