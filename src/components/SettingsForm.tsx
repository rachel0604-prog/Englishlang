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
  granted: "已授權",
  denied: "已拒絕（請至瀏覽器網站設定手動開啟）",
  default: "尚未授權",
  unsupported: "此瀏覽器不支援通知",
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
      setMessage(`儲存失敗：${error.message}`);
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
          ? "已儲存，並排定兩則提醒通知。"
          : "已儲存。此瀏覽器不支援預先排程通知，開啟 App 時若已過提醒時間會即時提醒；建議另外在手機的提醒事項 App 設定備援提醒。"
      );
    } else {
      setMessage("已儲存提醒時間。要收到通知，請先開啟通知授權。");
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
    setMessage(error ? `清除失敗：${error.message}` : "已清除全部進度。");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-navy-700 bg-navy-900 p-5">
        <p className="font-display text-xs text-accent">通知</p>
        <p className="mt-2 text-sm text-parchment-200">
          通知狀態：{PERMISSION_LABEL[permission] ?? permission}
        </p>
        {permission !== "granted" && permission !== "unsupported" && (
          <button
            onClick={handleEnableNotifications}
            className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy-950"
          >
            開啟通知授權
          </button>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center justify-between text-sm">
            <span>早上提醒</span>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="rounded-md border border-navy-700 bg-navy-950 px-3 py-1.5 text-parchment-100"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>晚上提醒</span>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="rounded-md border border-navy-700 bg-navy-950 px-3 py-1.5 text-parchment-100"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy-950 disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存設定"}
        </button>

        <p className="mt-3 text-xs text-parchment-200">
          通知內容固定為：「該進 Case File 了——今天的任務等你解鎖」。部分瀏覽器（尤其手機
          Safari）不支援預先排程通知，建議另外在手機的提醒事項 App 設定備援提醒。
        </p>
      </section>

      <section className="rounded-lg border border-navy-700 bg-navy-900 p-5">
        <p className="font-display text-xs text-accent">清除進度</p>
        <p className="mt-2 text-sm text-parchment-200">
          將所有題目的解鎖狀態重設為未解鎖，此動作無法復原。
        </p>
        <button
          onClick={handleClearProgress}
          disabled={clearing}
          className={`mt-3 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            clearConfirming
              ? "bg-red-700 text-parchment-100"
              : "bg-navy-700 text-parchment-100"
          }`}
        >
          {clearing ? "清除中..." : clearConfirming ? "確定要清除全部進度？再按一次確認" : "清除進度"}
        </button>
      </section>

      {message && (
        <div className="rounded-md border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-parchment-100">
          {message}
        </div>
      )}
    </div>
  );
}
