import TodayView from "@/components/TodayView";
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
    <TodayView
      todayTask={todayTask}
      weekTasks={weekTasks}
      weekId={overview?.week.id ?? null}
    />
  );
}
