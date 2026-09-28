import Image from "next/image";
import { inManila } from "@/lib/admin";
import { blocks, runs } from "@/lib/contracts";

const Rich = ({ text }: { text: string }) => (
  <>{runs(text).map((r, i) => (r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>))}</>
);

/** A contract's text as a readable document (the PDF renders the same blocks). */
export function ContractText({ body }: { body: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-navy/90">
      {blocks(body).map((b, i) =>
        b.type === "heading" ? (
          <h2 key={i} className="pt-5 text-lg font-semibold tracking-tight text-navy">
            {b.lines[0]}
          </h2>
        ) : b.type === "bullets" ? (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-accent">
            {b.lines.map((l, j) => (
              <li key={j}>
                <Rich text={l} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Rich text={b.lines.join(" ")} />
          </p>
        ),
      )}
    </div>
  );
}

/** One party's signature block, as it appears under the agreement. */
export function SignatureCard({ role, name, image, when }: { role: string; name: string | null; image: string | null; when: Date | null }) {
  return (
    <div className="flex-1 border-t border-line pt-4">
      <p className="eyebrow text-accent">{role}</p>
      {image ? (
        <Image src={image} alt={`${name}’s signature`} width={280} height={80} unoptimized className="mt-2 h-16 w-auto" />
      ) : (
        <div className="mt-2 h-16" />
      )}
      <p className="mt-1 font-semibold">{name ?? "Not signed yet"}</p>
      {when && (
        <p className="text-xs text-muted">
          Signed {inManila(when, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
