import { cancelAudio, canSpeak } from '../number-hunt/audio';
import { instruction } from './questions';
import type { Question } from './types';
let generation=0;
let current:SpeechSynthesisUtterance|null=null;
let settle:((value:boolean)=>void)|null=null;
export function stopAudio(){generation++;cancelAudio();settle?.(false);settle=null;current=null;}
export function speakEnglish(text:string, enabled:boolean, locale='en-GB',options?:{rate?:number;pitch?:number}):Promise<boolean>{
 stopAudio();
 if(!enabled||!canSpeak())return Promise.resolve(false);
 const token=generation;
 return new Promise(resolve=>{
  settle=resolve;
  try{
   const utterance=new SpeechSynthesisUtterance(text);current=utterance;
   utterance.lang=locale;utterance.rate=options?.rate??0.8;utterance.pitch=options?.pitch??1.08;
   const voices=window.speechSynthesis.getVoices();
   utterance.voice=voices.find(v=>v.lang.toLowerCase()===locale.toLowerCase())??voices.find(v=>v.lang.toLowerCase().startsWith(locale.slice(0,2).toLowerCase()))??voices.find(v=>v.lang.startsWith('en'))??null;
   const finish=(ok:boolean)=>{if(token!==generation)return;settle=null;current=null;resolve(ok);};
   utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);
   window.speechSynthesis.speak(current);
  }catch{settle=null;current=null;resolve(false);}
 });
}
export const speakQuestion=(q:Question,enabled:boolean)=>speakEnglish(instruction(q),enabled);
export { canSpeak };
