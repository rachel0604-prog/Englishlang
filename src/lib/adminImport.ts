import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface ImportRoundInput {
  target_word: string;
  sentence_html: string;
  hint_text?: string | null;
  options: string[];
  correct_index: number;
  code_fragment: string;
}

export interface ImportCaseInput {
  case_title: string;
  rounds: ImportRoundInput[];
}

export interface ImportWeekInput {
  week_number: number;
  theme_title: string;
  source_note?: string | null;
  cases: ImportCaseInput[];
}

export type ValidationResult =
  | { ok: true; value: ImportWeekInput }
  | { ok: false; error: string };

export function validateWeekInput(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "JSON 最外層必須是一個物件" };
  }
  const data = raw as Record<string, unknown>;

  if (typeof data.week_number !== "number" || !Number.isInteger(data.week_number)) {
    return { ok: false, error: "week_number 必須是整數" };
  }
  if (typeof data.theme_title !== "string" || data.theme_title.trim() === "") {
    return { ok: false, error: "theme_title 必須是非空字串" };
  }
  if (data.source_note !== undefined && typeof data.source_note !== "string") {
    return { ok: false, error: "source_note 必須是字串" };
  }
  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    return { ok: false, error: "cases 必須是至少一筆的陣列" };
  }

  const cases: ImportCaseInput[] = [];
  for (let ci = 0; ci < data.cases.length; ci++) {
    const rawCase = data.cases[ci] as Record<string, unknown>;
    if (typeof rawCase !== "object" || rawCase === null) {
      return { ok: false, error: `cases[${ci}] 必須是物件` };
    }
    if (typeof rawCase.case_title !== "string" || rawCase.case_title.trim() === "") {
      return { ok: false, error: `cases[${ci}].case_title 必須是非空字串` };
    }
    if (!Array.isArray(rawCase.rounds) || rawCase.rounds.length === 0) {
      return { ok: false, error: `cases[${ci}].rounds 必須是至少一筆的陣列` };
    }

    const rounds: ImportRoundInput[] = [];
    for (let ri = 0; ri < rawCase.rounds.length; ri++) {
      const r = rawCase.rounds[ri] as Record<string, unknown>;
      const path = `cases[${ci}].rounds[${ri}]`;
      if (typeof r !== "object" || r === null) {
        return { ok: false, error: `${path} 必須是物件` };
      }
      if (typeof r.target_word !== "string" || r.target_word.trim() === "") {
        return { ok: false, error: `${path}.target_word 必須是非空字串` };
      }
      if (typeof r.sentence_html !== "string" || r.sentence_html.trim() === "") {
        return { ok: false, error: `${path}.sentence_html 必須是非空字串` };
      }
      if (r.hint_text !== undefined && r.hint_text !== null && typeof r.hint_text !== "string") {
        return { ok: false, error: `${path}.hint_text 必須是字串` };
      }
      if (
        !Array.isArray(r.options) ||
        r.options.length !== 4 ||
        !r.options.every((o) => typeof o === "string" && o.trim() !== "")
      ) {
        return { ok: false, error: `${path}.options 必須是 4 個非空字串的陣列` };
      }
      if (
        typeof r.correct_index !== "number" ||
        !Number.isInteger(r.correct_index) ||
        r.correct_index < 0 ||
        r.correct_index > 3
      ) {
        return { ok: false, error: `${path}.correct_index 必須是 0-3 的整數` };
      }
      if (typeof r.code_fragment !== "string" || r.code_fragment.trim() === "") {
        return { ok: false, error: `${path}.code_fragment 必須是非空字串` };
      }

      rounds.push({
        target_word: r.target_word,
        sentence_html: r.sentence_html,
        hint_text: (r.hint_text as string | null | undefined) ?? null,
        options: r.options as string[],
        correct_index: r.correct_index,
        code_fragment: r.code_fragment,
      });
    }

    cases.push({ case_title: rawCase.case_title, rounds });
  }

  return {
    ok: true,
    value: {
      week_number: data.week_number,
      theme_title: data.theme_title,
      source_note: (data.source_note as string | undefined) ?? null,
      cases,
    },
  };
}

export interface ImportResult {
  weekId: string;
  caseCount: number;
  roundCount: number;
}

/** Upserts by week_number: re-importing the same week replaces its cases/rounds. */
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
    if (updateError) throw new Error(`更新 weeks 失敗：${updateError.message}`);

    const { error: deleteError } = await supabase
      .from("cases")
      .delete()
      .eq("week_id", weekId);
    if (deleteError) throw new Error(`清除舊 cases 失敗：${deleteError.message}`);
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
      throw new Error(`新增 weeks 失敗：${insertError?.message ?? "unknown error"}`);
    }
    weekId = inserted.id;
  }

  let roundCount = 0;

  for (const c of input.cases) {
    const { data: insertedCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        week_id: weekId,
        case_title: c.case_title,
        source_note: input.source_note,
      })
      .select("id")
      .single();
    if (caseError || !insertedCase) {
      throw new Error(`新增 case「${c.case_title}」失敗：${caseError?.message ?? "unknown error"}`);
    }

    const roundsPayload = c.rounds.map((r, i) => ({
      case_id: insertedCase.id,
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
      throw new Error(`新增 rounds 失敗（case「${c.case_title}」）：${roundsError.message}`);
    }
    roundCount += roundsPayload.length;
  }

  return { weekId, caseCount: input.cases.length, roundCount };
}
