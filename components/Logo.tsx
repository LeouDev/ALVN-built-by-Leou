import { useId } from "react";

// The build mark (design handoff "build logo.html"): letters drawn as strokes, an orbit ring passing behind them
// at the top and in front at the bottom, and a diamond for the i's dot. The design cuts those overlaps with
// background-coloured strokes; here they're masks, so the mark sits on any background (photo, glass nav, paper).
const WEIGHTS = {
  // The design's own strokes, for large sizes (hero, About plate, share image).
  regular: { letter: 7, ring: 2.5, letterGap: 18, ringGap: 14, diamond: 16, diamondGap: 6 },
  // The favicon's heavier strokes, so the ring still shows at nav and footer size.
  bold: { letter: 12, ring: 5, letterGap: 22, ringGap: 17, diamond: 20, diamondGap: 7 },
};

const BACK = "M27.4 194.8A250 56 -8 0 1 522.6 125.2"; // the ring's far side, behind the letters
const FRONT = "M522.6 125.2A250 56 -8 0 1 27.4 194.8"; // its near side, in front of them

function Letters(props: React.SVGProps<SVGGElement>) {
  return (
    <g fill="none" {...props}>
      <path d="M80 60V200M190 120V160A40 40 0 0 0 270 160M270 120V200M310 120V200M350 60V200M470 60V200" />
      <circle cx="120" cy="160" r="40" />
      <circle cx="430" cy="160" r="40" />
    </g>
  );
}

/** The build wordmark in the current text colour. Size it with a height or width class. */
export function Logo({ weight = "bold", tagline = false, className = "" }: { weight?: keyof typeof WEIGHTS; tagline?: boolean; className?: string }) {
  const id = useId().replace(/\W/g, "");
  const w = WEIGHTS[weight];
  const diamond = { x: -w.diamond / 2, y: -w.diamond / 2, width: w.diamond, height: w.diamond, transform: "translate(310.4 99.4) rotate(45)" };
  const area = { maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 560, height: 320 } as const;

  return (
    <svg viewBox={tagline ? "24 56 502 248" : "24 56 502 174"} role="img" aria-label={tagline ? "build — Built by Leou" : "build"} className={className}>
      <defs>
        <mask id={`${id}b`} {...area}>
          <rect {...area} fill="#fff" />
          <Letters stroke="#000" strokeWidth={w.letterGap} />
          <rect {...diamond} fill="#000" stroke="#000" strokeWidth={w.diamondGap} />
        </mask>
        <mask id={`${id}f`} {...area}>
          <rect {...area} fill="#fff" />
          <path d={FRONT} fill="none" stroke="#000" strokeWidth={w.ringGap} />
        </mask>
      </defs>
      <path d={BACK} fill="none" stroke="currentColor" strokeWidth={w.ring} mask={`url(#${id}b)`} />
      <Letters stroke="currentColor" strokeWidth={w.letter} mask={`url(#${id}f)`} />
      <path d={FRONT} fill="none" stroke="currentColor" strokeWidth={w.ring} />
      <rect {...diamond} fill="currentColor" />
      {tagline && (
        // letter-spacing trails the last letter, so the centre sits half a space right of 275 (as in the design)
        <text x="279.5" y="290" textAnchor="middle" fontSize="15" fontWeight="300" letterSpacing="9" fill="currentColor" className="font-display">
          BUILT BY LEOU
        </text>
      )}
    </svg>
  );
}
