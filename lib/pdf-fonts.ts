import { Font } from "@react-pdf/renderer";

// Manrope for PDFs, loaded from the site's own public files (react-pdf fetches them by URL).
let registeredFrom = "";

export function registerPdfFonts(origin: string) {
  if (registeredFrom === origin) return;
  Font.register({ family: "Manrope", fonts: [400, 600, 700].map((fontWeight) => ({ src: `${origin}/fonts/Manrope-${fontWeight}.ttf`, fontWeight })) });
  Font.registerHyphenationCallback((word) => [word]); // no hyphenation mid-word
  registeredFrom = origin;
}
