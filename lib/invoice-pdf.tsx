import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Provider } from "@/lib/contracts";
import type { Invoice } from "@/lib/invoices-db";
import { longDate, php } from "@/lib/invoices";
import { registerPdfFonts } from "@/lib/pdf-fonts";

const navy = "#0E0E0E";
const muted = "#66635C";
const accent = "#0E0E0E";
const line = "#DAD7D0";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 56, fontFamily: ["Manrope", "Geist"], fontSize: 10, lineHeight: 1.5, color: navy },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, color: accent },
  label: { fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 700, color: muted, marginBottom: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: line, paddingVertical: 9 },
  footer: { position: "absolute", left: 56, right: 56, bottom: 28, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: muted },
});

// Fits the QR in 140 × 180 pt, keeping its shape (a PNG stores its width and height at bytes 16–23).
function qrSize(png: Buffer) {
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  const scale = Math.min(140 / w, 180 / h);
  return { width: w * scale, height: h * scale };
}

function InvoicePdf({ inv, provider, logo, qr }: { inv: Invoice; provider: Provider; logo: string; qr: Buffer | null }) {
  const paid = inv.status === "paid";
  const stamp = paid
    ? { text: `PAID${inv.paid_at ? ` · ${new Date(inv.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}` : ""}`, color: "#067647" }
    : inv.status === "void"
      ? { text: "VOID", color: "#b42318" }
      : null;
  return (
    <Document title={`Billing Statement ${inv.number}`} author={provider.name} subject={`Billing Statement ${inv.number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Image src={logo} style={{ height: 24 }} />
          <Text style={s.eyebrow}>Billing statement · {inv.number}</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>Billing Statement</Text>
            <Text style={{ color: muted, marginTop: 2 }}>{inv.number}</Text>
          </View>
          {stamp && (
            <Text style={{ borderWidth: 1.5, borderColor: stamp.color, color: stamp.color, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, fontWeight: 700, letterSpacing: 1.2 }}>
              {stamp.text}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 24, marginTop: 26 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Billed to</Text>
            <Text style={{ fontWeight: 700 }}>{inv.client_name}</Text>
            {inv.client_company ? <Text>{inv.client_company}</Text> : null}
            <Text style={{ color: muted }}>{inv.client_email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>From</Text>
            <Text style={{ fontWeight: 700 }}>{provider.business}</Text>
            <Text>{provider.name}</Text>
            <Text style={{ color: muted }}>{provider.address}</Text>
          </View>
          <View style={{ width: 130 }}>
            <Text style={s.label}>Issued</Text>
            <Text>{longDate(inv.issue_date)}</Text>
            <Text style={[s.label, { marginTop: 10 }]}>Due</Text>
            <Text style={{ fontWeight: 700 }}>{longDate(inv.due_date)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <View style={[s.row, { borderBottomColor: navy, paddingVertical: 6 }]}>
            <Text style={[s.label, { flex: 1, marginBottom: 0 }]}>Description</Text>
            <Text style={[s.label, { marginBottom: 0 }]}>Amount</Text>
          </View>
          {inv.items.map((item, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={{ flex: 1, paddingRight: 16 }}>{item.description}</Text>
              <Text>{php(item.amount)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14 }}>
            <View style={{ width: 240, backgroundColor: "#F2EFE8", borderRadius: 10, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: 700 }}>{paid ? "Total paid" : "Total due"}</Text>
              <Text style={{ fontWeight: 700, fontSize: 13 }}>{php(inv.total)}</Text>
            </View>
          </View>
        </View>

        {inv.notes || qr ? (
          <View style={{ marginTop: 30, flexDirection: "row", gap: 20, borderLeftWidth: 3, borderLeftColor: accent, paddingLeft: 14 }} wrap={false}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>How to pay</Text>
              {inv.notes ? <Text>{inv.notes}</Text> : null}
              {qr ? <Text style={{ color: muted, marginTop: inv.notes ? 6 : 0 }}>{inv.notes ? "Or scan" : "Scan"} the QR code with your bank or e-wallet app.</Text> : null}
            </View>
            {qr ? <Image src={{ data: qr, format: "png" }} style={qrSize(qr)} /> : null}
          </View>
        ) : null}

        <Text style={{ marginTop: 36, color: muted }}>Thank you for your business.</Text>

        <View style={s.footer} fixed>
          <Text>
            {provider.business} · Billing statement {inv.number}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Renders a billing statement. `origin` is the site's own URL, where the fonts and logo are served; `qr` is the payment QR (PNG). */
export async function renderInvoicePdf(inv: Invoice, provider: Provider, origin: string, qr: Buffer | null) {
  registerPdfFonts(origin);
  return renderToBuffer(<InvoicePdf inv={inv} provider={provider} logo={`${origin}/brand/alvn-wordmark.png`} qr={qr} />);
}
