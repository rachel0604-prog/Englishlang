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
    return { status: "error", message: "ADMIN_PIN isn't set on the server — add it to .env.local first." };
  }
  if (pin !== expectedPin) {
    return { status: "error", message: "Incorrect PIN." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { status: "error", message: "Invalid JSON — please check that the pasted content is valid JSON." };
  }

  const validation = validateWeekInput(parsed);
  if (!validation.ok) {
    return { status: "error", message: `Invalid content: ${validation.error}` };
  }

  try {
    const result = await importWeekContent(validation.value);
    return {
      status: "success",
      message: `Imported Week ${validation.value.week_number}: ${result.caseCount} case(s), ${result.roundCount} round(s) total. Status set to active.`,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error while writing to the database.",
    };
  }
}
