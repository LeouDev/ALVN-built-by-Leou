"use client";

import { useEffect, useRef } from "react";

// Port of the "ALVN Ambient Logo Animation" handoff: an 8s seamless loop where only small
// elements move. Every coordinate below is in the handoff's image space (2522×1314 px), copied
// verbatim from its spec. Our original logo art is drawn into that space with a fitted transform
// (52 matched features, mean error 0.3px), so the handoff numbers apply unchanged.
const IW = 2522;
const IH = 1314;
const ART = { src: "/brand/alvn-logo.webp", x: 58.21, y: -227.77, w: 1536 * 1.58089, h: 1024 * 1.58089 };
const VIEW = { x: ART.x, y: 39, w: ART.w, h: 1085 }; // the About plate's framing, in image space

const L = 8;
const CREAM = "#FEFBF0";
const RING = { cx: 590.24, cy: 491.7, r: 319.75 };
const PLANET = { x: 748, y: 215, r: 44, a: -60.3 };
const BALL = { x: 850, y: 627, r: 31 };
const CUE = { Drift: 0, Shine: 2, Glint: 4, Return: 5.5 };

const circ = (r: number, x: number, y: number) => `circle(${r}px at ${x}px ${y}px)`;
const rect = (x1: number, y1: number, x2: number, y2: number) =>
  `polygon(${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px)`;
const LINE_CLIP =
  "polygon(922px 866px, 1397px 866px, 1397px 892px, 922px 892px, 922px 866px, 1820px 866px, 2282px 866px, 2282px 892px, 1820px 892px, 1820px 866px)";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sweep = (t: number, from: number, to: number, start: number, end: number) =>
  from + (to - from) * (-(Math.cos(Math.PI * clamp01((t - start) / (end - start))) - 1) / 2);
const pulse = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2));

type Ref = React.RefObject<HTMLDivElement | null>;
const layer: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: IW, height: IH, pointerEvents: "none" };

function Crop({ clip, origin, nodeRef }: { clip: string; origin?: [number, number]; nodeRef?: Ref }) {
  return (
    <div ref={nodeRef} style={{ ...layer, clipPath: clip, transformOrigin: origin ? `${origin[0]}px ${origin[1]}px` : "0 0" }}>
      <img src={ART.src} alt="" draggable={false} style={{ position: "absolute", left: ART.x, top: ART.y, width: ART.w, height: ART.h, maxWidth: "none" }} />
    </div>
  );
}

function Glow({ x, y, r, nodeRef }: { x: number; y: number; r: number; nodeRef: Ref }) {
  return (
    <div
      ref={nodeRef}
      style={{
        position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: 0,
        mixBlendMode: "lighten", background: "radial-gradient(circle, #ffb46e 0%, #4a2a14 22%, #000 55%)",
      }}
    />
  );
}

const useCometRefs = () => ({
  tl: useRef<HTMLDivElement>(null), tr: useRef<HTMLDivElement>(null), hl: useRef<HTMLDivElement>(null), hr: useRef<HTMLDivElement>(null),
});

export function LogoAnimation() {
  const stage = useRef<HTMLDivElement>(null);
  const space = useRef<HTMLDivElement>(null);
  const n = {
    planet: useRef<HTMLDivElement>(null), ball: useRef<HTMLDivElement>(null), core: useRef<HTMLDivElement>(null),
    starTop: useRef<HTMLDivElement>(null), starA: useRef<HTMLDivElement>(null), starB: useRef<HTMLDivElement>(null),
    gA: useRef<HTMLDivElement>(null), gB: useRef<HTMLDivElement>(null), gC: useRef<HTMLDivElement>(null), moon: useRef<HTMLDivElement>(null),
    word: useRef<HTMLDivElement>(null), wordBand: useRef<HTMLDivElement>(null), tag: useRef<HTMLDivElement>(null), tagBand: useRef<HTMLDivElement>(null),
  };
  const comets = [useCometRefs(), useCometRefs()]; // offsets 0 and 0.5 of a cycle

  useEffect(() => {
    // Reduced motion (or no JS): the static logo underneath is all that shows.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const st = stage.current!, sp = space.current!;
    const $ = (r: Ref) => r.current!.style;

    const fit = () => {
      sp.style.transform = `scale(${st.clientWidth / VIEW.w}) translate(${-VIEW.x}px, ${-VIEW.y}px)`;
      sp.style.visibility = "visible";
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(st);

    const frame = (t: number) => {
      const ph = (t / L) * Math.PI * 2;
      const a = ((PLANET.a + 26 * Math.sin(ph)) * Math.PI) / 180;
      const px = RING.cx + RING.r * Math.cos(a), py = RING.cy + RING.r * Math.sin(a);
      $(n.planet).transform = `translate(${px - PLANET.x}px, ${py - PLANET.y}px) rotate(${8 * Math.sin(ph)}deg) scale(${1 + 0.07 * Math.cos(ph)})`;
      $(n.ball).transform = `translate(${9 * Math.sin(ph * 2 + 1)}px, ${14 * Math.sin(ph + 1.2)}px) scale(${1 + 0.06 * Math.cos(ph + 1.2)})`;
      $(n.core).opacity = String(0.15 + 0.4 * (0.5 - 0.5 * Math.cos(ph * 2)));

      const kTop = pulse(t, CUE.Shine + 1.55, 0.35);
      const kA = pulse(t, CUE.Drift + 1.2, 0.3), kB = pulse(t, CUE.Glint + 0.8, 0.3), kC = pulse(t, CUE.Return + 1.0, 0.3);
      $(n.starTop).transform = `rotate(${kTop * 45}deg) scale(${1 + kTop * 0.35})`;
      $(n.starA).transform = `rotate(${kA * 45}deg) scale(${1 + kA * 0.5})`;
      $(n.starB).transform = `rotate(${kB * 45}deg) scale(${1 + kB * 0.4})`;
      $(n.gA).opacity = String(kA);
      $(n.gB).opacity = String(kB);
      $(n.gC).opacity = String(kC);
      $(n.moon).transform = `scale(${1 + pulse(t, CUE.Glint + 1.1, 0.3) * 0.12})`;

      comets.forEach((c, i) => {
        const p = ((t / L) * 2 + i * 0.5) % 1, o = String(Math.sin(Math.PI * p));
        const lx = 1395 - p * 470, rx = 1822 + p * 458;
        $(c.tl).left = `${lx}px`;
        $(c.tr).left = `${rx - 160}px`;
        $(c.hl).left = `${lx - 9}px`;
        $(c.hr).left = `${rx - 9}px`;
        $(c.tl).opacity = $(c.tr).opacity = $(c.hl).opacity = $(c.hr).opacity = o;
      });

      $(n.word).display = t > CUE.Shine - 0.05 && t < CUE.Shine + 1.65 ? "block" : "none";
      $(n.wordBand).left = `${sweep(t, 820, 2420, CUE.Shine, CUE.Shine + 1.6) - 130}px`;
      $(n.tag).display = t > CUE.Glint - 0.05 && t < CUE.Glint + 1.35 ? "block" : "none";
      $(n.tagBand).left = `${sweep(t, 860, 2380, CUE.Glint, CUE.Glint + 1.3) - 100}px`;
    };

    // Run only while the logo is on screen.
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frame(((now - t0) / 1000) % L);
      raf = requestAnimationFrame(loop);
    };
    const view = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    frame(0);
    view.observe(st);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      view.disconnect();
    };
  }, []);

  const sheen = (core: string): React.CSSProperties => ({
    position: "absolute", transform: "skewX(-22deg)",
    background: `linear-gradient(90deg, #000 0%, #22384f 30%, ${core} 50%, #22384f 70%, #000 100%)`,
  });

  return (
    <div
      ref={stage}
      role="img"
      aria-label="ALVN — Digital Products & Experiences"
      className="relative overflow-hidden bg-paper"
      style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
    >
      {/* Static logo: first paint, no-JS, and reduced motion. The animated layers cover it exactly. */}
      <img
        src={ART.src}
        alt=""
        className="absolute left-0 w-full max-w-none"
        style={{ top: `${((ART.y - VIEW.y) / VIEW.h) * 100}%` }}
      />
      <div ref={space} aria-hidden style={{ ...layer, transformOrigin: "0 0", visibility: "hidden" }}>
        <Crop clip={rect(140, 140, 2380, 940)} />

        {/* Patches over the original planet and ball; the ring arc is redrawn through the planet patch. */}
        <div style={{ position: "absolute", left: PLANET.x - 48, top: PLANET.y - 48, width: 96, height: 96, borderRadius: "50%", background: CREAM, overflow: "hidden" }}>
          <svg width="96" height="96" style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={RING.cx - PLANET.x + 48} cy={RING.cy - PLANET.y + 48} r={RING.r} fill="none" stroke="#F08F3E" strokeWidth="8" opacity="0.9" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: BALL.x - 35, top: BALL.y - 35, width: 70, height: 70, borderRadius: "50%", background: CREAM }} />

        <Crop clip={circ(PLANET.r, PLANET.x, PLANET.y)} origin={[PLANET.x, PLANET.y]} nodeRef={n.planet} />
        <Crop clip={circ(BALL.r, BALL.x, BALL.y)} origin={[BALL.x, BALL.y]} nodeRef={n.ball} />
        <Glow x={548} y={395} r={130} nodeRef={n.core} />

        <Crop clip={circ(58, 2300, 355)} origin={[2300, 355]} nodeRef={n.starTop} />
        <Crop clip={circ(24, 880, 262)} origin={[880, 262]} nodeRef={n.starA} />
        <Crop clip={circ(34, 260, 715)} origin={[260, 715]} nodeRef={n.starB} />
        <Glow x={725} y={728} r={40} nodeRef={n.gC} />
        <Glow x={485} y={275} r={34} nodeRef={n.gA} />
        <Glow x={612} y={280} r={30} nodeRef={n.gB} />
        <Crop clip={circ(42, 1606, 880)} origin={[1606, 880]} nodeRef={n.moon} />

        {comets.map((c, i) => (
          <div key={i}>
            <div style={{ ...layer, clipPath: LINE_CLIP, mixBlendMode: "lighten" }}>
              <div ref={c.tl} style={{ position: "absolute", top: 866, width: 160, height: 26, opacity: 0, background: "linear-gradient(90deg, #ff8a2a 0%, #b4521a 30%, #000 100%)" }} />
              <div ref={c.tr} style={{ position: "absolute", top: 866, width: 160, height: 26, opacity: 0, background: "linear-gradient(270deg, #ff8a2a 0%, #b4521a 30%, #000 100%)" }} />
            </div>
            {[c.hl, c.hr].map((h, j) => (
              <div
                key={j}
                ref={h}
                style={{ position: "absolute", top: 870, width: 18, height: 18, borderRadius: "50%", opacity: 0, background: "#F07011", boxShadow: "0 0 18px 6px rgba(240,112,17,0.45)" }}
              />
            ))}
          </div>
        ))}

        <div ref={n.word} style={{ ...layer, clipPath: rect(880, 350, 2292, 730), mixBlendMode: "lighten", display: "none" }}>
          <div ref={n.wordBand} style={{ ...sheen("#f9d2ad"), top: 330, width: 260, height: 420 }} />
        </div>
        <div ref={n.tag} style={{ ...layer, clipPath: rect(915, 748, 2290, 818), mixBlendMode: "lighten", display: "none" }}>
          <div ref={n.tagBand} style={{ ...sheen("#e9a36a"), top: 740, width: 200, height: 90 }} />
        </div>
      </div>
    </div>
  );
}
