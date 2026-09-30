import type { Metadata, Viewport } from "next";
import { Archivo, Caveat, Instrument_Sans, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

// Fonts are downloaded at build time and self-hosted, so they work offline and inside the native app.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat", display: "swap" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
  preload: false, // only the Bible reader uses it
});

export const metadata: Metadata = {
  title: { default: "Camino", template: "%s · Camino" },
  description: "Un camino, no una competencia. Acompañamiento para jóvenes y su iglesia local.",
  applicationName: "Camino",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Camino", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F2EC",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} ${caveat.variable} ${sourceSerif.variable}`}
    >
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Saltar al contenido
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
