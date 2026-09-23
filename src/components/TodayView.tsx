"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessionWithStatus } from "@/lib/data";
import { SESSION_TYPE_LABEL } from "@/lib/sessionTypes";

const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

function SessionCard({ session }: { session: SessionWithStatus }) {
  return (
    <Link
      href={`/session/${session.id}`}
      className={`block rounded-lg border p-4 transition-colors ${
        session.isComplete
          ? "border-mint-300 bg-mint-50"
          : "border-sky-300 bg-sky-100 hover:bg-sky-50"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{session.time_of_day === "morning" ? "Morning · ~15 min" : "Evening · ~15 min"}</span>
        <span>{session.isComplete ? "✓ Done" : "Not done"}</span>
      </div>
      <p className="mt-1 font-display text-xs text-sky-700">
        {SESSION_TYPE_LABEL[session.session_type]}
      </p>
      <h3 className="mt-1 text-base text-ink">{session.title}</h3>
      {session.totalRounds !== undefined && (
        <p className="mt-1 text-xs text-ink-muted">
          {session.solvedRounds}/{session.totalRounds} words unlocked
        </p>
      )}
    </Link>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-sky-300 p-4 text-sm text-ink-muted">
      {label}: no session imported for this slot yet.
    </div>
  );
}

export default function TodayView({
  todayDayOfWeek,
  sessions,
}: {
  /** JS Date.getDay(): 0=Sun..6=Sat. 1-5 are Mon-Fri; 0/6 mean weekend. */
  todayDayOfWeek: number;
  sessions: SessionWithStatus[];
}) {
  const availableDays = [1, 2, 3, 4, 5].filter((d) => sessions.some((s) => s.day_of_week === d));
  const defaultDay = availableDays.includes(todayDayOfWeek) ? todayDayOfWeek : (availableDays[0] ?? 1);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const daySessions = sessions.filter((s) => s.day_of_week === selectedDay);
  const morning = daySessions.find((s) => s.time_of_day === "morning");
  const evening = daySessions.find((s) => s.time_of_day === "evening");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="font-display text-xs text-sky-700">
          {DAY_NAMES[selectedDay]}
          {selectedDay !== todayDayOfWeek && " (catch-up)"}
        </p>
        {morning ? <SessionCard session={morning} /> : <EmptySlot label="Morning" />}
        {evening ? <SessionCard session={evening} /> : <EmptySlot label="Evening" />}
      </section>

      <section className="rounded-lg border border-lavender-300 bg-lavender-100 p-5">
        <p className="font-display text-xs text-lavender-600">This Week&rsquo;s Schedule</p>
        <p className="mt-1 text-xs text-ink-muted">
          Tap any day to review or catch up on that day&rsquo;s sessions.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((day) => {
            const daySess = sessions.filter((s) => s.day_of_week === day);
            const doneCount = daySess.filter((s) => s.isComplete).length;
            return (
              <li key={day}>
                <button
                  onClick={() => setSelectedDay(day)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    day === selectedDay
                      ? "bg-lavender-300 text-ink"
                      : "text-ink-muted hover:bg-lavender-50"
                  }`}
                >
                  <span className="font-display text-xs">
                    {DAY_NAMES[day]}
                    {day === todayDayOfWeek && " · Today"}
                  </span>
                  <span>{daySess.length > 0 ? `${doneCount}/${daySess.length} done` : "No content yet"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
