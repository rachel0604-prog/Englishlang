import { notFound } from "next/navigation";
import CaseGame from "@/components/CaseGame";
import SelfReportSession from "@/components/SelfReportSession";
import { getSessionDetail } from "@/lib/data";
import { SESSION_TYPE_LABEL, isQuizSession } from "@/lib/sessionTypes";

const DAY_LABELS = ["Sun", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sat"];

// Depends on live progress data — must not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const detail = await getSessionDetail(sessionId);
  if (!detail) notFound();

  const { session, caseData, roundsProgress, selfProgress } = detail;
  const dayLabel = DAY_LABELS[session.day_of_week] ?? "";
  const timeLabel = session.time_of_day === "morning" ? "Morning" : "Evening";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-xs text-accent">
          {dayLabel} · {timeLabel} · {SESSION_TYPE_LABEL[session.session_type]}
        </p>
        <h1 className="text-lg">{session.title}</h1>
      </div>

      {isQuizSession(session.session_type) && caseData ? (
        <CaseGame
          weekTitle={session.title}
          cases={[caseData]}
          initialProgress={roundsProgress}
        />
      ) : (
        <SelfReportSession
          sessionId={session.id}
          instructions={session.instructions}
          initialProgress={selfProgress}
        />
      )}
    </div>
  );
}
