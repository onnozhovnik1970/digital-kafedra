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
