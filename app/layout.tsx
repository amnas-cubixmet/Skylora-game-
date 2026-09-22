import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYLORA Number Hunt",
  description: "A gentle number-recognition learning game for children.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
