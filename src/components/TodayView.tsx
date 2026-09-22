"use client";

import Link from "next/link";
import { useState } from "react";
import type { DailyTask } from "@/lib/today";

interface TodayViewProps {
  todayTask: DailyTask;
  weekTasks: DailyTask[];
  weekId: string | null;
}

export default function TodayView({ todayTask, weekTasks, weekId }: TodayViewProps) {
  const [selectedDay, setSelectedDay] = useState(todayTask.day);
  const selectedTask =
    weekTasks.find((t) => t.day === selectedDay) ?? todayTask;
  const isToday = selectedDay === todayTask.day;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-cream-200 bg-cream-100 p-5 text-ink">
        <p className="font-display text-xs text-sky-700">
          {selectedTask.label}
          {!isToday && " (catch-up)"}
        </p>
        <h1 className="mt-1 text-xl">{selectedTask.title}</h1>
        <p className="mt-2 text-sm">{selectedTask.description}</p>
      </section>

      <section className="rounded-lg border border-sky-300 bg-sky-100 p-5">
        <p className="font-display text-xs text-sky-700">This Week&rsquo;s Schedule</p>
        <p className="mt-1 text-xs text-ink-muted">
          Tap any day to review or catch up on that day&rsquo;s task.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {weekTasks.map((task) => (
            <li key={task.day}>
              <button
                onClick={() => setSelectedDay(task.day)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  task.day === selectedDay
                    ? "bg-sky-300 text-ink"
                    : "text-ink-muted hover:bg-sky-50"
                }`}
              >
                <span className="font-display text-xs">
                  {task.label}
                  {task.day === todayTask.day && " · Today"}
                </span>
                <span>{task.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {weekId ? (
          <Link
            href={`/case/${weekId}`}
            className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
          >
            Start
          </Link>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            No active case yet. Import this week&rsquo;s content in <code>/admin</code>.
          </p>
        )}
      </section>
    </div>
  );
}
