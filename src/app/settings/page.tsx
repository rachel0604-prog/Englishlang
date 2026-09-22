import SettingsForm from "@/components/SettingsForm";
import { getSettings } from "@/lib/data";

// Reads live settings — must not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-xs text-accent">SETTINGS</p>
        <h1 className="text-lg">設定</h1>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
