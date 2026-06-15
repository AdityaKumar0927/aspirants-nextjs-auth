import localFont from "next/font/local";
import { Inter } from "next/font/google";

export const sfPro = localFont({
  src: "./SF-Pro-Display-Medium.otf",
  variable: "--font-sf",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * The "Desk" inner-page theme uses the app's default font (same as the nav and
 * the rest of the site), so no extra families are loaded. `deskFontVars` is
 * kept as a no-op string so the inner layouts that reference it don't need to
 * change.
 */
export const deskFontVars = "";
