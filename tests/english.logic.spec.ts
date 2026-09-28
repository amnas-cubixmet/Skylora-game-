import { test, expect } from '@playwright/test';
import { CONFUSIONS, LEVELS, letter } from '../lib/english/content';
import { generateQuestion } from '../lib/english/questions';
import { freshProgress } from '../lib/english/types';
import { parseProgress } from '../lib/english/storage';
import { initialState, reducer } from '../lib/english/engine';

test('all ten levels generate valid, unique choices and exactly one correct answer',()=>{
 for(let level=1;level<=10;level++)for(let seed=1;seed<=100;seed++)for(let round=0;round<10;round++){
  const q=generateQuestion(level,round,freshProgress(),seed);
  expect(q.options.length).toBe(LEVELS[level-1].choices);
  expect(new Set(q.options).size).toBe(q.options.length);
  expect(q.options.filter(x=>x===q.target)).toHaveLength(1);
  if(level<=3)expect(q.options.every(x=>x.charCodeAt(0)<65+LEVELS[level-1].range)).toBe(true);
  if(q.mode==='phonics')expect(q.options.filter(x=>letter(x).sound===letter(q.target).sound)).toHaveLength(1);
  if(q.mode==='confusion'){
   const pair=CONFUSIONS.find(p=>p.includes(q.target.toLowerCase()))!;
   expect(pair.every(x=>q.options.includes(x.toUpperCase()))).toBe(true);
  }
 }
});
test('adaptive practice revisits a recorded confusion without abandoning the range',()=>{
 const p=freshProgress();p.confusions={'B:D':8};
 for(const level of [2,3,4,5,6,7,8,9,10])expect(generateQuestion(level,2,p,99).target).toBe('B');
 expect(new Set(Array.from({length:3},(_,i)=>generateQuestion(1,i,p,99).target)).size).toBe(3);
});
test('corrupt, wrong-version, and malformed saves recover safely',()=>{
 for(const raw of ['null','[]','{','{"version":2}','{"version":1,"levels":null,"metrics":"x","active":{"round":999}}'])expect(parseProgress(raw).highest).toBe(1);
 const p=parseProgress(JSON.stringify({version:1,highest:100,stars:-5,sound:false,letters:{A:{completed:2,firstTry:99,attempts:NaN},oops:{}},confusions:{'B:D':4,'__proto__':99},active:{level:3,round:11,seed:3}}));
 expect(p.highest).toBe(10);expect(p.stars).toBe(0);expect(p.sound).toBe(false);expect(p.active).toBeNull();expect(p.letters.A.firstTry).toBe(2);expect(Object.keys(p.letters)).toEqual(['A']);expect(p.confusions).toEqual({'B:D':4});
});
test('reducer guards pause and duplicate submissions, persists hints, and unlocks the next level',()=>{
 let s=reducer(initialState,{type:'LOAD',progress:freshProgress(),available:true});s=reducer(s,{type:'START',level:1,seed:12});
 const target=s.question!.target,wrong=s.question!.options.find(x=>x!==target)!;
 s=reducer(s,{type:'PAUSE'});expect(reducer(s,{type:'SELECT',value:target,date:'2026-09-28'})).toEqual(s);s=reducer(s,{type:'RESUME'});
 s=reducer(s,{type:'SELECT',value:wrong,date:'2026-09-28'});s=reducer(s,{type:'SELECT',value:wrong,date:'2026-09-28'});
 expect(s.status).toBe('HINT');expect(s.progress.metrics.hints).toBe(1);expect(s.progress.confusions[`${target}:${wrong}`]).toBe(2);
 const saved=parseProgress(JSON.stringify(s.progress));expect(saved.active!.question).toEqual(s.question);
 s=reducer(s,{type:'SELECT',value:target,date:'2026-09-28'});expect(s.progress.metrics.firstTry).toBe(0);
 const duplicate=reducer(s,{type:'SELECT',value:target,date:'2026-09-28'});expect(duplicate).toEqual(s);
 for(let round=1;round<10;round++){s=reducer(s,{type:'NEXT'});s=reducer(s,{type:'SELECT',value:s.question!.target,date:'2026-09-28'});}
 expect(s.progress.active).toBeNull();expect(s.progress.highest).toBe(2);expect(s.progress.stars).toBe(10);expect(s.progress.levels['1'].completed).toBe(10);expect(s.progress.metrics.firstTry).toBe(9);expect(reducer(s,{type:'NEXT'}).status).toBe('LEVEL_COMPLETE');
});
test('manual hints and replay are measured separately; every final level completes',()=>{
 let s=reducer(initialState,{type:'LOAD',progress:{...freshProgress(),highest:10},available:true});s=reducer(s,{type:'START',level:10,seed:42});
 s=reducer(s,{type:'HINT'});s=reducer(s,{type:'REPLAY'});expect(s.progress.metrics.hints).toBe(1);expect(s.progress.metrics.replays).toBe(1);
 for(let i=0;i<10;i++){s=reducer(s,{type:'SELECT',value:s.question!.target,date:'2026-09-28'});s=reducer(s,{type:'NEXT'});}
 expect(s.status).toBe('GAME_COMPLETE');expect(s.progress.highest).toBe(10);
});
