'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { initialState, reducer, type Action } from '../../lib/english/engine';
import { loadProgress, saveProgress } from '../../lib/english/storage';
import { emit } from '../../lib/english/analytics';
import { canSpeak, speakEnglish, speakQuestion, stopAudio } from '../../lib/english/audio';
import { successFeedback } from '../../lib/english/questions';
export function useAdventure(){
 const [state,dispatch]=useReducer(reducer,initialState);
 const [listening,setListening]=useState(false);
 const [audioAvailable,setAudioAvailable]=useState(()=>canSpeak());
 const stateRef=useRef(state);const submitted=useRef(false);const lastTap=useRef(0);const audioToken=useRef(0);
 useEffect(()=>{stateRef.current=state;},[state]);
 useEffect(()=>{const saved=loadProgress();dispatch({type:'LOAD',...saved});emit('game_started');return()=>stopAudio();},[]);
 useEffect(()=>{if(state.status!=='LOADING'&&!saveProgress(state.progress)&&state.available)dispatch({type:'STORAGE_UNAVAILABLE'});},[state.progress,state.status,state.available]);
 const qid=state.question?.id;
 useEffect(()=>{submitted.current=false;lastTap.current=0;},[qid]);
 useEffect(()=>{
  if(!state.question||state.status==='PAUSED'||state.status==='READY')return;
  emit('question_presented',{level:state.level,round:(state.progress.active?.round??0)+1,mode:state.question.mode,target:state.question.target});
  // Only a new question is announced, never an answer-state re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[qid]);
 useEffect(()=>{
  const hidden=()=>{if(document.hidden){stopAudio();setListening(false);dispatch({type:'PAUSE'});if(['PLAYING','HINT'].includes(stateRef.current.status))emit('game_paused',{reason:'hidden'});}};
  document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);
 },[]);
 function stop(){audioToken.current++;stopAudio();setListening(false);}
 async function announce(text?:string){
  const s=stateRef.current;const token=++audioToken.current;
  setListening(s.progress.sound&&canSpeak());
  const ok=await(text?speakEnglish(text,s.progress.sound):s.question?speakQuestion(s.question,s.progress.sound):Promise.resolve(false));
  if(token===audioToken.current){setListening(false);if(s.progress.sound&&!ok)setAudioAvailable(false);}
 }
 function act(action:Action){
  if(['PAUSE','HOME','SOUND','START','NEXT','TUTORIAL'].includes(action.type))stop();
  dispatch(action);
 }
 function start(level:number,restart=false){
  stop();submitted.current=false;
  dispatch({type:'START',level,seed:Math.floor(Math.random()*0x7fffffff),restart});emit('level_started',{level,resumed:!restart&&state.progress.active?.level===level});
 }
 function select(value:string){
  const s=stateRef.current,q=s.question,a=s.progress.active;
  if(!q||!a||submitted.current||Date.now()-lastTap.current<250||s.status==='PAUSED')return;
  lastTap.current=Date.now();const correct=value===q.target;
  if(correct)submitted.current=true;
  emit('letter_selected',{target:q.target,selected:value,mode:q.mode,attempt:a.attempted+1});
  emit(correct?'answer_correct':'answer_retry',{target:q.target,selected:value,first_attempt:a.attempted===0,hint_used:a.hinted});
  dispatch({type:'SELECT',value,date:new Date().toISOString()});
  if(correct){
   void announce(successFeedback(q,a.seed+a.round));emit('question_completed',{level:a.level,round:a.round+1});
   if(a.round===9){emit('level_completed',{level:a.level});if(a.level===10)emit('game_completed');}
  }else{void announce(a.attempted===0?'Try again!':'Let’s look carefully.');if(a.attempted===1&&!a.hinted)emit('hint_shown',{kind:'automatic',target:q.target});}
 }
 function hint(){dispatch({type:'HINT'});emit('hint_shown',{kind:'requested'});void announce();}
 function replay(){dispatch({type:'REPLAY'});emit('audio_replayed');setAudioAvailable(canSpeak());void announce();}
 return {state,act,start,select,hint,replay,announce,stop,listening,audioAvailable};
}
