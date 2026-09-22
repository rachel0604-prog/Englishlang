"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Case, Progress, Round } from "@/lib/types";

interface RoundState {
  round: Round;
  caseTitle: string;
  isSolved: boolean;
  attempts: number;
}

interface CaseGameProps {
  weekTitle: string;
  cases: Array<Case & { rounds: Round[] }>;
  initialProgress: Progress[];
}

export default function CaseGame({ weekTitle, cases, initialProgress }: CaseGameProps) {
  const initialRounds = useMemo<RoundState[]>(() => {
    const progressByRound = new Map(initialProgress.map((p) => [p.round_id, p]));
    return cases.flatMap((c) =>
      c.rounds.map((round) => {
        const p = progressByRound.get(round.id);
        return {
          round,
          caseTitle: c.case_title,
          isSolved: p?.is_solved ?? false,
          attempts: p?.attempts ?? 0,
        };
      })
    );
  }, [cases, initialProgress]);

  const [rounds, setRounds] = useState<RoundState[]>(initialRounds);
  const [viewIndex, setViewIndex] = useState(() => {
    const firstUnsolved = initialRounds.findIndex((r) => !r.isSolved);
    return firstUnsolved === -1 ? initialRounds.length : firstUnsolved;
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);

  const allSolved = viewIndex >= rounds.length;
  const current = allSolved ? null : rounds[viewIndex];
  const solvedCount = rounds.filter((r) => r.isSolved).length;

  async function submitAnswer(optionIndex: number) {
    if (!current || feedback === "correct") return;

    const isCorrect = optionIndex === current.round.correct_index;
    const nextAttempts = current.attempts + 1;

    setSelected(optionIndex);
    setFeedback(isCorrect ? "correct" : "wrong");

    setRounds((prev) =>
      prev.map((r, i) =>
        i === viewIndex
          ? { ...r, isSolved: isCorrect, attempts: nextAttempts }
          : r
      )
    );

    const supabase = getSupabaseBrowserClient();
    await supabase.from("progress").upsert(
      {
        round_id: current.round.id,
        is_solved: isCorrect,
        solved_at: isCorrect ? new Date().toISOString() : null,
        attempts: nextAttempts,
      },
      { onConflict: "round_id" }
    );
  }

  function goNext() {
    setViewIndex((i) => i + 1);
    setSelected(null);
    setFeedback(null);
    setShowHint(false);
  }

  if (rounds.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No rounds for this week yet. Import content in <code>/admin</code> first.
      </p>
    );
  }

  if (allSolved) {
    const code = rounds.map((r) => r.round.code_fragment).join("");
    return (
      <div className="rounded-lg border border-sky-600 bg-cream-100 p-6 text-center text-ink">
        <p className="font-display text-xs text-sky-700">Case Unlocked</p>
        <h1 className="mt-2 text-xl">{weekTitle}</h1>
        <p className="mt-4 text-sm">This week&rsquo;s unlock code</p>
        <p className="font-display mt-2 text-3xl tracking-[0.3em] text-sky-700">
          {code}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span className="font-display">{current.caseTitle}</span>
        <span>
          {solvedCount} / {rounds.length} unlocked
        </span>
      </div>

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-5 text-ink">
        <p
          className="text-lg leading-relaxed [&_mark]:bg-sky-300 [&_mark]:px-1 [&_mark]:font-semibold"
          dangerouslySetInnerHTML={{ __html: current.round.sentence_html }}
        />

        {current.round.hint_text && (
          <button
            onClick={() => setShowHint((v) => !v)}
            className="mt-3 text-xs text-sky-700 underline underline-offset-2"
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        )}
        {showHint && current.round.hint_text && (
          <p className="mt-2 text-sm text-sky-700">{current.round.hint_text}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {current.round.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = i === current.round.correct_index;
          let stateClass = "border-sky-300 bg-sky-100 text-ink";
          if (feedback && isSelected && isCorrectOption) {
            stateClass = "border-green-600 bg-green-50 text-ink";
          } else if (feedback && isSelected && !isCorrectOption) {
            stateClass = "border-red-600 bg-red-50 text-ink";
          }

          return (
            <button
              key={i}
              onClick={() => submitAnswer(i)}
              disabled={feedback === "correct"}
              className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${stateClass}`}
            >
              <span className="font-display mr-2 text-sky-700">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {feedback === "wrong" && (
        <p className="text-sm text-red-600">Not quite — try again.</p>
      )}

      {feedback === "correct" && (
        <div className="rounded-lg border border-sky-600 bg-sky-50 p-4">
          <p className="text-sm text-ink-muted">
            Unlock code fragment:
            <span className="font-display ml-2 text-lg text-sky-700">
              {current.round.code_fragment}
            </span>
          </p>
          <button
            onClick={goNext}
            className="mt-3 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
