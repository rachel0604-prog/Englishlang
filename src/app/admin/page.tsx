"use client";

import { useActionState, useState } from "react";
import { submitWeekContent, type SubmitState } from "./actions";

const initialState: SubmitState = { status: "idle", message: "" };

const PLACEHOLDER = `{
  "week_number": 1,
  "theme_title": "Should Remote Work Become the Norm?",
  "source_note": "Adapted from a BBC/Economist article",
  "cases": [
    {
      "case_title": "Case 01",
      "rounds": [
        {
          "target_word": "stalemate",
          "sentence_html": "...sentence, with the target word wrapped in <mark>word</mark>...",
          "hint_text": "Etymology or context clue",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_index": 1,
          "code_fragment": "3"
        }
      ]
    }
  ]
}`;

export default function AdminPage() {
  const [state, formAction, pending] = useActionState(submitWeekContent, initialState);
  const [content, setContent] = useState("");

  // Reset only after a successful import — keep the pasted JSON around on
  // error so a typo doesn't force re-pasting the whole week's content.
  const [handledStatus, setHandledStatus] = useState(state.status);
  if (state.status !== handledStatus) {
    setHandledStatus(state.status);
    if (state.status === "success") setContent("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-xs text-accent">ADMIN</p>
        <h1 className="text-lg">Import Content</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Paste this week&rsquo;s content JSON. Submitting writes it to the database and sets
          this week to active.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pin" className="mb-1 block text-xs text-ink-muted">
            PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-md border border-sky-300 bg-sky-100 px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-1 block text-xs text-ink-muted">
            Content JSON
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            className="w-full rounded-md border border-sky-300 bg-cream-100 px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-muted/60"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Importing..." : "Submit"}
        </button>
      </form>

      {state.status !== "idle" && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-green-600 bg-green-50 text-ink"
              : "border-red-600 bg-red-50 text-ink"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
