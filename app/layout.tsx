import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://www.offglass.com.br")
  ),
  title: "OFFGLASS SCENT — Catálogo",
  description:
    "Decants de perfumes originais em frascos de 2ml, 5ml e 10ml. Descubra sua próxima fragrância favorita.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "OFFGLASS SCENT — Catálogo",
    description:
      "Decants de perfumes originais em frascos de 2ml, 5ml e 10ml. Descubra sua próxima fragrância favorita.",
    siteName: "OFFGLASS SCENT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OFFGLASS SCENT",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OFFGLASS SCENT — Catálogo",
    description:
      "Decants de perfumes originais em frascos de 2ml, 5ml e 10ml. Descubra sua próxima fragrância favorita.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${inter.variable} antialiased`} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
