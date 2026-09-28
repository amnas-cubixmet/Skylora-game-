'use client';
import { useEffect, useState } from 'react';
import { GuideCharacter } from '../english/Art';
import { primary, secondary } from '../english/Controls';
import { SoundPicture } from './SoundArt';
import type { AudioPart } from '../../lib/sound-match/audio';
export function SoundTutorial({ onDone, speak, stop, voice }: { onDone:(skip:boolean)=>void; speak:(parts:AudioPart[])=>Promise<boolean>; stop:()=>void; voice:boolean }) {
  const [solved,setSolved]=useState(false),[message,setMessage]=useState('Listen to ball. Tap its picture.');
  useEffect(()=>{void speak([{text:'Listen to ball. Tap the picture that starts with the first sound in ball.'}]);return stop;},[speak,stop]);
  function choose(id:string) {
    if(id==='B') { setSolved(true);setMessage('Great! B is for ball.');void speak([{text:'Great! B is for ball. Let’s play!'}]); }
    else { setMessage('Try again. Look for the ball.');void speak([{text:'Try again. Look for the ball.'}]); }
  }
  return <section className="sound-match-tutorial mx-auto w-full min-w-0 max-w-xl rounded-[32px] border border-border bg-white p-5 text-center sm:p-8">
    <GuideCharacter mood={solved?'celebrating':'listening'} className="mx-auto w-28"/><p className="text-xs font-black uppercase tracking-widest text-primary">A little practice with Pip</p><h1 className="text-3xl font-black">Listen. Match. Learn.</h1><p className="text-sm text-muted">Listen to the beginning of “ball”. Tap its picture.</p>
    <button className={`${secondary} my-4`} disabled={!voice} onClick={()=>void speak([{text:'Listen to ball. Find ball.'}])}>Hear it again</button>
    <div className="sound-match-tutorial-grid grid grid-cols-2 gap-4">{['B','C'].map(id=><button key={id} aria-label={id==='B'?'ball':'cat'} disabled={solved} onClick={()=>choose(id)} className={`grid min-h-40 place-items-center rounded-3xl border-2 p-3 ${solved&&id==='B'?'border-success bg-success-soft':'border-border bg-surface-soft'}`}><SoundPicture value={id} className="size-24"/><span className="font-bold text-primary">{id==='B'?'Ball':'Cat'}</span></button>)}</div>
    <p role="status" className="my-5 text-sm font-bold text-primary">{message}</p>{solved&&<button className={primary} onClick={()=>onDone(false)}>Let’s play!</button>}
    <button className="mx-auto mt-4 block min-h-11 px-4 text-sm font-bold text-muted" onClick={()=>onDone(true)}>Skip tutorial</button>
  </section>;
}
