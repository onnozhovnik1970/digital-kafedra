interface ReminderEmailParams {
    fullName: string;
    points: number;
    targetThreshold: number;
    academicYear: string;
    siteUrl: string;
  }
  
  /** Returns a warm, colleague-toned reminder in Ukrainian — not a cold system notification. */
  export function buildReminderEmail({
    fullName,
    points,
    targetThreshold,
    academicYear,
    siteUrl,
  }: ReminderEmailParams): { subject: string; html: string } {
    const pointsNeeded = Math.max(0, targetThreshold - points);
    const firstName = fullName.split(' ')[0] || 'колего';
  
    const subject = `Цифровий завкаф: не забудьте оновити свій рейтинг за ${academicYear} н.р.`;
  
    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <p>Шановний(а) ${firstName},</p>
  
        <p>
          Здається, ви давно не додавали нових публікацій, кваліфікацій чи інших видів робіт
          до свого профілю в «Цифровому завкафі» — можливо, просто закрутились у справах! 😊
        </p>
  
        <p>
          Наразі ваш рейтинг за ${academicYear} н.р. становить
          <strong>${points} балів</strong> із <strong>${targetThreshold}</strong> потрібних для
          досягнення цільового показника — залишилось набрати ще
          <strong>${pointsNeeded} балів</strong>.
        </p>
  
        <p>
          Якщо за останній час з'явились нові публікації, сертифікати підвищення кваліфікації,
          чи інші види робіт згідно з Положенням про рейтингову оцінку — не забудьте внести їх,
          доки є час до підбиття підсумків.
        </p>
  
        <p style="margin: 24px 0;">
          <a href="${siteUrl}/dashboard"
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Перейти до кабінету
          </a>
        </p>
  
        <p style="color: #6b7280; font-size: 13px;">
          Це автоматичне нагадування надсилається раз на 1.5–2 місяці лише тим, хто ще не досяг
          цільового порогу рейтингу кафедри. Якщо ви вже все оновили — просто ігноруйте цей лист,
          наступне нагадування прийде не раніше ніж за ~6 тижнів.
        </p>
  
        <p style="color: #9ca3af; font-size: 12px;">— Цифровий завкаф</p>
      </div>
    `;
  
    return { subject, html };
  }
  