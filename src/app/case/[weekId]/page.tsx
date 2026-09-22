import { notFound } from "next/navigation";
import CaseGame from "@/components/CaseGame";
import { getProgressForRounds, getWeekById, getWeekCasesWithRounds } from "@/lib/data";

export default async function CasePage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;

  const week = await getWeekById(weekId);
  if (!week) notFound();

  const cases = await getWeekCasesWithRounds(weekId);
  const roundIds = cases.flatMap((c) => c.rounds.map((r) => r.id));
  const progress = await getProgressForRounds(roundIds);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-xs text-accent">
          WEEK {week.week_number}
        </p>
        <h1 className="text-lg">{week.theme_title}</h1>
      </div>
      <CaseGame weekTitle={week.theme_title} cases={cases} initialProgress={progress} />
    </div>
  );
}
