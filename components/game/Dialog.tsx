'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export function Dialog({children,labelledBy,onClose,className=''}:{children:ReactNode;labelledBy:string;onClose:()=>void;className?:string}){
 const ref=useRef<HTMLElement>(null);const close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const node=ref.current;
  const focusable=()=>Array.from(node?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input,[tabindex="0"]')??[]);
  focusable()[0]?.focus();
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();close.current();}
   if(e.key==='Tab'){
    const items=focusable(),first=items[0],last=items.at(-1);
    if(!first){e.preventDefault();node?.focus();return;}
    if(e.shiftKey&&(document.activeElement===first||!node?.contains(document.activeElement))){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!node?.contains(document.activeElement))){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',key);
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 return <div className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-[#252138]/40 p-4 backdrop-blur-sm"><section ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={`max-h-[90svh] overflow-y-auto ${className}`}>{children}</section></div>;
}
