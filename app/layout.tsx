import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYLORA · English A–Z Adventure",
  description: "A joyful alphabet adventure: discover letters, sounds, and picture friends at your own pace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
