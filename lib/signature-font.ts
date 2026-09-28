import localFont from "next/font/local";

// Handwriting font for typed signatures (drawn onto the signature canvas). Bundled, so builds
// don't depend on Google Fonts. Caveat, SIL Open Font License: lib/fonts/OFL.txt.
export const signatureFont = localFont({ src: "./fonts/Caveat-SemiBold.ttf", weight: "600" });
