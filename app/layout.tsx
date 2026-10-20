import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blessed Auto Car | Mobil bekas pilihan",
  description: "Cari mobil bekas sesuai kebutuhan dan anggaran. Lihat foto, harga, dan spesifikasi di Blessed Auto Car.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
