'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { GameShell } from '../game/GameShell';
import { Dialog } from '../game/Dialog';
import { GuideCharacter, Icon } from '../english/Art';
import { primary, secondary } from '../english/Controls';
import { LEVELS, REQUIRE_ALPHABET_BOOK } from '../../lib/sound-match/content';
import { roundAudio } from '../../lib/sound-match/audio';
import { soundMatchUnlocked } from '../../lib/sound-match/access';
import { emit } from '../../lib/sound-match/analytics';
import { useSoundMatch } from './useSoundMatch';
import { SoundHome } from './SoundHome';
import { SoundParents } from './SoundParents';
import { SoundTutorial } from './SoundTutorial';
import { SoundRound } from './SoundRound';
import { SoundGarden, SoundProgress } from './SoundArt';
const subscribe=(fn:()=>void)=>{window.addEventListener('storage',fn);return()=>window.removeEventListener('storage',fn);};
export function SoundMatchGame() {
  const game=useSoundMatch(),{state,act,start,speak,stop}=game,{status,progress:p}=state;
  const [parents,setParents]=useState(false),[switchTo,setSwitchTo]=useState<number|null>(null);
  const pending=useRef(1),summary=useRef<HTMLHeadingElement>(null);
  const unlocked=useSyncExternalStore(subscribe,soundMatchUnlocked,()=>!REQUIRE_ALPHABET_BOOK);
  const active=['ROUND_INTRO','PLAYING','HINT','ANSWER_FEEDBACK','PAUSED'].includes(status),paused=status==='PAUSED',completed=['LEVEL_COMPLETE','GAME_COMPLETE'].includes(status);
  useEffect(()=>{if(completed)summary.current?.focus();},[completed]);
  function begin(level:number) {
    if(!p.tutorialCompleted){pending.current=level;act({type:'TUTORIAL'});emit('tutorial_started');}
    else if(p.session&&p.session.level!==level)setSwitchTo(level);
    else start(level);
  }
  function home(){act({type:'HOME'});emit('game_exited');}
  function resume(){act({type:'RESUME'});emit('game_resumed');}
  return <>
    <GameShell adventure gameplay={active} gameTitle="Sound Match" inert={paused||parents||switchTo!==null} onBack={home} backLabel="Back to Sound Match home" soundEnabled={p.settings.voice} onToggleSound={()=>act({type:'SETTING',key:'voice'})} showPause={active&&!paused} onPause={()=>{act({type:'PAUSE'});emit('game_paused');}}>
      <div className={active?"skylora-gameplay-content":"pb-[max(1rem,env(safe-area-inset-bottom))]"}>
      {status==='LOADING'&&<div role="status" className="grid min-h-[65svh] place-content-center justify-items-center text-muted"><GuideCharacter mood="listening"/><p>Opening your sound garden…</p></div>}
      {!unlocked&&status!=='LOADING'?<section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center"><GuideCharacter className="mx-auto w-32"/><h1 className="text-3xl font-black">Meet your letters first</h1><p className="text-muted">Your sound garden will be ready after the A–Z letter book.</p><Link className={primary} href="/english-az-adventure">Explore the alphabet</Link></section>:<>
      {status==='READY'&&<SoundHome progress={p} onStart={begin} onTutorial={()=>{pending.current=p.session?.level??1;act({type:'TUTORIAL'});emit('tutorial_started');}} onParents={()=>{stop();setParents(true);}}/>}
      {status==='TUTORIAL'&&<SoundTutorial voice={p.settings.voice} speak={speak} stop={stop} onDone={skip=>{stop();act({type:'TUTORIAL_DONE'});emit(skip?'tutorial_skipped':'tutorial_completed');start(pending.current);}}/>}
      {active&&state.question&&<SoundRound state={state} listening={game.listening} unavailable={game.audioUnavailable} onSelect={game.select} onReplay={game.replay} onHint={game.hint} onSpeak={speak}/>}
      {completed&&<section className="mx-auto max-w-2xl overflow-hidden rounded-[36px] border border-border bg-white text-center"><div className="p-6 sm:p-10"><p className="text-xs font-black uppercase tracking-widest text-primary">A pocketful of sound gems</p><GuideCharacter mood="celebrating" className="mx-auto w-40"/><h1 ref={summary} tabIndex={-1} className="text-4xl font-black tracking-tight outline-none">{status==='GAME_COMPLETE'?'You’re a Sound Detective!':'Amazing listening!'}</h1><p className="text-sm leading-relaxed text-muted">{status==='GAME_COMPLETE'?'You explored every corner of the sound garden. Your sounds will be here whenever you visit again.':`You completed ${LEVELS[state.level-1].title}. A lovely moment to stretch and take a little break.`}</p><SoundProgress earned={10}/><p className="mx-auto my-4 w-fit rounded-full bg-[#fff0c7] px-5 py-3 text-sm font-extrabold text-[#8a6b2a]">★ {LEVELS[state.level-1].badge}</p><div className="mx-auto grid max-w-sm gap-3">{state.level<6&&<button className={primary} onClick={()=>start(state.level+1)}>Continue to the next place<Icon name="arrow"/></button>}<button className={secondary} onClick={()=>start(state.level,true)}>Play again</button><button className={secondary} onClick={home}>My sound garden</button><Link className="inline-flex min-h-12 items-center justify-center font-bold text-primary" href="/">Back to Games</Link></div></div><SoundGarden current={state.level}/></section>}
      {status==='ERROR'&&<section role="alert" className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center"><GuideCharacter mood="encouraging" className="mx-auto w-32"/><h1 className="text-3xl font-black">Oops! Let’s try that again.</h1><button className={`${primary} my-4`} onClick={home}>Try again</button><Link className={secondary} href="/">Back to Games</Link></section>}
      </>}
      {!state.available&&<p role="status" className="mx-auto mt-5 max-w-xl rounded-2xl bg-[#fff1d9] p-4 text-center text-xs text-muted">This browser cannot save progress. You can still play during this visit.</p>}
      </div>
    </GameShell>
    {paused&&<Dialog labelledBy="sound-pause-title" onClose={resume} className="w-full max-w-md rounded-3xl bg-white p-6"><h2 id="sound-pause-title" className="text-2xl font-extrabold">A little listening break</h2><p className="text-sm text-muted">Your sound garden can wait.</p><div className="mt-5 grid gap-3"><button className={primary} onClick={resume}>Resume</button><button className={secondary} onClick={()=>{resume();if(state.question)void speak(roundAudio(state.question));}}>Replay instruction</button><button className={secondary} aria-pressed={p.settings.voice} onClick={()=>act({type:'SETTING',key:'voice'})}>Voice: {p.settings.voice?'On':'Off'}</button><button className={secondary} aria-pressed={p.settings.sfx} onClick={()=>act({type:'SETTING',key:'sfx'})}>Gentle chimes: {p.settings.sfx?'On':'Off'}</button><button className={secondary} onClick={()=>act({type:'RESTART_ACTIVITY'})}>Restart current activity</button><button className={secondary} onClick={home}>Welcome screen</button><Link onClick={()=>{stop();emit('game_exited');}} className={secondary} href="/">Exit to Games</Link></div></Dialog>}
    {parents&&<SoundParents p={p} onClose={()=>setParents(false)} onSetting={key=>act({type:'SETTING',key})} onAccent={value=>act({type:'ACCENT',value})}/>}
    {switchTo!==null&&<Dialog labelledBy="sound-switch-title" onClose={()=>setSwitchTo(null)} className="w-full max-w-md rounded-3xl bg-white p-6"><h2 id="sound-switch-title" className="text-2xl font-extrabold">Explore another place?</h2><p className="text-sm leading-relaxed text-muted">Your earned sound gems are safe. This replaces your unfinished trail.</p><button className={`${primary} mt-4 w-full`} onClick={()=>{start(switchTo,true);setSwitchTo(null);}}>Start this place</button><button className={`${secondary} mt-3 w-full`} onClick={()=>setSwitchTo(null)}>Keep my trail</button></Dialog>}
  </>;
}
