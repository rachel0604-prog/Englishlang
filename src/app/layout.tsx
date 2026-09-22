import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import Link from "next/link";
import ReminderChecker from "@/components/ReminderChecker";
import { getSettings } from "@/lib/data";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIZZAREA",
  description: "A 16-month vocabulary and business English training program.",
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
    statusBarStyle: "default",
    title: "LIZZAREA",
  },
};

export const viewport: Viewport = {
  themeColor: "#eaf6fb",
};

// The layout reads live settings (reminder times) on every request.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-50 text-ink">
        <header className="border-b border-sky-300 bg-sky-50">
          <nav className="mx-auto flex max-w-2xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-display text-sm tracking-wide text-sky-700">
              LIZZAREA
            </Link>
            <Link href="/today" className="text-sm text-ink-muted hover:text-sky-600">
              Today
            </Link>
            <Link href="/admin" className="text-sm text-ink-muted hover:text-sky-600">
              Admin
            </Link>
            <Link href="/settings" className="text-sm text-ink-muted hover:text-sky-600">
              Settings
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
