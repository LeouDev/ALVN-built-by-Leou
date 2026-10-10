import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { blocks, runs } from "@/lib/contracts";
import type { Contract } from "@/lib/contracts-db";
import { registerPdfFonts } from "@/lib/pdf-fonts";

// The signed contract as a PDF: the agreement, both signatures, and a signature certificate page.
// Fonts and the logo load from the site's own public files, so the PDF matches the brand.

const navy = "#0E0E0E";
const muted = "#66635C";
const accent = "#0E0E0E";
const line = "#DAD7D0";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 56, fontFamily: ["Manrope", "Geist"], fontSize: 10, lineHeight: 1.55, color: navy },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, color: accent },
  title: { fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 18 },
  heading: { fontSize: 11.5, fontWeight: 700, marginTop: 14, marginBottom: 4 },
  paragraph: { marginBottom: 6 },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  sigRow: { flexDirection: "row", gap: 24, marginTop: 10 },
  sigBox: { flex: 1, borderTopWidth: 1, borderTopColor: line, paddingTop: 10 },
  sigImage: { height: 54, objectFit: "contain", objectPosition: "left", marginBottom: 6 },
  small: { fontSize: 8.5, color: muted },
  footer: { position: "absolute", left: 56, right: 56, bottom: 28, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: muted },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 7 },
  label: { width: 150, color: muted },
});

const when = (d: Date | null) =>
  d
    ? `${new Date(d).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" })} (GMT+8)`
    : "—";

const Rich = ({ text }: { text: string }) => (
  <>
    {runs(text).map((r, i) => (
      <Text key={i} style={r.bold ? { fontWeight: 700 } : undefined}>
        {r.text}
      </Text>
    ))}
  </>
);

function Signature({ role, name, detail, image, signedAt }: { role: string; name: string | null; detail: string; image: string | null; signedAt: Date | null }) {
  return (
    <View style={s.sigBox} wrap={false}>
      <Text style={s.eyebrow}>{role}</Text>
      {image ? <Image src={image} style={s.sigImage} /> : <View style={{ height: 60 }} />}
      <Text style={{ fontWeight: 700 }}>{name ?? "—"}</Text>
      {detail && <Text style={s.small}>{detail}</Text>}
      <Text style={s.small}>Signed {when(signedAt)}</Text>
    </View>
  );
}

function ContractPdf({ c, logo }: { c: Contract; logo: string }) {
  const footer = (
    <View style={s.footer} fixed>
      <Text>
        {c.title} · Contract #{c.id}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
  const events: [string, string][] = [
    ["Document", `${c.title} (Contract #${c.id})`],
    ["Fingerprint (SHA-256)", c.body_hash?.match(/.{1,8}/g)?.join(" ") ?? "—"], // grouped so it can wrap
    ["Signed by Provider", c.provider_signed_at ? `${c.provider_name} · ${when(c.provider_signed_at)} · IP ${c.provider_ip}` : "Not signed yet"],
    ["Sent for signature", c.sent_at ? `To ${c.client_email} · ${when(c.sent_at)}` : "Not sent yet"],
    ["Opened by Client", c.viewed_at ? `${when(c.viewed_at)} · IP ${c.viewed_ip}` : "Not opened yet"],
    ["Signed by Client", c.client_signed_at ? `${c.client_signer_name} (${c.client_email}) · ${when(c.client_signed_at)} · IP ${c.client_ip}` : "Not signed yet"],
    ["Client’s browser", c.client_ua || "—"],
  ];

  return (
    <Document title={c.title} author={c.provider_name ?? undefined} subject={`Contract #${c.id}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <Image src={logo} style={{ height: 24 }} />
          <Text style={s.eyebrow}>Agreement · #{c.id}</Text>
        </View>
        <Text style={s.title}>{c.title}</Text>

        {blocks(c.body).map((b, i) =>
          b.type === "heading" ? (
            <Text key={i} style={s.heading} minPresenceAhead={40}>
              {b.lines[0]}
            </Text>
          ) : b.type === "bullets" ? (
            <View key={i} style={{ marginBottom: 6 }}>
              {b.lines.map((l, j) => (
                <View key={j} style={s.bullet}>
                  <Text style={{ width: 12, color: accent }}>•</Text>
                  <Text style={{ flex: 1 }}>
                    <Rich text={l} />
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text key={i} style={s.paragraph}>
              <Rich text={b.lines.join("\n")} />
            </Text>
          ),
        )}

        <Text style={[s.heading, { marginTop: 22 }]} minPresenceAhead={120}>
          Signatures
        </Text>
        <View style={s.sigRow} wrap={false}>
          <Signature role="Provider" name={c.provider_name} detail="" image={c.provider_signature} signedAt={c.provider_signed_at} />
          <Signature role="Client" name={c.client_signer_name} detail={c.client_company} image={c.client_signature} signedAt={c.client_signed_at} />
        </View>
        {footer}
      </Page>

      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Image src={logo} style={{ height: 24 }} />
          <Text style={s.eyebrow}>Signature certificate</Text>
        </View>
        <Text style={s.title}>Signature certificate</Text>
        <Text style={[s.paragraph, { color: muted }]}>
          This page records how this agreement was signed electronically. Any change to the agreement’s text would change its fingerprint below.
        </Text>
        <View style={{ marginTop: 10 }}>
          {events.map(([label, value]) => (
            <View key={label} style={s.row} wrap={false}>
              <Text style={s.label}>{label}</Text>
              <Text style={{ flex: 1, fontWeight: 600 }}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.small, { marginTop: 16 }]}>Signed electronically under the Electronic Commerce Act of 2000 (Republic Act No. 8792). Times are Philippine time.</Text>
        {footer}
      </Page>
    </Document>
  );
}

/** Renders the signed contract. `origin` is the site's own URL, where the fonts and logo are served. */
export async function renderContractPdf(c: Contract, origin: string) {
  registerPdfFonts(origin);
  return renderToBuffer(<ContractPdf c={c} logo={`${origin}/brand/alvn-wordmark.png`} />);
}
