"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SessionProgress } from "@/lib/types";

export default function SelfReportSession({
  sessionId,
  instructions,
  initialProgress,
}: {
  sessionId: string;
  instructions: string;
  initialProgress: SessionProgress | null;
}) {
  const [responseText, setResponseText] = useState(initialProgress?.response_text ?? "");
  const [isComplete, setIsComplete] = useState(initialProgress?.is_complete ?? false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function save() {
    setSaving(true);
    setJustSaved(false);

    const supabase = getSupabaseBrowserClient();
    await supabase.from("session_progress").upsert(
      {
        session_id: sessionId,
        is_complete: true,
        completed_at: new Date().toISOString(),
        response_text: responseText.trim() === "" ? null : responseText,
      },
      { onConflict: "session_id" }
    );

    setIsComplete(true);
    setSaving(false);
    setJustSaved(true);
  }

  async function undo() {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("session_progress").upsert(
      {
        session_id: sessionId,
        is_complete: false,
        completed_at: null,
        response_text: responseText.trim() === "" ? null : responseText,
      },
      { onConflict: "session_id" }
    );
    setIsComplete(false);
    setSaving(false);
    setJustSaved(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-cream-200 bg-cream-100 p-5 text-ink">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{instructions}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="response" className="text-xs text-ink-muted">
          Your response — write it here, then bring it to your chat with Claude for
          correction and discussion.
        </label>
        <textarea
          id="response"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          rows={8}
          className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-ink"
          placeholder="Type your words, sentences, or writing piece here..."
        />
      </div>

      {isComplete ? (
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-mint-600 px-4 py-2 text-sm font-medium text-white">
            {justSaved ? "Saved ✓" : "Completed ✓"}
          </span>
          <button
            onClick={undo}
            disabled={saving}
            className="text-xs text-ink-muted underline underline-offset-2 disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      ) : (
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save & Mark Complete"}
        </button>
      )}
    </div>
  );
}
