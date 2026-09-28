import { Font } from "@react-pdf/renderer";

// Manrope for PDFs, loaded from the site's own public files (react-pdf fetches them by URL).
let registeredFrom = "";

export function registerPdfFonts(origin: string) {
  if (registeredFrom === origin) return;
  Font.register({ family: "Manrope", fonts: [400, 600, 700].map((fontWeight) => ({ src: `${origin}/fonts/Manrope-${fontWeight}.ttf`, fontWeight })) });
  // Manrope has no ₱ sign (and a few other symbols); text falls back to Geist for just those characters.
  Font.register({ family: "Geist", src: `${origin}/fonts/Geist-Regular.ttf` });
  Font.registerHyphenationCallback((word) => [word]); // no hyphenation mid-word
  registeredFrom = origin;
}
