export const MILESTONES = [10, 25, 50, 100, 200, 400, 800];

export interface MilestoneProgress {
  total: number;
  achieved: number[];
  next: number | null;
  /** 0-100, percent of the way from the last achieved milestone to the next. */
  percent: number;
}

export function getMilestoneProgress(total: number): MilestoneProgress {
  const achieved = MILESTONES.filter((m) => m <= total);
  const next = MILESTONES.find((m) => m > total) ?? null;
  const prev = achieved.length > 0 ? achieved[achieved.length - 1] : 0;
  const percent = next === null ? 100 : Math.round(((total - prev) / (next - prev)) * 100);

  return { total, achieved, next, percent };
}
