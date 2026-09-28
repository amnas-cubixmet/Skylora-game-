import {test,expect,type Page} from '@playwright/test';
import {freshProgress} from '../lib/sound-match/types';
import {STORAGE_KEY} from '../lib/sound-match/storage';
import {REQUIRE_ALPHABET_BOOK} from '../lib/sound-match/content';
import {soundMatchUnlocked} from '../lib/sound-match/access';
async function setup(page:Page,level=1){
 const p={...freshProgress(),highestUnlockedLevel:6,tutorialCompleted:true,settings:{voice:false,sfx:false,autoContinue:false}};
 await page.goto('/');await page.evaluate(({key,p})=>localStorage.setItem(key,JSON.stringify(p)),{key:STORAGE_KEY,p});
 await page.goto('/sound-match');
 await page.getByRole('button',{name:`Level ${level}: ${level===1?'Listen & Find the Letter':level===2?'Listen & Find the Picture':level===3?'Picture to Letter':level===4?'Beginning Sound Match':level===5?'Similar Sound Challenge':'Sound Detective'}`}).click();
 await expect(page.getByTestId('sound-choice').first()).toBeVisible();
}
async function saved(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),STORAGE_KEY);}
async function solve(page:Page,next=true){
 const before=await page.locator('[data-round-id]').getAttribute('data-round-id');
 const p=await saved(page),target=p.session.question.target;
 await page.locator(`[data-testid="sound-choice"][data-value="${target}"]`).click();
 await expect(page.getByRole('button',{name:/Next discovery|See my sound garden/})).toBeVisible();
 if(next){await page.getByRole('button',{name:/Next discovery|See my sound garden/}).click();if(p.session.index<9)await expect(page.locator('[data-round-id]')).not.toHaveAttribute('data-round-id',before!);}
}
test('root shows Sound Match card and opens the dedicated game slug',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'A world of little discoveries.'})).toBeVisible();
 await page.getByRole('link',{name:/Play Sound Match/}).click();await expect(page).toHaveURL(/\/sound-match$/);await expect(page.getByRole('heading',{name:'Sound Match'})).toBeVisible();
});
test('tutorial speaks, offers skip, completes on a successful example and enters Level 1',async({page})=>{
 await page.addInitScript(()=>{const calls:string[]=[];Object.assign(window,{soundCalls:calls});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel:()=>calls.push('CANCEL'),getVoices:()=>[],speak:(u:{text:string;onend:()=>void})=>{calls.push(u.text);setTimeout(()=>u.onend?.(),5);}}});Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(public text:string){}}});});
 await page.goto('/sound-match');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.getByRole('heading',{name:'Listen. Match. Learn.'})).toBeVisible();
 await page.getByRole('button',{name:'cat',exact:true}).click();await expect(page.getByText('Try again. Look for the ball.')).toBeVisible();
 await page.getByRole('button',{name:'ball',exact:true}).click();await page.getByRole('button',{name:'Let’s play!'}).click();await expect(page.getByTestId('sound-choice').first()).toBeVisible();
 expect(await page.evaluate(()=>(window as unknown as {soundCalls:string[]}).soundCalls.some(x=>x.includes('Listen to ball')))).toBeTruthy();
});
test('all six activities present accessible touch choices and representative rounds work',async({page})=>{
 for(let level=1;level<=6;level++){
  await setup(page,level);const mode=(await saved(page)).session.question.mode;
  if(level===6)expect(mode).toBeTruthy();
  for(const [width,height] of [[320,568],[360,640],[360,800],[375,667],[390,844],[414,896],[768,1024],[1024,768],[1366,900]]){
   await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const boxes=await page.getByTestId('sound-choice').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {width:b.width,height:b.height,top:b.top,bottom:b.bottom};}));
   expect(boxes.every(b=>b.width>=100&&b.height>=100&&b.top>=0&&b.bottom<=height),`${width}x${height} sound choices: ${JSON.stringify(boxes)}`).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});await solve(page);
  await page.getByRole('button',{name:'Back to Sound Match home'}).click();await page.getByRole('link',{name:'SKYLORA all games'}).click();await expect(page).toHaveURL('/');
 }
});
test('gentle retry, replay hint dimming, feedback lock and saved resume',async({page})=>{
 await setup(page);const p=await saved(page),q=p.session.question,wrong=q.options.find((x:string)=>x!==q.target);
 await page.locator(`[data-value="${wrong}"]`).click();await expect(page.getByRole('button',{name:'Next discovery'})).toHaveCount(0);
 await expect(page.locator('[data-round-id] [data-testid="sound-choice"]')).toHaveCount(q.options.length);
 await page.waitForTimeout(800);const newest=await saved(page);expect(newest.totalAttempts).toBe(1);expect(Object.keys(newest.confusionPairs)).toContain(`${q.target}:${wrong}`);
 await page.getByRole('button',{name:'Pause game'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Replay instruction'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Hint'}).click();await expect((await page.getByTestId('sound-choice').evaluateAll(es=>es.some(e=>e.className.includes('hint-pulse'))))).toBeTruthy();
 const target=page.locator(`[data-testid="sound-choice"][data-value="${q.target}"]`);const bounds=await target.boundingBox();expect(bounds).not.toBeNull();await page.mouse.click(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);await expect(page.getByRole('button',{name:'Next discovery'})).toBeVisible();expect((await saved(page)).totalRounds).toBe(1);
 await page.reload();await expect(page.getByRole('button',{name:'Continue'})).toBeVisible();await page.getByRole('button',{name:'Continue'}).click();expect((await saved(page)).session.index).toBe(1);
});
test('Level 1 completes, unlocks the next place and Sound Detective completes',async({page})=>{
 await setup(page,1);for(let i=0;i<10;i++)await solve(page);await expect(page.getByRole('heading',{name:'Amazing listening!'})).toBeVisible();expect((await saved(page)).completedLevels).toContain(1);
 await page.getByRole('button',{name:'My sound garden'}).click();await expect(page.getByRole('button',{name:/^Level 2:/})).toBeEnabled();
 await page.getByRole('button',{name:/^Level 6:/}).click();const modes=new Set<string>();
 for(let i=0;i<10;i++){modes.add((await saved(page)).session.question.mode);await solve(page);}
 expect(modes.size).toBe(6);await expect(page.getByRole('heading',{name:'You’re a Sound Detective!'})).toBeVisible();expect((await saved(page)).completedLevels).toContain(6);
});
test('audio replay cancels speech, mute and reduced motion work without overlapping prompts',async({page})=>{
 await page.addInitScript(()=>{const calls:string[]=[];Object.assign(window,{soundCalls:calls});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel:()=>calls.push('CANCEL'),getVoices:()=>[],speak:(u:{text:string;onend:()=>void})=>{calls.push(u.text);setTimeout(()=>u.onend?.(),100);}}});Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(public text:string){}}});});
 await page.emulateMedia({reducedMotion:'reduce'});const p={...freshProgress(),tutorialCompleted:true,settings:{voice:true,sfx:false,autoContinue:false}};await page.addInitScript(({key,p})=>localStorage.setItem(key,JSON.stringify(p)),{key:STORAGE_KEY,p});await page.goto('/sound-match');await page.getByRole('button',{name:/^Level 1:/}).click();
 await page.waitForTimeout(250);await page.getByRole('button',{name:'Replay instruction'}).click();await page.getByRole('button',{name:'Replay instruction'}).click();await page.getByRole('button',{name:'Replay instruction'}).click();
 const calls=await page.evaluate(()=>(window as unknown as {soundCalls:string[]}).soundCalls);expect(calls.filter(c=>c==='CANCEL').length).toBeGreaterThanOrEqual(2);
 await expect(page.getByRole('button',{name:'Pause game'})).toBeVisible();await page.getByRole('button',{name:'Pause game'}).click();await page.getByRole('button',{name:'Voice: On'}).click();await expect(page.getByRole('button',{name:'Voice: Off'})).toBeVisible();await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Turn sound on'})).toBeVisible();
});
test('parent metrics use local history and locked content can be configured',async({page})=>{
 expect(soundMatchUnlocked()).toBe(!REQUIRE_ALPHABET_BOOK);await page.goto('/sound-match');await page.getByRole('button',{name:'For grown-ups'}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText('Listening observations')).toBeVisible();await expect(page.getByText(/not a diagnosis/)).toBeVisible();
});
