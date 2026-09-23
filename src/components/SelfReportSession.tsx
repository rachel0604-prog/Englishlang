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
  const [isComplete, setIsComplete] = useState(initialProgress?.is_complete ?? false);
  const [saving, setSaving] = useState(false);

  async function toggleComplete() {
    setSaving(true);
    const next = !isComplete;

    const supabase = getSupabaseBrowserClient();
    await supabase.from("session_progress").upsert(
      {
        session_id: sessionId,
        is_complete: next,
        completed_at: next ? new Date().toISOString() : null,
      },
      { onConflict: "session_id" }
    );

    setIsComplete(next);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-cream-200 bg-cream-100 p-5 text-ink">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{instructions}</p>
      </div>

      <p className="text-xs text-ink-muted">
        This is a self-directed task — do it off-app, then mark it complete below.
      </p>

      <button
        onClick={toggleComplete}
        disabled={saving}
        className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
          isComplete ? "bg-mint-600" : "bg-sky-600"
        }`}
      >
        {saving ? "Saving..." : isComplete ? "Completed ✓ (tap to undo)" : "Mark Complete"}
      </button>
    </div>
  );
}
