import TodayView from "@/components/TodayView";
import { getActiveWeekOverview } from "@/lib/data";

// Depends on the current date and live progress data — must not be frozen
// at build time (a static build would show the build day's sessions forever).
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const overview = await getActiveWeekOverview();
  const todayDayOfWeek = new Date().getDay();

  if (!overview) {
    return (
      <p className="text-sm text-ink-muted">
        No active week yet. Import this week&rsquo;s content in <code>/admin</code>.
      </p>
    );
  }

  return <TodayView todayDayOfWeek={todayDayOfWeek} sessions={overview.sessions} />;
}
