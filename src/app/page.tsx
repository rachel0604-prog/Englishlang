import Link from "next/link";
import { getActiveWeekOverview, getStreakDays } from "@/lib/data";
import { getTodayTask } from "@/lib/today";

// Reads live progress/streak data — must not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [overview, streak] = await Promise.all([
    getActiveWeekOverview(),
    getStreakDays(),
  ]);
  const todayTask = getTodayTask();

  const percent =
    overview && overview.totalRounds > 0
      ? Math.round((overview.solvedRounds / overview.totalRounds) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-navy-700 bg-navy-900 p-5">
        <p className="font-display text-xs text-accent">STREAK</p>
        <p className="mt-1 text-3xl font-display">{streak} 天</p>
        <p className="mt-1 text-sm text-parchment-200">連續解謎天數</p>
      </section>

      <section className="rounded-lg border border-navy-700 bg-parchment-100 p-5 text-ink">
        <p className="font-display text-xs text-navy-800">本週案件</p>
        {overview ? (
          <>
            <h1 className="mt-1 text-xl">
              Week {overview.week.week_number} — {overview.week.theme_title}
            </h1>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-parchment-200">
              <div
                className="h-full rounded-full bg-navy-800 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm">
              {overview.solvedRounds} / {overview.totalRounds} 題已解鎖（{percent}%）
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm">
            尚無進行中的案件。請至 <code>/admin</code> 匯入本週內容。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-navy-700 bg-navy-900 p-5">
        <p className="font-display text-xs text-accent">TODAY</p>
        <h2 className="mt-1 text-lg">{todayTask.title}</h2>
        <p className="mt-1 text-sm text-parchment-200">{todayTask.description}</p>
        <Link
          href="/today"
          className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy-950"
        >
          進入今日任務
        </Link>
      </section>
    </div>
  );
}
