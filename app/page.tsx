"use client";
import {useEffect,useMemo,useState} from "react";

type Letter={l:string;sound:string;word:string;friend:string;action:string;emoji:string};
const LETTERS:Letter[]=[
["A","æ","apple","ant","Make the apple grow","🍎"],["B","b","ball","bee","Blow the balloon forward","🎈"],["C","k","cat","car","Wake the sleepy cat","🐱"],["D","d","dog","drum","Beat the magic drum","🥁"],["E","e","egg","elephant","Help the egg hatch","🥚"],["F","f","fish","fan","Move the fish through bubbles","🐟"],["G","g","goat","gift","Open the glowing gift","🎁"],["H","h","hat","hen","Send the hat into the breeze","🎩"],["I","ɪ","ink","insect","Reveal a picture with magic ink","🖋️"],["J","dʒ","jam","jet","Launch the little jet","✈️"],["K","k","kite","key","Lift the kite into the sky","🪁"],["L","l","lion","leaf","Guide the leaf along a path","🍃"],["M","m","moon","mouse","Light up the moon","🌙"],["N","n","nest","net","Bring a bird home to its nest","🪺"],["O","ɒ","octopus","orange","Wake the colorful octopus","🐙"],["P","p","pig","pen","Pop gentle floating bubbles","🐷"],["Q","kw","queen","quilt","Complete the queen's quilt","👑"],["R","r","rabbit","rain","Help the rabbit reach the rain","🐰"],["S","s","sun","snake","Make the sun rise","☀️"],["T","t","top","tiger","Spin the magic top","🐯"],["U","ʌ","umbrella","up","Open the umbrella","☂️"],["V","v","van","vase","Move the van along the road","🚐"],["W","w","water","web","Send water to a little plant","💧"],["X","ks","box","fox","Unlock the mystery box","📦"],["Y","j","yak","yellow","Follow the yellow trail","🟡"],["Z","z","zebra","zip","Zip open the final portal","🦓"]
].map(x=>({l:x[0],sound:x[1],word:x[2],friend:x[3],action:x[4],emoji:x[5]}));

function speak(text:string){if(!("speechSynthesis" in window))return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text);u.rate=.72;u.pitch=1.08;speechSynthesis.speak(u)}
export default function Home(){
 const [idx,setIdx]=useState(0),[phase,setPhase]=useState<"meet"|"listen"|"speak"|"success">("meet"),[listening,setListening]=useState(false),[attempts,setAttempts]=useState(0),[done,setDone]=useState<string[]>([]); const x=LETTERS[idx];
 useEffect(()=>{try{const d=JSON.parse(localStorage.getItem("skylora-progress")||"[]");setDone(d)}catch{}},[]);
 const progress=useMemo(()=>Math.round(done.length/26*100),[done]);
 function model(){setPhase("listen");speak(`${x.sound}. ${x.sound}. ${x.word}`)}
 function success(){setListening(false);setPhase("success");const n=[...new Set([...done,x.l])];setDone(n);localStorage.setItem("skylora-progress",JSON.stringify(n));speak(`Yes! ${x.sound}. ${x.word}!`)}
 function record(){
   const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
   setPhase("speak");setListening(true);
   if(!SR){setTimeout(success,1800);return}
   const r=new SR();r.lang="en-US";r.interimResults=false;r.maxAlternatives=5;
   r.onresult=(e:any)=>{const heard=[...e.results[0]].map((a:any)=>a.transcript.toLowerCase()).join(" "); const ok=heard.includes(x.word)||heard.includes(x.l.toLowerCase())||heard.length>0; ok?success():(setAttempts(a=>a+1),setListening(false),speak(`Let's listen again. ${x.sound}`))};
   r.onerror=()=>{setAttempts(a=>a+1);setListening(false);speak(`Let's listen again. ${x.sound}`)};r.onend=()=>setListening(false);r.start();
 }
 function next(){setIdx((idx+1)%26);setPhase("meet");setAttempts(0)}
 return <main className={`world phase-${phase}`}>
  <header><div><b>SKYLORA</b><span>Sound Quest</span></div><button className="parent" onClick={()=>alert(`Parent insight: ${done.length}/26 sounds explored • ${progress}% journey`)}>Parent</button></header>
  <div className="progress"><i style={{width:`${progress}%`}}/></div>
  <section className="scene">
   <div className="cloud c1"/><div className="cloud c2"/><div className="hill h1"/><div className="hill h2"/>
   <div className={`object ${phase==="success"?"alive":""}`} aria-hidden>{x.emoji}</div>
   <div className="card">
    <p className="eyebrow">{phase==="meet"?"MEET THE SOUND":phase==="listen"?"LISTEN":phase==="speak"?"YOUR TURN":"YOU MADE THE WORLD MOVE!"}</p>
    <div className="letter">{x.l}</div><div className="phoneme">/{x.sound}/</div>
    <h1>{phase==="success"?x.action:`${x.word[0].toUpperCase()+x.word.slice(1)} • ${x.friend[0].toUpperCase()+x.friend.slice(1)}`}</h1>
    <p>{phase==="meet"?"Tap Listen and hear the sound.":phase==="listen"?`Listen: / ${x.sound} /  / ${x.sound} /  ${x.word}`:phase==="speak"?(listening?"I'm listening…":"Say the sound. Your voice is the controller."):"Wonderful! A new part of Sound World is awake."}</p>
    <div className="actions">{phase!=="success"&&<><button onClick={model}>🔊 Listen</button><button className={listening?"mic live":"mic"} onClick={record}>🎙 {listening?"Listening…":"My turn"}</button></>}{phase==="success"&&<button className="next" onClick={next}>{idx===25?"Open Sound World":"Next sound →"}</button>}</div>
    {attempts>=2&&phase!=="success"&&<button className="assist" onClick={success}>Practice together →</button>}
   </div>
  </section>
  <nav>{LETTERS.map((a,i)=><button key={a.l} className={i===idx?"active":done.includes(a.l)?"done":""} onClick={()=>{setIdx(i);setPhase("meet");setAttempts(0)}}>{a.l}</button>)}</nav>
 </main>
}