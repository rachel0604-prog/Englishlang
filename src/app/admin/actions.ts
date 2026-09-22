"use server";

import { importWeekContent, validateWeekInput } from "@/lib/adminImport";

export interface SubmitState {
  status: "idle" | "error" | "success";
  message: string;
}

export async function submitWeekContent(
  _prevState: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const pin = String(formData.get("pin") ?? "");
  const jsonText = String(formData.get("content") ?? "");

  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedPin) {
    return { status: "error", message: "伺服器尚未設定 ADMIN_PIN，請先在 .env.local 加入。" };
  }
  if (pin !== expectedPin) {
    return { status: "error", message: "PIN 碼錯誤。" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { status: "error", message: "JSON 格式錯誤，請確認貼上的內容是合法 JSON。" };
  }

  const validation = validateWeekInput(parsed);
  if (!validation.ok) {
    return { status: "error", message: `內容格式錯誤：${validation.error}` };
  }

  try {
    const result = await importWeekContent(validation.value);
    return {
      status: "success",
      message: `已匯入 Week ${validation.value.week_number}：${result.caseCount} 個案件、共 ${result.roundCount} 題，狀態已設為 active。`,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "寫入資料庫時發生未知錯誤。",
    };
  }
}
