import {test,expect} from '@playwright/test';
import {SOUNDS,MODES,LEVELS,ROUNDS,sound} from '../lib/sound-match/content';
import {generateRound} from '../lib/sound-match/questions';
import {choiceCount,confusionUpdate,introducedPool} from '../lib/sound-match/difficulty';
import {freshProgress} from '../lib/sound-match/types';
import {parseProgress,STORAGE_KEY} from '../lib/sound-match/storage';
import {initialState,reducer} from '../lib/sound-match/progress';
import {SoundAudioController} from '../lib/sound-match/audio';

test('curated alphabet content has one labeled visual and controlled example per grapheme',()=>{
 expect(SOUNDS.map(s=>s.id).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
 for(const item of SOUNDS){expect(item.letter.toLowerCase()).toBe(item.lowercase);expect(item.primaryWord.length).toBeGreaterThan(1);expect(item.image).toContain('inline:');expect(['initial','final','cluster']).toContain(item.position);}
 expect(sound('W').primaryWord).toBe('watch');expect(sound('Q').grapheme).toBe('Qu');expect(sound('X').position).toBe('final');
});
test('6000 generated rounds have unique choices, valid distractors, targets and balanced options',()=>{
 let p=freshProgress();
 for(let level=1;level<=6;level++)for(let i=0;i<1000;i++){
  const round=i%ROUNDS,q=generateRound(level,round,p,i*1837+level);
  expect(q.options.filter(x=>x===q.target)).toHaveLength(1);expect(new Set(q.options).size).toBe(q.options.length);
  expect(q.options.length).toBeGreaterThanOrEqual(2);expect(q.options.length).toBeLessThanOrEqual(4);
  expect(q.options.filter(id=>sound(id).phoneme===sound(q.target).phoneme)).toEqual([q.target]);
  expect(MODES).toContain(q.mode);expect(q.id).toBe(`${i*1837+level}:${level}:${round}`);
 }
 expect(LEVELS).toHaveLength(6);
});
test('early sequence, pair practice and adaptive choices add support gradually',()=>{
 const p=freshProgress();expect(introducedPool(1,0,p)).toEqual(['A','M','S']);expect(introducedPool(1,4,p)).toEqual(['A','M','S','B','F','T']);
 expect(choiceCount(1,0,p)).toBe(2);p.recent=[true,true,true];expect(choiceCount(1,4,p)).toBe(3);
 expect(introducedPool(5,0,p)).toEqual(['B','P','D','T','F','V','S','Z','M','N']);
 const next=confusionUpdate(p,'B','P');expect(next.difficultLetters.B).toBe(1);expect(next.confusionPairs['B:P']).toBe(1);
 const pair=generateRound(5,0,p,44);expect(pair.options).toHaveLength(2);expect(new Set(pair.options)).toEqual(new Set(['B','P']));
});
test('bad JSON and corrupted records recover; saved sessions resume safely',()=>{
 for(const value of [null,'bad','[]','{"version":8}','{"version":1,"session":{"level":99}}'])expect(parseProgress(value).version).toBe(1);
 let s=reducer(initialState,{type:'LOAD',progress:freshProgress(),available:true});
 s=reducer(s,{type:'TUTORIAL'});s=reducer(s,{type:'TUTORIAL_DONE'});s=reducer(s,{type:'START',level:1,seed:13});s=reducer(s,{type:'INTRO_DONE'});
 const save=JSON.stringify(s.progress),loaded=parseProgress(save);expect(loaded.session?.question).toEqual(s.progress.session?.question);expect(loaded.highestUnlockedLevel).toBe(1);expect(STORAGE_KEY).toContain(':v1');
 const broken=JSON.parse(save);broken.session.question.options=[broken.session.question.target,broken.session.question.target];expect(parseProgress(JSON.stringify(broken)).session).toBeNull();
});
test('retry, hints, first-try metrics and level unlocking obey state transitions',()=>{
 let s=reducer(initialState,{type:'LOAD',progress:freshProgress(),available:true});s=reducer(s,{type:'START',level:1,seed:9});s=reducer(s,{type:'INTRO_DONE'});
 const q=s.question!;s=reducer(s,{type:'SELECT',value:q.options.find(x=>x!==q.target)!,date:'2026-09-28'});expect(s.status).toBe('ANSWER_FEEDBACK');expect(s.correct).toBe(false);expect(s.progress.totalAttempts).toBe(1);
 s=reducer(s,{type:'RETRY_READY'});expect(['PLAYING','HINT']).toContain(s.status);s=reducer(s,{type:'SELECT',value:q.target,date:'2026-09-28'});expect(s.status).toBe('ANSWER_FEEDBACK');expect(s.progress.totalRounds).toBe(1);expect(s.progress.firstAttemptCorrect).toBe(0);
 s=reducer(s,{type:'NEXT'});expect(s.status).toBe('ROUND_INTRO');expect(s.progress.session?.index).toBe(1);
 for(let i=1;i<10;i++){s=reducer(s,{type:'INTRO_DONE'});const q2=s.question!;s=reducer(s,{type:'SELECT',value:q2.target,date:'2026-09-28'});s=reducer(s,{type:'NEXT'});}
 expect(s.status).toBe('LEVEL_COMPLETE');expect(s.progress.completedLevels).toEqual([1]);expect(s.progress.highestUnlockedLevel).toBe(2);
});
test('session and full-game completion advance through all six levels',()=>{
 let p={...freshProgress(),highestUnlockedLevel:6};
 for(let level=1;level<=6;level++){
  let s=reducer(initialState,{type:'LOAD',progress:p,available:true});s=reducer(s,{type:'START',level,seed:level*719});
  for(let i=0;i<ROUNDS;i++){
   s=reducer(s,{type:'INTRO_DONE'});const q=s.question!;s=reducer(s,{type:'SELECT',value:q.target,date:'2026-09-28'});s=reducer(s,{type:'NEXT'});
  }
  expect(s.status).toBe(level===6?'GAME_COMPLETE':'LEVEL_COMPLETE');expect(s.progress.completedLevels).toContain(level);p=s.progress;
 }
 expect(p.totalRounds).toBe(60);expect(p.history).toHaveLength(6);
});
test('audio cancellation resolves old speech, failed clips fall back, and new prompts do not overlap',async()=>{
 let resolveSpeech:((ok:boolean)=>void)|undefined,cancels=0;const spoken:string[]=[];
 type MediaStub={preload:string;src:string;onended:(()=>void)|null;onerror:((e:Event)=>void)|null;pause:()=>void;removeAttribute:(name:string)=>void;play:()=>Promise<void>};
 const media:MediaStub={preload:'',src:'',onended:null,onerror:null,pause(){},removeAttribute(name:string){if(name==='src')this.src='';},play(){this.onerror?.(new Event('error'));return Promise.resolve();}};
 const player=new SoundAudioController({speak:async text=>{spoken.push(text);if(text.includes('fallback'))return true;return new Promise<boolean>(resolve=>{resolveSpeech=resolve;});},cancel:()=>{cancels++;},available:()=>true,media:()=>media as unknown as HTMLAudioElement});
 const pending=player.play([{text:'Old instruction'}],true);await Promise.resolve();player.stop();expect(await pending).toBe(false);expect(cancels).toBeGreaterThan(0);
 const failedClip=await player.play([{text:'A spoken fallback',src:'/missing.mp3'}],true);expect(failedClip).toBe(true);expect(spoken).toContain('A spoken fallback');
 const current=player.play([{text:'New instruction'}],true);await Promise.resolve();resolveSpeech?.(true);expect(await current).toBe(true);player.dispose();
});
