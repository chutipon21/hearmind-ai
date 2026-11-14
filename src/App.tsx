import {useEffect,useMemo,useRef,useState} from 'react';
import {NavLink,Route,Routes,useNavigate} from 'react-router-dom';
import {Activity,ArrowRight,AudioLines,BookOpen,Check,ChevronRight,Clock,Download,GraduationCap,Headphones,Home,Info,Keyboard,Menu,Mic,MicOff,Moon,Radio,RotateCcw,Settings,ShieldCheck,Sun,Trash2,Volume2,X,FileText,Monitor,WifiOff,Sparkles,ExternalLink,Copy,BrainCircuit,Lightbulb,ListChecks} from 'lucide-react';
import {useTheme,type Theme} from './hooks/useTheme';
import {ClassroomHome,ClassroomRoom} from './components/Classroom';
import {useSpeechRecognition} from './hooks/useSpeechRecognition';
import {ensureAnonymousAuth,supabase} from './lib/supabase';

import {
  downloadText,
  loadLessons,
  loadLessonsFromCloud,
  saveLesson,
  saveLessonToCloud,
  deleteLessonFromCloud
} from './lib/storage';

// Public chat URL for the published HearMind AI v4 agent on LangMind.
// If the public link changes, update this one constant. Do not put API keys here.
const LANGMIND_AGENT_URL = 'https://langmind.in.th/public/agents/44ca28a5-abd9-46da-88cb-814eb6866f7c/chat';

function IconLogo(){return <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20"><AudioLines size={24}/></span>}
const nav=[{to:'/',icon:Home,label:'ภาพรวม'},{to:'/live',icon:Radio,label:'คำบรรยายสด'},{to:'/classroom',icon:GraduationCap,label:'ห้องเรียนออนไลน์'},{to:'/personal',icon:Headphones,label:'ไมโครโฟนส่วนตัว'},{to:'/lessons',icon:BookOpen,label:'บทเรียนของฉัน'},{to:'/agent',icon:Sparkles,label:'ผู้ช่วย AI · LANGMIND'},{to:'/settings',icon:Settings,label:'ตั้งค่า'}];
function Shell({children,theme,setTheme}:{children:React.ReactNode,theme:Theme,setTheme:(t:Theme)=>void}){const [menu,setMenu]=useState(false);return <div className="min-h-screen bg-[#f6f9fc] text-slate-900 transition-colors dark:bg-[#101827] dark:text-slate-100"><aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${menu?'translate-x-0':'-translate-x-full'}`}><div className="mb-10 flex items-center justify-between"><NavLink to="/" onClick={()=>setMenu(false)} className="flex items-center gap-3"><IconLogo/><span><strong className="block text-xl leading-tight">HearMind <span className="text-teal-600">AI</span></strong><span className="text-xs text-slate-500">Learning without barriers</span></span></NavLink><button aria-label="ปิดเมนู" className="lg:hidden" onClick={()=>setMenu(false)}><X/></button></div><div className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">เมนูหลัก</div><nav className="space-y-1">{nav.map(({to,icon:Icon,label})=><NavLink key={to} to={to} onClick={()=>setMenu(false)} end={to==='/'} className={({isActive})=>`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive?'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={19}/>{label}</NavLink>)}</nav></aside>{menu&&<button aria-label="ปิดเมนู" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={()=>setMenu(false)}/>}<div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:px-10"><div className="flex items-center gap-3"><button aria-label="เปิดเมนู" onClick={()=>setMenu(true)} className="rounded-lg p-2 lg:hidden"><Menu/></button><div><div className="text-sm font-bold md:text-base">HearMind AI</div><div className="text-xs text-slate-500">พื้นที่การเรียนรู้ที่เข้าถึงได้สำหรับทุกคน</div></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 sm:inline">DEMO VERSION</span><button aria-label="สลับธีม" title="สลับธีม" className="btn-outline !p-2.5" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button></div></header><main className="mx-auto max-w-7xl p-5 md:p-10">{children}</main><footer className="mx-auto max-w-7xl px-5 pb-8 text-xs text-slate-400 md:px-10">HearMind AI © 2026 · ต้นแบบเพื่อการศึกษา · ไม่ใช่บริการล่ามภาษามือ</footer></div></div>}
function Title({eyebrow,title,description}:{eyebrow:string,title:string,description:string}){return <div className="mb-8"><div className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-600">{eyebrow}</div><h1 className="section-title mb-2">{title}</h1><p className="max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p></div>}
function Dashboard(){const navigate=useNavigate();const lessons=loadLessons();return <><div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#155e75] p-7 text-white md:p-10"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[45px] border-white/10"/><div className="relative max-w-2xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><Activity size={14}/> Accessible Learning Platform</span><h1 className="mb-3 text-3xl font-extrabold leading-snug md:text-4xl">ทุกเสียงในห้องเรียน<br/>ควรเข้าถึงได้</h1><p className="mb-7 max-w-xl text-sm leading-7 text-white/85">แปลงเสียงบรรยายภาษาไทยเป็นข้อความแบบต่อเนื่อง เพื่อช่วยให้นักศึกษาติดตามเนื้อหาและทบทวนบทเรียนได้สะดวกขึ้น</p><button className="btn bg-white text-teal-800 hover:bg-teal-50" onClick={()=>navigate('/live')}>เริ่มคำบรรยายสด <ArrowRight size={17}/></button><a className="ml-0 mt-3 inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25 sm:ml-3 sm:mt-0" href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer"><Sparkles size={17}/>เรียนรู้ต่อด้วย LANGMIND AI <ExternalLink size={16}/></a></div></div><LangMindSpotlight/><button className="btn-primary mb-7" onClick={()=>navigate('/classroom')}>เข้าห้องเรียนออนไลน์ <ArrowRight size={17}/></button><div className="mb-7 grid gap-4 md:grid-cols-3"><Metric icon={Radio}value="ภาษาไทย"label="การรู้จำเสียง th-TH"/><Metric icon={BookOpen}value={String(lessons.length)}label="บทเรียนที่บันทึกในเครื่อง"/><Metric icon={ShieldCheck}value="Local"label="บทเรียนในเครื่อง + ห้องเรียนออนไลน์"/></div><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">เริ่มต้นใช้งาน</h2><span className="text-xs text-slate-400">เลือกโหมดที่เหมาะกับคุณ</span></div><div className="grid gap-5 md:grid-cols-2"><ActionCard icon={GraduationCap}title="โหมดอาจารย์"tag="Teacher Mode"description="เปิดไมโครโฟนของอาจารย์เพื่อทดลองแปลงคำบรรยายเป็นข้อความบนอุปกรณ์นี้"button="เปิดคำบรรยายสด"onClick={()=>navigate('/live')}/><ActionCard icon={Headphones}title="โหมดนักศึกษา"tag="Student Mode"description="เปิดไมโครโฟนบนอุปกรณ์ของนักศึกษาเพื่อรับฟังเสียงรอบตัวและแสดงคำบรรยายส่วนตัว"button="เริ่มไมโครโฟนส่วนตัว"onClick={()=>navigate('/personal')}/></div><div className="panel mt-7 flex gap-3 p-5"><Info className="mt-0.5 shrink-0 text-teal-600" size={20}/><div><div className="mb-1 font-bold">เกี่ยวกับระบบคำบรรยาย</div><p className="text-sm leading-7 text-slate-500 dark:text-slate-400">โหมดคำบรรยายสดและไมโครโฟนส่วนตัวยังทำงานบนอุปกรณ์ปัจจุบัน ส่วนเมนูห้องเรียนออนไลน์รองรับการแชร์ข้อความข้ามอุปกรณ์ผ่าน Supabase หลังตั้งค่าการเชื่อมต่อ</p></div></div></>}

// Visible LangMind integration showcase. The live site still uses a manual handoff.
function LangMindSpotlight() {
  return <section aria-label="LANGMIND AI Agent" className="panel relative mb-6 overflow-hidden border-teal-200 p-6 dark:border-teal-800 md:p-7">
    <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-12 rounded-full border-[28px] border-teal-50 dark:border-teal-900/40" aria-hidden="true"/>
    <div className="relative flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#153c5b] text-white"><Sparkles size={24}/></span>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">AI LEARNING ASSISTANT · LANGMIND AGENT STUDIO</div>
          <h2 className="text-xl font-extrabold md:text-2xl">HearMind AI Agent <span className="text-teal-700 dark:text-teal-300">v4</span></h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">เปลี่ยนข้อความจากบทเรียนให้เป็นความเข้าใจ ด้วย AI Agent ที่พัฒนาบนแพลตฟอร์ม LANGMIND — ช่วยสรุป อธิบาย และสร้างคำถามทบทวนได้หลากหลายวิชา</p>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">ขณะนี้เปิดใช้ Agent ผ่านหน้าสนทนา LANGMIND โดยคัดลอกข้อความเอง · การเชื่อม API อัตโนมัติอยู่ระหว่างพัฒนา</p>
        </div>
      </div>
      <a className="btn-primary shrink-0" href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer"><Sparkles size={17}/>ทดลองผู้ช่วย AI <ExternalLink size={17}/></a>
    </div>
  </section>;
}

type AgentTask = 'summary' | 'explain' | 'quiz';
const AGENT_TASKS: {id:AgentTask;title:string;detail:string;prompt:string}[] = [
  {id:'summary',title:'สรุปประเด็นสำคัญ',detail:'จับใจความสำคัญจากบทเรียน',prompt:'โปรดสรุปเนื้อหาบทเรียนต่อไปนี้เป็นข้อ ๆ โดยรักษาความหมายเดิม แยกสิ่งที่ไม่แน่ชัดจากข้อความถอดเสียง และไม่แต่งข้อมูลเพิ่ม'},
  {id:'explain',title:'อธิบายให้เข้าใจง่าย',detail:'ขยายความพร้อมตัวอย่างที่เกี่ยวข้อง',prompt:'โปรดอธิบายเนื้อหาบทเรียนต่อไปนี้ด้วยภาษาไทยที่เข้าใจง่าย แบ่งเป็นขั้นตอน อธิบายคำศัพท์สำคัญและยกตัวอย่างที่ตรงประเด็น โดยแจ้งเมื่อข้อความต้นทางไม่ชัดเจน'},
  {id:'quiz',title:'สร้างคำถามทบทวน',detail:'คำถาม 5 ข้อ พร้อมเฉลยและเหตุผล',prompt:'โปรดสร้างคำถามทบทวนความเข้าใจ 5 ข้อจากข้อความบทเรียนต่อไปนี้ พร้อมเฉลยและคำอธิบายอย่างสั้น โดยอ้างอิงข้อความที่ให้มาเป็นหลักและไม่แต่งข้อเท็จจริง'},
];

function LangMindAgentPage() {
  const navigate = useNavigate();
  const [transcript,setTranscript] = useState('');
  const [task,setTask] = useState<AgentTask>('summary');
  const [notice,setNotice] = useState('');
  const selectedTask = AGENT_TASKS.find(x=>x.id===task)!;
  const copyPrompt = async () => {
    if (!transcript.trim()) {
      setNotice('กรุณาวางข้อความจากบทเรียนก่อน หรือไปที่ “บทเรียนของฉัน” เพื่อคัดลอกข้อความ');
      return;
    }
    const prompt = [
      'คุณคือ HearMind AI ผู้ช่วยการเรียนรู้บน LANGMIND สำหรับผู้เรียนที่หูหนวกหรือหูตึง',
      selectedTask.prompt,
      '',
      'ข้อความถอดเสียงต้นทาง (อาจมีคำผิดหรือข้อความตกหล่น):',
      transcript.trim(),
      '',
      'ใช้ภาษาไทยที่ชัดเจน แยกคำอธิบายเพิ่มเติมของ AI และบอกข้อจำกัดของข้อมูลตามจริง',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice('คัดลอกคำสั่งพร้อมเนื้อหาแล้ว — กด “เปิด LANGMIND Agent v4” และวางข้อความเพื่อเริ่มสนทนา');
    } catch {
      setNotice('คัดลอกไม่สำเร็จ กรุณาเปิดเว็บไซต์ผ่าน HTTPS หรือ localhost และอนุญาตการใช้คลิปบอร์ด');
    }
  };
  return <>
    <Title eyebrow="LANGMIND AI AGENT · VERSION 4" title="ผู้ช่วยการเรียนรู้ด้วย LANGMIND" description="ใช้ AI Agent ที่สร้างบนแพลตฟอร์ม LANGMIND เพื่อเปลี่ยนข้อความบรรยายให้เป็นบทสรุป คำอธิบาย และคำถามทบทวนสำหรับผู้เรียนทุกสาขาวิชา"/>
    <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#142d49] via-[#17466b] to-[#0f766e] p-6 text-white md:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><BrainCircuit size={29}/></span><div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-100">LANGMIND AGENT STUDIO</p><h2 className="text-2xl font-extrabold">HearMind AI · Agent v4</h2><p className="mt-2 max-w-xl text-sm leading-7 text-white/85">Agent เผยแพร่แล้วและพร้อมสนทนาผ่าน LANGMIND ใช้งานเป็นผู้ช่วยอธิบายบทเรียน สรุปประเด็น และสร้างคำถามทบทวนได้</p></div></div>
        <a href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#163952] transition hover:bg-teal-50">เปิด LANGMIND Agent v4 <ExternalLink size={17}/></a>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-emerald-400/20 px-3 py-2 text-emerald-50">● Agent v4 เผยแพร่แล้ว</span><span className="rounded-full bg-white/15 px-3 py-2 text-white">ใช้งานผ่านหน้าสนทนา LANGMIND</span><span className="rounded-full bg-white/15 px-3 py-2 text-white">API อัตโนมัติ: อยู่ระหว่างพัฒนา</span></div>
    </section>
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      {AGENT_TASKS.map(({id,title,detail})=><div key={id} className="panel p-5"><span className="mb-3 inline-flex rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200">{id==='summary'?<ListChecks size={22}/>:id==='explain'?<Lightbulb size={22}/>:<BrainCircuit size={22}/>}</span><h3 className="mb-1 font-bold">{title}</h3><p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{detail}</p></div>)}
    </div>
    <section className="panel p-6 md:p-8">
      <h2 className="mb-2 text-lg font-extrabold">ทดลองส่งเนื้อหาให้ HearMind AI Agent</h2>
      <p className="mb-5 text-sm leading-7 text-slate-600 dark:text-slate-300">เวอร์ชันนี้ยังไม่ส่งข้อความเข้า LANGMIND โดยอัตโนมัติ ให้เตรียมข้อความด้านล่าง คัดลอก แล้ววางในหน้า LANGMIND ที่เปิดในแท็บใหม่</p>
      <label htmlFor="agent-transcript" className="mb-2 block text-sm font-bold">1. วางข้อความจากบทเรียน</label>
      <textarea id="agent-transcript" rows={7} maxLength={8000} value={transcript} onChange={e=>{setTranscript(e.target.value);setNotice('')}} placeholder="วางข้อความถอดเสียงหรือเนื้อหาบทเรียนที่ต้องการเรียนรู้เพิ่มเติมตรงนี้..." className="input min-h-40 w-full resize-y text-sm leading-7"/>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>ไม่ควรใส่ข้อมูลส่วนบุคคลหรือเนื้อหาที่ไม่ได้รับอนุญาตให้ส่งไปยังบริการ AI</span><span>{transcript.length.toLocaleString('th-TH')}/8,000 ตัวอักษร</span></div>
      <div className="mt-6 mb-3 text-sm font-bold">2. เลือกรูปแบบการช่วยเรียนรู้</div>
      <div className="grid gap-3 md:grid-cols-3">{AGENT_TASKS.map(item=><button type="button" aria-pressed={task===item.id} key={item.id} className={`rounded-xl border p-4 text-left transition ${task===item.id?'border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200':'border-slate-200 hover:border-teal-300 dark:border-slate-700'}`} onClick={()=>{setTask(item.id);setNotice('')}}><span className="text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs opacity-80">{item.detail}</span></button>)}</div>
      <div className="mt-6 flex flex-wrap gap-3"><button type="button" className="btn-primary" onClick={copyPrompt}><Copy size={17}/>3. คัดลอกข้อความเพื่อถาม AI</button><a href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer" className="btn-outline"><ExternalLink size={17}/>4. เปิด LANGMIND Agent v4</a><button type="button" onClick={()=>navigate('/lessons')} className="btn-outline"><BookOpen size={17}/>ไปยังบทเรียนของฉัน</button></div>
      {notice&&<div role="status" aria-live="polite" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-7 text-teal-900 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-100">{notice}</div>}
    </section>
    <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">สถานะการเชื่อมต่อ: เว็บไซต์ยังไม่ใช้ LANGMIND Chat API ในขณะนี้ · การถอดเสียงดำเนินการโดยระบบ Speech-to-Text ของเบราว์เซอร์ ไม่ใช่ฟังก์ชันของ LANGMIND · ผลลัพธ์จาก AI ควรตรวจสอบความถูกต้องก่อนใช้</p>
  </>;
}

function Metric({icon:Icon,value,label}:{icon:typeof Radio,value:string,label:string}){return <div className="panel flex items-center gap-4 p-5"><span className="rounded-2xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"><Icon size={22}/></span><div><div className="text-xl font-extrabold">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div>}
function ActionCard({icon:Icon,title,tag,description,button,onClick}:{icon:typeof Radio,title:string,tag:string,description:string,button:string,onClick:()=>void}){return <div className="panel flex flex-col p-6"><div className="mb-5 flex items-start justify-between"><span className="rounded-2xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"><Icon size={25}/></span><span className="text-xs font-semibold text-slate-400">{tag}</span></div><h3 className="mb-2 text-lg font-bold">{title}</h3><p className="mb-6 flex-1 text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p><button className="btn-outline justify-between" onClick={onClick}>{button}<ArrowRight size={18}/></button></div>}
function Captions({source}:{source:'teacher'|'student'}){const speech=useSpeechRecognition(source);const [title,setTitle]=useState(source==='teacher'?'บันทึกคำบรรยายจากอาจารย์':'บันทึกคำบรรยายส่วนตัว');const [fontSize,setFontSize]=useState(28);const [notice,setNotice]=useState('');const [consent,setConsent]=useState(false);const allText=useMemo(()=>speech.segments.map(s=>s.text).join('\n'),[speech.segments]);const isTeacher=source==='teacher';const navigate=useNavigate();const [mockMode,setMockMode]=useState(false);
  // ติดตามคำบรรยายใหม่โดยไม่แย่งการควบคุมเมื่อผู้ใช้เลื่อนอ่านย้อนหลัง
  const captionsViewportRef = useRef<HTMLDivElement|null>(null);
  const autoFollowRef = useRef(true);
  const [showLatestButton,setShowLatestButton] = useState(false);
  const handleCaptionScroll = () => {
    const el = captionsViewportRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    autoFollowRef.current = nearBottom;
    setShowLatestButton(!nearBottom);
  };
  const jumpToLatest = () => {
    const el = captionsViewportRef.current;
    autoFollowRef.current = true;
    setShowLatestButton(false);
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    const el = captionsViewportRef.current;
    if (el && autoFollowRef.current) el.scrollTop = el.scrollHeight;
  }, [speech.segments, speech.interim]);


const save = async () => {
  const segments = speech.segments;

  if (!segments.length) {
    setNotice('ยังไม่มีข้อความให้บันทึก');
    return;
  }

  // เก็บสำเนาไว้ในเบราว์เซอร์
  saveLesson(title, segments);

  try {
    // บันทึกข้อมูลลง Supabase
    await saveLessonToCloud(title, segments);

    setNotice('บันทึกบทเรียนลง Supabase สำเร็จ');
  } catch (error) {
    console.error('Supabase save failed:', error);

    setNotice(
      'บันทึกในเบราว์เซอร์แล้ว แต่บันทึกลง Supabase ไม่สำเร็จ'
    );
  }
};
const addDemo=()=>{speech.setSegments(prev=>[...prev,{id:crypto.randomUUID(),text:'Internet of Things หรือ IoT คือการเชื่อมต่ออุปกรณ์ต่าง ๆ ผ่านเครือข่าย เพื่อรับส่งข้อมูลและทำงานร่วมกัน',at:new Date().toISOString(),source,final:true},{id:crypto.randomUUID(),text:'ตัวอย่างเช่น เซนเซอร์วัดอุณหภูมิในห้องเรียน และระบบเปิดปิดไฟอัตโนมัติ',at:new Date().toISOString(),source,final:true}]);setMockMode(true)};
return <><Title eyebrow={isTeacher?'Teacher mode':'Student mode'} title={isTeacher?'คำบรรยายสดจากอาจารย์':'ไมโครโฟนส่วนตัว'} description={isTeacher?'เปิดไมโครโฟนของอุปกรณ์นี้เพื่อทดลองสร้างคำบรรยายภาษาไทยระหว่างการสอน':'ใช้อุปกรณ์ของนักศึกษาเพื่อทดลองรับเสียงพูดรอบตัวและแสดงเป็นข้อความภาษาไทย'}/><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${speech.listening?'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}><span className={`h-2 w-2 rounded-full ${speech.listening?'animate-pulse bg-rose-500':'bg-slate-400'}`}/>{speech.listening?'กำลังรับเสียง':'ไมโครโฟนปิดอยู่'}</span><span className="text-xs text-slate-500">ภาษา: ไทย (th-TH) · อุปกรณ์ปัจจุบันเท่านั้น</span></div><div className="grid gap-5 xl:grid-cols-[1fr_300px]"><section className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div className="flex items-center gap-2 font-bold"><FileText size={19} className="text-teal-600"/>พื้นที่คำบรรยาย</div><div className="flex items-center gap-2"><button className="btn-outline !px-3 !py-1.5" aria-label="ลดขนาดตัวอักษร" onClick={()=>setFontSize(n=>Math.max(20,n-2))}>A−</button><span className="w-12 text-center text-xs">{fontSize}px</span><button className="btn-outline !px-3 !py-1.5" aria-label="เพิ่มขนาดตัวอักษร" onClick={()=>setFontSize(n=>Math.min(44,n+2))}>A+</button></div></div><div className="relative"><div ref={captionsViewportRef} onScroll={handleCaptionScroll} aria-live="polite" aria-relevant="additions text" className="min-h-[360px] max-h-[530px] space-y-5 overflow-y-auto p-6 md:p-8">{speech.segments.length===0&&!speech.interim?<div className="flex min-h-[280px] flex-col items-center justify-center text-center"><div className="mb-5 rounded-3xl bg-teal-50 p-6 text-teal-600 dark:bg-teal-900/30"><Volume2 size={42}/></div><h3 className="mb-2 text-lg font-bold">พร้อมรับฟังและแสดงข้อความ</h3><p className="max-w-sm text-sm leading-7 text-slate-500">อนุญาตให้ใช้ไมโครโฟน จากนั้นเริ่มพูดภาษาไทย ระบบจะแสดงคำบรรยายที่ตรวจจับได้ตรงนี้</p></div>:<>{speech.segments.map(s=><div key={s.id} className="border-l-[3px] border-teal-500 pl-4"><div className="mb-2 text-xs text-slate-400">{new Date(s.at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} · {s.source==='teacher'?'เสียงอาจารย์':'เสียงจากไมค์นักศึกษา'}</div><p className="break-words font-medium leading-[1.85]" style={{fontSize}}>{s.text}</p></div>)}{speech.interim&&<p className="animate-pulse border-l-[3px] border-amber-400 pl-4 leading-[1.85] text-slate-400" style={{fontSize}}>{speech.interim} …</p>}</>}</div>{showLatestButton&&<button type="button" className="absolute bottom-3 right-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-teal-800" onClick={jumpToLatest}>↓ กลับไปคำบรรยายล่าสุด</button>}</div><div className="flex flex-wrap gap-3 border-t border-slate-200 p-5 dark:border-slate-800"><div className="w-full rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-slate-800 dark:border-teal-800 dark:bg-teal-900/20 dark:text-slate-100"><strong className="mb-1 block">วิธีเริ่มใช้คำบรรยายสด</strong><p>1. อ่านและทำเครื่องหมายยืนยันความยินยอมด้านล่าง → 2. กด “เริ่มไมโครโฟน” → 3. อนุญาตให้เบราว์เซอร์ใช้ไมโครโฟน</p><label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg bg-white/80 p-3 dark:bg-slate-900/70"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-teal-600"/><span>ฉันยืนยันว่าได้รับความยินยอมที่จำเป็นจากผู้เกี่ยวข้องก่อนใช้ไมโครโฟนและบันทึกคำบรรยาย</span></label>{!speech.supported?<p role="status" className="mt-2 text-rose-700">เบราว์เซอร์นี้ไม่รองรับการรู้จำเสียง กรุณาใช้ Chrome หรือ Edge</p>:!speech.listening&&!consent?<p role="status" className="mt-2 font-semibold text-amber-800 dark:text-amber-300">กรุณาติ๊กช่องยืนยันความยินยอมก่อน จึงจะกดเริ่มไมโครโฟนได้</p>:<p role="status" className="mt-2 font-semibold text-teal-800 dark:text-teal-200">{speech.listening?'ไมโครโฟนทำงานอยู่':'พร้อมแล้ว กดเริ่มไมโครโฟนได้เลย'}</p>}</div><button className={speech.listening?'btn bg-rose-600 text-white hover:bg-rose-700':'btn-primary'} disabled={!speech.supported||(!speech.listening&&!consent)} onClick={speech.listening?speech.stop:speech.start}>{speech.listening?<><MicOff size={18}/>หยุดไมโครโฟน</>:<><Mic size={18}/>เริ่มไมโครโฟน</>}</button><button className="btn-outline" onClick={save} disabled={!speech.segments.length}><BookOpen size={17}/>บันทึกบทเรียน</button><button className="btn-outline" onClick={()=>downloadText('hearmind-transcript.txt',allText)} disabled={!speech.segments.length}><Download size={17}/>ส่งออก .txt</button></div></section><aside className="space-y-5"><div className="panel p-5"><h3 className="mb-4 font-bold">การตั้งค่าคาบเรียน</h3><label htmlFor="lesson-title" className="mb-2 block text-xs font-semibold text-slate-500">ชื่อบทเรียน</label><input id="lesson-title" className="input mb-4" value={title} maxLength={100} onChange={e=>setTitle(e.target.value)}/><p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">การยืนยันความยินยอมอยู่ติดกับปุ่มเริ่มไมโครโฟนในพื้นที่คำบรรยาย</p><div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><div className="mb-1 flex justify-between text-sm"><span className="muted">ข้อความที่บันทึกได้</span><strong>{speech.segments.length}</strong></div><div className="flex justify-between text-sm"><span className="muted">การแปลงเสียง</span><strong>{speech.supported?'รองรับ*':'ไม่รองรับ'}</strong></div></div></div><div className="panel p-5"><h3 className="mb-2 flex items-center gap-2 font-bold"><Info size={18} className="text-teal-600"/>คำแนะนำ</h3><p className="text-xs leading-6 text-slate-500 dark:text-slate-400">ใช้ Chrome หรือ Edge บน HTTPS หรือ localhost · พูดใกล้ไมโครโฟน · ตรวจสอบข้อความก่อนนำไปใช้อ้างอิง</p><p className="mt-3 text-xs leading-6 text-slate-500">*บางเบราว์เซอร์อาจส่งเสียงไปประมวลผลบนเซิร์ฟเวอร์ของผู้ให้บริการเบราว์เซอร์ ระบบนี้ไม่รับประกันการประมวลผลแบบออฟไลน์</p></div><div className="panel p-5"><h3 className="mb-3 font-bold">เครื่องมือทดสอบ</h3><button className="btn-outline mb-2 w-full" onClick={addDemo}><FileText size={16}/>ใส่ข้อความตัวอย่าง</button><button className="btn-outline w-full" onClick={()=>{if(window.confirm('ล้างคำบรรยายทั้งหมดในหน้านี้?')){speech.stop();speech.clear();setMockMode(false)}}}><RotateCcw size={16}/>ล้างข้อความ</button>{mockMode&&<p className="mt-3 text-xs text-amber-600">มีข้อความตัวอย่างที่ไม่ได้มาจากไมโครโฟน</p>}</div><button className="btn-outline w-full" onClick={()=>navigate('/lessons')}>ดูบทเรียนที่บันทึก <ChevronRight size={16}/></button><a className="btn-outline w-full justify-between" href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer"><span className="flex items-center gap-2"><Sparkles size={16}/>ผู้ช่วย AI · LANGMIND</span><ExternalLink size={16}/></a></aside></div>{!speech.supported&&<div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200"><WifiOff className="mr-2 inline" size={18}/>เบราว์เซอร์นี้ไม่มี SpeechRecognition API ลองเปิดเว็บไซต์ผ่าน Chrome หรือ Edge บน HTTPS หรือ localhost</div>}{speech.error&&<div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">{speech.error}</div>}{notice&&<div role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">{notice}</div>}</>}
function Lessons() {
  const [lessons, setLessons] = useState(loadLessons);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudError, setCloudError] = useState('');
  const [aiNotice, setAiNotice] = useState('');

  // ขณะนี้ยังไม่ใช้ LANGMIND API: เตรียมข้อความให้ผู้ใช้คัดลอกไปวางเอง
  const copyForLangMind = async (lesson: (typeof lessons)[number]) => {
    const transcript = lesson.segments.map(segment => segment.text.trim()).filter(Boolean).join('\n');
    if (!transcript) {
      setAiNotice('บทเรียนนี้ยังไม่มีข้อความสำหรับส่งให้ AI');
      return;
    }
    const prompt = [
      'คุณคือ HearMind AI ผู้ช่วยการเรียนรู้',
      `หัวข้อบทเรียน: ${lesson.title}`,
      '',
      'ข้อความถอดเสียงจากบทเรียน (อาจมีคำผิด):',
      transcript,
      '',
      'โปรดสรุปประเด็นสำคัญ อธิบายคำศัพท์ที่ยาก และสร้างคำถามทบทวน 3 ข้อพร้อมเฉลย',
      'ยึดข้อความบรรยายเป็นหลัก แยกคำอธิบายเพิ่มเติมจาก AI และแจ้งหากเนื้อหาบางส่วนไม่ชัดเจน',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(prompt);
      setAiNotice('คัดลอกข้อความแล้ว — เปิด LANGMIND และวางข้อความในแชท HearMind AI v4 ได้เลย');
    } catch {
      setAiNotice('คัดลอกไม่สำเร็จ โปรดลองบน localhost หรือ HTTPS และอนุญาต Clipboard');
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchLessons() {
      try {
        const cloudLessons = await loadLessonsFromCloud();

        if (!cancelled) {
          setLessons(cloudLessons);
          setCloudError('');
        }
      } catch (error) {
        console.error('Failed to load cloud lessons:', error);

        if (!cancelled) {
          setCloudError('โหลดบทเรียนจาก Supabase ไม่สำเร็จ กำลังแสดงข้อมูลในเครื่อง');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLessons();

    return () => {
      cancelled = true;
    };
  }, []);const active=lessons.find(x=>x.id===selected);if (loading) {
  return (
    <div className="panel p-8 text-center">
      <p className="text-lg font-bold">
        กำลังโหลดบทเรียน...
      </p>
      <p className="mt-2 text-sm text-slate-500">
        กำลังดึงข้อมูลจาก Supabase
      </p>
    </div>
  );
}return <><Title eyebrow="My lessons" title="บทเรียนของฉัน" description="ดูบทเรียนที่บันทึกไว้ใน Supabase ดาวน์โหลดเป็นไฟล์ข้อความ หรือนำข้อความไปใช้กับ HearMind AI Agent"/>{cloudError && (
  <div
    role="alert"
    className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
  >
    {cloudError}
  </div>
)}{lessons.length===0?<div className="panel flex min-h-72 flex-col items-center justify-center p-8 text-center"><BookOpen className="mb-4 text-teal-600" size={42}/><h2 className="mb-2 font-bold">ยังไม่มีบทเรียนที่บันทึกไว้</h2><p className="mb-5 text-sm text-slate-500">เริ่มไมโครโฟนหรือทดลองข้อความตัวอย่างแล้วกดบันทึกบทเรียน</p><NavLink className="btn-primary" to="/live">เริ่มคำบรรยาย <ArrowRight size={16}/></NavLink></div>:<div className="grid gap-5 lg:grid-cols-[340px_1fr]"><div className="space-y-3">{lessons.map(x=><button key={x.id} onClick={()=>{setSelected(x.id);setAiNotice('')}} className={`panel w-full p-4 text-left transition hover:border-teal-400 ${selected===x.id?'!border-teal-500':''}`}><div className="mb-2 font-bold">{x.title}</div><div className="flex items-center gap-2 text-xs text-slate-500"><Clock size={14}/>{new Date(x.date).toLocaleString('th-TH')} · {x.segments.length} ข้อความ</div></button>)}</div><div className="panel min-h-72 p-6">{active?<><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{active.title}</h2><div className="flex gap-2"><button className="btn-outline !px-3 !py-2" onClick={()=>downloadText(`hearmind-${active.id.slice(0,8)}.txt`,active.segments.map(x=>x.text).join('\n'))}><Download size={16}/>TXT</button><button className="btn-outline !px-3 !py-2" onClick={()=>copyForLangMind(active)}><BookOpen size={16}/>คัดลอกเพื่อถาม AI</button><button className="btn-outline !px-3 !py-2 !text-rose-600" 
onClick={async () => {
  if (!window.confirm("ยืนยันลบบทเรียนนี้อย่างถาวรหรือไม่?")) {
    return;
  }

  try {
    await deleteLessonFromCloud(active.id);

    setLessons((prev) =>
      prev.filter((lesson) => lesson.id !== active.id)
    );
    setSelected(null);

    alert("ลบบทเรียนสำเร็จ");
  } catch (error) {
    console.error("Delete lesson failed:", error);

    alert(
      error instanceof Error
        ? error.message
        : "ไม่สามารถลบบทเรียนได้"
    );
  }
}}
><Trash2 size={16}/>ลบ</button></div></div><div className="space-y-4">{active.segments.map(s=><p key={s.id} className="border-l-2 border-teal-500 pl-4 text-sm leading-8">{s.text}</p>)}</div>{aiNotice&&<div role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-800 dark:border-teal-900 dark:bg-teal-900/20 dark:text-teal-200">{aiNotice}<div className="mt-2"><a href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">เปิด HearMind AI Agent v4 ใน LANGMIND</a></div></div>}</>:<div className="flex min-h-64 items-center justify-center text-sm text-slate-500">เลือกบทเรียนทางด้านซ้ายเพื่อดูรายละเอียด</div>}</div></div>}<p className="mt-5 text-xs leading-6 text-slate-500">หมายเหตุ: การส่งข้อมูลให้ LANGMIND ในขั้นตอนนี้ใช้วิธีคัดลอกและวางข้อความด้วยตนเอง ระบบยังไม่ได้เชื่อมต่อ API โดยอัตโนมัติ · ควรตรวจสอบข้อมูลส่วนบุคคลก่อนส่งให้ AI</p></>}

// Temporary diagnostic: verifies that the website can reach the authenticated Edge Function.
// Does not transmit saved lessons or invoke LangMind API.
function AgentConnectionTest() {
  const [testing,setTesting] = useState(false);
  const [result,setResult] = useState('');

  const run = async () => {
    setTesting(true);
    setResult('กำลังตรวจสอบการเชื่อมต่อ...');
    try {
      await ensureAnonymousAuth();
      if (!supabase) throw new Error('ยังไม่ได้ตั้งค่า Supabase');
      const {data:{session}} = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('ไม่พบ Supabase access token ของผู้ใช้');

      const {data,error} = await supabase.functions.invoke('hearmind-agent', {
        body: {message: 'ทดสอบการเชื่อมต่อจากเว็บไซต์ HearMind AI'},
        headers: {Authorization: `Bearer ${session.access_token}`},
      });

      if (error) {
        const response = error.context instanceof Response ? error.context : null;
        const payload = response
          ? await response.clone().json().catch(() => null)
          : null;
        if (response?.status === 503 && payload?.ready === false) {
          setResult('✅ เชื่อมต่อถึง Edge Function และผ่านการตรวจสอบผู้ใช้แล้ว (HTTP 503 ตามที่กำหนดไว้ เพราะยังไม่เปิด LangMind API)');
        } else if (response?.status === 401 || response?.status === 403) {
          setResult(`⚠️ HTTP ${response.status}: ระบบยืนยันตัวตนยังไม่ผ่าน ต้องตรวจสอบ JWT และการตั้งค่า Edge Function`);
        } else {
          setResult(`⚠️ เรียกฟังก์ชันไม่สำเร็จ${response ? ` (HTTP ${response.status})` : ''}: ${error.message}`);
        }
        return;
      }

      if (data?.ready === false) {
        setResult('✅ เรียก Edge Function ได้แล้ว — ฟังก์ชันกำลังรอ LangMind API');
      } else {
        setResult('✅ Edge Function ตอบกลับแล้ว แต่ผลลัพธ์ต่างจากตัวอย่างที่กำหนด กรุณาตรวจสอบ Code ของฟังก์ชัน');
      }
    } catch (e) {
      setResult(`⚠️ ${e instanceof Error ? e.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setTesting(false);
    }
  };

  return <section className="panel mt-5 p-6">
    <h2 className="mb-2 flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-teal-600"/>ทดสอบ Edge Function (Phase 4)</h2>
    <p className="mb-4 text-sm leading-7 text-slate-500 dark:text-slate-400">ตรวจสอบการส่งข้อความตัวอย่างจากเว็บไซต์ไปยัง Supabase hearmind-agent เท่านั้น ยังไม่ส่งข้อมูลบทเรียนหรือเรียก LangMind API</p>
    <button className="btn-primary" onClick={run} disabled={testing}>
      {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ Supabase'}
    </button>
    {result && <p role="status" className="mt-4 rounded-xl bg-slate-100 p-4 text-sm leading-7 text-slate-800 dark:bg-slate-800 dark:text-slate-100">{result}</p>}
  </section>;
}
function SettingsPage({theme,setTheme}:{theme:Theme,setTheme:(t:Theme)=>void}){return <><Title eyebrow="Preferences" title="การตั้งค่า" description="ปรับรูปแบบการแสดงผลและตรวจสอบข้อจำกัดของระบบต้นแบบ"/><div className="grid gap-5 lg:grid-cols-2"><section className="panel p-6"><h2 className="mb-5 flex items-center gap-2 font-bold"><Monitor size={19} className="text-teal-600"/>Adaptive Theme</h2><div className="space-y-3">{([{v:'system',name:'ตามอุปกรณ์',icon:Monitor},{v:'light',name:'โหมดสว่าง',icon:Sun},{v:'dark',name:'โหมดมืด',icon:Moon}] as const).map(({v,name,icon:Icon})=><button key={v} onClick={()=>setTheme(v)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${theme===v?'border-teal-500 bg-teal-50 dark:bg-teal-900/20':'border-slate-200 dark:border-slate-700'}`}><span className="flex items-center gap-3 text-sm font-semibold"><Icon size={19}/>{name}</span>{theme===v&&<Check size={18} className="text-teal-600"/>}</button>)}</div></section><section className="panel p-6"><h2 className="mb-5 flex items-center gap-2 font-bold"><Keyboard size={19} className="text-teal-600"/>การเข้าถึง</h2><ul className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><li>• เพิ่มหรือลดขนาดข้อความคำบรรยายได้ที่หน้ารับเสียง</li><li>• ปุ่มและเมนูรองรับการใช้งานด้วยคีย์บอร์ด</li><li>• แสดงสถานะไมโครโฟนด้วยข้อความร่วมกับสี</li><li>• มีการแสดงข้อความชั่วคราวระหว่างประมวลผล</li></ul></section></div><div className="panel mt-5 p-6"><h2 className="mb-3 font-bold">สถานะการพัฒนา</h2><div className="grid gap-3 text-sm md:grid-cols-2"><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ คำบรรยายภาษาไทยบนอุปกรณ์ปัจจุบัน</div><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ บันทึกและส่งออกข้อความในเครื่อง</div><div className="rounded-xl bg-slate-100 p-4 text-slate-600 dark:bg-slate-800 dark:text-slate-300">ถัดไป: ห้องเรียนแบบหลายอุปกรณ์</div><div className="rounded-xl bg-slate-100 p-4 text-slate-600 dark:bg-slate-800 dark:text-slate-300">ถัดไป: เชื่อมต่อ LANGMIND AI Agent</div></div></div><AgentConnectionTest/></>}
export default function App(){const {theme,setTheme}=useTheme();return <Shell theme={theme} setTheme={setTheme}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/live" element={<Captions source="teacher"/>}/><Route path="/classroom" element={<ClassroomHome/>}/><Route path="/classroom/:id" element={<ClassroomRoom/>}/><Route path="/personal" element={<Captions source="student"/>}/><Route path="/lessons" element={<Lessons/>}/><Route path="/agent" element={<LangMindAgentPage/>}/><Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme}/>}/><Route path="*" element={<div className="panel p-10 text-center"><h1 className="mb-3 text-2xl font-bold">ไม่พบหน้านี้</h1><NavLink to="/" className="btn-primary">กลับหน้าหลัก</NavLink></div>}/></Routes></Shell>}
