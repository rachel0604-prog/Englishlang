import Link from "next/link";
import { getActiveWeekOverview } from "@/lib/data";
import { getTodayTask, getWeekTaskList } from "@/lib/today";

// Depends on the current date and live progress data — must not be frozen
// at build time (a static build would show the build day's task forever).
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const todayTask = getTodayTask();
  const overview = await getActiveWeekOverview();
  const weekTasks = getWeekTaskList();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-navy-700 bg-parchment-100 p-5 text-ink">
        <p className="font-display text-xs text-navy-800">{todayTask.label}</p>
        <h1 className="mt-1 text-xl">{todayTask.title}</h1>
        <p className="mt-2 text-sm">{todayTask.description}</p>
      </section>

      <section className="rounded-lg border border-navy-700 bg-navy-900 p-5">
        <p className="font-display text-xs text-accent">本週任務總覽</p>
        <ul className="mt-3 flex flex-col gap-2">
          {weekTasks.map((task) => (
            <li
              key={task.day}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                task.day === todayTask.day
                  ? "bg-navy-700 text-parchment-100"
                  : "text-parchment-200"
              }`}
            >
              <span className="font-display text-xs">{task.label}</span>
              <span>{task.title}</span>
            </li>
          ))}
        </ul>

        {overview ? (
          <Link
            href={`/case/${overview.week.id}`}
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy-950"
          >
            開始
          </Link>
        ) : (
          <p className="mt-4 text-sm text-parchment-200">
            尚無進行中的案件，請先於 <code>/admin</code> 匯入本週內容。
          </p>
        )}
      </section>
    </div>
  );
}
