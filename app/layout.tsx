import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "./components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kiawah Island Golf Trip 2026",
  description: "Track players, rounds, scores, and standings for the trip",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="min-h-screen">
          <header
            className="border-b"
            style={{
              background: "var(--augusta-green)",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-5 py-4 text-sm font-medium text-white">
              <Image
                src="/kiawah-logo.png"
                alt="Kiawah Island 2026 logo"
                width={44}
                height={44}
                className="rounded-sm border border-white/20"
                priority
              />
              <span className="mr-2 text-base font-semibold text-white">
                Kiawah Island Trip
              </span>
              <Link
                className="hidden hover:opacity-90 sm:inline"
                href="/"
                style={{ color: "var(--augusta-cream)" }}
              >
                Trip Home
              </Link>
              <Link
                className="hidden hover:opacity-90 sm:inline"
                href="/players"
                style={{ color: "var(--augusta-cream)" }}
              >
                Players
              </Link>
              <Link
                className="hidden hover:opacity-90 sm:inline"
                href="/rounds"
                style={{ color: "var(--augusta-cream)" }}
              >
                Rounds
              </Link>
              <Link
                className="hidden hover:opacity-90 sm:inline"
                href="/standings"
                style={{ color: "var(--augusta-cream)" }}
              >
                Standings
              </Link>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl px-5 py-10 pb-24 sm:pb-10">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
