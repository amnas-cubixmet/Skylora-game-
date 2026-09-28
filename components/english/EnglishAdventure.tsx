'use client';
import { useEffect, useRef, useState } from 'react';
import { GameShell } from '../game/GameShell';
import { PauseMenu } from '../game/PauseMenu';
import { ProgressDots } from '../game/ProgressDots';
import { Dialog } from '../game/Dialog';
import { GuideCharacter, Icon, Picture, WorldScenery, type GuideMood } from './Art';
import { LetterLearning } from './LetterLearning';
import { AdventureHome } from './AdventureHome';
import { ParentView } from './ParentView';
import { AudioButton, HintButton, LetterCard, SectionLabel, primary, secondary } from './Controls';
import { useAdventure } from './useAdventure';
import { BADGES, LEVELS, letter } from '../../lib/english/content';
import { emit } from '../../lib/english/analytics';
export function EnglishAdventure(){
 const game=useAdventure();const {state,act,start,select,hint,replay,listening,audioAvailable}=game;
 const {progress:p,status,question:q}=state;
 const [parents,setParents]=useState(false),[tutorialSolved,setTutorialSolved]=useState(false),[tutorialMessage,setTutorialMessage]=useState('Can you find A?'),[switchLevel,setSwitchLevel]=useState<number|null>(null);
 const pendingLevel=useRef<number|null>(null);const heading=useRef<HTMLHeadingElement>(null);const completedHeading=useRef<HTMLHeadingElement>(null);
 const active=['PLAYING','HINT','ANSWER_FEEDBACK','PAUSED'].includes(status);
 const correct=status==='ANSWER_FEEDBACK'&&!state.wrong;
 const paused=status==='PAUSED';
 const qid=q?.id;
 useEffect(()=>{
  if(!qid)return;
  const raf=requestAnimationFrame(()=>{heading.current?.focus();void game.announce();});
  return()=>cancelAnimationFrame(raf);
  // Question IDs define the announcement lifetime. Answer changes never replay it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[qid]);
 useEffect(()=>{if(status==='LEVEL_COMPLETE'||status==='GAME_COMPLETE')completedHeading.current?.focus();},[status]);
 useEffect(()=>{
  if(!correct||!qid)return;
  const timer=window.setTimeout(()=>act({type:'NEXT'}),1400);
  return()=>window.clearTimeout(timer);
  // Correct answers advance automatically after the short in-place reward.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[correct,qid]);
 function begin(level:number){
  if(!p.tutorial){pendingLevel.current=level;setTutorialSolved(false);act({type:'TUTORIAL'});emit('tutorial_started');}
  else if(p.active&&p.active.level!==level)setSwitchLevel(level);
  else start(level);
 }
 function tutorial(){pendingLevel.current=null;setTutorialSolved(false);setTutorialMessage('Can you find A?');act({type:'TUTORIAL'});emit('tutorial_started');}
 function finishTutorial(){act({type:'TUTORIAL_DONE'});emit('tutorial_completed');if(pendingLevel.current!==null)start(pendingLevel.current);pendingLevel.current=null;}
 function home(){act({type:'HOME'});emit('game_exited',{level:state.level});}
 const mood:GuideMood=correct?'happy':listening?'listening':paused?'thinking':status==='HINT'?'hint':state.wrong?'encouraging':'idle';
 const a=p.active;
 const shownRound=correct?(a?a.round:10):(a?.round??0);
 const target=q?letter(q.target):null;
 const concealed=q?.mode==='listening'&&p.sound&&audioAvailable&&!a?.hinted&&!correct;
 const subtitle=q?.mode==='matching'?'Find its little letter friend':q?.mode==='picture'?'Find its picture friend':q?.mode==='phonics'?(q.target==='X'?'Listen for the last sound':q.target==='Q'?'Which letter works with U?':'Listen for the first sound'):q?.mode==='confusion'?'Look closely. Find its twin.':concealed?'Listen closely. Which letter?':'Find the letter';
 const summary=status==='LEVEL_COMPLETE'||status==='GAME_COMPLETE';
 return <>
 <GameShell adventure gameplay={active} gameTitle="English A–Z Adventure" inert={paused||parents||switchLevel!==null} onBack={home} backLabel="Back to adventure map" soundEnabled={p.sound} onToggleSound={()=>act({type:'SOUND'})} showPause={active&&!correct&&!paused} onPause={()=>{act({type:'PAUSE'});emit('game_paused');}}>
  {status==='LOADING'&&<div role="status" className="grid min-h-[65svh] place-content-center justify-items-center gap-3 text-muted"><GuideCharacter mood="thinking"/><p>Getting your little world ready…</p></div>}
  {status==='ERROR'&&<section role="alert" className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center"><GuideCharacter mood="encouraging" className="mx-auto w-32"/><h1 className="text-2xl font-black">Let’s try a fresh start</h1><p className="text-muted">{state.error??'Your adventure needs a moment.'}</p><button className={primary} onClick={home}>Back to the map</button></section>}
  <div hidden={status!=='READY'}><LetterLearning sound={p.sound}><AdventureHome progress={p} onStart={begin} onParents={()=>setParents(true)} onTutorial={tutorial}/></LetterLearning></div>
  {status==='TUTORIAL'&&<section className="mx-auto max-w-2xl rounded-[32px] border border-border bg-white p-5 text-center sm:p-10"><SectionLabel>A LITTLE HELLO BEFORE WE GO</SectionLabel><GuideCharacter mood={tutorialSolved?'happy':'listening'} className="mx-auto mt-3 w-36"/><h1 className="text-3xl font-black tracking-tight">Listen. Look. Find!</h1><p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">I’m Pip! Listen to a letter, then tap its card. We can always try again together.</p><button className={`${secondary} my-3`} onClick={()=>void game.announce('Find the letter A.')}><Icon name="sound"/>Hear the letter</button><div className="mx-auto grid max-w-md grid-cols-3 gap-3">{['A','B','C'].map((v,i)=><LetterCard key={v} value={v} index={i} lowercase={false} picture={false} selectedWrong={false} correct={tutorialSolved&&v==='A'} hinted={false} dimmed={false} disabled={tutorialSolved} onSelect={v=>{if(v==='A'){setTutorialSolved(true);setTutorialMessage('You found A! You’re ready to explore.');void game.announce('Wonderful! A is for apple.');}else{setTutorialMessage('Try again. Look for A.');void game.announce('Try again. Find A.');}}}/>)}</div><p aria-live="polite" className="my-5 text-sm font-bold text-primary-dark">{tutorialMessage}</p><button className={primary} disabled={!tutorialSolved} onClick={finishTutorial}>Let’s explore<Icon name="arrow"/></button><button className="mx-auto mt-5 block min-h-11 px-4 text-sm font-bold text-muted" onClick={home}>Back to the map</button></section>}
  {active&&q&&target&&<>
   <section className={`skylora-activity-screen skylora-activity-card skylora-english-round relative mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-[#e5deed] bg-white px-4 pb-5 pt-4 shadow-[0_12px_50px_#47355a08] sm:rounded-[36px] sm:p-7 ${correct?'is-correct':''}`}>
    <span className="sr-only">{LEVELS[state.level-1].title}</span>
    <ProgressDots current={shownRound} total={10}/>
    <div className="relative mx-auto max-w-2xl pb-2 pt-3 text-center">
     <h1 ref={heading} tabIndex={-1} className="m-0 text-lg font-extrabold tracking-tight outline-none sm:text-2xl">{subtitle}</h1>
     <div className="skylora-activity-target relative mx-auto flex min-h-28 max-w-sm items-center justify-center sm:min-h-44">
      <div data-testid="target-clue" className="relative z-10 flex flex-col items-center justify-center">
       {concealed?<button onClick={replay} className="my-3 grid size-24 place-items-center rounded-[28px] border-2 border-[#d9cdec] bg-surface-soft text-primary shadow-[0_5px_0_#e1d6ee]" aria-label="Hear the hidden letter"><Icon name="sound" className="size-10"/></button>:<span aria-label={q.mode==='phonics'?`Sound ${target.sound}`:`Target ${q.mode==='confusion'?target.lower:target.upper}`} className={`block font-black leading-none tracking-[-0.055em] text-primary-dark ${q.mode==='phonics'?'py-5 text-6xl sm:text-7xl':'text-[5rem] sm:text-[8rem]'}`}>{q.mode==='phonics'?`/${target.sound}/`:q.mode==='confusion'?target.lower:target.upper}</span>}
       {q.mode==='phonics'&&<span className="sr-only">{q.target==='X'?'The end of box':q.target==='Q'?'Q and U in queen':`The beginning of ${target.word}`}</span>}
      </div>
      <GuideCharacter mood={mood} className="skylora-english-guide absolute -right-1 bottom-1 w-[80px] opacity-95 sm:-right-12 sm:w-28"/>
     </div>
     <div className="flex flex-wrap items-center justify-center gap-2">{!correct&&<><AudioButton onClick={replay} disabled={!p.sound} listening={listening}/><HintButton onClick={hint}/></>}</div>
     {q.mode==='listening'&&(!p.sound||!audioAvailable)&&<p className="sr-only" role="status">A visual clue is ready.</p>}
    </div>
    <p aria-live="polite" aria-atomic="true" className={`mx-auto mb-3 mt-2 min-h-6 max-w-md text-center text-base font-black ${correct?'text-[#567e58]':'text-muted'}`}>{correct?'Great!':state.wrong?'Try again!':''}</p>
    <div className={`skylora-choice-grid relative mx-auto grid max-w-2xl gap-2 sm:gap-3 ${q.options.length===3||q.options.length===6?'grid-cols-3':'grid-cols-2 min-[680px]:grid-cols-4'}`}>
      {q.options.map((value,i)=><LetterCard key={`${q.id}-${value}`} value={value} index={i} lowercase={q.mode==='matching'||q.mode==='confusion'} picture={q.mode==='picture'} selectedWrong={state.wrong===value} correct={correct&&value===q.target} hinted={!correct&&!!a?.hinted&&value===q.target} dimmed={!correct&&!!a&&(a.attempted>=3||a.hints>=2)&&value!==q.target} disabled={paused||correct} onSelect={select}/>)}
     </div>
    {correct&&<div className="skylora-correct-panel relative mx-auto flex mt-4 max-w-lg flex-col items-center rounded-3xl bg-[#f4f6ed] p-4 text-center motion-safe:animate-[soft-enter_0.3s_ease-out]">
      <div className="flex items-center gap-4"><Picture value={q.target} className="h-24 w-24 sm:h-28 sm:w-28"/><div className="text-left"><span className="text-4xl font-black text-primary-dark">{target.upper} <span className="text-primary">{target.lower}</span></span><p className="mb-0 mt-1 text-lg font-bold capitalize text-[#637853]">{target.word}</p><span className="text-sm text-muted">{q.target==='Q'?'qu':target.lower} · /{target.sound}/</span></div></div>
     </div>}
    {a?.hinted&&!correct&&q.mode!=='picture'&&<div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-muted"><Picture value={q.target} className="size-9"/>{q.target==='X'?'X is in box':`${target.upper} is for ${target.word}`}</div>}
   </section>
  </>}
  {summary&&<section className="relative mx-auto max-w-2xl overflow-hidden rounded-[36px] border border-[#e4deed] bg-gradient-to-b from-white to-[#f2efdf] px-5 pb-24 pt-8 text-center sm:px-10"><SectionLabel>{status==='GAME_COMPLETE'?'YOUR ALPHABET ADVENTURE':'A POCKETFUL OF DISCOVERIES'}</SectionLabel><GuideCharacter mood="celebrating" className="mx-auto my-2 w-44"/><h1 ref={completedHeading} tabIndex={-1} className="text-4xl font-black tracking-tight outline-none">{status==='GAME_COMPLETE'?'You’re an A–Z Star!':'Look how far you’ve come!'}</h1><p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">{status==='GAME_COMPLETE'?'You explored every part of our little world. Your letters will be here whenever you want to visit again.':'Ten little discoveries, all yours. A lovely moment to stretch, smile, and take a little break.'}</p><div className="my-5 flex justify-center gap-1 text-[#d6b35d]" aria-label="10 stars earned">{Array.from({length:10},(_,i)=><Icon name="star" key={i} className="size-5 sm:size-6"/>)}</div>{BADGES.filter(b=>b.level===state.level).map(b=><div key={b.id} className="mx-auto mb-6 w-fit rounded-full border border-[#e7d49b] bg-[#fff2cc] px-5 py-3 text-sm font-extrabold text-[#927734]">✦ {b.title}</div>)}<div className="relative z-10 mx-auto grid max-w-sm gap-3">{state.level<10&&<button className={primary} onClick={()=>start(state.level+1)}>Explore the next place<Icon name="arrow"/></button>}<button className={secondary} onClick={home}><Icon name="home"/>Back to my adventure map</button><button className="min-h-11 text-sm font-bold text-muted" onClick={()=>start(state.level,true)}>Play this level again</button></div><WorldScenery className="pointer-events-none absolute bottom-0 left-0 h-28 w-full"/></section>}
  {!state.available&&<p role="status" className="mx-auto mt-6 max-w-xl rounded-2xl bg-[#fff1d9] p-3 text-center text-xs text-[#876b3e]">You can still play! This browser can’t save progress after you leave.</p>}
 </GameShell>
 {paused&&<PauseMenu soundEnabled={p.sound} onContinue={()=>{act({type:'RESUME'});emit('game_resumed');void game.announce();}} onRestart={()=>start(state.level,true)} onToggleSound={()=>act({type:'SOUND'})} onExit={home}/>}
 {parents&&<ParentView progress={p} onClose={()=>setParents(false)}/>}
 {switchLevel!==null&&<Dialog labelledBy="switch-title" onClose={()=>setSwitchLevel(null)} className="w-full max-w-md rounded-3xl bg-white p-7"><h2 id="switch-title" className="text-2xl font-extrabold">Explore a different place?</h2><p className="text-sm leading-relaxed text-muted">Your stars and discoveries are safe. Starting here replaces the unfinished trail in Level {p.active?.level}.</p><div className="mt-5 grid gap-3"><button className={primary} onClick={()=>{start(switchLevel,true);setSwitchLevel(null);}}>Start Level {switchLevel}</button><button className={secondary} onClick={()=>setSwitchLevel(null)}>Keep my current trail</button></div></Dialog>}
 </>;
}
