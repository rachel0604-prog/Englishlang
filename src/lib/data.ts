import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Case, Progress, Round, Settings, Week } from "@/lib/types";

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

export async function getProgressForRounds(
  roundIds: string[]
): Promise<Progress[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase || roundIds.length === 0) return [];

  const { data } = await supabase
    .from("progress")
    .select("*")
    .in("round_id", roundIds);

  return data ?? [];
}

export interface WeekOverview {
  week: Week;
  totalRounds: number;
  solvedRounds: number;
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

  const { data: cases } = await supabase
    .from("cases")
    .select("id")
    .eq("week_id", week.id);

  const caseIds = (cases ?? []).map((c) => c.id);
  if (caseIds.length === 0) {
    return { week, totalRounds: 0, solvedRounds: 0 };
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id")
    .in("case_id", caseIds);

  const roundIds = (rounds ?? []).map((r) => r.id);
  const totalRounds = roundIds.length;

  let solvedRounds = 0;
  if (roundIds.length > 0) {
    const { count } = await supabase
      .from("progress")
      .select("id", { count: "exact", head: true })
      .in("round_id", roundIds)
      .eq("is_solved", true);
    solvedRounds = count ?? 0;
  }

  return { week, totalRounds, solvedRounds };
}

export async function getWeekCasesWithRounds(
  weekId: string
): Promise<Array<Case & { rounds: Round[] }>> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .eq("week_id", weekId)
    .order("case_title", { ascending: true });

  if (!cases || cases.length === 0) return [];

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .in(
      "case_id",
      cases.map((c) => c.id)
    )
    .order("order_index", { ascending: true });

  return cases.map((c) => ({
    ...c,
    rounds: (rounds ?? []).filter((r) => r.case_id === c.id),
  }));
}

/** Consecutive-day streak counted back from today, based on solved_at dates. */
export async function getStreakDays(): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const { data } = await supabase
    .from("progress")
    .select("solved_at")
    .eq("is_solved", true)
    .not("solved_at", "is", null)
    .order("solved_at", { ascending: false });

  if (!data || data.length === 0) return 0;

  const solvedDates = new Set(
    data.map((row) => new Date(row.solved_at as string).toDateString())
  );

  let streak = 0;
  const cursor = new Date();
  // Allow today to be "not yet solved" without breaking the streak.
  if (!solvedDates.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (solvedDates.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Total words ever solved, across all weeks — not just the active one. */
export async function getTotalWordsLearned(): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("progress")
    .select("id", { count: "exact", head: true })
    .eq("is_solved", true);

  return count ?? 0;
}
