/** Student survey score -> coefficient, per Положення п.3.6. Informational only — does not multiply into rating points. */
export function getSurveyCoefficient(score: number): number {
    if (score > 4.5) return 1.1;
    if (score > 4.0) return 1.05;      // 4.1 - 4.5
    if (score === 4.0) return 1.0;
    if (score >= 3.8) return 0.95;     // 3.8 - 4.0 (exclusive of exactly 4.0, handled above)
    if (score >= 3.5) return 0.9;      // 3.5 - 3.7
    if (score >= 3.2) return 0.8;      // 3.2 - 3.4
    if (score >= 3.0) return 0.7;      // 3.0 - 3.1
    return 0.6;                        // below 3.0
  }
  