"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: [string, string][] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map(([label, href]) => {
        const activo = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              activo ? "bg-ranch-marron text-ranch-crema" : "text-ranch-marron/70 hover:bg-ranch-marron/10"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
