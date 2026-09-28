import {existsSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {LESSONS,LESSON_KEY,parseLessons,allLessonsComplete} from '../lib/english/lessons';
test('all 26 lessons have five unique words; corrupted progress never unlocks practice',()=>{
 expect(LESSONS.map(l=>l.letter).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
 for(const l of LESSONS){expect(l.words).toHaveLength(5);for(const w of l.words)expect(existsSync(`public${w.pictureSrc}`)).toBe(true);expect(new Set(l.words.map(w=>w.word)).size).toBe(5);}
 for(const raw of ['bad','null','{"version":2}','{"version":1,"explored":{"A":["fake"]}}'])expect(allLessonsComplete(parseLessons(raw))).toBe(false);
});
test('root is a catalog and games have independent URLs',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Where shall we explore today?'})).toBeVisible();await expect(page.getByTestId('letter-card')).toHaveCount(0);
 await page.getByRole('link',{name:/English A–Z Adventure/}).click();await expect(page).toHaveURL(/\/english-az-adventure$/);await expect(page.getByRole('button',{name:/^Explore [A-Z]/})).toHaveCount(26);
 await page.getByRole('link',{name:'SKYLORA all games'}).click();await page.getByRole('link',{name:/Number Hunt/}).click();await expect(page).toHaveURL(/\/number-hunt$/);
});
test('five word audios, cancellation, saved progress and next letter',async({page})=>{
 await page.addInitScript(()=>{
  const calls:string[]=[];Object.assign(window,{audioCalls:calls});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel:()=>calls.push('cancel'),getVoices:()=>[],speak:(u:{text:string;onend:()=>void})=>{calls.push(u.text);setTimeout(()=>u.onend?.(),10);}}});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(public text:string){}}});
 });
 await page.goto('/english-az-adventure');await expect(page.getByRole('button',{name:'Start practice adventures'})).toBeDisabled();
 await page.getByRole('button',{name:'Explore A',exact:true}).click();await expect(page.getByRole('button',{name:'Next letter'})).toBeDisabled();await expect.poll(()=>page.locator('img').evaluateAll(es=>es.every(e=>(e as HTMLImageElement).naturalWidth>0))).toBe(true);
 for(const w of LESSONS[0].words)await page.getByRole('button',{name:`Hear ${w.word}`,exact:true}).click();
 const calls=await page.evaluate(()=>(window as unknown as {audioCalls:string[]}).audioCalls);for(const w of LESSONS[0].words)expect(calls).toContain(w.word);expect(calls.filter(c=>c==='cancel').length).toBeGreaterThanOrEqual(5);
 await page.getByRole('button',{name:'Next letter'}).click();await expect(page.getByRole('heading',{name:'B b'})).toBeFocused();
 await page.reload();await expect(page.getByRole('button',{name:'Explore A, completed'})).toBeVisible();
});
test('finishing alphabet opens existing practice and supports all mobile widths',async({page})=>{
 await page.addInitScript(({key,lessons})=>localStorage.setItem(key,JSON.stringify({version:1,explored:Object.fromEntries(lessons.map(l=>[l.letter,l.words.map(w=>w.word)]))})),{key:LESSON_KEY,lessons:LESSONS});
 await page.goto('/english-az-adventure');
 for(const [width,height] of [[320,568],[360,800],[375,667],[390,844],[414,896],[768,1024],[1024,768],[1366,900]]){
  await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Explore Q, completed'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'A–Z letter list'}).click();
 }
 await page.getByRole('button',{name:'Start practice adventures'}).click();await expect(page.getByRole('button',{name:'Let’s play',exact:true})).toBeVisible();
});
test('blocked storage and unavailable speech leave letter exploration usable',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});Object.defineProperty(Storage.prototype,'getItem',{value:()=>{throw Error('blocked');}});Object.defineProperty(Storage.prototype,'setItem',{value:()=>{throw Error('blocked');}});});
 await page.goto('/english-az-adventure');await page.getByRole('button',{name:'Explore A',exact:true}).click();await page.getByRole('button',{name:'Hear Apple',exact:true}).click();await expect(page.getByText(/Voice is unavailable/)).toBeVisible();await expect(page.getByText(/cannot save this letter book/)).toBeVisible();
});
