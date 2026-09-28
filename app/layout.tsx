import './world.css';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYLORA Games · Learn and discover",
  description: "Play gentle SKYLORA learning adventures for letters, sounds, and numbers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
