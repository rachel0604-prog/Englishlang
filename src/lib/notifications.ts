export const REMINDER_TITLE = "Case File";
export const REMINDER_BODY = "該進 Case File 了——今天的任務等你解鎖";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  return isNotificationSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function showReminderNotification(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(REMINDER_TITLE, {
        body: REMINDER_BODY,
        tag: "daily-reminder",
      });
    } else {
      new Notification(REMINDER_TITLE, { body: REMINDER_BODY });
    }
  } catch {
    // Notification display can fail silently (e.g. OS-level permission
    // revoked after the browser granted it); nothing actionable to do here.
  }
}

/**
 * Experimental, Chromium-only API for scheduling a notification ahead of
 * time even while the app is closed. No official TypeScript types exist for
 * it, so it's feature-detected and wrapped defensively — most browsers
 * (including Safari/iOS, the likely PWA target here) don't support it, and
 * callers should treat a `false` return as the expected common case, not
 * a failure to fix.
 */
export async function tryScheduleTriggeredReminders(
  registration: ServiceWorkerRegistration,
  morningTime: string,
  eveningTime: string
): Promise<boolean> {
  const w = window as unknown as { TimestampTrigger?: new (timestamp: number) => unknown };
  if (!("showTrigger" in Notification.prototype) || !w.TimestampTrigger) return false;

  try {
    for (const time of [morningTime, eveningTime]) {
      const [hours, minutes] = time.split(":").map(Number);
      const next = new Date();
      next.setHours(hours, minutes, 0, 0);
      if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);

      await registration.showNotification(REMINDER_TITLE, {
        body: REMINDER_BODY,
        tag: `reminder-${time}`,
        // @ts-expect-error showTrigger has no TS lib definition yet.
        showTrigger: new w.TimestampTrigger(next.getTime()),
      });
    }
    return true;
  } catch {
    return false;
  }
}

function todayReminderKey(slot: "morning" | "evening"): string {
  return `reminder-shown-${slot}-${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Fallback for browsers without Notification Triggers: fires (at most once
 * per day per slot) the first time the app is opened on/after a reminder
 * time, per the spec's "App 開啟時提醒" fallback.
 */
export function checkFallbackReminders(morningTime: string, eveningTime: string): void {
  if (typeof window === "undefined") return;
  if (getPermissionState() !== "granted") return;

  const now = new Date();
  const slots: Array<["morning" | "evening", string]> = [
    ["morning", morningTime],
    ["evening", eveningTime],
  ];

  for (const [slot, time] of slots) {
    const [hours, minutes] = time.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    if (now < scheduled) continue;

    const key = todayReminderKey(slot);
    if (localStorage.getItem(key)) continue;
    localStorage.setItem(key, "1");
    void showReminderNotification();
  }
}
