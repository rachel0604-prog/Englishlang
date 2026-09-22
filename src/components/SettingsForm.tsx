"use client";

import { useState, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getPermissionState,
  registerServiceWorker,
  requestNotificationPermission,
  tryScheduleTriggeredReminders,
} from "@/lib/notifications";
import type { Settings } from "@/lib/types";

const PERMISSION_LABEL: Record<string, string> = {
  granted: "Granted",
  denied: "Denied (enable it in your browser's site settings)",
  default: "Not enabled yet",
  unsupported: "Not supported in this browser",
};

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [morningTime, setMorningTime] = useState(initialSettings.reminder_morning_time.slice(0, 5));
  const [eveningTime, setEveningTime] = useState(initialSettings.reminder_evening_time.slice(0, 5));
  // Notification.permission only exists in the browser, so it's read via
  // useSyncExternalStore with an "unsupported" server snapshot — that keeps
  // the first client render matching the server-rendered markup instead of
  // causing a hydration mismatch.
  const syncedPermission = useSyncExternalStore(
    () => () => {},
    getPermissionState,
    () => "unsupported"
  );
  const [permissionOverride, setPermissionOverride] = useState<string | null>(null);
  const permission = permissionOverride ?? syncedPermission;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clearConfirming, setClearConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setPermissionOverride(result);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("settings")
      .update({ reminder_morning_time: morningTime, reminder_evening_time: eveningTime })
      .eq("id", 1);

    if (error) {
      setMessage(`Save failed: ${error.message}`);
      setSaving(false);
      return;
    }

    if (permission === "granted") {
      const registration = await registerServiceWorker();
      const scheduled = registration
        ? await tryScheduleTriggeredReminders(registration, morningTime, eveningTime)
        : false;
      setMessage(
        scheduled
          ? "Saved, and both reminders are scheduled."
          : "Saved. This browser doesn't support pre-scheduled notifications — you'll get a reminder the next time you open the app after a reminder time. Consider also setting a backup reminder in your phone's Reminders app."
      );
    } else {
      setMessage("Reminder times saved. Enable notifications above to actually receive them.");
    }
    setSaving(false);
  }

  async function handleClearProgress() {
    if (!clearConfirming) {
      setClearConfirming(true);
      return;
    }
    setClearing(true);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("progress")
      .update({ is_solved: false, solved_at: null, attempts: 0 })
      .not("id", "is", null);

    setClearing(false);
    setClearConfirming(false);
    setMessage(error ? `Reset failed: ${error.message}` : "All progress has been reset.");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-sky-300 bg-sky-100 p-5">
        <p className="font-display text-xs text-sky-700">Notifications</p>
        <p className="mt-2 text-sm text-ink-muted">
          Status: {PERMISSION_LABEL[permission] ?? permission}
        </p>
        {permission !== "granted" && permission !== "unsupported" && (
          <button
            onClick={handleEnableNotifications}
            className="mt-3 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
          >
            Enable Notifications
          </button>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center justify-between text-sm text-ink">
            <span>Morning reminder</span>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="rounded-md border border-sky-300 bg-cream-50 px-3 py-1.5 text-ink"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-ink">
            <span>Evening reminder</span>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="rounded-md border border-sky-300 bg-cream-50 px-3 py-1.5 text-ink"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <p className="mt-3 text-xs text-ink-muted">
          The reminder text is fixed: &ldquo;Time for your Case File — today&rsquo;s task is
          waiting to be unlocked.&rdquo; Some browsers (especially mobile Safari) don&rsquo;t
          support pre-scheduled notifications — consider also setting a backup reminder in your
          phone&rsquo;s Reminders app.
        </p>
      </section>

      <section className="rounded-lg border border-pink-300 bg-pink-100 p-5">
        <p className="font-display text-xs text-pink-600">Reset</p>
        <p className="mt-2 text-sm text-ink-muted">
          Resets every round back to unsolved. This cannot be undone.
        </p>
        <button
          onClick={handleClearProgress}
          disabled={clearing}
          className={`mt-3 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            clearConfirming ? "bg-red-600" : "bg-pink-600"
          }`}
        >
          {clearing
            ? "Resetting..."
            : clearConfirming
              ? "Reset all progress? Click again to confirm"
              : "Reset"}
        </button>
      </section>

      {message && (
        <div className="rounded-md border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}
    </div>
  );
}
