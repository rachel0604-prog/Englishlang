import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Case,
  Progress,
  Round,
  Session,
  SessionProgress,
  Settings,
  Week,
} from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  reminder_morning_time: "08:00",
  reminder_evening_time: "18:00",
  push_subscription: null,
};

export async function getSettings(): Promise<Settings> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return data ?? DEFAULT_SETTINGS;
}

export async function getWeekById(weekId: string): Promise<Week | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("weeks")
    .select("*")
    .eq("id", weekId)
    .maybeSingle();

  return data ?? null;
}

export interface SessionWithStatus extends Session {
  isComplete: boolean;
  totalRounds?: number;
  solvedRounds?: number;
}

const TIME_ORDER: Record<Session["time_of_day"], number> = { morning: 0, evening: 1 };

/** All 10 sessions for a week, each annotated with completion status. */
export async function getWeekSessionsWithStatus(weekId: string): Promise<SessionWithStatus[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: sessionsRaw } = await supabase.from("sessions").select("*").eq("week_id", weekId);
  const sessions = (sessionsRaw ?? []).sort((a, b) =>
    a.day_of_week !== b.day_of_week
      ? a.day_of_week - b.day_of_week
      : TIME_ORDER[a.time_of_day as Session["time_of_day"]] -
        TIME_ORDER[b.time_of_day as Session["time_of_day"]]
  );

  if (sessions.length === 0) return [];

  const caseIds = sessions.filter((s) => s.case_id).map((s) => s.case_id as string);
  const sessionIds = sessions.map((s) => s.id);

  const [{ data: rounds }, { data: sessionProgressRows }] = await Promise.all([
    caseIds.length > 0
      ? supabase.from("rounds").select("id, case_id").in("case_id", caseIds)
      : Promise.resolve({ data: [] as Array<{ id: string; case_id: string }> }),
    supabase.from("session_progress").select("*").in("session_id", sessionIds),
  ]);

  const roundIds = (rounds ?? []).map((r) => r.id);
  const { data: progressRows } =
    roundIds.length > 0
      ? await supabase.from("progress").select("round_id, is_solved").in("round_id", roundIds)
      : { data: [] as Array<{ round_id: string; is_solved: boolean }> };

  const solvedRoundIds = new Set(
    (progressRows ?? []).filter((p) => p.is_solved).map((p) => p.round_id)
  );
  const roundsByCase = new Map<string, string[]>();
  for (const r of rounds ?? []) {
    const arr = roundsByCase.get(r.case_id) ?? [];
    arr.push(r.id);
    roundsByCase.set(r.case_id, arr);
  }
  const selfProgressBySession = new Map(
    (sessionProgressRows ?? []).map((sp) => [sp.session_id, sp as SessionProgress])
  );

  return sessions.map((s) => {
    if (s.case_id) {
      const roundIdsForCase = roundsByCase.get(s.case_id) ?? [];
      const solved = roundIdsForCase.filter((id) => solvedRoundIds.has(id)).length;
      return {
        ...s,
        totalRounds: roundIdsForCase.length,
        solvedRounds: solved,
        isComplete: roundIdsForCase.length > 0 && solved === roundIdsForCase.length,
      };
    }
    const sp = selfProgressBySession.get(s.id);
    return { ...s, isComplete: sp?.is_complete ?? false };
  });
}

export interface WeekOverview {
  week: Week;
  totalSessions: number;
  completedSessions: number;
  sessions: SessionWithStatus[];
}

export async function getActiveWeekOverview(): Promise<WeekOverview | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("status", "active")
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!week) return null;

  const sessions = await getWeekSessionsWithStatus(week.id);
  const completedSessions = sessions.filter((s) => s.isComplete).length;

  return { week, totalSessions: sessions.length, completedSessions, sessions };
}

export interface SessionDetail {
  session: Session;
  caseData: (Case & { rounds: Round[] }) | null;
  roundsProgress: Progress[];
  selfProgress: SessionProgress | null;
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  if (session.case_id) {
    const [{ data: caseRow }, { data: rounds }] = await Promise.all([
      supabase.from("cases").select("*").eq("id", session.case_id).maybeSingle(),
      supabase
        .from("rounds")
        .select("*")
        .eq("case_id", session.case_id)
        .order("order_index", { ascending: true }),
    ]);

    const roundIds = (rounds ?? []).map((r) => r.id);
    const { data: progress } =
      roundIds.length > 0
        ? await supabase.from("progress").select("*").in("round_id", roundIds)
        : { data: [] as Progress[] };

    return {
      session,
      caseData: caseRow ? { ...caseRow, rounds: rounds ?? [] } : null,
      roundsProgress: progress ?? [],
      selfProgress: null,
    };
  }

  const { data: selfProgress } = await supabase
    .from("session_progress")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  return { session, caseData: null, roundsProgress: [], selfProgress: selfProgress ?? null };
}

/** Consecutive-day streak, based on either a solved round or a self-reported
 * session completion on that day. */
export async function getStreakDays(): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const [{ data: progressRows }, { data: sessionRows }] = await Promise.all([
    supabase.from("progress").select("solved_at").eq("is_solved", true).not("solved_at", "is", null),
    supabase
      .from("session_progress")
      .select("completed_at")
      .eq("is_complete", true)
      .not("completed_at", "is", null),
  ]);

  const activeDates = new Set<string>();
  for (const row of progressRows ?? []) {
    activeDates.add(new Date(row.solved_at as string).toDateString());
  }
  for (const row of sessionRows ?? []) {
    activeDates.add(new Date(row.completed_at as string).toDateString());
  }

  if (activeDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  // Allow today to be "not yet done" without breaking the streak.
  if (!activeDates.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (activeDates.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Total words ever solved via quiz-type sessions, across all weeks. */
export async function getTotalWordsLearned(): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("progress")
    .select("id", { count: "exact", head: true })
    .eq("is_solved", true);

  return count ?? 0;
}
