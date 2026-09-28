'use client';
export default function ErrorPage({reset}:{reset:()=>void}){
 return <main className="grid min-h-svh place-content-center gap-5 bg-[#faf8f2] px-6 text-center text-ink"><h1 className="text-3xl font-extrabold">Let’s take a little breath.</h1><p>Your adventure needs a fresh start.</p><button onClick={reset} className="min-h-12 rounded-2xl bg-primary px-6 py-3 font-bold text-white">Try again</button></main>;
}
