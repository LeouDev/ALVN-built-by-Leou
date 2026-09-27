"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

// Port of the "Orbit Project Gallery" handoff: covers drift right → left inside the orbit circle;
// the one nearest the center grows and shows its name. Values are the handoff's.
const S = 172; // spacing between items, px

function place(i: number, n: number, offset: number, big: number) {
  const L = n * S;
  const x = ((((i * S - offset) % L) + L) % L) - L / 2; // wraps seamlessly
  const d = Math.abs(x) / S;
  const f = Math.exp(-1.6 * d * d); // 1 at center → 0
  const push = Math.sign(x) * Math.min(1, d) * 40 * (big - 1); // neighbours make room for the big card
  return {
    transform: `translateX(${x + push}px) scale(${1 + (big - 1) * f})`,
    zIndex: Math.round(f * 100),
    opacity: 0.35 + 0.65 * Math.max(f, 1 - Math.min(1, d / 2.2)),
    label: Math.max(0, (f - 0.6) / 0.4),
  };
}

export function OrbitGallery({
  items,
  speed = 28,
  centerScale = 1.7,
}: {
  items: { slug: string; name: string; image: string }[];
  speed?: number;
  centerScale?: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLAnchorElement | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let offset = 0, speedMul = reduce.matches ? 0 : 1, last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const target = paused.current || reduce.matches ? 0 : 1;
      speedMul += (target - speedMul) * Math.min(1, dt * 4); // hover eases to a stop and back
      offset += speed * speedMul * dt;
      els.current.forEach((el, i) => {
        if (!el) return;
        const p = place(i, items.length, offset, centerScale);
        el.style.transform = p.transform;
        el.style.zIndex = String(p.zIndex);
        el.style.opacity = String(p.opacity);
        labels.current[i]!.style.opacity = String(p.label);
      });
      raf = requestAnimationFrame(tick);
    };
    // Run only while on screen (it's display:none below lg, so never there).
    const view = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    view.observe(viewport.current!);
    return () => {
      cancelAnimationFrame(raf);
      view.disconnect();
    };
  }, [items.length, speed, centerScale]);

  return (
    <div
      ref={viewport}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      className="absolute inset-[10.5%] hidden overflow-hidden rounded-full text-cream lg:block"
      style={{ maskImage: "radial-gradient(circle at 50% 50%, #000 58%, transparent 71%)" }}
    >
      {items.map((item, i) => {
        const p = place(i, items.length, 0, centerScale); // first frame, rendered on the server too
        return (
          <Link
            key={item.slug}
            href={`/projects/${item.slug}`}
            tabIndex={-1}
            ref={(el) => {
              els.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 -mt-[47px] -ml-[75px] flex w-[150px] flex-col gap-2.5 will-change-[transform,opacity]"
            style={{ transform: p.transform, zIndex: p.zIndex, opacity: p.opacity }}
          >
            <span
              className="relative block h-[94px] w-[150px] overflow-hidden rounded-[10px] bg-navy-soft shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
              style={{ outline: "1px solid rgb(247 243 234 / 0.1)" }}
            >
              <Image src={item.image} alt="" fill sizes="256px" className="object-cover" />
            </span>
            <span
              ref={(el) => {
                labels.current[i] = el;
              }}
              className="text-center text-[8px] font-bold tracking-[0.16em] whitespace-nowrap text-cream uppercase"
              style={{ opacity: p.label }}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
