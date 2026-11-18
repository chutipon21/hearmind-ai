import {useCallback,useEffect,useRef,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {BookOpen,Check,ChevronRight,Copy,DoorOpen,Info,Mic,MicOff,Radio,Users,Wifi,WifiOff,X} from 'lucide-react';
import {configured,ensureAnonymousAuth,supabase} from '../lib/supabase';
import {useSpeechRecognition} from '../hooks/useSpeechRecognition';
import {downloadText,saveLesson,saveLessonToCloud,type Segment} from '../lib/storage';

type Room={id:string;code:string;title:string;teacher_id:string;is_active:boolean};
type Caption={id:string;room_id:string;author_id:string;text:string;created_at:string};
// แสดงรายละเอียดจริงจาก PostgREST/Supabase แทน [object Object]
function message(e:unknown):string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object') {
    const issue = e as Record<string,unknown>;
    const parts = ['message','details','hint','code']
      .map(key => typeof issue[key] === 'string' && issue[key] ? `${key}: ${issue[key]}` : '')
      .filter(Boolean);
    if (parts.length) return parts.join(' | ');
    try { return JSON.stringify(e); } catch { return 'เกิดข้อผิดพลาดที่ไม่ทราบรายละเอียด'; }
  }
  return typeof e === 'string' ? e : 'ไม่สามารถดำเนินการได้ โปรดลองใหม่';
}
function extractRoomId(data:unknown):string {
  // create_classroom returns UUID; join_classroom returns TABLE(classroom_id, classroom_title).
  const item: unknown = Array.isArray(data) ? data[0] : data;
  const candidate = typeof item === 'string' ? item :
    item && typeof item === 'object' ?
      (item as Record<string,unknown>).classroom_id ??
      (item as Record<string,unknown>).id ??
      (item as Record<string,unknown>).room_id ??
      (item as Record<string,unknown>).create_classroom ??
      (item as Record<string,unknown>).join_classroom : null;
  if (typeof candidate !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(candidate)) {
    throw new Error('Supabase ส่งรหัสห้องเรียนกลับมาไม่ถูกต้อง: ' + message(data));
  }
  return candidate;
}

function statusText(s:string){return ({CONNECTING:'กำลังเชื่อมต่อ',SUBSCRIBED:'เชื่อมต่อแล้ว',CHANNEL_ERROR:'การเชื่อมต่อผิดพลาด',TIMED_OUT:'หมดเวลาการเชื่อมต่อ',CLOSED:'ยุติการเชื่อมต่อ'} as Record<string,string>)[s]||s}
export function ClassroomHome(){const nav=useNavigate();const [title,setTitle]=useState('บทเรียนวันนี้');const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const create=async()=>{if(!supabase)return;setBusy(true);setError('');try{await ensureAnonymousAuth();const {data,error}=await supabase.rpc('create_classroom',{p_title:title.trim()||'บทเรียนวันนี้'});if(error)throw error;nav(`/classroom/${extractRoomId(data)}`)}catch(e){console.error('Classroom RPC failed',e);setError(message(e))}finally{setBusy(false)}};
 const join=async()=>{if(!supabase)return;setBusy(true);setError('');try{await ensureAnonymousAuth();const {data,error}=await supabase.rpc('join_classroom',{p_room_code:code.trim().toUpperCase()});if(error)throw error;nav(`/classroom/${extractRoomId(data)}`)}catch(e){console.error('Classroom RPC failed',e);setError(message(e))}finally{setBusy(false)}};
 return <div className="space-y-6"><div><div className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-600">Live Classroom</div><h1 className="section-title">ห้องเรียนแบบเรียลไทม์</h1><p className="mt-2 text-sm leading-7 text-slate-500">อาจารย์สร้างห้องเรียนและเปิดไมโครโฟน นักศึกษาเข้าร่วมด้วยรหัส 6 ตัวเพื่ออ่านคำบรรยายบนอุปกรณ์ของตน</p></div>{!configured&&<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">ยังไม่เชื่อมต่อ Supabase: สร้างไฟล์ .env ตาม README และรัน SQL ใน Supabase ก่อนใช้งาน</div>}<div className="grid gap-5 md:grid-cols-2"><section className="panel p-6"><h2 className="mb-3 text-lg font-bold">สำหรับอาจารย์</h2><label className="mb-2 block text-sm" htmlFor="room-title">ชื่อคาบเรียน</label><input id="room-title" className="input mb-4" maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/><button className="btn-primary" disabled={!configured||busy} onClick={create}><Radio size={17}/>สร้างห้องเรียน</button></section><section className="panel p-6"><h2 className="mb-3 text-lg font-bold">สำหรับนักศึกษา</h2><label className="mb-2 block text-sm" htmlFor="room-code">รหัสเข้าห้องเรียน 6 ตัว</label><input id="room-code" className="input mb-4 uppercase tracking-widest" maxLength={6} autoComplete="off" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))} placeholder="เช่น A7K9P2"/><button className="btn-primary" disabled={!configured||busy||code.length!==6} onClick={join}><DoorOpen size={17}/>เข้าร่วมห้องเรียน</button></section></div>{error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p className="mb-2 font-semibold">สร้างหรือเข้าร่วมห้องเรียนไม่สำเร็จ</p><p className="break-words">{error}</p><button type="button" className="mt-3 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold" onClick={()=>void navigator.clipboard?.writeText(error)}>คัดลอกข้อผิดพลาดเพื่อส่งตรวจสอบ</button></div>}<p className="text-xs leading-6 text-slate-500">ผู้ใช้ต้องอนุญาตการเข้าสู่ระบบแบบไม่ระบุตัวตนใน Supabase Authentication ก่อนใช้งาน รหัสห้องเรียนเป็นข้อมูลสำหรับผู้ได้รับเชิญเท่านั้น</p></div>
}
export function ClassroomRoom(){const {id}=useParams();const nav=useNavigate();const [room,setRoom]=useState<Room|null>(null);const [mine,setMine]=useState('');const [captions,setCaptions]=useState<Caption[]>([]);const [status,setStatus]=useState('CONNECTING');const [error,setError]=useState('');const [consent,setConsent]=useState(false);const [font,setFont]=useState(28);const [ready,setReady]=useState(false);const [closing,setClosing]=useState(false);const [savingLesson,setSavingLesson]=useState(false);const [savedSignature,setSavedSignature]=useState('');const [saveNotice,setSaveNotice]=useState('');const [savePopup,setSavePopup]=useState<{kind:'success'|'error';title:string;description:string}|null>(null);const saveLockRef=useRef(false);const speech=useSpeechRecognition('teacher');const sent=useRef(new Set<string>());const isTeacher=Boolean(room&&mine===room.teacher_id);const roomId=id||'';const currentSaveSignature=roomId+'|'+(room?.title||'')+'|'+captions.map(c=>c.id+':'+c.text).join('|');const alreadySaved=captions.length>0&&savedSignature===currentSaveSignature;
 const captionsViewportRef=useRef<HTMLDivElement|null>(null);
 const followCaptionsRef=useRef(true);
 const [showLatestButton,setShowLatestButton]=useState(false);
 const handleScroll=()=>{
   const el=captionsViewportRef.current;
   if(!el)return;
   const nearBottom=el.scrollHeight-el.scrollTop-el.clientHeight<100;
   followCaptionsRef.current=nearBottom;
   setShowLatestButton(!nearBottom);
 };
 const jumpToLatest=()=>{
   followCaptionsRef.current=true;
   setShowLatestButton(false);
   const el=captionsViewportRef.current;
   if(el)el.scrollTop=el.scrollHeight;
 };
 useEffect(()=>{
   const el=captionsViewportRef.current;
   if(el&&followCaptionsRef.current)el.scrollTop=el.scrollHeight;
 },[captions,speech.interim]);

 const load=useCallback(async()=>{if(!supabase||!roomId)return;try{const uid=await ensureAnonymousAuth();setMine(uid);const {data:r,error:re}=await supabase.from('classrooms').select('id,code:room_code,title,teacher_id,is_active').eq('id',roomId).single();if(re)throw re;setRoom(r as Room);const {data:c,error:ce}=await supabase.from('captions').select('id,room_id:classroom_id,author_id:speaker_id,text:content,created_at').eq('classroom_id',roomId).order('created_at',{ascending:true}).limit(500);if(ce)throw ce;setCaptions((c||[]) as Caption[]);setReady(true)}catch(e){setError(message(e))}},[roomId]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const client=supabase;if(!ready||!client)return;const channel=client.channel(`captions-${roomId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'captions',filter:`classroom_id=eq.${roomId}`},payload=>{const row=payload.new as {id:string;classroom_id:string;speaker_id:string;content:string;created_at:string};const c:Caption={id:row.id,room_id:row.classroom_id,author_id:row.speaker_id,text:row.content,created_at:row.created_at};setCaptions(prev=>prev.some(x=>x.id===c.id)?prev:[...prev,c].slice(-500))}).subscribe(s=>setStatus(s));return()=>{void client.removeChannel(channel)}},[ready,roomId]);
 // Check classroom status independently so students see the room close without refreshing.
 useEffect(()=>{
   const client=supabase;
   if(!ready||!client||!roomId)return;
   let disposed=false;
   const checkStatus=async()=>{
     const {data,error:e}=await client.from('classrooms')
       .select('is_active')
       .eq('id',roomId)
       .maybeSingle();
     if(disposed)return;
     if(e){console.warn('Classroom status refresh failed',e);return;}
     if(data)setRoom(prev=>prev&&prev.is_active!==data.is_active?{...prev,is_active:data.is_active}:prev);
   };
   const timer=window.setInterval(()=>void checkStatus(),3000);
   return()=>{disposed=true;window.clearInterval(timer)};
 },[ready,roomId]);
 useEffect(()=>{if(room&&!room.is_active&&speech.listening)speech.stop()},[room?.is_active,speech.listening,speech.stop]);
 // Polling fallback for reconnects and missed database events.
 useEffect(()=>{const client=supabase;if(!ready||!client)return;const refresh=async()=>{const {data,error:e}=await client.from('captions').select('id,room_id:classroom_id,author_id:speaker_id,text:content,created_at').eq('classroom_id',roomId).order('created_at',{ascending:false}).limit(500);if(!e&&data)setCaptions((data as Caption[]).reverse())};const timer=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(timer)},[ready,roomId]);
 useEffect(()=>{if(!isTeacher||!supabase||!room?.is_active)return;for(const seg of speech.segments){if(sent.current.has(seg.id))continue;sent.current.add(seg.id);void supabase.from('captions').insert({classroom_id:roomId,speaker_id:mine,content:seg.text,source:'teacher'}).then(({error:e})=>{if(e){sent.current.delete(seg.id);setError(`ส่งคำบรรยายไม่สำเร็จ: ${e.message}`)}})}},[speech.segments,isTeacher,roomId,mine,room?.is_active]);
 const close=async()=>{
   const client=supabase;
   if(!client||!isTeacher||!room?.is_active||closing)return;
   if(!window.confirm('ต้องการปิดห้องเรียนนี้หรือไม่? นักศึกษาจะไม่สามารถเข้าร่วมใหม่ได้ และคำบรรยายสดจะหยุดลง'))return;
   setClosing(true);
   setError('');
   try{
     const {data,error:e}=await client.from('classrooms')
       .update({is_active:false})
       .eq('id',roomId)
       .eq('teacher_id',mine)
       .select('id,is_active')
       .maybeSingle();
     if(e)throw e;
     if(!data||data.is_active!==false)throw new Error('ไม่พบห้องเรียนที่อัปเดต โปรดตรวจสอบสิทธิ์ UPDATE และนโยบาย RLS ของอาจารย์');
     speech.stop();
     setRoom(prev=>prev?{...prev,is_active:false}:prev);
   }catch(e){setError('ปิดห้องเรียนไม่สำเร็จ: '+message(e));}
   finally{setClosing(false)}
 };
 // The Lessons page loads its primary list from Supabase, not localStorage.
 // Save to both places so teachers and students each have their own cloud lesson.
 // Visible confirmation remains near the user's screen even if they scrolled within the transcript.
 useEffect(()=>{
   if(!savePopup)return;
   const timer=window.setTimeout(()=>setSavePopup(null),7500);
   return()=>window.clearTimeout(timer);
 },[savePopup]);
 const save=async()=>{
   if(saveLockRef.current||alreadySaved)return;
   setError('');
   setSaveNotice('');
   setSavePopup(null);
   const segments:Segment[]=captions
     .filter(c=>c.text.trim().length>0)
     .map(c=>({id:c.id,text:c.text,at:c.created_at,source:'teacher',final:true}));
   if(!segments.length){
     setSavePopup({kind:'error',title:'ยังไม่มีคำบรรยายให้บันทึก',description:'รอคำบรรยายจากอาจารย์ก่อน'});
     return;
   }
   const lessonTitle=room?.title||'บทเรียนจากห้องเรียน';
   const snapshotSignature=currentSaveSignature;
   saveLockRef.current=true;
   setSavingLesson(true);
   let localSaved=false;
   try{
     // Preserve a local backup when possible; cloud storage is the source for the Lessons page.
     try{localSaved=saveLesson(lessonTitle,segments);}
     catch(localError){console.warn('Local classroom backup failed:',localError);}
     await saveLessonToCloud(lessonTitle,segments);
     setSavedSignature(snapshotSignature);
     setSaveNotice('บันทึกคำบรรยายเรียบร้อยแล้ว เปิดเมนู “บทเรียนของฉัน” เพื่อดูเนื้อหา');
     setSavePopup({kind:'success',title:'บันทึกคำบรรยายเรียบร้อยแล้ว',description:localSaved?'เปิดดูได้ใน “บทเรียนของฉัน” และมีสำเนาบนอุปกรณ์':'เปิดดูได้ใน “บทเรียนของฉัน” (ไม่สามารถสำรองบนอุปกรณ์ได้)'});
   }catch(e){
     console.error('Classroom lesson save failed:',e);
     setError('บันทึกลง Supabase ไม่สำเร็จ: '+message(e)+(localSaved?' (มีสำเนาอยู่ในเบราว์เซอร์นี้)':''));
     setSavePopup({kind:'error',title:'ยังบันทึกบทเรียนออนไลน์ไม่สำเร็จ',description:localSaved?'มีสำเนาในเบราว์เซอร์ โปรดตรวจสอบการเชื่อมต่อแล้วลองใหม่':'โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'});
   }finally{
     setSavingLesson(false);
     saveLockRef.current=false;
   }
 };
 if(!configured)return <div className="panel p-6">ยังไม่ตั้งค่า Supabase กรุณากลับไปตั้งค่าตาม README</div>;
 return <div className="space-y-5"><button className="text-sm text-teal-600" onClick={()=>nav('/classroom')}>← กลับหน้าห้องเรียน</button>{error&&<div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}{!room?<div className="panel p-8">{error?"ไม่สามารถเปิดห้องเรียนได้ กรุณาตรวจสอบข้อความผิดพลาดด้านบน":"กำลังตรวจสอบสิทธิ์และโหลดห้องเรียน…"}</div>:<><div className="panel flex flex-wrap items-center justify-between gap-4 p-5"><div><div className="text-xs font-bold uppercase tracking-wider text-teal-600">{isTeacher?'Teacher · ผู้สร้างห้อง':'Student · ผู้เข้าร่วม'}</div><h1 className="mt-1 text-2xl font-bold">{room.title}</h1><div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500"><span className="flex items-center gap-1"><Users size={16}/>รหัสห้อง: <strong className="tracking-widest">{room.code}</strong></span><button className="flex items-center gap-1 text-teal-600" onClick={()=>void navigator.clipboard.writeText(room.code)}><Copy size={15}/>คัดลอกรหัส</button></div></div><div className="text-sm"><span className="flex items-center gap-2">{status==='SUBSCRIBED'?<Wifi size={18} className="text-teal-600"/>:<WifiOff size={18} className="text-amber-600"/>}{statusText(status)} · {room.is_active?'ห้องเปิดอยู่':'ห้องปิดแล้ว'}</span><p className="mt-1 text-xs text-slate-500">มีระบบดึงข้อมูลสำรองทุก 5 วินาที</p></div></div>{!room.is_active&&<div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">ห้องเรียนสิ้นสุดแล้ว — หยุดส่งคำบรรยายสดและไม่เปิดรับสมาชิกใหม่ คุณยังอ่านหรือบันทึกข้อความที่มีอยู่ได้</div>}<>{saveNotice&&alreadySaved&&<div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-7 text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">{saveNotice} <button type="button" className="ml-2 font-bold underline" onClick={()=>nav('/lessons')}>เปิดบทเรียนของฉัน</button></div>}<div className="grid gap-5 lg:grid-cols-[1fr_300px]"><section className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-5 dark:border-slate-800"><strong>คำบรรยายจากอาจารย์</strong><div className="flex items-center gap-2"><button className="btn-outline !px-3 !py-1" onClick={()=>setFont(n=>Math.max(20,n-2))}>A−</button><span className="text-xs">{font}px</span><button className="btn-outline !px-3 !py-1" onClick={()=>setFont(n=>Math.min(48,n+2))}>A+</button></div></div><div className="relative"><div ref={captionsViewportRef} onScroll={handleScroll} aria-live="polite" aria-relevant="additions" className="min-h-[350px] max-h-[560px] space-y-5 overflow-y-auto p-6">{captions.length===0?<p className="py-24 text-center text-slate-500">รอคำบรรยายจากอาจารย์…</p>:captions.map(c=><div key={c.id} className="border-l-[3px] border-teal-500 pl-4"><div className="mb-2 text-xs text-slate-400">{new Date(c.created_at).toLocaleTimeString('th-TH')}</div><p className="break-words leading-[1.85]" style={{fontSize:font}}>{c.text}</p></div>)}{isTeacher&&speech.interim&&<p className="border-l-2 border-amber-400 pl-4 text-slate-400" style={{fontSize:font}}>{speech.interim} … (ยังไม่ส่ง)</p>}</div>{showLatestButton&&<button type="button" onClick={jumpToLatest} className="absolute bottom-3 right-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-teal-800">↓ กลับไปคำบรรยายล่าสุด</button>}</div><div className="flex flex-wrap gap-3 border-t border-slate-200 p-5 dark:border-slate-800"><button className={alreadySaved?'btn-outline !border-teal-400 !text-teal-700 dark:!text-teal-300':'btn-outline'} onClick={()=>void save()} disabled={!captions.length||savingLesson||alreadySaved}>{alreadySaved?<Check size={16}/>:<BookOpen size={16}/>} {savingLesson?'กำลังบันทึก…':alreadySaved?'บันทึกแล้ว':'บันทึกบทเรียน'}</button><button className="btn-outline" disabled={!captions.length} onClick={()=>downloadText('hearmind-classroom.txt',captions.map(x=>x.text).join('\n'))}>ส่งออก TXT</button></div></section><aside className="space-y-4"><div className="panel p-5">{isTeacher?<><h2 className="mb-3 font-bold">ควบคุมไมโครโฟนอาจารย์</h2><p className="mb-3 rounded-lg bg-teal-50 p-3 text-sm leading-6 text-teal-900 dark:bg-teal-900/20 dark:text-teal-100">เริ่มใช้งาน: 1. ยืนยันความยินยอม 2. กดเริ่มไมโครโฟน 3. อนุญาตไมโครโฟนในเบราว์เซอร์ นักศึกษาในห้องจึงจะได้รับข้อความ</p><label className="mb-4 flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>ได้รับความยินยอมที่จำเป็นสำหรับการถอดเสียงและส่งข้อความให้ผู้เข้าร่วมแล้ว</label>{!consent&&!speech.listening&&<p role="status" className="mb-3 text-xs font-semibold text-amber-700">กรุณายืนยันความยินยอมก่อนเริ่มไมโครโฟน</p>}<button className={speech.listening?'btn bg-rose-600 text-white':'btn-primary'} disabled={!room.is_active||!speech.supported||(!speech.listening&&!consent)} onClick={speech.listening?speech.stop:speech.start}>{speech.listening?<><MicOff size={18}/>หยุดไมโครโฟน</>:<><Mic size={18}/>เริ่มไมโครโฟน</>}</button>{speech.error&&<p role="alert" className="mt-3 text-sm text-rose-600">{speech.error}</p>}<p className="mt-3 text-xs leading-6 text-slate-500">ส่งเฉพาะข้อความที่ระบบรู้จำเสียงยืนยันแล้ว ไม่ส่งเสียงดิบหรือข้อความชั่วคราว</p><button className="btn-outline mt-5 w-full" onClick={()=>void close()} disabled={!room.is_active||closing}>{closing?'กำลังปิดห้องเรียน…':room.is_active?'ปิดห้องเรียน':'ปิดห้องเรียนแล้ว'}</button></>:<><h2 className="mb-3 font-bold">โหมดนักศึกษา</h2><p className="text-sm leading-7 text-slate-500">ข้อความจากอาจารย์จะปรากฏที่นี่โดยอัตโนมัติ คุณสามารถปรับขนาดตัวอักษร บันทึก และดาวน์โหลดได้โดยไม่ต้องเปิดไมโครโฟน</p><p className="mt-3 text-xs text-slate-500">หากต้องการใช้ไมโครโฟนส่วนตัว ให้เปิดเมนู “ไมโครโฟนส่วนตัว” แยกต่างหาก</p></>}</div><div className="panel p-5 text-xs leading-6 text-slate-500">คำบรรยายอาจผิดพลาดหรือมีความล่าช้า ระบบนี้ช่วยเสริมการเข้าถึงบทเรียน ไม่ทดแทนล่ามภาษามือหรือบริการสนับสนุนที่จำเป็น</div></aside></div></></>}{savePopup&&<div role={savePopup.kind==='error'?'alert':'status'} aria-live={savePopup.kind==='error'?'assertive':'polite'} aria-atomic="true" className={`fixed bottom-5 left-4 right-4 z-[100] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border-2 bg-white p-4 shadow-2xl dark:bg-slate-900 sm:bottom-8 sm:p-5 ${savePopup.kind==='success'?'border-teal-500':'border-rose-500'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${savePopup.kind==='success'?'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300':'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>{savePopup.kind==='success'?<Check size={23}/>:<Info size={23}/>}</span><div className="min-w-0 flex-1"><strong className="block text-base leading-7">{savePopup.title}</strong><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{savePopup.description}</p>{savePopup.kind==='success'&&<button type="button" className="mt-3 rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800" onClick={()=>nav('/lessons')}>เปิดบทเรียนของฉัน <ChevronRight size={16} className="inline"/></button>}</div><button type="button" aria-label="ปิดข้อความแจ้งเตือน" className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setSavePopup(null)}><X size={19}/></button></div>}</div>
}
