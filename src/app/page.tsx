import Link from "next/link";
import { getActiveWeekOverview, getStreakDays, getTotalWordsLearned } from "@/lib/data";
import { getMilestoneProgress } from "@/lib/milestones";
import { getTodayTask } from "@/lib/today";

// Reads live progress/streak data — must not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [overview, streak, totalWords] = await Promise.all([
    getActiveWeekOverview(),
    getStreakDays(),
    getTotalWordsLearned(),
  ]);
  const todayTask = getTodayTask();
  const milestone = getMilestoneProgress(totalWords);

  const percent =
    overview && overview.totalRounds > 0
      ? Math.round((overview.solvedRounds / overview.totalRounds) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-sky-300 bg-sky-100 p-5">
        <p className="font-display text-xs text-sky-700">STREAK</p>
        <p className="mt-1 text-3xl font-display text-ink">{streak} days</p>
        <p className="mt-1 text-sm text-ink-muted">Consecutive days solved</p>
      </section>

      <section className="rounded-lg border border-sky-300 bg-sky-100 p-5">
        <p className="font-display text-xs text-sky-700">Words Learned</p>
        <p className="mt-1 text-3xl font-display text-ink">{totalWords} words</p>
        <p className="mt-1 text-sm text-ink-muted">Total words unlocked</p>

        <div className="mt-4">
          {milestone.next === null ? (
            <p className="text-sm text-ink-muted">
              You&rsquo;ve reached the top milestone ({milestone.achieved.at(-1)} words)!
            </p>
          ) : (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full rounded-full bg-sky-600 transition-all"
                  style={{ width: `${milestone.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {milestone.next - totalWords} words to go until the next milestone (
                {milestone.next} words)
              </p>
            </>
          )}
          {milestone.achieved.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {milestone.achieved.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-sky-600 px-2 py-0.5 text-xs text-sky-700"
                >
                  {m} words reached
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-cream-200 bg-cream-100 p-5 text-ink">
        <p className="font-display text-xs text-sky-700">This Week&rsquo;s Case</p>
        {overview ? (
          <>
            <h1 className="mt-1 text-xl">
              Week {overview.week.week_number} — {overview.week.theme_title}
            </h1>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-sky-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm">
              {overview.solvedRounds} / {overview.totalRounds} rounds unlocked ({percent}%)
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm">
            No active case yet. Import this week&rsquo;s content in <code>/admin</code>.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-sky-300 bg-sky-100 p-5">
        <p className="font-display text-xs text-sky-700">Today</p>
        <h2 className="mt-1 text-lg text-ink">{todayTask.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{todayTask.description}</p>
        <Link
          href="/today"
          className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Go to Today&rsquo;s Task
        </Link>
      </section>
    </div>
  );
}
