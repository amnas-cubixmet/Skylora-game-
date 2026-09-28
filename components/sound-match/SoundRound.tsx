import { useEffect, useRef } from 'react';
import { GuideCharacter, Icon } from '../english/Art';
import { AudioButton, RewardStar, secondary } from '../english/Controls';
import { pictureChoices, sound } from '../../lib/sound-match/content';
import type { AudioPart } from '../../lib/sound-match/audio';
import type { State } from '../../lib/sound-match/types';
import { SoundPicture, SoundProgress } from './SoundArt';

export function SoundRound({ state, listening, unavailable, onSelect, onReplay, onSpeak }: { state: State; listening: boolean; unavailable: boolean; onSelect: (id:string)=>void; onReplay: ()=>void; onSpeak:(parts:AudioPart[])=>Promise<boolean> }) {
  const heading=useRef<HTMLHeadingElement>(null),q=state.question!,p=state.progress,s=sound(q.target),a=p.session;
  useEffect(()=>{heading.current?.focus();},[q.id]);
  const pictures=pictureChoices(q.mode), feedback=state.status==='ANSWER_FEEDBACK', locked=!['PLAYING','HINT'].includes(state.status);
  const assisted=(!state.correct&&!!a?.hints)||!p.settings.voice||unavailable;
  const showPicture=['picture-to-letter','beginning-sound'].includes(q.mode)||(assisted&&!pictures);
  const showLetter=q.mode==='letter-to-picture'||(assisted&&pictures);
  const subtitle=q.mode==='picture-to-letter'?'Find its letter friend':q.mode==='letter-to-picture'?'Find its picture friend':q.mode==='beginning-sound'?(s.position==='final'?'Listen for the last sounds':'Listen for the first sound'):pictures?'Find the sound’s picture':'Find the sound’s letter';
  const earned=state.correct?(a?a.index+1:10):(a?.index??0);
  const colors=['bg-[#f0eafb] border-[#d7ccec]','bg-[#f9eddb] border-[#ecd9b8]','bg-[#e8f1e8] border-[#cbdcc8]','bg-[#e7eff7] border-[#cbdcea]'];
  return <section data-round-id={q.id} className={`skylora-activity-screen skylora-sound-round mx-auto max-w-4xl ${state.correct?'is-correct':''}`}>
    <div className="skylora-activity-card rounded-[32px] border border-border bg-white px-4 pb-6 pt-1 shadow-[0_12px_50px_#47355a08] sm:px-8">
      <SoundProgress earned={earned}/>
      <h1 ref={heading} tabIndex={-1} className="m-0 text-center text-xl font-extrabold tracking-tight outline-none sm:text-3xl">{subtitle}</h1>
      <div className="skylora-activity-target relative mx-auto my-4 flex min-h-32 max-w-md items-center justify-center gap-4 sm:min-h-40">
        <div data-testid="sound-target" className="flex flex-col items-center">
          {showPicture?<><SoundPicture value={q.target} className="skylora-sound-target-picture size-28 sm:size-36"/><span className="mt-1 text-lg font-bold capitalize text-primary-dark">{s.primaryWord}</span></>:showLetter?<span className="text-[6rem] font-black leading-none tracking-tight text-primary-dark">{s.grapheme}</span>:<button onClick={onReplay} disabled={locked} aria-label="Hear the mystery sound" className={`${secondary} skylora-sound-target-picture grid size-28 place-items-center rounded-[32px] bg-[#f0eafb] sm:size-32 ${listening?'motion-safe:animate-[hint-pulse_1.8s_ease-in-out_infinite]':''}`}><Icon name="sound" className="size-12"/></button>}

        </div>
        <GuideCharacter mood={state.correct?'celebrating':listening?'listening':a?.hints?'hint':state.wrong?'encouraging':'thinking'} className="skylora-sound-guide w-20 shrink-0 sm:w-28"/>
      </div>
      {!feedback&&p.settings.voice&&<div className="skylora-sound-controls flex justify-center"><AudioButton onClick={onReplay} disabled={locked} listening={listening}/></div>}
      {(!p.settings.voice||unavailable)&&<span className="sr-only" role="status">Visual clue enabled.</span>}
      <p role="status" aria-live="polite" aria-atomic="true" className="skylora-sound-feedback skylora-game-feedback">{state.feedback||''}</p>
      <div className={`skylora-choice-grid mx-auto grid max-w-2xl grid-cols-2 gap-3 ${q.options.length===3?'sm:grid-cols-3':q.options.length===4?'sm:grid-cols-4':''}`}>
        {q.options.map((id,i)=>{const item=sound(id),right=state.correct&&id===q.target,hint=!state.correct&&!!a?.hints&&id===q.target,dim=!state.correct&&!!a&&(a.attempts>=3||a.hints>=2)&&id!==q.target;return <div key={`${q.id}-${id}`} className="min-w-0">
          <button data-testid="sound-choice" data-value={id} aria-label={pictures?item.primaryWord:`Letter ${item.grapheme}`} disabled={locked} onClick={()=>onSelect(id)} style={{animationDelay:hint||right||state.wrong===id?'0ms':`${i*45}ms`}} className={`skylora-choice-card relative flex min-h-[clamp(96px,18dvh,144px)] w-full min-w-0 flex-col items-center justify-center rounded-[24px] border-2 border-b-[6px] px-2 py-4 font-extrabold text-primary-dark transition-[transform,opacity,box-shadow] enabled:active:scale-95 sm:min-h-44 ${colors[i]} ${right?'ring-4 ring-[#9fc9a6] motion-safe:animate-[letter-pop_0.55s_ease]':hint?'ring-4 ring-[#d4c6f0] motion-safe:animate-[hint-pulse_1.8s_ease-in-out_infinite]':state.wrong===id?'motion-safe:animate-[gentle-nudge_0.3s_ease]':'motion-safe:animate-[card-arrive_0.3s_ease_both]'} ${dim?'opacity-45':''}`}>
            {pictures?<><SoundPicture value={id} className="skylora-sound-choice-picture size-20 sm:size-24"/><span className="mt-2 text-sm capitalize">{item.primaryWord}</span></>:<><span className="text-[clamp(3rem,13vw,4.5rem)] leading-none tracking-tight">{item.grapheme}</span><span className="mt-2 text-sm">{item.grapheme.toLowerCase()}</span></>}
            {right&&<><RewardStar/><span className="absolute -right-1 -top-2 grid size-8 place-items-center rounded-full bg-[#f6d887]" aria-label="Matched">✓</span></>}
          </button>
          {p.settings.voice&&!pictures&&['beginning-sound','similar-sound'].includes(q.mode)&&<button disabled={locked} onClick={()=>void onSpeak([{text:`Listen to ${item.primaryWord}. Hear the ${item.position==='final'?'last sounds':'first sound'}.`,src:item.phonemeAudio}])} aria-label={`Hear ${item.grapheme} sound example`} className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-primary disabled:opacity-50"><Icon name="sound" className="size-4"/>Hear sound</button>}
        </div>;})}
      </div>
      {state.correct&&<div className="skylora-auto-reward" aria-hidden="true">✨ ⭐ ✨</div>}
    </div>
  </section>;
}
