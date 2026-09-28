import { useId } from 'react';
export type GuideMood='idle'|'listening'|'thinking'|'happy'|'celebrating'|'encouraging'|'hint';
export { Icon } from '../game/Icon';
export function GuideCharacter({mood='idle',className='w-36'}:{mood?:GuideMood;className?:string}){
 const id=useId().replace(/:/g,''); const happy=['happy','celebrating'].includes(mood);
 return <svg viewBox="0 0 180 190" role="img" aria-label={`Pip, your friendly guide, is ${mood}`} className={`${className} overflow-visible ${mood==='celebrating'?'motion-safe:animate-[guide-dance_0.7s_ease-in-out_2]':'motion-safe:animate-[guide-float_5s_ease-in-out_infinite]'}`}>
  <defs><linearGradient id={id} x2=".8" y2="1"><stop stopColor="#bfb0f1"/><stop offset="1" stopColor="#8e7bd0"/></linearGradient></defs>
  <ellipse cx="91" cy="173" rx="48" ry="9" fill="#41306e" opacity=".10"/>
  <path d="m57 147-8 17q10 10 24 0l1-15m30 0 6 16q14 7 22-2l-10-18" fill="#7560bb"/>
  <path d={happy?'M37 103Q6 88 17 75M144 101q28-14 18-29':'M38 110q-28 14-18 27m121-27q25 14 19 24'} fill="none" stroke="#9b88d6" strokeWidth="15" strokeLinecap="round"/>
  <path d="M91 49C62 9 29 52 40 74 10 83 20 122 39 124c-4 32 35 42 53 26 25 21 62-1 51-27 29-19 12-57-12-52 0-31-30-36-40-22Z" fill={`url(#${id})`} stroke="#8e7ac9" strokeWidth="2"/>
  <path d="M85 48Q63 17 88 15q18 11 5 29Q91 10 111 11q5 25-18 37" fill="#c5dda2" stroke="#84aa68" strokeWidth="2"/>
  <ellipse cx="53" cy="113" rx="10" ry="6" fill="#efb5c4"/><ellipse cx="126" cy="113" rx="10" ry="6" fill="#efb5c4"/>
  {happy?<g fill="none" stroke="#393052" strokeWidth="4" strokeLinecap="round"><path d="M62 96q6-9 12 0m32 0q6-9 12 0"/></g>:<g fill="#393052"><ellipse cx="68" cy="96" rx="5" ry={mood==='thinking'?3:7}/><ellipse cx="112" cy="96" rx="5" ry="7"/><circle cx="70" cy="93" r="1.5" fill="white"/><circle cx="114" cy="93" r="1.5" fill="white"/></g>}
  <path d={happy?'M79 114q12 22 24 0Z':'M82 116q8 8 17 0'} fill={happy?'#67406c':'none'} stroke="#443557" strokeWidth="3" strokeLinecap="round"/>
  <path d="m87 134 4-6 4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5z" fill="#ffe5a0"/>
  {mood==='listening'&&<g stroke="#8770c0" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M152 55q13 8 0 16m8-23q20 15 0 30"/></g>}
  {mood==='hint'&&<g fill="#f5bc59"><path d="m151 33 4 8 9 1-7 7 2 9-8-5-8 5 2-9-7-7 9-1z"/></g>}
 </svg>;
}
export function WorldScenery({className=''}:{className?:string}){
 return <svg viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden="true" className={className}>
 <g fill="#fff" opacity=".7"><path d="M87 68c-20 0-20-25-4-28 0-29 39-33 46-10 25-3 33 35 7 38z"/><path d="M725 43c-14 0-17-20-3-24 0-23 31-27 37-7 23-3 25 31 3 31z"/></g>
 <path d="M0 165Q160 48 340 163T710 148T1040 155V240H0" fill="#e6ebd8"/><path d="M0 202Q185 115 384 201T744 173T1050 194V240H0" fill="#d4e3cd"/>
 <path d="M322 240q141-70 321 0" fill="#f5ebd7"/><g stroke="#9aaf85" strokeWidth="7" strokeLinecap="round"><path d="M122 193v-56m754 44v-58"/></g>
 <g fill="#adc996"><ellipse cx="121" cy="114" rx="31" ry="43"/><ellipse cx="874" cy="98" rx="27" ry="38"/></g><g fill="#c0d5a9"><ellipse cx="106" cy="121" rx="21" ry="24"/><ellipse cx="887" cy="105" rx="19" ry="24"/></g>
 <g fill="#e8bb96"><circle cx="214" cy="199" r="5"/><circle cx="785" cy="208" r="4"/></g><g fill="#faf7e9"><circle cx="223" cy="208" r="4"/><circle cx="779" cy="198" r="5"/></g>
 </svg>;
}
export function Picture({value,className='w-24 h-24'}:{value:string;className?:string}){
 const shapes:Record<string,React.ReactNode>={
 A:<><path d="M51 30q-4-18 8-24" stroke="#746347"/><path d="M55 18q19-15 24-3-10 12-24 3" fill="#90b878"/><path d="M51 32C16 13 6 55 25 80q13 17 26 7c29 14 50-52 24-58q-13-5-24 3" fill="#e98478"/><path d="M29 43q-10 13-5 22" stroke="#ffd9c3"/></>,
 B:<><circle cx="50" cy="51" r="36" fill="#eeb66f"/><path d="M18 36q43 8 60 40M46 16q-24 35 19 64M19 71q41-25 62-46" stroke="#fff0cd" fill="none"/></>,
 C:<><path d="m23 39-3-25 25 15m12 0 22-15-3 28" fill="#e5b47c"/><ellipse cx="50" cy="56" rx="35" ry="30" fill="#edc391"/><circle cx="36" cy="52" r="3"/><circle cx="64" cy="52" r="3"/><path d="m46 63 4 5 5-5m-5 5v8m-24-14-19-3m20 11-19 4m66-12 18-3m-18 12 18 3" fill="none" stroke="#785b51"/></>,
 D:<><path d="M25 27Q-2 27 13 70l22-22m38-20q29 0 14 43L65 49" fill="#9e765d"/><ellipse cx="50" cy="53" rx="31" ry="33" fill="#d7b48a"/><ellipse cx="50" cy="67" rx="19" ry="14" fill="#f5e1ba"/><circle cx="37" cy="48" r="3"/><circle cx="63" cy="48" r="3"/><path d="m43 62 7 7 7-7" fill="#6b544c"/></>,
 E:<><path d="M50 12C25 12 4 73 28 86c39 25 70-13 47-49Q63 12 50 12" fill="#fff6db" stroke="#dfcbae"/><ellipse cx="50" cy="64" rx="19" ry="20" fill="#f0c46d"/></>,
 F:<><path d="m70 49 22-22v46z" fill="#e3a56d"/><ellipse cx="43" cy="51" rx="31" ry="25" fill="#ecb87b"/><path d="m42 27 13-16 10 23m-23 42 13 13 9-20" fill="#d89867"/><circle cx="27" cy="47" r="4"/><path d="M49 32q-12 20 0 38" fill="none" stroke="#fff0cb"/></>,
 G:<><path d="M30 37 24 11m46 26 6-26" stroke="#aa9374"/><path d="m24 38-18-9 13 24m57-14 19-10-14 24" fill="#d1bf96"/><ellipse cx="50" cy="53" rx="27" ry="30" fill="#f3e4c4"/><path d="m39 78 11 16 12-16" fill="#ded0aa"/><circle cx="39" cy="49" r="3"/><circle cx="62" cy="49" r="3"/><path d="m44 65 6 5 6-5" fill="#ae987e"/></>,
 H:<><path d="m25 67 6-40q19-27 40 0l6 40" fill="#a89bd0"/><ellipse cx="50" cy="70" rx="42" ry="12" fill="#8a7bb5"/><path d="M28 51h47v12H28z" fill="#e8bd82"/></>,
 I:<><ellipse cx="50" cy="57" rx="25" ry="31" fill="#db8880"/><circle cx="50" cy="27" r="14" fill="#6b6269"/><path d="M50 36v48M36 17l-8-8m36 8 8-8M24 47l-13-6m13 22-14 6m66-22 13-6m-13 22 14 6" stroke="#6b6269"/><g fill="#6b6269"><circle cx="38" cy="50" r="5"/><circle cx="63" cy="62" r="5"/><circle cx="36" cy="70" r="4"/></g></>,
 J:<><rect x="24" y="27" width="52" height="59" rx="12" fill="#cf8494"/><rect x="21" y="18" width="58" height="15" rx="5" fill="#b6bcdf"/><rect x="29" y="43" width="42" height="27" rx="7" fill="#fff0da"/><path d="M41 53q10-10 19 0l-9 13z" fill="#d9868b"/></>,
 K:<><path d="m50 8 32 29-32 38-31-38z" fill="#c1b0e0"/><path d="M50 9v65M20 37h61" stroke="#fff3dd"/><path d="M50 75q28 9 2 18" fill="none" stroke="#987bc0"/><path d="m59 81 11-5v13z" fill="#eabf85"/></>,
 L:<><path d="M20 80Q1 17 82 13q9 73-62 67" fill="#acc78b"/><path d="m20 81 48-51M38 62l-9-26m22 13 23 1" fill="none" stroke="#759962"/></>,
 M:<><path d="M66 13C-5 10 0 90 58 88q23-2 31-26C50 86 27 32 66 13" fill="#f3d489"/><path d="m78 20 3 7 8 1-6 5 1 8-6-4-6 4 1-8-6-5 8-1z" fill="#b2a1d8"/></>,
 N:<><path d="M12 50q38-29 76 0L77 82H24z" fill="#c5a076"/><ellipse cx="50" cy="49" rx="38" ry="15" fill="#9f805f"/><ellipse cx="39" cy="45" rx="12" ry="17" fill="#d8e7d0"/><ellipse cx="62" cy="45" rx="12" ry="17" fill="#f7e6bf"/><path d="m20 63 61 5m-54 7 48 2" stroke="#a68665"/></>,
 O:<><path d="M24 58q-22 39 2 21 13 29 20 0 12 29 20 0 25 23 18-18" fill="none" stroke="#b09acd" strokeWidth="12"/><ellipse cx="51" cy="43" rx="30" ry="32" fill="#b09acd"/><circle cx="39" cy="42" r="3"/><circle cx="63" cy="42" r="3"/><path d="M44 53q7 7 14 0" fill="none" stroke="#71627b"/></>,
 P:<><path d="M50 28C31 20 39 46 23 54-6 87 60 108 78 80c17-28-18-29-16-46q-2-10-12-6" fill="#bace86"/><path d="M51 28q-4-17 6-20" stroke="#8a7958"/><path d="M55 19q25-17 24 1-15 8-24-1" fill="#8eae70"/></>,
 Q:<><path d="m23 28-5-16 20 10L50 6l12 16 20-10-5 20" fill="#e7c676"/><circle cx="50" cy="48" r="24" fill="#efd4af"/><path d="M23 53Q11 89 9 94h83L75 53q-25 28-52 0" fill="#bb9bc9"/><circle cx="41" cy="46" r="2"/><circle cx="60" cy="46" r="2"/><path d="M45 57q5 5 10 0" stroke="#be9585" fill="none"/></>,
 R:<><path d="M12 80a38 50 0 0 1 76 0" stroke="#db9b98" strokeWidth="12" fill="none"/><path d="M24 80a26 37 0 0 1 52 0" stroke="#efcf91" strokeWidth="12" fill="none"/><path d="M36 80a14 24 0 0 1 28 0" stroke="#b5cba3" strokeWidth="12" fill="none"/></>,
 S:<><g stroke="#e6bd6c" strokeWidth="5"><path d="M50 5v9m0 72v9M5 50h9m72 0h9M18 18l7 7m50 50 7 7m0-64-7 7M25 75l-7 7"/></g><circle cx="50" cy="50" r="27" fill="#f0d184"/><circle cx="41" cy="47" r="2"/><circle cx="60" cy="47" r="2"/><path d="M43 59q7 6 14 0" stroke="#a98755" fill="none"/></>,
 T:<><path d="M45 53h13v38H45z" fill="#b19575"/><path d="m50 7-31 39h15L12 68h77L67 46h14z" fill="#aac690"/><path d="m50 29-10 18h21z" fill="#c5d8ad"/></>,
 U:<><path d="M51 21v58q0 19-15 9" stroke="#9a88b6" strokeWidth="6" fill="none"/><path d="M7 51a43 35 0 0 1 86 0q-13-9-27 0-15-9-30 0-14-9-29 0" fill="#b8add6"/><path d="M50 17Q32 25 36 50m14-33q20 11 16 34" fill="none" stroke="#dcd5e8"/></>,
 V:<><path d="M10 35q0-9 9-9h48l23 24v28H10z" fill="#a5c1b1"/><path d="M57 33v20h27L65 33zM19 34h26v18H19z" fill="#e6f1eb"/><circle cx="29" cy="77" r="11" fill="#716b78"/><circle cx="75" cy="77" r="11" fill="#716b78"/><circle cx="29" cy="77" r="5" fill="#d5d1d8"/><circle cx="75" cy="77" r="5" fill="#d5d1d8"/></>,
 W:<><path d="M73 54Q48 16 18 41C-7 81 68 105 84 60q18 5 13-15-10 2-14 11 0-20-16-18z" fill="#a2bed5"/><path d="M16 67q17 18 41 11" fill="none" stroke="#d7e6ee"/><circle cx="28" cy="54" r="3"/><path d="M40 32V14m0 4q-15-15-16-3m16 3q14-16 17-3" stroke="#a2bed5" fill="none"/></>,
 X:<><path d="m13 32 37-20 37 20v48L50 95 13 80z" fill="#dfb98d"/><path d="m13 32 37 18 37-18M50 50v45" stroke="#bb936b" fill="none"/><path d="m33 20 37 18v21l-14 6V44L22 27" fill="#f4d9ad"/><path d="m24 53 15 20m0-20L24 70" stroke="#987c61"/></>,
 Y:<><path d="M58 17Q93 12 75 49L49 65" stroke="#ad98c8" fill="none"/><circle cx="43" cy="65" r="26" fill="#b29bd3"/><ellipse cx="39" cy="65" rx="19" ry="23" fill="#cbb7e5"/><circle cx="38" cy="64" r="7" fill="#f7e1a4"/></>,
 Z:<><path d="m24 35 6-22 12 15 20-1 13-14 1 28q21 28-12 46H34Q10 71 24 35" fill="#f6efde" stroke="#ddd5c4"/><path d="m32 33 13 13m23-13-13 13M25 51l13 5m37-5-13 5M45 29l6 13M28 68l13-2m31 2-13-2" stroke="#777380" strokeWidth="5"/><ellipse cx="50" cy="78" rx="20" ry="11" fill="#c6bcc5"/><circle cx="38" cy="53" r="3"/><circle cx="63" cy="53" r="3"/></>,
 };
 return <svg aria-hidden="true" viewBox="0 0 100 100" className={className} fill="#51475c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{shapes[value.toUpperCase()]??shapes.A}</svg>;
}
