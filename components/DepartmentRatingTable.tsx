import { DepartmentRatingSummary } from '@/lib/departmentRating';
import { RatingStatus } from '@/lib/rating';

const STATUS_DOT: Record<RatingStatus, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  excellent: 'bg-emerald-600',
};

const STATUS_LABEL: Record<RatingStatus, string> = {
  red: 'Нижче мінімуму',
  yellow: 'У межах норми',
  green: 'Ціль досягнута',
  excellent: 'Відмінно',
};

interface Props {
  summary: DepartmentRatingSummary;
}

export function DepartmentRatingTable({ summary }: Props) {
  const { lecturers, totalPoints, averagePoints, countByStatus, thresholds, academicYear } =
    summary;

  if (!thresholds) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800 text-sm">
        Пороги рейтингу для {academicYear} н.р. ще не налаштовані. Задайте їх вище, щоб побачити
        статус кожного викладача.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-gray-500">Разом балів</div>
          <div className="text-lg font-semibold">{totalPoints}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-gray-500">Середній бал</div>
          <div className="text-lg font-semibold">{averagePoints}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-gray-500">Нижче мінімуму</div>
          <div className="text-lg font-semibold text-red-600">{countByStatus.red}</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-xs text-gray-500">Ціль досягнута +</div>
          <div className="text-lg font-semibold text-green-600">
            {countByStatus.green + countByStatus.excellent}
          </div>
        </div>
      </div>

      {/* Per-lecturer table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Викладач</th>
              <th className="px-3 py-2">Бали</th>
              <th className="px-3 py-2">Прогрес</th>
              <th className="px-3 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {lecturers.map((l) => (
              <tr key={l.profile_id} className="border-t">
                <td className="px-3 py-2">{l.full_name}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {l.points} / {thresholds.target_threshold}
                </td>
                <td className="px-3 py-2 w-1/3">
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_DOT[l.status]}`}
                      style={{ width: `${l.percent}%` }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[l.status]}`} />
                    {STATUS_LABEL[l.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
