/** Ukrainian academic year runs Sept 1 - Aug 31. Sept 2026 -> '2026-2027'. */
export function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  