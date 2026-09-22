import type { Metadata, Viewport } from "next";
import { Special_Elite, Lora } from "next/font/google";
import Link from "next/link";
import ReminderChecker from "@/components/ReminderChecker";
import { getSettings } from "@/lib/data";
import "./globals.css";

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocab Case File",
  description: "英語詞彙密卷 — 16 個月詞彙與商務英文訓練計畫",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Case File",
  },
};

export const viewport: Viewport = {
  themeColor: "#16213a",
};

// The layout reads live settings (reminder times) on every request.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="zh-Hant"
      className={`${specialElite.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy-950 text-parchment-100">
        <header className="border-b border-navy-700 bg-navy-900">
          <nav className="mx-auto flex max-w-2xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-display text-sm tracking-wide">
              LIZZAREA
            </Link>
            <Link href="/today" className="text-sm text-parchment-200 hover:text-accent">
              今日任務
            </Link>
            <Link href="/admin" className="text-sm text-parchment-200 hover:text-accent">
              管理
            </Link>
            <Link href="/settings" className="text-sm text-parchment-200 hover:text-accent">
              設定
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        <ReminderChecker
          morningTime={settings.reminder_morning_time.slice(0, 5)}
          eveningTime={settings.reminder_evening_time.slice(0, 5)}
        />
      </body>
    </html>
  );
}
