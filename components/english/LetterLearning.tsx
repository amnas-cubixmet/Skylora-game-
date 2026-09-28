'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { LESSONS, LESSON_KEY, freshLessons, parseLessons, lessonComplete, allLessonsComplete, type LessonProgress } from '../../lib/english/lessons';
import { speakEnglish, stopAudio } from '../../lib/english/audio';
import { GuideCharacter } from './Art';
import { primary, secondary } from './Controls';

type State={progress:LessonProgress;loaded:boolean;available:boolean};
function reducer(state:State,action:{type:'load';progress:LessonProgress;available:boolean}|{type:'word';letter:string;word:string}|{type:'unavailable'}):State{
 if(action.type==='load')return {...action,loaded:true};
 if(action.type==='unavailable')return {...state,available:false};
 const words=state.progress.explored[action.letter]??[];
 return {...state,progress:{version:1,explored:{...state.progress.explored,[action.letter]:Array.from(new Set([...words,action.word]))}}};
}
export function LetterLearning({sound,children}:{sound:boolean;children:ReactNode}){
 const [state,dispatch]=useReducer(reducer,{progress:freshLessons(),loaded:false,available:true});
 const [selected,setSelected]=useState<string|null>(null),[practice,setPractice]=useState(false),[message,setMessage]=useState('Tap a word to explore it.'),[speaking,setSpeaking]=useState<string|null>(null);
 const token=useRef(0),title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{try{dispatch({type:'load',progress:parseLessons(localStorage.getItem(LESSON_KEY)),available:true});}catch{dispatch({type:'load',progress:freshLessons(),available:false});}return()=>stopAudio();},[]);
 useEffect(()=>{if(state.loaded){try{localStorage.setItem(LESSON_KEY,JSON.stringify(state.progress));}catch{if(state.available)dispatch({type:'unavailable'});}}},[state.progress,state.loaded,state.available]);
 useEffect(()=>{token.current++;stopAudio();},[sound]);
 useEffect(()=>{if(selected)title.current?.focus();},[selected]);
 const complete=allLessonsComplete(state.progress),lesson=LESSONS.find(l=>l.letter===selected),done=LESSONS.filter(l=>lessonComplete(state.progress,l.letter)).length;
 function navigate(letter:string|null){token.current++;stopAudio();setSpeaking(null);setSelected(letter);setMessage('Tap a word to explore it.');}
 async function hear(text:string,word?:string){
  const current=++token.current;setSpeaking(text);
  if(word&&selected)dispatch({type:'word',letter:selected,word});
  setMessage(text);
  const ok=await speakEnglish(text,sound);
  if(current===token.current){setSpeaking(null);if(!ok)setMessage(`${text} — ${sound?'Voice is unavailable on this device. Read it together or try replay.':'Sound is off. You can read it together.'}`);}
 }
 if(!state.loaded)return <p role="status">Opening your alphabet book…</p>;
 if(practice&&complete)return <><button className={`${secondary} mb-5`} onClick={()=>{stopAudio();setPractice(false);}}>← Back to letter learning</button>{children}</>;
 return <section className="english-letter-learning mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden">
  <nav className="alphabet-nav mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex min-h-11 items-center font-bold text-primary">← All games</Link>{lesson&&<button className={secondary} onClick={()=>navigate(null)}>A–Z letter list</button>}</nav>
  {!lesson?<>
   <div className="alphabet-book-intro relative rounded-[32px] bg-[#eee8f6] p-6 sm:p-10"><GuideCharacter mood="happy" className="float-right ml-3 w-20 sm:w-32"/><p className="text-xs font-extrabold tracking-widest text-primary">FIRST, LET’S MEET THE LETTERS</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">My alphabet book</h1><p className="mt-4 max-w-xl leading-relaxed text-muted">Explore A to Z. Each letter has five words to discover and hear. After every letter, your practice adventures will be ready.</p><p className="mt-5 text-sm font-bold text-primary" role="status">{done} of 26 letters explored</p></div>
   <div className="alphabet-letter-grid my-7 grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-7">{LESSONS.map(l=><button key={l.letter} aria-label={`Explore ${l.letter}${lessonComplete(state.progress,l.letter)?', completed':''}`} onClick={()=>navigate(l.letter)} className="relative min-h-24 rounded-3xl border border-border bg-white p-3 text-primary shadow-sm motion-safe:transition motion-safe:hover:-translate-y-1"><span className="block text-3xl font-black sm:text-4xl">{l.letter}<span className="ml-1 font-semibold text-muted">{l.letter.toLowerCase()}</span></span><span className="mt-2 block text-xs font-bold">{lessonComplete(state.progress,l.letter)?'★ Explored':'5 words'}</span></button>)}</div>
   <div className="alphabet-practice-card rounded-3xl border border-border bg-white p-6"><h2 className="text-xl font-extrabold">Next: playful practice</h2><p className="my-3 text-sm leading-relaxed text-muted">Find letters, match big and little letters, listen to sounds, and become an alphabet detective.</p><button className={primary} disabled={!complete} onClick={()=>{stopAudio();setPractice(true);}}>Start practice adventures →</button>{!complete&&<p className="mt-3 text-xs text-muted">Explore the five words in each letter to open practice. You can visit any letter first.</p>}</div>
  </>:<>
   <div className="alphabet-letter-hero rounded-[32px] bg-[#eee8f6] p-6 text-center sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-primary">Letter {LESSONS.indexOf(lesson)+1} of 26</p><h1 ref={title} tabIndex={-1} className="my-3 text-[6rem] font-black leading-none tracking-tight text-primary-dark outline-none sm:text-[8rem]">{lesson.letter} <span className="text-primary">{lesson.letter.toLowerCase()}</span></h1><button className={secondary} onClick={()=>void hear(`Letter ${lesson.letter}.`)}>Hear letter {lesson.letter}</button><p className="mt-4 text-sm text-muted">{lesson.letter==='X'?'Find X at the end of these words. It makes the /ks/ sound.':'Five words to explore. Tap each one and listen.'}</p></div>
   <div className="alphabet-word-grid my-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{lesson.words.map(w=>{const explored=state.progress.explored[lesson.letter]?.includes(w.word);return <button key={w.word} aria-label={`Hear ${w.word}`} aria-pressed={!!explored} onClick={()=>void hear(w.word,w.word)} className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border bg-white p-5 shadow-sm ${explored?'border-[#92b49c]':'border-border'}`}><Image src={w.pictureSrc} alt="" width={64} height={64} className="size-16"/><span className="text-xl font-extrabold text-primary-dark">{w.word}</span><span className="text-xs font-bold text-muted">{speaking===w.word&&sound?'Listening…':explored?'↻ Hear again':'♪ Hear word'}</span></button>;})}</div>
   <p role="status" aria-live="polite" className="my-4 min-h-6 text-center text-sm text-muted">{message}</p><p className="mb-4 text-center text-sm font-bold text-primary">{state.progress.explored[lesson.letter]?.length??0} of 5 words explored</p>
   <div className="alphabet-letter-actions flex flex-wrap justify-center gap-3"><button className={secondary} onClick={()=>navigate(null)}>Back to A–Z</button><button className={primary} disabled={!lessonComplete(state.progress,lesson.letter)} onClick={()=>navigate(LESSONS[LESSONS.indexOf(lesson)+1]?.letter??null)}>{lesson.letter==='Z'?'Finish letter book':'Next letter →'}</button></div>
  </>}
  {!state.available&&<p role="status" className="mt-5 rounded-2xl bg-[#fff1d9] p-4 text-sm">Your browser cannot save this letter book. You can still explore and open practice during this visit.</p>}
 <p className="alphabet-footnote mt-8 text-center text-[10px] text-muted">Word pictures: Twemoji, © Twitter and contributors · CC BY 4.0.</p>
 </section>;
}
