"use client";
import Link from "next/link";
export default function GameError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-svh grid place-content-center gap-5 p-6 text-center">
      <h1>Let’s try that adventure again.</h1>
      <button
        onClick={reset}
        className="min-h-12 rounded-2xl bg-primary text-white p-4"
      >
        Try again
      </button>
      <Link href="/" className="min-h-12 p-4">
        Back to worlds
      </Link>
    </main>
  );
}
