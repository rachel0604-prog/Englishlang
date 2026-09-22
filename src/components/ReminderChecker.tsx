"use client";

import { useEffect } from "react";
import { checkFallbackReminders, registerServiceWorker } from "@/lib/notifications";

export default function ReminderChecker({
  morningTime,
  eveningTime,
}: {
  morningTime: string;
  eveningTime: string;
}) {
  useEffect(() => {
    void registerServiceWorker();
    checkFallbackReminders(morningTime, eveningTime);
  }, [morningTime, eveningTime]);

  return null;
}
