import { Dialog } from '../game/Dialog';
import type { Progress } from '../../lib/english/types';
import { letter } from '../../lib/english/content';
import { Icon } from './Art';
import { secondary, SectionLabel } from './Controls';
export function ParentView({progress,onClose}:{progress:Progress;onClose:()=>void}){
 const m=progress.metrics;const pairs=Object.entries(progress.confusions).sort((a,b)=>b[1]-a[1]).slice(0,5);
 return <Dialog labelledBy="parent-title" onClose={onClose} className="w-full max-w-xl rounded-3xl bg-[#fffdf7] p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><SectionLabel>FOR GROWN-UPS</SectionLabel><h2 id="parent-title" className="mt-2 text-2xl font-extrabold">Little steps of progress</h2></div><button className={secondary} onClick={onClose} aria-label="Close learning progress"><Icon name="close"/></button></div>
 <p className="text-sm leading-relaxed text-muted">These observations help you choose what to practise together. They are not a diagnosis or a grade.</p>
 <dl className="my-5 grid grid-cols-2 gap-3">{[['Activities completed',m.completed],['First-try, without hints',m.completed?`${Math.round(m.firstTry/m.completed*100)}%`:'Not yet'],['Letters explored',Object.keys(progress.letters).length],['Attempts',m.attempts],['Hints used',m.hints],['Audio replays',m.replays]].map(([label,value])=><div key={label} className="rounded-2xl bg-surface-soft p-4"><dt className="text-xs text-muted">{label}</dt><dd className="m-0 mt-1 text-2xl font-extrabold text-primary-dark">{value}</dd></div>)}</dl>
 <h3 className="text-base font-extrabold">Ideas for your next practice</h3><p className="text-sm text-muted">{pairs.length?pairs.map(([pair])=>pair.split(':').map(x=>letter(x).lower).join(' / ')).join(' · '):'Explore letters together and follow your child’s curiosity.'}</p>
 <p className="text-sm leading-relaxed text-muted">Lowercase mix-ups: {Object.values(progress.caseConfusions).reduce((a,b)=>a+b,0)} · Sound mix-ups: {Object.values(progress.phonicsConfusions).reduce((a,b)=>a+b,0)}</p>
 <p className="text-xs leading-relaxed text-muted">Progress is saved only in this browser. No account, advertising, or child data is sent to a server. Voice quality and availability depend on your device. Phonics activities use the sounds in spoken example words; Q is paired with U, and X is taught in “box”.</p>
 <p className="text-xs text-muted">Last played: {progress.lastPlayed?new Date(progress.lastPlayed).toLocaleDateString():'Your adventure is just beginning'}</p><button className={`${secondary} mt-3 w-full`} onClick={onClose}>Back to the adventure</button>
 </Dialog>;
}
