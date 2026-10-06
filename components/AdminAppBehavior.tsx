"use client";

import { useEffect } from "react";

const GESTURES = ["gesturestart", "gesturechange"];

/** iPhone Safari ignores user-scalable=no, so cancel its pinch gesture directly. Mounted on admin pages only. */
export function AdminAppBehavior() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    GESTURES.forEach((type) => document.addEventListener(type, stop, { passive: false }));
    return () => GESTURES.forEach((type) => document.removeEventListener(type, stop));
  }, []);
  return null;
}
