"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/rounds", label: "Rounds" },
  { href: "/standings", label: "Standings" },
  { href: "/players", label: "Players" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/70 bg-white/95 backdrop-blur sm:hidden">
      <ul className="mx-auto grid max-w-5xl grid-cols-4">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-2 py-3 text-center text-xs font-semibold ${
                  active ? "text-emerald-700" : "text-zinc-600"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
