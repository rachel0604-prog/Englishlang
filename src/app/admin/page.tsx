"use client";

import { useActionState, useState } from "react";
import { submitWeekContent, type SubmitState } from "./actions";

const initialState: SubmitState = { status: "idle", message: "" };

const PLACEHOLDER = `{
  "week_number": 1,
  "theme_title": "遠距工作是否該成為常態",
  "source_note": "改寫自 BBC/Economist 相關報導",
  "cases": [
    {
      "case_title": "Case 01",
      "rounds": [
        {
          "target_word": "stalemate",
          "sentence_html": "...句子，目標字用 <mark>word</mark> 包起來...",
          "hint_text": "詞源或語境線索",
          "options": ["選項A", "選項B", "選項C", "選項D"],
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
        <h1 className="text-lg">內容貼上頁</h1>
        <p className="mt-1 text-sm text-parchment-200">
          貼入本週內容 JSON，送出後會寫入資料庫並將該週設為 active。
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pin" className="mb-1 block text-xs text-parchment-200">
            PIN 碼
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            required
            autoComplete="off"
            className="w-full rounded-md border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-parchment-100"
          />
        </div>

        <div>
          <label htmlFor="content" className="mb-1 block text-xs text-parchment-200">
            內容 JSON
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            className="w-full rounded-md border border-navy-700 bg-parchment-100 px-3 py-2 font-mono text-xs text-ink placeholder:text-navy-700/50"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy-950 disabled:opacity-50"
        >
          {pending ? "匯入中..." : "送出"}
        </button>
      </form>

      {state.status !== "idle" && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-green-600 bg-green-900/30 text-parchment-100"
              : "border-red-600 bg-red-900/30 text-parchment-100"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
