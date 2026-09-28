// Shown the moment a tab is clicked (Next prefetches it), while the page loads on the server.
export default function Loading() {
  return (
    <div aria-busy="true" className="animate-pulse motion-reduce:animate-none">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="h-11 w-56 max-w-full rounded-2xl bg-navy/[0.07] sm:h-13" />
      <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-navy/[0.05]" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-[22px] border border-line bg-white/60" />
        ))}
      </div>
    </div>
  );
}
