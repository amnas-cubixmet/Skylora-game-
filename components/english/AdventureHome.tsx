import { BADGES, LEVELS } from '../../lib/english/content';
import type { Progress } from '../../lib/english/types';
import { GuideCharacter, Icon, WorldScenery } from './Art';
import { primary, secondary, SectionLabel } from './Controls';
export function AdventureHome({progress,onStart,onParents,onTutorial}:{progress:Progress;onStart:(level:number)=>void;onParents:()=>void;onTutorial:()=>void}){
 const next=progress.active?.level??progress.highest;
 return <>
  <div className="mb-5 flex items-center justify-between gap-2"><span className="flex items-center gap-2 rounded-full bg-[#edf1e5] px-3 py-2 text-[11px] font-bold tracking-wide text-[#6f845c]"><Icon name="leaf" className="size-4"/>LITTLE STEPS, BIG DISCOVERIES</span><button className="min-h-11 px-2 text-xs font-bold text-muted underline-offset-4 hover:underline" onClick={onParents}>For grown-ups</button></div>
  <section className="relative isolate overflow-hidden rounded-[32px] border border-[#e5e0ed] bg-gradient-to-br from-[#f2edf9] via-[#fbf8f2] to-[#f1f3e6] px-6 pb-28 pt-8 sm:px-10 sm:pb-32 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:pt-12">
   <div className="relative z-10">
    <SectionLabel>WELCOME TO YOUR LITTLE WORLD</SectionLabel>
    <h1 className="mt-4 text-[clamp(2.6rem,6.5vw,4.8rem)] font-black leading-[1.06] tracking-[-0.055em]">English A–Z<br/><span className="text-primary">Adventure</span><span className="ml-2 inline-block text-3xl text-[#d3aa60]" aria-hidden="true">✦</span></h1>
    <p className="mb-6 mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">A world of letters. A pocketful of stars.<br/>Let’s find something wonderful together.</p>
    <button className={primary} onClick={()=>onStart(next)}>{progress.active?'Continue adventure':Object.keys(progress.levels).length?'Let’s explore again':'Let’s play'}<Icon name="arrow"/></button>
    <p className="mb-0 mt-4 text-xs text-muted">10 little discoveries · Go at your own pace</p>
   </div>
   <div className="relative mx-auto mt-8 flex h-[180px] w-full max-w-sm items-end justify-center lg:mt-2 lg:h-[260px]" aria-hidden="true">
    <span className="absolute left-[4%] top-7 grid size-20 -rotate-12 place-items-center rounded-[23px] border-2 border-b-[7px] border-[#d4c4e8] bg-[#e8def7] text-5xl font-black text-[#8266b6] motion-safe:animate-[guide-float_5s_ease-in-out_infinite] lg:size-24 lg:text-6xl">A</span>
    <span className="absolute right-[3%] top-0 grid size-20 rotate-12 place-items-center rounded-[23px] border-2 border-b-[7px] border-[#ddcca5] bg-[#f5e7c7] text-5xl font-black text-[#aa884c] motion-safe:animate-[guide-float_6s_ease-in-out_infinite] lg:size-24 lg:text-6xl">b</span>
    <span className="absolute right-[8%] top-28 text-2xl text-[#c9af73]">✦</span><span className="absolute left-[13%] top-0 text-[#a5ba91]">✧</span>
    <GuideCharacter mood="happy" className="relative z-10 w-44 lg:w-60"/>
    <div className="absolute -bottom-5 z-20 rounded-full border border-[#e4deed] bg-white/95 px-4 py-2 text-xs font-bold text-primary-dark shadow-sm">Hi, I’m Pip. Come explore!</div>
   </div>
   <WorldScenery className="pointer-events-none absolute bottom-0 left-0 -z-0 h-36 w-full opacity-85"/>
  </section>
  <div className="mb-5 mt-9 flex items-end justify-between gap-3"><div><SectionLabel>YOUR ADVENTURE MAP</SectionLabel><h2 className="mb-0 mt-2 text-2xl font-extrabold tracking-tight">One little discovery at a time</h2></div><span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f7efd8] px-3 py-2 text-sm font-extrabold text-[#997c37]"><Icon name="star" className="size-4"/>{progress.stars}<span className="sr-only">stars collected</span></span></div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
   {LEVELS.map((level,i)=>{const done=!!progress.levels[i+1],unlocked=i+1<=progress.highest,current=i+1===next;return <button key={level.title} disabled={!unlocked} onClick={()=>onStart(i+1)} aria-label={`Level ${i+1}: ${level.title}${!unlocked?', locked':done?', completed':''}`} className={`group relative flex min-h-40 flex-col items-start rounded-[22px] border p-4 text-left transition enabled:hover:-translate-y-1 enabled:hover:shadow-md ${current?'border-[#beaddc] bg-[#eee7f8] shadow-[0_3px_0_#d8cbea]':done?'border-[#d6e2c9] bg-[#f0f4e9]':'border-[#e8e4dc] bg-white'} ${!unlocked?'opacity-65':''}`}>
    <div className="mb-4 flex w-full items-center justify-between"><span className={`grid size-9 place-items-center rounded-xl text-lg font-black ${current?'bg-primary text-white':'bg-[#f3f0e9] text-muted'}`}>{i+1}</span>{done?<Icon name="star" className="size-5 text-[#c6a34e]"/>:unlocked?<Icon name="arrow" className="size-4 text-primary"/>:<Icon name="lock" className="size-4 text-muted"/>}</div>
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{level.area}</span><span className="mt-1 text-sm font-extrabold leading-snug">{level.title}</span><span className="mt-2 text-[11px] leading-relaxed text-muted">{level.description}</span>
   </button>;})}
  </div>
  <section className="mb-4 mt-7 flex flex-col gap-5 rounded-3xl border border-[#e6e0ee] bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between"><div><SectionLabel>YOUR LITTLE TREASURES</SectionLabel><p className="mb-0 mt-2 text-sm text-muted">Every discovery belongs to you.</p></div><div className="flex flex-wrap gap-3">{BADGES.map(b=><div key={b.id} title={b.title} aria-label={`${b.title}: ${progress.levels[b.level]?'earned':'not yet earned'}`} className={`grid size-12 place-items-center rounded-2xl border ${progress.levels[b.level]?'border-[#e9d59a] bg-[#fff1c6] text-[#b39241]':'border-[#e8e4dc] bg-[#f7f5f0] text-[#d4cdc0]'}`}><Icon name="star" className="size-6"/></div>)}</div><button onClick={onTutorial} className={secondary}><Icon name="play"/>How to play</button></section>
 </>;
}
