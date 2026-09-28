import { Picture, WorldScenery, Icon } from '../english/Art';
export function SoundPicture({ value, className = 'size-24' }: { value: string; className?: string }) {
  if (value !== 'W') return <Picture value={value} className={className}/>;
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={className}><path d="M35 5h30l4 29H31Zm-4 61h38l-4 29H35Z" fill="#b9a4dc"/><circle cx="50" cy="50" r="30" fill="#e0d5ed" stroke="#8172a6" strokeWidth="4"/><circle cx="50" cy="50" r="23" fill="#fffaf1"/><path d="M50 34v17l12 7M50 30v3m0 34v3M30 50h3m34 0h3" fill="none" stroke="#53466c" strokeWidth="4" strokeLinecap="round"/></svg>;
}
export function SoundGarden({ current = 0, compact = false }: { current?: number; compact?: boolean }) {
  return <div aria-hidden="true" className={`pointer-events-none relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#eaf0f3] to-[#f8f3dc] ${compact ? 'h-24' : 'h-44 sm:h-52'}`}>
    <WorldScenery className="absolute inset-0 h-full w-full"/>
    <svg viewBox="0 0 600 160" className="relative h-full w-full" fill="none"><path d="M50 118Q140 55 220 108T405 96T550 99" stroke="#fdfaf0" strokeWidth="22" strokeLinecap="round"/>
      {[70,160,250,340,430,520].map((x,i)=><g key={x} transform={`translate(${x} ${[112,86,110,121,88,98][i]})`}><circle r={i===Math.min(5,current)?18:13} fill={i<=current?'#b59bd7':'#e5dcc6'} stroke="#fffaf0" strokeWidth="4"/>{i<=current&&<path d="m-6 0 4 4 8-9" stroke="white" strokeWidth="3" strokeLinecap="round"/>}</g>)}
      <path d="M100 35v-15l14-4v15m-14-6c-12-2-12 10-1 7m15-7c-12-2-12 10-1 7M473 35v-13l12-3v12" stroke="#a18cc4" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  </div>;
}
export function SoundProgress({ earned }: { earned: number }) {
  return <div role="progressbar" aria-label="Sound gems collected" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(10,earned)} className="flex flex-wrap justify-center gap-2 py-4">{Array.from({length:10},(_,i)=><span aria-hidden="true" key={i} className={`grid size-5 place-items-center rounded-full sm:size-6 ${i<earned?'bg-[#f5df9f] text-[#92712b]':'border-2 border-[#ded5e8] bg-[#f6f2f9]'}`}>{i<earned&&<Icon name="star" className="size-3 sm:size-4"/>}</span>)}</div>;
}
