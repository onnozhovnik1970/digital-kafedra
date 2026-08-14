import * as XLSX from 'xlsx';
import { LecturerReportData, DepartmentReportData } from './exportData';

export function exportLecturerReportExcel(data: LecturerReportData) {
  const rows = data.items.map((item) => ({
    'Категорія': item.category,
    'Вид роботи': item.description,
    'Деталі': item.detail,
    'Бали': item.points,
  }));

  rows.push({ 'Категорія': '', 'Вид роботи': '', 'Деталі': 'РАЗОМ', 'Бали': data.totalPoints });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 45 }, { wch: 10 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Рейтинг');

  if (data.surveyInfo || data.expertEvaluations.length > 0) {
    const evalRows: Record<string, string | number>[] = [];

    if (data.surveyInfo) {
      evalRows.push({
        'Тип': 'Анкетування студентів',
        'Дата': '',
        'Дисципліна': '',
        'Бали / Оцінка': data.surveyInfo.score,
        'Коефіцієнт': data.surveyInfo.coefficient,
        'Експерт': '',
      });
    }

    for (const ev of data.expertEvaluations) {
      evalRows.push({
        'Тип': 'Експертна оцінка заняття',
        'Дата': new Date(ev.date).toLocaleDateString('uk-UA'),
        'Дисципліна': ev.discipline ?? '',
        'Бали / Оцінка': `${ev.total} / 100`,
        'Коефіцієнт': ev.coefficient,
        'Експерт': ev.evaluatorName ?? '',
      });
    }

    const evalWorksheet = XLSX.utils.json_to_sheet(evalRows);
    evalWorksheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 10 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, evalWorksheet, 'Анкетування та оцінка');
  }

  XLSX.writeFile(workbook, `Рейтинг_${data.fullName}_${data.academicYear}.xlsx`);
}

export function exportDepartmentReportExcel(data: DepartmentReportData) {
  const rows = data.rows.map((row, idx) => ({
    '№': idx + 1,
    'ПІБ': row.fullName,
    'Бали': row.totalPoints,
    'Статус': row.status,
  }));

  rows.push({ '№': '' as any, 'ПІБ': 'Разом / середній', 'Бали': data.totalPoints, 'Статус': `сер. ${data.averagePoints}` });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Рейтинг кафедри');

  XLSX.writeFile(workbook, `Рейтинг_кафедри_${data.departmentName}_${data.academicYear}.xlsx`);
}
