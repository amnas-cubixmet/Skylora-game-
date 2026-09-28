import { test, expect, type Page } from '@playwright/test';
import { freshProgress } from '../lib/english/types';
import { STORAGE_KEY } from '../lib/english/storage';
async function setup(page:Page,level=1){
 await page.addInitScript(({key,p})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(p));},{key:STORAGE_KEY,p:{...freshProgress(),highest:level,tutorial:true,sound:false}});
 await page.goto('/');await page.getByRole('button',{name:new RegExp(`^Level ${level}:`)}).click();
 await expect(page.getByTestId('letter-card').first()).toBeVisible();
}
async function saved(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),STORAGE_KEY);}
async function answer(page:Page){const p=await saved(page);await page.locator(`[data-testid="letter-card"][data-value="${p.active.question.target}"]`).click();await expect(page.getByRole('button',{name:/Next discovery|See my treasures/})).toBeVisible();}

test('tutorial, complete session, unlock and saved progress',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Let’s play',exact:true}).click();
 await page.getByRole('button',{name:'Letter B',exact:true}).click();await expect(page.getByText('Try again. Look for A.')).toBeVisible();
 await page.getByRole('button',{name:'Letter A',exact:true}).click();await page.getByRole('button',{name:'Let’s explore',exact:true}).click();
 for(let i=0;i<10;i++){await answer(page);await page.getByRole('button',{name:/Next discovery|See my treasures/}).click();}
 await expect(page.getByRole('heading',{name:'Look how far you’ve come!'})).toBeVisible();
 expect((await saved(page)).highest).toBe(2);expect((await saved(page)).stars).toBe(10);
 await page.getByRole('button',{name:'Back to my adventure map'}).click();await expect(page.getByRole('button',{name:/^Level 2:/})).toBeEnabled();await page.reload();expect((await saved(page)).tutorial).toBe(true);
});
test('hints, rapid duplicate tap, refresh and sound preference',async({page})=>{
 await setup(page);const q=(await saved(page)).active.question;const wrong=q.options.find((x:string)=>x!==q.target);
 const wrongCard=page.locator(`[data-value="${wrong}"]`);await wrongCard.click();await page.waitForTimeout(300);await wrongCard.click();await expect(page.getByText('Let’s look carefully.')).toBeVisible();
 expect((await saved(page)).metrics.hints).toBe(1);await page.reload();await page.getByRole('button',{name:'Continue adventure'}).click();expect((await saved(page)).active.question).toEqual(q);
 await page.waitForTimeout(300);await page.locator(`[data-value="${q.target}"]`).evaluate((e:HTMLButtonElement)=>{e.click();e.click();});expect((await saved(page)).stars).toBe(1);
 await page.getByRole('button',{name:'Turn sound on'}).click();await page.reload();await expect(page.getByRole('button',{name:'Turn sound off'})).toBeVisible();
});
test('pause traps focus, escape resumes, restart preserves earned discoveries',async({page})=>{
 await setup(page);await answer(page);await page.getByRole('button',{name:'Next discovery'}).click();await page.getByRole('button',{name:'Pause game'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Exit Game'})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeFocused();
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await page.getByRole('button',{name:'Pause game'}).click();await page.getByRole('button',{name:'Restart Level'}).click();await page.getByRole('button',{name:'Yes, restart'}).click();
 expect((await saved(page)).active.round).toBe(0);expect((await saved(page)).stars).toBe(1);
});
test('all specified viewports fit and support touch-sized controls',async({page})=>{
 await setup(page,10);
 for(const [width,height] of [[320,568],[360,800],[375,667],[390,844],[414,896],[768,1024],[1024,768],[1366,900]]){
  await page.setViewportSize({width,height});
  const box=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));expect(box.scroll).toBeLessThanOrEqual(box.width);
  const sizes=await page.getByTestId('letter-card').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));expect(sizes.length).toBe(6);expect(sizes.every(b=>b.width>=44&&b.height>=44)).toBe(true);
 }
});
test('keyboard selection and reduced motion remain usable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await setup(page);
 const q=(await saved(page)).active.question;const card=page.locator(`[data-value="${q.target}"]`);await page.keyboard.press('Tab');await card.focus();await expect(card).toBeFocused();
 const css=await card.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,animation:getComputedStyle(e).animationDuration}));expect(css.outline).not.toBe('none');expect(parseFloat(css.animation)).toBeLessThan(0.01);
 await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Next discovery'})).toBeVisible();
});
test('listening hides the target until requested; audio cancels previous speech',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel:()=>{(window as unknown as {calls:string[]}).calls.push('cancel');},getVoices:()=>[],speak:(u:{text:string;onend:()=>void})=>{(window as unknown as {calls:string[]}).calls.push(u.text);setTimeout(()=>u.onend?.(),30);}}});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class {text:string;constructor(text:string){this.text=text;}}});
  (window as unknown as {calls:string[]}).calls=[];
 });
 await setup(page,6);await page.getByRole('button',{name:'Turn sound on'}).click();
 await expect(page.getByRole('button',{name:'Hear the hidden letter'})).toBeVisible();
 await page.getByRole('button',{name:'Replay instruction'}).click();await page.getByRole('button',{name:'Replay instruction'}).click();
 const calls=await page.evaluate(()=>(window as unknown as {calls:string[]}).calls);expect(calls.filter(x=>x.startsWith('Find the letter')).length).toBeGreaterThanOrEqual(2);expect(calls.filter(x=>x==='cancel').length).toBeGreaterThanOrEqual(2);
 await page.getByRole('button',{name:'Show a letter clue'}).click();await expect(page.getByRole('button',{name:'Hear the hidden letter'})).toHaveCount(0);expect((await saved(page)).metrics.hints).toBe(1);
});
test('missing speech and blocked storage have playable fallbacks',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});Object.defineProperty(Storage.prototype,'getItem',{value:()=>{throw new Error('blocked');}});Object.defineProperty(Storage.prototype,'setItem',{value:()=>{throw new Error('blocked');}});});
 await page.goto('/');await expect(page.getByText(/browser can’t save progress/)).toBeVisible();await page.getByRole('button',{name:'Let’s play',exact:true}).click();await page.getByRole('button',{name:'Letter A',exact:true}).click();await page.getByRole('button',{name:'Let’s explore',exact:true}).click();await expect(page.getByTestId('letter-card')).toHaveCount(3);expect(errors).toEqual([]);
});
test('parent metrics stay outside gameplay and modal is keyboard dismissible',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'For grown-ups'}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText('First-try, without hints')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('all detective activity modes and final completion are playable',async({page},info)=>{
 await setup(page,10);
 const modes=new Set<string>();
 for(let i=0;i<10;i++){
  const q=(await saved(page)).active.question;modes.add(q.mode);
  if(i===0){await page.setViewportSize({width:320,height:568});await page.screenshot({path:info.outputPath('game-320.png'),fullPage:true,animations:'disabled'});await page.setViewportSize({width:1366,height:900});}
  if(q.mode==='picture')await expect(page.getByRole('button',{name:letterWord(q.target),exact:true})).toBeVisible();
  await answer(page);await page.getByRole('button',{name:/Next discovery|See my treasures/}).click();
 }
 expect(modes.size).toBe(6);await expect(page.getByRole('heading',{name:'You’re an A–Z Star!'})).toBeVisible();
 await page.screenshot({path:info.outputPath('complete.png'),fullPage:true,animations:'disabled'});await page.getByRole('button',{name:'Back to my adventure map'}).click();await page.screenshot({path:info.outputPath('home-desktop.png'),fullPage:true,animations:'disabled'});await page.setViewportSize({width:320,height:568});await page.screenshot({path:info.outputPath('home-320.png'),fullPage:true,animations:'disabled'});
});
function letterWord(value:string){const words=['apple','ball','cat','dog','egg','fish','goat','hat','insect','jam','kite','leaf','moon','nest','octopus','pear','queen','rainbow','sun','tree','umbrella','van','whale','box','yo-yo','zebra'];return words[value.charCodeAt(0)-65];}
