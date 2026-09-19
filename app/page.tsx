"use client";
import {useEffect,useMemo,useRef,useState} from "react";

type Letter={l:string;sound:string;cue:string;action:string;emoji:string;mouth:string};
const DATA:string[][]=[
["A","æ","short a","Grow the apple","🍎","Open your mouth wide. Tongue low."],["B","b","b","Bounce the ball","⚽","Close both lips, then release."],["C","k","k","Wake the cat","🐱","Back of tongue lifts, then releases."],["D","d","d","Beat the drum","🥁","Tongue taps behind top teeth."],["E","e","short e","Hatch the egg","🥚","Mouth relaxed and slightly open."],["F","f","f","Swim with the fish","🐟","Top teeth touch lower lip. Blow air."],["G","g","g","Open the gift","🎁","Back of tongue lifts. Voice on."],["H","h","h","Fly the hat","🎩","Mouth open. Soft air flows out."],["I","ɪ","short i","Paint with ink","🖌️","Relaxed mouth. Tongue high-front."],["J","dʒ","j","Launch the jet","✈️","Tongue near roof. Voice then release."],["K","k","k","Lift the kite","🪁","Back of tongue lifts, then releases."],["L","l","l","Guide the leaf","🍃","Tongue tip touches behind top teeth."],["M","m","m","Light the moon","🌙","Lips together. Voice hums."],["N","n","n","Build the nest","🪺","Tongue behind top teeth. Voice through nose."],["O","ɒ","short o","Wake the octopus","🐙","Round open mouth."],["P","p","p","Pop the bubbles","🫧","Close lips, release a puff of air."],["Q","kw","kw","Light the crown","👑","Start k, then round lips for w."],["R","r","r","Help the rabbit","🐰","Lips slightly rounded. Tongue does not touch roof."],["S","s","s","Raise the sun","☀️","Teeth close. Long stream of air."],["T","t","t","Spin the top","🌀","Tongue taps behind top teeth. No voice."],["U","ʌ","short u","Open the umbrella","☂️","Relaxed open mouth. Short sound."],["V","v","v","Drive the van","🚐","Top teeth touch lower lip. Voice vibrates."],["W","w","w","Water the plant","💧","Round lips, then open."],["X","ks","ks","Open the box","📦","Make k then s."],["Y","j","y","Follow the trail","✨","Tongue high, glide into the sound."],["Z","z","z","Open the portal","🦓","Teeth close. Voice buzzes."]
];
const LETTERS:Letter[]=DATA.map(x=>({l:x[0],sound:x[1],cue:x[2],action:x[3],emoji:x[4],mouth:x[5]}));
function say(text:string,rate=.55){if(!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=rate;u.pitch=1.12;const vs=speechSynthesis.getVoices();u.voice=vs.find(v=>/female|samantha|zira|ava|victoria/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null;speechSynthesis.speak(u)}
export default function Home(){
 const [idx,setIdx]=useState(0),[phase,setPhase]=useState<"meet"|"listen"|"speak"|"retry"|"success">("meet"),[listening,setListening]=useState(false),[attempts,setAttempts]=useState(0),[done,setDone]=useState<string[]>([]),[level,setLevel]=useState(0);const timer=useRef<any>(null);const x=LETTERS[idx];
 useEffect(()=>{try{setDone(JSON.parse(localStorage.getItem("skylora-progress")||"[]"))}catch{};return()=>clearTimeout(timer.current)},[]);
 const progress=useMemo(()=>Math.round(done.length/26*100),[done]);
 function model(){setPhase("listen");say(x.cue==="short a"?"aah":x.cue==="short e"?"eh":x.cue==="short i"?"ih":x.cue==="short o"?"oh":x.cue==="short u"?"uh":x.sound,.42)}
 function pass(){setListening(false);setPhase("success");setLevel(1);const n=[...new Set([...done,x.l])];setDone(n);localStorage.setItem("skylora-progress",JSON.stringify(n));say("Beautiful sound!",.7)}
 function retry(){setListening(false);setAttempts(a=>a+1);setPhase("retry");say("Let's listen again",.65);timer.current=setTimeout(model,900)}
 function record(){
  setPhase("speak");setListening(true);setLevel(0);
  navigator.mediaDevices?.getUserMedia({audio:true}).then(stream=>{
   const ctx=new AudioContext(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();an.fftSize=512;src.connect(an);const d=new Uint8Array(an.frequencyBinCount);let peak=0,frames=0;
   const sample=()=>{an.getByteFrequencyData(d);peak=Math.max(peak,d.reduce((a,b)=>a+b,0)/d.length);frames++;setLevel(Math.min(1,peak/45));if(frames<45)requestAnimationFrame(sample);else{stream.getTracks().forEach(t=>t.stop());ctx.close();peak>7?pass():retry()}};sample();
  }).catch(retry)
 }
 function next(){setIdx((idx+1)%26);setPhase("meet");setAttempts(0);setLevel(0)}
 return <main className={"world "+phase}>
  <header><div><b>SKYLORA</b><span>A–Z Sound Quest</span></div><button className="parent" onClick={()=>alert(`${done.length}/26 sounds explored • ${progress}% journey`)}>Parent</button></header>
  <div className="progress"><i style={{width:`${progress}%`}}/></div>
  <section className="scene"><div className="cloud c1"/><div className="cloud c2"/><div className="hill h1"/><div className="hill h2"/>
   <div className={"object "+(phase==="success"?"alive":"")} style={{transform:`scale(${1+level*.16})`}}>{x.emoji}</div>
   <div className="card">
    <p className="eyebrow">{phase==="retry"?"LET'S TRY ONCE MORE":phase==="success"?"YOUR SOUND MOVED THE WORLD":phase==="speak"?"YOUR TURN":phase==="listen"?"WATCH • LISTEN":"MEET THE SOUND"}</p>
    <div className="letter">{x.l}</div><div className="phoneme">/{x.sound}/</div>
    <div className="mouth" aria-label="mouth position"><span className="face">◡</span><div className="air">{phase==="listen"?"··· →":""}</div><small>{x.mouth}</small></div>
    <h1>{phase==="success"?x.action:"Only the letter sound"}</h1>
    <p>{phase==="meet"?"Listen slowly. Watch how the mouth makes the sound.":phase==="listen"?`Listen carefully to / ${x.sound} /`:phase==="speak"?(listening?"Listening to your sound…":"Tap the microphone and make the sound."):phase==="retry"?"Not quite yet. Listen to the sound once more.":"Great! Your voice made something happen."}</p>
    <div className="wave">{[.4,.8,.55,1,.65,.9,.45].map((v,i)=><i key={i} style={{height:`${12+(listening?level:0)*v*42}px`}}/>)}</div>
    <div className="actions">{phase!=="success"&&<><button onClick={model}>🔊 Slow sound</button><button className={listening?"mic live":"mic"} disabled={listening} onClick={record}>🎙 {listening?"Listening…":"Say the sound"}</button></>}{phase==="success"&&<button className="next" onClick={next}>Next sound →</button>}</div>
    {attempts>=2&&phase!=="success"&&<button className="assist" onClick={()=>{model();setTimeout(pass,1400)}}>Say it together →</button>}
   </div>
  </section>
  <nav>{LETTERS.map((a,i)=><button key={a.l} className={i===idx?"active":done.includes(a.l)?"done":""} onClick={()=>{setIdx(i);setPhase("meet");setAttempts(0)}}>{a.l}</button>)}</nav>
 </main>
}