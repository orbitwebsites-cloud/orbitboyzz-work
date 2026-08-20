import { Archivo, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "OrbitBoyzz — Websites We've Built",
  description:
    "Hand-coded websites for local businesses, built end-to-end by OrbitBoyzz — no page-builders, no templates.",
  openGraph: {
    title: "OrbitBoyzz — Websites We've Built",
    description:
      "Hand-coded websites for local businesses, built end-to-end by OrbitBoyzz.",
    type: "website",
  },
  metadataBase: new URL("https://example.com"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${bebas.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
