import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isQuizSession } from "@/lib/sessionTypes";
import type { SessionType } from "@/lib/types";

const SESSION_TYPES: SessionType[] = [
  "reading",
  "vocab_game",
  "root_context",
  "logic_puzzle",
  "listening",
  "rewrite",
  "spaced_review",
  "speaking",
  "writing_quiz",
];

export interface ImportRoundInput {
  target_word: string;
  sentence_html: string;
  hint_text?: string | null;
  options: string[];
  correct_index: number;
  code_fragment: string;
}

export interface ImportSessionInput {
  day_of_week: number;
  time_of_day: "morning" | "evening";
  session_type: SessionType;
  title: string;
  instructions: string;
  case_title?: string;
  rounds?: ImportRoundInput[];
}

export interface ImportWeekInput {
  week_number: number;
  theme_title: string;
  source_note?: string | null;
  sessions: ImportSessionInput[];
}

export type ValidationResult =
  | { ok: true; value: ImportWeekInput }
  | { ok: false; error: string };

type RoundValidationResult =
  | { ok: true; value: ImportRoundInput }
  | { ok: false; error: string };

function validateRound(r: Record<string, unknown>, path: string): RoundValidationResult {
  if (typeof r !== "object" || r === null) {
    return { ok: false, error: `${path} must be an object` };
  }
  if (typeof r.target_word !== "string" || r.target_word.trim() === "") {
    return { ok: false, error: `${path}.target_word must be a non-empty string` };
  }
  if (typeof r.sentence_html !== "string" || r.sentence_html.trim() === "") {
    return { ok: false, error: `${path}.sentence_html must be a non-empty string` };
  }
  if (r.hint_text !== undefined && r.hint_text !== null && typeof r.hint_text !== "string") {
    return { ok: false, error: `${path}.hint_text must be a string` };
  }
  if (
    !Array.isArray(r.options) ||
    r.options.length !== 4 ||
    !r.options.every((o) => typeof o === "string" && o.trim() !== "")
  ) {
    return { ok: false, error: `${path}.options must be an array of 4 non-empty strings` };
  }
  if (
    typeof r.correct_index !== "number" ||
    !Number.isInteger(r.correct_index) ||
    r.correct_index < 0 ||
    r.correct_index > 3
  ) {
    return { ok: false, error: `${path}.correct_index must be an integer from 0-3` };
  }
  if (typeof r.code_fragment !== "string" || r.code_fragment.trim() === "") {
    return { ok: false, error: `${path}.code_fragment must be a non-empty string` };
  }

  return {
    ok: true,
    value: {
      target_word: r.target_word,
      sentence_html: r.sentence_html,
      hint_text: (r.hint_text as string | null | undefined) ?? null,
      options: r.options as string[],
      correct_index: r.correct_index,
      code_fragment: r.code_fragment,
    },
  };
}

export function validateWeekInput(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "The top level of the JSON must be an object" };
  }
  const data = raw as Record<string, unknown>;

  if (typeof data.week_number !== "number" || !Number.isInteger(data.week_number)) {
    return { ok: false, error: "week_number must be an integer" };
  }
  if (typeof data.theme_title !== "string" || data.theme_title.trim() === "") {
    return { ok: false, error: "theme_title must be a non-empty string" };
  }
  if (data.source_note !== undefined && typeof data.source_note !== "string") {
    return { ok: false, error: "source_note must be a string" };
  }
  if (!Array.isArray(data.sessions) || data.sessions.length === 0) {
    return { ok: false, error: "sessions must be an array with at least one item" };
  }

  const sessions: ImportSessionInput[] = [];
  const seenSlots = new Set<string>();

  for (let si = 0; si < data.sessions.length; si++) {
    const s = data.sessions[si] as Record<string, unknown>;
    const path = `sessions[${si}]`;
    if (typeof s !== "object" || s === null) {
      return { ok: false, error: `${path} must be an object` };
    }
    if (
      typeof s.day_of_week !== "number" ||
      !Number.isInteger(s.day_of_week) ||
      s.day_of_week < 1 ||
      s.day_of_week > 5
    ) {
      return { ok: false, error: `${path}.day_of_week must be an integer from 1 (Mon) to 5 (Fri)` };
    }
    if (s.time_of_day !== "morning" && s.time_of_day !== "evening") {
      return { ok: false, error: `${path}.time_of_day must be "morning" or "evening"` };
    }
    if (typeof s.session_type !== "string" || !SESSION_TYPES.includes(s.session_type as SessionType)) {
      return {
        ok: false,
        error: `${path}.session_type must be one of: ${SESSION_TYPES.join(", ")}`,
      };
    }
    if (typeof s.title !== "string" || s.title.trim() === "") {
      return { ok: false, error: `${path}.title must be a non-empty string` };
    }
    if (typeof s.instructions !== "string" || s.instructions.trim() === "") {
      return { ok: false, error: `${path}.instructions must be a non-empty string` };
    }

    const slotKey = `${s.day_of_week}-${s.time_of_day}`;
    if (seenSlots.has(slotKey)) {
      return { ok: false, error: `${path}: duplicate day_of_week/time_of_day slot (${slotKey})` };
    }
    seenSlots.add(slotKey);

    const sessionType = s.session_type as SessionType;
    const entry: ImportSessionInput = {
      day_of_week: s.day_of_week,
      time_of_day: s.time_of_day,
      session_type: sessionType,
      title: s.title,
      instructions: s.instructions,
    };

    if (isQuizSession(sessionType)) {
      if (typeof s.case_title !== "string" || s.case_title.trim() === "") {
        return { ok: false, error: `${path}.case_title is required for quiz-type sessions` };
      }
      if (!Array.isArray(s.rounds) || s.rounds.length === 0) {
        return { ok: false, error: `${path}.rounds must be an array with at least one item` };
      }
      const rounds: ImportRoundInput[] = [];
      for (let ri = 0; ri < s.rounds.length; ri++) {
        const validated = validateRound(
          s.rounds[ri] as Record<string, unknown>,
          `${path}.rounds[${ri}]`
        );
        if (!validated.ok) return validated;
        rounds.push(validated.value);
      }
      entry.case_title = s.case_title;
      entry.rounds = rounds;
    }

    sessions.push(entry);
  }

  return {
    ok: true,
    value: {
      week_number: data.week_number,
      theme_title: data.theme_title,
      source_note: (data.source_note as string | undefined) ?? null,
      sessions,
    },
  };
}

export interface ImportResult {
  weekId: string;
  sessionCount: number;
  roundCount: number;
}

/** Upserts by week_number: re-importing the same week replaces its sessions/cases/rounds. */
export async function importWeekContent(input: ImportWeekInput): Promise<ImportResult> {
  const supabase = getSupabaseAdminClient();

  const { data: existingWeek } = await supabase
    .from("weeks")
    .select("id")
    .eq("week_number", input.week_number)
    .maybeSingle();

  let weekId: string;

  if (existingWeek) {
    weekId = existingWeek.id;
    const { error: updateError } = await supabase
      .from("weeks")
      .update({ theme_title: input.theme_title, status: "active" })
      .eq("id", weekId);
    if (updateError) throw new Error(`Failed to update weeks: ${updateError.message}`);

    // Sessions first (session_progress cascades), then cases (rounds cascade;
    // this also cascades any remaining quiz-session rows via case_id FK).
    const { error: deleteSessionsError } = await supabase
      .from("sessions")
      .delete()
      .eq("week_id", weekId);
    if (deleteSessionsError) throw new Error(`Failed to clear old sessions: ${deleteSessionsError.message}`);

    const { error: deleteCasesError } = await supabase.from("cases").delete().eq("week_id", weekId);
    if (deleteCasesError) throw new Error(`Failed to clear old cases: ${deleteCasesError.message}`);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("weeks")
      .insert({
        week_number: input.week_number,
        start_date: new Date().toISOString().slice(0, 10),
        theme_title: input.theme_title,
        status: "active",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw new Error(`Failed to insert weeks: ${insertError?.message ?? "unknown error"}`);
    }
    weekId = inserted.id;
  }

  let roundCount = 0;

  for (const s of input.sessions) {
    let caseId: string | null = null;

    if (s.case_title && s.rounds) {
      const { data: insertedCase, error: caseError } = await supabase
        .from("cases")
        .insert({
          week_id: weekId,
          case_title: s.case_title,
          source_note: input.source_note,
        })
        .select("id")
        .single();
      if (caseError || !insertedCase) {
        throw new Error(`Failed to insert case "${s.case_title}": ${caseError?.message ?? "unknown error"}`);
      }
      caseId = insertedCase.id;

      const roundsPayload = s.rounds.map((r, i) => ({
        case_id: caseId,
        order_index: i + 1,
        target_word: r.target_word,
        sentence_html: r.sentence_html,
        hint_text: r.hint_text,
        options: r.options,
        correct_index: r.correct_index,
        code_fragment: r.code_fragment,
      }));

      const { error: roundsError } = await supabase.from("rounds").insert(roundsPayload);
      if (roundsError) {
        throw new Error(`Failed to insert rounds for case "${s.case_title}": ${roundsError.message}`);
      }
      roundCount += roundsPayload.length;
    }

    const { error: sessionError } = await supabase.from("sessions").insert({
      week_id: weekId,
      day_of_week: s.day_of_week,
      time_of_day: s.time_of_day,
      session_type: s.session_type,
      title: s.title,
      instructions: s.instructions,
      case_id: caseId,
    });
    if (sessionError) {
      throw new Error(`Failed to insert session (day ${s.day_of_week}, ${s.time_of_day}): ${sessionError.message}`);
    }
  }

  return { weekId, sessionCount: input.sessions.length, roundCount };
}
