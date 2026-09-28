import type { ReactNode } from 'react';
import { Icon, Picture } from './Art';
import { letter } from '../../lib/english/content';
export const primary='inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-3 text-base font-extrabold text-white shadow-[0_5px_0_#4f419f] transition hover:bg-primary-dark active:translate-y-0.5 active:shadow-[0_2px_0_#4f419f] disabled:opacity-50';
export const secondary='inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-extrabold text-primary-dark transition hover:bg-surface-soft active:scale-[0.98]';
export function AudioButton({onClick,disabled=false,listening=false}:{onClick:()=>void;disabled?:boolean;listening?:boolean}){return <button type="button" onClick={onClick} disabled={disabled} className={secondary} aria-label="Replay instruction"><Icon name="sound"/>{listening?'Listening…':'Listen'}</button>;}
export function HintButton({onClick}:{onClick:()=>void}){return <button type="button" onClick={onClick} className={secondary}><Icon name="bulb"/>Hint</button>;}
export function LetterCard({value,lowercase,picture,selectedWrong,correct,hinted,dimmed,disabled,index,onSelect}:{value:string;lowercase:boolean;picture:boolean;selectedWrong:boolean;correct:boolean;hinted:boolean;dimmed:boolean;disabled:boolean;index:number;onSelect:(v:string)=>void}){
 const item=letter(value);
 const colors=['bg-[#f0eafb] border-[#d7ccec] text-[#7661a9]','bg-[#f9ebda] border-[#ecdbc1] text-[#987347]','bg-[#e8f0e6] border-[#cddfc6] text-[#5b815c]','bg-[#e7eff5] border-[#ccdde9] text-[#577e9d]','bg-[#f7e8ed] border-[#e7cdd7] text-[#a36e83]','bg-[#f8f1d8] border-[#eadfb7] text-[#9e853d]'];
 return <button type="button" data-testid="letter-card" data-value={value} aria-label={picture?item.word:`${lowercase?'Lowercase':'Letter'} ${lowercase?item.lower:item.upper}`} disabled={disabled} onClick={()=>onSelect(value)}
  className={`relative flex min-h-[86px] min-w-0 flex-col items-center justify-center rounded-[24px] border-2 border-b-[6px] px-2 py-3 font-black transition-[transform,opacity,box-shadow] duration-200 enabled:cursor-pointer enabled:hover:-translate-y-1 enabled:active:translate-y-1 sm:min-h-[142px] ${colors[index%colors.length]} ${correct?'border-[#86b793] bg-[#e2f1dc] shadow-[0_0_0_5px_#cce8bd] motion-safe:animate-[letter-pop_0.55s_ease]':''} ${hinted?'ring-4 ring-[#d4c6f0] motion-safe:animate-[hint-pulse_1.8s_ease-in-out_infinite]':''} ${dimmed?'opacity-45':''} ${selectedWrong?'motion-safe:animate-[gentle-nudge_0.3s_ease]':''} motion-safe:animate-[card-arrive_0.4s_ease_both]`} style={{animationDelay:correct||selectedWrong||hinted?'0ms':`${index*45}ms`}}>
  {picture?<Picture value={value} className="h-20 w-20 sm:h-24 sm:w-24"/>:<span className="text-[clamp(3.2rem,13vw,5.5rem)] leading-none motion-safe:animate-[letter-idle_6s_ease-in-out_infinite] tracking-[-0.035em]">{lowercase?item.lower:item.upper}</span>}
  {picture&&<span className="mt-1 text-sm font-bold">{item.word}</span>}
  {correct&&<RewardStar/>}
  {correct&&<span className="absolute -right-2 -top-3 flex size-9 items-center justify-center rounded-full bg-[#f2d280] text-[#91712f] shadow-sm"><Icon name="star"/></span>}
 </button>;
}
export function SectionLabel({children}:{children:ReactNode}){return <p className="m-0 text-[11px] font-black uppercase tracking-[0.18em] text-primary sm:text-xs">{children}</p>;}
export function RewardStar(){return <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-20 text-[#edc366] motion-safe:animate-[reward-trail_0.9s_ease-out_both]"><Icon name="star" className="size-10"/></span>;}
