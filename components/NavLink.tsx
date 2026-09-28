"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A Link that also works on its own page: Next.js doesn't scroll when you click a link to where you already are,
 *  so this goes back to the top (smoothly, unless the visitor prefers reduced motion — see globals.css). */
export function NavLink(props: React.ComponentProps<typeof Link>) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (String(props.href) === pathname) window.scrollTo({ top: 0 });
      }}
    />
  );
}
