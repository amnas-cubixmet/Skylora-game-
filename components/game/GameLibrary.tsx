'use client';
import Link from 'next/link';
import { useEffect, useReducer } from 'react';
import { Icon } from './Icon';
import { freshProgress, type Progress } from '../../lib/sound-match/types';
import { localProgressStore } from '../../lib/sound-match/storage';
import { soundMatchUnlocked } from '../../lib/sound-match/access';
export function GameLibrary() {
  const [saved,load]=useReducer((_: { progress:Progress;unlocked:boolean },next:{progress:Progress;unlocked:boolean})=>next,{progress:freshProgress(),unlocked:true});
  useEffect(()=>{load({progress:localProgressStore.load().progress,unlocked:soundMatchUnlocked()});},[]);
  const games=[
    {href:'/english-az-adventure',icon:'Aa',category:'English · Game 01',title:'English A–Z Adventure',copy:'Meet every letter, explore 130 words, then enjoy alphabet activities.',label:'Explore letters',locked:false,progress:''},
    {href:'/sound-match',icon:'sound',category:'English · Game 02',title:'Sound Match',copy:'Listen • Match • Learn. Find sound friends in a magical little garden.',label:saved.progress.session?'Continue Sound Match':'Play Sound Match',locked:!saved.unlocked,progress:saved.progress.completedLevels.length?`${saved.progress.completedLevels.length} of 6 places explored`:saved.progress.session?'Your listening trail is saved':'Six places to discover'},
    {href:'/number-hunt',icon:'123',category:'Maths adventure',title:'Number Hunt',copy:'Listen, look and discover numbers with gentle, playful practice.',label:'Explore numbers',locked:false,progress:''},
  ];
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{games.map(g=>{
    const content=<><span aria-hidden="true" className="block h-14 text-5xl font-black text-primary">{g.icon==='sound'?<Icon name="sound" className="size-14"/>:g.icon}</span><p className="mt-5 text-xs font-bold uppercase tracking-wider text-primary">{g.category}</p><h2 className="text-2xl font-extrabold">{g.title}</h2><p className="mt-3 flex-1 leading-relaxed text-muted">{g.copy}</p>{g.progress&&<span className="mt-3 text-xs font-bold text-muted">{g.progress}</span>}<span className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">{g.locked?'Explore Game 01 first':`${g.label} →`}</span></>;
    const style='group flex flex-col rounded-[32px] border border-border bg-white p-6 shadow-sm transition motion-safe:hover:-translate-y-1';
    return g.locked?<div key={g.href} aria-label="Sound Match, locked until alphabet book completion" className={`${style} opacity-70`}>{content}</div>:<Link key={g.href} href={g.href} className={style}>{content}</Link>;
  })}</div>;
}
