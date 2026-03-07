import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel Management",
  description: "Hotel management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
