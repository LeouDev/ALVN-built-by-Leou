"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// The two-column hero (globals.css): anything else gets the portrait cut.
const WIDE = "(min-width: 768px) and (min-aspect-ratio: 4/5)";

/** The hero's moving background, with the pause control that motion running past 5 seconds needs. */
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [paused, setPaused] = useState(true); // flips on the first "play"; stays true if autoplay is blocked
  const userPaused = useRef(false);
  // Added after hydration, and only when motion is welcome: the still paints first, and reduced motion downloads nothing.
  useEffect(() => setMotion(!matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  // Rest while the page's sheet fully covers the pinned hero (its top edge has passed the top of the screen).
  useEffect(() => {
    const v = video.current, sheet = document.querySelector(".home-sheet");
    if (!v || !sheet) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.pause() : !userPaused.current && v.play().catch(() => {})), {
      rootMargin: "0px 0px -100% 0px",
    });
    io.observe(sheet);
    return () => io.disconnect();
  }, [motion]);
  if (!motion) return null;

  return (
    <>
      <video ref={video} autoPlay muted loop playsInline aria-hidden onPlay={() => setPaused(false)} onPause={() => setPaused(true)} className="hero-bg hero-video animate-fade-in">
        {/* HEVC first (same quality at about half the size), H.264 for browsers without it. Phones and portrait
            tablets (the one-column hero) only show a middle strip, so they get a cropped portrait cut. */}
        <source src="/hero/space-hevc.mp4" media={WIDE} type='video/mp4; codecs="hvc1.1.6.L150.B0"' />
        <source src="/hero/space.mp4" media={WIDE} type="video/mp4" />
        <source src="/hero/space-mobile-hevc.mp4" type='video/mp4; codecs="hvc1.1.6.L120.B0"' />
        <source src="/hero/space-mobile.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={() => {
          const v = video.current;
          if (!v) return;
          userPaused.current = !v.paused;
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        }}
        aria-label={paused ? "Play the background video" : "Pause the background video"}
        className="hero-pause"
      >
        {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
      </button>
    </>
  );
}
