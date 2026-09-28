'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { primary, secondary } from '../../components/english/Controls';
import { stopAudio } from '../../lib/english/audio';
export default function SoundMatchError({error,reset}:{error:Error;reset:()=>void}) {
  useEffect(()=>{stopAudio();if(process.env.NODE_ENV==='development')console.error(error);},[error]);
  return <main className="grid min-h-svh place-content-center gap-5 bg-canvas p-6 text-center"><h1 className="text-3xl font-black">Oops! Let’s try that again.</h1><p className="text-muted">Your sound garden needs a little moment.</p><button className={primary} onClick={reset}>Try again</button><Link className={secondary} href="/">Back to Games</Link></main>;
}
