"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** The hero's moving background, with the pause control that motion running past 5 seconds needs. */
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  const [paused, setPaused] = useState(true); // flips on the first "play"; stays true if autoplay is blocked
  // Added after hydration, and only when motion is welcome: the still paints first, and reduced motion downloads nothing.
  useEffect(() => setMotion(!matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  if (!motion) return null;

  return (
    <>
      <video ref={video} autoPlay muted loop playsInline aria-hidden onPlay={() => setPaused(false)} onPause={() => setPaused(true)} className="hero-bg hero-video animate-fade-in">
        {/* Phones and portrait tablets (the one-column hero) only show a middle strip, so they get a cropped portrait cut. */}
        <source src="/hero/space.mp4" media="(min-width: 768px) and (min-aspect-ratio: 4/5)" type="video/mp4" />
        <source src="/hero/space-mobile.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={() => (video.current?.paused ? video.current.play().catch(() => {}) : video.current?.pause())}
        aria-label={paused ? "Play the background video" : "Pause the background video"}
        className="hero-pause"
      >
        {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
      </button>
    </>
  );
}
