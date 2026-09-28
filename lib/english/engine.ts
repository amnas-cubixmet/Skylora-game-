import { generateQuestion, successFeedback } from './questions';
import { emptyMetrics, freshProgress, type GameState, type Progress, type Metrics } from './types';
export const initialState: GameState = { status:'LOADING', progress:freshProgress(), question:null, wrong:null, feedback:'', available:true, error:null, level:1, result:null };
export type Action =
 | { type:'LOAD'; progress:Progress; available:boolean }
 | { type:'START'; level:number; seed:number; restart?:boolean }
 | { type:'TUTORIAL' } | { type:'TUTORIAL_DONE' }
 | { type:'SELECT'; value:string; date:string }
 | { type:'HINT' } | { type:'REPLAY' } | { type:'NEXT' }
 | { type:'PAUSE' } | { type:'RESUME' } | { type:'HOME' } | { type:'SOUND' }
 | { type:'ERROR'; message:string } | { type:'STORAGE_UNAVAILABLE' };
const add = (m:Metrics, delta:Partial<Metrics>):Metrics => Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v+(delta[k as keyof Metrics]??0)])) as Metrics;
export function reducer(state:GameState, action:Action):GameState {
 const p=state.progress;
 switch(action.type){
  case 'LOAD': return {...state,status:'READY',progress:action.progress,available:action.available};
  case 'STORAGE_UNAVAILABLE': return {...state,available:false};
  case 'ERROR': return {...state,status:'ERROR',error:action.message};
  case 'TUTORIAL': return {...state,status:'TUTORIAL'};
  case 'TUTORIAL_DONE': return {...state,status:'READY',progress:{...p,tutorial:true}};
  case 'SOUND': return {...state,progress:{...p,sound:!p.sound}};
  case 'HOME': return {...state,status:'READY',question:null,wrong:null,feedback:''};
  case 'START': {
   if(action.level<1||action.level>p.highest)return state;
   const active=!action.restart&&p.active?.level===action.level?p.active:{level:action.level,round:0,seed:action.seed,attempted:0,hinted:false,hints:0,stats:emptyMetrics()};
   const q=active.question??generateQuestion(active.level,active.round,p,active.seed);
   return {...state,status:active.hinted?'HINT':'PLAYING',level:action.level,result:null,question:q,wrong:null,feedback:'',progress:{...p,active:{...active,question:q}}};
  }
  case 'PAUSE': return ['PLAYING','HINT'].includes(state.status)||(state.status==='ANSWER_FEEDBACK'&&state.wrong)?{...state,status:'PAUSED'}:state;
  case 'RESUME': return state.status==='PAUSED'?{...state,status:p.active?.hinted?'HINT':'PLAYING',wrong:null}:state;
  case 'NEXT': return state.status==='ANSWER_FEEDBACK'&&!state.wrong?{...state,status:p.active?'PLAYING':state.level===10?'GAME_COMPLETE':'LEVEL_COMPLETE',question:p.active?.question??null,feedback:'',wrong:null}:state;
  case 'HINT': case 'REPLAY': {
   if(!p.active||!state.question||!['PLAYING','HINT','ANSWER_FEEDBACK'].includes(state.status)||(state.status==='ANSWER_FEEDBACK'&&!state.wrong))return state;
   const hint=action.type==='HINT'; const delta=hint?{hints:1}:{replays:1};
   return {...state,status:hint?'HINT':state.status,feedback:hint?'Look for the gentle glow. You can do it!':state.feedback,progress:{...p,metrics:add(p.metrics,delta),letters:{...p.letters,[state.question.target]:add(p.letters[state.question.target]??emptyMetrics(),delta)},active:{...p.active,hinted:p.active.hinted||hint,hints:p.active.hints+(hint?1:0),stats:add(p.active.stats,delta)}}};
  }
  case 'SELECT': {
   const a=p.active,q=state.question;
   if(!a||!q||!q.options.includes(action.value)||!['PLAYING','HINT','ANSWER_FEEDBACK'].includes(state.status)||(state.status==='ANSWER_FEEDBACK'&&!state.wrong))return state;
   const correct=action.value===q.target;
   const first=correct&&a.attempted===0&&!a.hinted;
   const autoHint=!correct&&a.attempted===1&&!a.hinted;
   const delta={attempts:1,completed:correct?1:0,firstTry:first?1:0,hints:autoHint?1:0};
   const stats=add(a.stats,delta);
   let progress:Progress={...p,lastPlayed:action.date,metrics:add(p.metrics,delta),letters:{...p.letters,[q.target]:add(p.letters[q.target]??emptyMetrics(),delta)},active:{...a,attempted:a.attempted+1,hinted:a.hinted||autoHint,hints:a.hints+(autoHint?1:0),stats}};
   if(!correct){
    const key=`${q.target}:${action.value}`;
    progress={...progress,confusions:{...p.confusions,[key]:(p.confusions[key]??0)+1}};
    if(q.mode==='matching'||q.mode==='confusion')progress.caseConfusions={...p.caseConfusions,[key]:(p.caseConfusions[key]??0)+1};
    if(q.mode==='phonics')progress.phonicsConfusions={...p.phonicsConfusions,[key]:(p.phonicsConfusions[key]??0)+1};
    return {...state,status:a.attempted>=1?'HINT':'ANSWER_FEEDBACK',wrong:action.value,feedback:a.attempted===0?'Try again!':a.attempted===1?'Let’s look carefully.':'Follow the glow. Take your time.',progress};
   }
   const done=a.round===9;
   progress={...progress,stars:p.stars+1,highest:done?Math.max(p.highest,Math.min(10,a.level+1)):p.highest,levels:done?{...p.levels,[a.level]:stats}:p.levels,active:done?null:{...a,round:a.round+1,attempted:0,hinted:false,hints:0,stats,question:generateQuestion(a.level,a.round+1,progress,a.seed)}};
   return {...state,status:'ANSWER_FEEDBACK',wrong:null,feedback:successFeedback(q,a.seed+a.round),result:stats,progress};
  }
 }
}
