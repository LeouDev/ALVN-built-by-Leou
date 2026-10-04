// The ALVN script logo: Oleo Script Bold at −5° with an orange sparkle (and, on the full lockup, a swash).
// Offsets are the design handoff's px values divided by its font size, so the whole mark scales with font size.
const word = "relative block w-fit -rotate-5 font-logo leading-none font-bold tracking-[-0.02em]";

function Sparkle({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="-10 -10 20 20" className={`absolute fill-accent ${className}`}>
      <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10Z" />
    </svg>
  );
}

/** The nav mark (32px there, 44px in the footer); size it with a text-size class. Takes the text colour. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="ALVN" className={`${word} ${className}`}>
      alvn
      <Sparkle className="top-[0.0625em] -right-[0.28em] size-[0.3125em]" />
    </span>
  );
}

/** The wordmark with its sparkle and swash, designed at 190px. Colour or fill the letters via `className`. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`${word} px-[0.105em] ${className}`}>
      alvn
      <Sparkle className="top-[0.116em] -right-[0.032em] size-[0.242em]" />
      <svg aria-hidden viewBox="0 0 380 34" className="absolute -bottom-[0.032em] left-[0.21em] h-[0.179em] w-[2em]">
        <path d="M4 26 Q190 2 376 18" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-accent" />
      </svg>
    </span>
  );
}

/** The full lockup for navy grounds: wordmark, sparkle, swash and “Built by Leou”. */
export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <div role="img" aria-label="ALVN — Built by Leou" className={`flex flex-col items-center ${className}`}>
      <LogoMark className="mb-[0.2em] text-logo-cream" />
      <span className="text-[13px] font-bold tracking-[0.32em] text-tag-grey">BUILT BY LEOU</span>
    </div>
  );
}
