import {useCallback,useEffect,useRef,useState} from 'react';
import type {Segment} from '../lib/storage';
interface SpeechAlternative{transcript:string;confidence:number}
interface SpeechResult{isFinal:boolean;[index:number]:SpeechAlternative}
interface SpeechResultList{length:number;[index:number]:SpeechResult}
interface SpeechEvent{resultIndex:number;results:SpeechResultList}
interface SpeechError{error:string;message?:string}
interface SpeechEngine{lang:string;continuous:boolean;interimResults:boolean;onresult:((event:SpeechEvent)=>void)|null;onerror:((event:SpeechError)=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void}
type SpeechCtor=new()=>SpeechEngine;
const getCtor=()=>((window as unknown as {SpeechRecognition?:SpeechCtor;webkitSpeechRecognition?:SpeechCtor}).SpeechRecognition||(window as unknown as {webkitSpeechRecognition?:SpeechCtor}).webkitSpeechRecognition);
export function useSpeechRecognition(source:'teacher'|'student'){
 const [supported]=useState(()=>typeof window!=='undefined'&&Boolean(getCtor()));
 const [listening,setListening]=useState(false);const [error,setError]=useState('');const [segments,setSegments]=useState<Segment[]>([]);const [interim,setInterim]=useState('');
 const engine=useRef<SpeechEngine|null>(null);const want=useRef(false);const sourceRef=useRef(source);sourceRef.current=source;
 const start=useCallback(()=>{if(!getCtor()){setError('เบราว์เซอร์นี้ไม่รองรับ Web Speech API กรุณาทดลอง Chrome หรือ Edge เวอร์ชันล่าสุด');return}if(want.current)return;setError('');want.current=true;const r=new (getCtor()!)();engine.current=r;r.lang='th-TH';r.continuous=true;r.interimResults=true;
 r.onresult=(e)=>{let pending='';const finals:string[]=[];for(let i=e.resultIndex;i<e.results.length;i++){const item=e.results[i];const txt=item[0]?.transcript?.trim()||'';if(!txt)continue;if(item.isFinal)finals.push(txt);else pending+=txt+' '}setInterim(pending.trim());if(finals.length)setSegments(prev=>[...prev,...finals.map(text=>({id:crypto.randomUUID(),text,at:new Date().toISOString(),source:sourceRef.current,final:true as const}))])};
 r.onerror=(e)=>{const errors:Record<string,string>={'not-allowed':'ไม่ได้รับอนุญาตใช้ไมโครโฟน โปรดอนุญาตในเบราว์เซอร์','audio-capture':'ไม่พบไมโครโฟนหรืออุปกรณ์กำลังถูกใช้งาน','network':'บริการรู้จำเสียงมีปัญหาเครือข่าย','no-speech':'ไม่พบเสียงพูด กรุณาลองอีกครั้ง','language-not-supported':'ระบบรู้จำเสียงไม่รองรับภาษาไทย'};if(e.error!=='no-speech')setError(errors[e.error]||`เกิดข้อผิดพลาด: ${e.error}`);if(['not-allowed','audio-capture','network','language-not-supported'].includes(e.error))want.current=false};
 r.onend=()=>{setListening(false);setInterim('');if(want.current){setTimeout(()=>{if(want.current&&engine.current===r){try{r.start();setListening(true)}catch{want.current=false;setListening(false)}}},400)}};
 try{r.start();setListening(true)}catch{want.current=false;setError('ไม่สามารถเริ่มไมโครโฟนได้')}} ,[]);
 const stop=useCallback(()=>{want.current=false;engine.current?.stop();setListening(false);setInterim('')},[]);
 const clear=useCallback(()=>{setSegments([]);setInterim('');setError('')},[]);
 useEffect(()=>()=>{want.current=false;engine.current?.abort()},[]);
 return {supported,listening,error,segments,interim,start,stop,clear,setSegments};
}
