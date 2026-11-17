import {useEffect,useMemo,useRef,useState} from 'react';
import {NavLink,Route,Routes,useLocation,useNavigate} from 'react-router-dom';
import {Activity,ArrowRight,AudioLines,BookOpen,Check,ChevronRight,Clock,Download,GraduationCap,Headphones,Home,Info,Keyboard,Menu,Mic,MicOff,Moon,Radio,RotateCcw,Settings,ShieldCheck,Sun,Trash2,Volume2,X,FileText,Monitor,WifiOff,Sparkles,ExternalLink,BrainCircuit,Send,MessageCircle,Plus,LoaderCircle} from 'lucide-react';
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
function Dashboard(){const navigate=useNavigate();const lessons=loadLessons();return <><div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#155e75] p-7 text-white md:p-10"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[45px] border-white/10"/><div className="relative max-w-2xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"><Activity size={14}/> Accessible Learning Platform</span><h1 className="mb-3 text-3xl font-extrabold leading-snug md:text-4xl">ทุกเสียงในห้องเรียน<br/>ควรเข้าถึงได้</h1><p className="mb-7 max-w-xl text-sm leading-7 text-white/85">แปลงเสียงบรรยายภาษาไทยเป็นข้อความแบบต่อเนื่อง เพื่อช่วยให้นักศึกษาติดตามเนื้อหาและทบทวนบทเรียนได้สะดวกขึ้น</p><button className="btn bg-white text-teal-800 hover:bg-teal-50" onClick={()=>navigate('/live')}>เริ่มคำบรรยายสด <ArrowRight size={17}/></button><a className="ml-0 mt-3 inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25 sm:ml-3 sm:mt-0" href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer"><Sparkles size={17}/>เรียนรู้ต่อด้วย LANGMIND AI <ExternalLink size={16}/></a></div></div><LangMindSpotlight/><button className="btn-primary mb-7" onClick={()=>navigate('/classroom')}>เข้าห้องเรียนออนไลน์ <ArrowRight size={17}/></button><div className="mb-7 grid gap-4 md:grid-cols-3"><Metric icon={Radio}value="ภาษาไทย"label="การรู้จำเสียง th-TH"/><Metric icon={BookOpen}value={String(lessons.length)}label="บทเรียนที่บันทึกในเครื่อง"/><Metric icon={ShieldCheck}value="Local"label="บทเรียนในเครื่อง + ห้องเรียนออนไลน์"/></div><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">เริ่มต้นใช้งาน</h2><span className="text-xs text-slate-400">เลือกโหมดที่เหมาะกับคุณ</span></div><div className="grid gap-5 md:grid-cols-2"><ActionCard icon={GraduationCap}title="โหมดอาจารย์"tag="Teacher Mode"description="เปิดไมโครโฟนของอาจารย์เพื่อทดลองแปลงคำบรรยายเป็นข้อความบนอุปกรณ์นี้"button="เปิดคำบรรยายสด"onClick={()=>navigate('/live')}/><ActionCard icon={Headphones}title="โหมดนักศึกษา"tag="Student Mode"description="เปิดไมโครโฟนบนอุปกรณ์ของนักศึกษาเพื่อรับฟังเสียงรอบตัวและแสดงคำบรรยายส่วนตัว"button="เริ่มไมโครโฟนส่วนตัว"onClick={()=>navigate('/personal')}/></div><div className="panel mt-7 flex gap-3 p-5"><Info className="mt-0.5 shrink-0 text-teal-600" size={20}/><div><div className="mb-1 font-bold">เกี่ยวกับระบบคำบรรยาย</div><p className="text-sm leading-7 text-slate-500 dark:text-slate-400">คำบรรยายสดและไมโครโฟนส่วนตัวทำงานบนอุปกรณ์ปัจจุบัน ส่วนห้องเรียนออนไลน์ใช้ Supabase ส่งข้อความข้ามอุปกรณ์ และหน้า AI ใช้ LANGMIND ผ่าน Edge Function</p></div></div></>}

// The public LangMind link is kept as an optional way to open the provider chat.
function LangMindSpotlight() {
  const navigate = useNavigate();
  return <section aria-label="LANGMIND AI Agent" className="panel relative mb-6 overflow-hidden border-teal-200 p-6 dark:border-teal-800 md:p-7">
    <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-12 rounded-full border-[28px] border-teal-50 dark:border-teal-900/40" aria-hidden="true"/>
    <div className="relative flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#153c5b] text-white"><Sparkles size={24}/></span>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">AI LEARNING ASSISTANT · LANGMIND AGENT STUDIO</div>
          <h2 className="text-xl font-extrabold md:text-2xl">HearMind AI Agent <span className="text-teal-700 dark:text-teal-300">v4</span></h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">ช่วยสรุป อธิบาย และสร้างคำถามทบทวนจากบทเรียนผ่าน LANGMIND API โดยสนทนาภายในเว็บไซต์ HearMind AI ได้</p>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">เชื่อมผ่าน Supabase Edge Function · รองรับการสนทนาต่อเนื่องในแท็บที่เปิดใช้งาน</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={()=>navigate('/agent')}><MessageCircle size={17}/>แชทกับ HearMind AI</button>
        <a className="btn-outline" href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/>เปิดบน LANGMIND</a>
      </div>
    </div>
  </section>;
}

type AgentTask = 'summary' | 'explain' | 'quiz';
const AGENT_TASKS: {id:AgentTask;title:string;detail:string;prompt:string}[] = [
  {id:'summary',title:'สรุปประเด็นสำคัญ',detail:'จับใจความสำคัญจากบทเรียน',prompt:'โปรดสรุปเนื้อหาบทเรียนต่อไปนี้เป็นข้อ ๆ โดยรักษาความหมายเดิม แยกสิ่งที่ไม่แน่ชัดจากข้อความถอดเสียง และไม่แต่งข้อมูลเพิ่ม'},
  {id:'explain',title:'อธิบายให้เข้าใจง่าย',detail:'ขยายความพร้อมตัวอย่างที่เกี่ยวข้อง',prompt:'โปรดอธิบายเนื้อหาบทเรียนต่อไปนี้ด้วยภาษาไทยที่เข้าใจง่าย แบ่งเป็นขั้นตอน อธิบายคำศัพท์สำคัญและยกตัวอย่างที่ตรงประเด็น โดยแจ้งเมื่อข้อความต้นทางไม่ชัดเจน'},
  {id:'quiz',title:'สร้างคำถามทบทวน',detail:'คำถาม 5 ข้อ พร้อมเฉลยและเหตุผล',prompt:'โปรดสร้างคำถามทบทวนความเข้าใจ 5 ข้อจากข้อความบทเรียนต่อไปนี้ พร้อมเฉลยและคำอธิบายอย่างสั้น โดยอ้างอิงข้อความที่ให้มาเป็นหลักและไม่แต่งข้อเท็จจริง'},
];

type AgentChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
};

type AgentConversation = {
  id: string;
  token: string;
};

type AgentApiResult = {
  ready?: boolean;
  answer?: string;
  conversation_id?: string | null;
  conversation_token?: string | null;
  message_id?: string | null;
  citations?: unknown[];
  error?: string;
};

function LangMindAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transcript, setTranscript] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [task, setTask] = useState<AgentTask>('summary');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [conversation, setConversation] = useState<AgentConversation | null>(null);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // A lesson is passed in router state, not in the URL or browser storage.
  // This avoids putting lesson content in links, query strings or localStorage.
  useEffect(() => {
    const state = location.state as { lessonTitle?: unknown; transcript?: unknown } | null;
    if (typeof state?.transcript === 'string') {
      setTranscript(state.transcript);
      setLessonTitle(typeof state.lessonTitle === 'string' ? state.lessonTitle : '');
      setMessages([]);
      setConversation(null);
      setNotice('นำเข้าบทเรียนแล้ว เลือกรูปแบบความช่วยเหลือแล้วกด “ส่งบทเรียนให้ AI”');
    }
  }, [location.key]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, working]);

  const send = async (message: string, clearDraft = false) => {
    const text = message.trim();
    if (inFlight.current) return;
    if (!text || text.length > 8000) {
      setNotice('กรุณาส่งข้อความที่มีความยาว 1–8,000 ตัวอักษร');
      return;
    }

    inFlight.current = true;
    setWorking(true);
    setNotice('');
    try {
      await ensureAnonymousAuth();
      if (!supabase) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('ไม่พบเซสชัน Supabase กรุณารีเฟรชแล้วลองอีกครั้ง');
      }

      const { data, error } = await supabase.functions.invoke<AgentApiResult>('hearmind-agent', {
        body: {
          message: text,
          conversation_id: conversation?.id ?? null,
          ...(conversation ? { conversation_token: conversation.token } : {}),
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        const response = error.context instanceof Response ? error.context : null;
        const payload = response ? await response.clone().json().catch(() => null) : null;
        const detail = typeof payload?.error === 'string' ? payload.error : error.message;
        throw new Error(response ? `${detail} (HTTP ${response.status})` : detail);
      }
      if (data?.ready !== true || typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error('ระบบ AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง กรุณาตรวจสอบ Edge Function');
      }

      const sources = Array.isArray(data.citations)
        ? data.citations
            .map((item: unknown) => item && typeof item === 'object' && 'document_name' in item && typeof item.document_name === 'string' ? item.document_name : null)
            .filter((value: string | null): value is string => Boolean(value))
        : [];
      const newEntries: AgentChatMessage[] = [
        { id: crypto.randomUUID(), role: 'user', content: text },
        { id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources },
      ];
      setMessages(previous => [...previous, ...newEntries]);
      if (typeof data.conversation_id === 'string' && typeof data.conversation_token === 'string') {
        setConversation({ id: data.conversation_id, token: data.conversation_token });
      } else {
        setConversation(null);
        setNotice('AI ตอบกลับแล้ว แต่ไม่มีข้อมูลสำหรับถามต่อเนื่องในบทสนทนาเดิม');
      }
      if (clearDraft) setDraft('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'เชื่อมต่อ AI ไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      inFlight.current = false;
      setWorking(false);
    }
  };

  const sendTask = () => {
    if (!transcript.trim()) {
      setNotice('กรุณาวางบทเรียนก่อน หรือเลือกบทเรียนจากหน้า “บทเรียนของฉัน”');
      return;
    }
    const instruction = AGENT_TASKS.find(item => item.id === task)!.prompt;
    const message = [
      instruction,
      lessonTitle.trim() ? `ชื่อบทเรียน: ${lessonTitle.trim()}` : '',
      'ข้อความบทเรียนต้นทาง (อาจมีข้อผิดพลาดจากการถอดเสียง):',
      transcript.trim(),
      'ตอบเป็นภาษาไทยที่อ่านง่าย และระบุส่วนที่ไม่แน่ชัดโดยไม่แต่งข้อมูลขึ้นเอง',
    ].filter(Boolean).join('\n\n');
    void send(message);
  };

  const newChat = () => {
    if (inFlight.current) return;
    setMessages([]);
    setConversation(null);
    setDraft('');
    setNotice('เริ่มบทสนทนาใหม่แล้ว (บทเรียนที่วางไว้ยังคงอยู่)');
  };

  return <>
    <Title eyebrow="LANGMIND AI · INTEGRATED CHAT" title="ผู้ช่วยการเรียนรู้ HearMind AI" description="สนทนากับ HearMind AI Agent ผ่านเว็บไซต์ได้โดยตรง สรุปบทเรียน อธิบายเรื่องที่ยาก และถามต่อเนื่องโดยไม่ต้องเปิดแท็บใหม่"/>
    <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#142d49] via-[#17466b] to-[#0f766e] p-6 text-white md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><BrainCircuit size={29}/></span>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-100">LANGMIND AGENT STUDIO</p>
            <h2 className="text-2xl font-extrabold">HearMind AI · Agent v4</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/85">เชื่อม LANGMIND API ผ่าน Supabase Edge Function โดยไม่เปิดเผย API Key ในเบราว์เซอร์</p>
          </div>
        </div>
        <a href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20">เปิดแชท LANGMIND ภายนอก <ExternalLink size={16}/></a>
      </div>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
      <section className="panel p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2"><BookOpen className="text-teal-600" size={21}/><h2 className="text-lg font-extrabold">ส่งบทเรียนให้ AI</h2></div>
        <p className="mb-4 text-sm leading-6 text-slate-500 dark:text-slate-400">วางข้อความหรือส่งจากหน้า “บทเรียนของฉัน” แล้วเลือกสิ่งที่ต้องการให้ AI ช่วย</p>
        <label className="mb-2 block text-sm font-semibold" htmlFor="ai-lesson-title">ชื่อบทเรียน (ไม่บังคับ)</label>
        <input id="ai-lesson-title" className="input mb-4" maxLength={100} value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="เช่น การออกแบบอัลกอริทึม"/>
        <label className="mb-2 block text-sm font-semibold" htmlFor="ai-lesson-text">ข้อความบทเรียน</label>
        <textarea id="ai-lesson-text" className="input min-h-52 w-full resize-y text-sm leading-7" rows={8} maxLength={8000} value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="วางข้อความจากคำบรรยายหรือบทเรียนที่นี่..."/>
        <p className="mt-1 text-right text-xs text-slate-500">{transcript.length.toLocaleString('th-TH')}/8,000 ตัวอักษร (รวมคำสั่งต้องไม่เกิน 8,000)</p>
        <div className="mt-5 space-y-2" role="group" aria-label="เลือกรูปแบบการช่วยเรียนรู้">
          {AGENT_TASKS.map(item=><button type="button" key={item.id} aria-pressed={task===item.id} onClick={()=>setTask(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${task===item.id?'border-teal-600 bg-teal-50 dark:bg-teal-900/25':'border-slate-200 hover:border-teal-300 dark:border-slate-700'}`}><span className="block text-sm font-bold">{item.title}</span><span className="block text-xs leading-6 text-slate-500 dark:text-slate-400">{item.detail}</span></button>)}
        </div>
        <button type="button" className="btn-primary mt-5 w-full justify-center" disabled={working || !transcript.trim()} onClick={sendTask}><Sparkles size={17}/> {working?'กำลังประมวลผล...':'ส่งบทเรียนให้ AI'}</button>
        <button type="button" className="btn-outline mt-3 w-full justify-center" onClick={()=>navigate('/lessons')}><BookOpen size={16}/>เลือกบทเรียนที่บันทึกไว้</button>
        <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">โปรดตรวจสอบข้อมูลส่วนบุคคลและขออนุญาตก่อนส่งข้อความบทเรียนไปประมวลผลกับ AI</p>
      </section>

      <section className="panel flex min-h-[620px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2 font-extrabold"><MessageCircle size={20} className="text-teal-600"/>แชทกับ HearMind AI</div>
          <button type="button" className="btn-outline !px-3 !py-2" disabled={working} onClick={newChat} title="ล้างแชทและเริ่มบทสนทนาใหม่"><Plus size={16}/>แชทใหม่</button>
        </div>
        <div ref={listRef} role="log" aria-live="polite" aria-relevant="additions" className="min-h-[360px] max-h-[570px] flex-1 space-y-5 overflow-y-auto bg-slate-50/40 p-5 dark:bg-slate-900/25">
          {messages.length===0&&<div className="flex min-h-72 flex-col items-center justify-center text-center"><span className="mb-4 rounded-2xl bg-teal-50 p-5 text-teal-600 dark:bg-teal-900/30"><Sparkles size={32}/></span><h3 className="mb-2 font-extrabold">พร้อมช่วยทำความเข้าใจบทเรียน</h3><p className="max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">ส่งบทเรียนด้านซ้าย หรือพิมพ์คำถามด้านล่างเพื่อเริ่มสนทนา</p></div>}
          {messages.map(item=><div key={item.id} className={`flex ${item.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[94%] rounded-2xl p-4 text-sm leading-7 shadow-sm ${item.role==='user'?'bg-teal-700 text-white':'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}><div className="mb-2 text-xs font-extrabold opacity-80">{item.role==='user'?'คุณ':'HearMind AI'}</div><p className="whitespace-pre-wrap break-words">{item.content}</p>{item.sources&&item.sources.length>0&&<p className="mt-3 border-t border-current/20 pt-2 text-xs opacity-75">เอกสารอ้างอิง: {item.sources.join(', ')}</p>}</div></div>)}
          {working&&<div className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300"><LoaderCircle className="animate-spin" size={17}/>HearMind AI กำลังตอบ...</div>}
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {notice&&<div role="status" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{notice}</div>}
          <label htmlFor="ai-chat-input" className="sr-only">พิมพ์คำถามถึง HearMind AI</label>
          <textarea id="ai-chat-input" rows={3} maxLength={8000} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(draft,true)}}} className="input w-full resize-y text-sm leading-7" placeholder="พิมพ์คำถามที่ต้องการถามต่อ... (Enter เพื่อส่ง, Shift+Enter เพื่อขึ้นบรรทัดใหม่)"/>
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{conversation?'สนทนาต่อเนื่องในแชทนี้':'บทสนทนาใหม่'} · ประวัติแชทไม่ถูกเก็บใน localStorage</span><button type="button" className="btn-primary" disabled={working||!draft.trim()} onClick={()=>void send(draft,true)}><Send size={16}/>ส่งคำถาม</button></div>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">AI อาจตอบคลาดเคลื่อน โปรดตรวจสอบข้อมูลสำคัญก่อนนำไปใช้</p>
        </div>
      </section>
    </div>
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
  const navigate = useNavigate();
  const [lessons, setLessons] = useState(loadLessons);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudError, setCloudError] = useState('');
  const [aiNotice, setAiNotice] = useState('');

  // External LANGMIND copy is still supported as a fallback.
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

  const openLessonInAI = (lesson: (typeof lessons)[number]) => {
    const transcript = lesson.segments.map(segment => segment.text.trim()).filter(Boolean).join('\n');
    if (!transcript) {
      setAiNotice('บทเรียนนี้ยังไม่มีข้อความสำหรับส่งให้ AI');
      return;
    }
    if (transcript.length > 7500) {
      setAiNotice('บทเรียนยาวเกินไปสำหรับส่งเข้า AI ในครั้งเดียว กรุณาคัดเลือกเนื้อหาบางส่วนก่อน');
      return;
    }
    navigate('/agent', { state: { lessonTitle: lesson.title, transcript } });
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
)}{lessons.length===0?<div className="panel flex min-h-72 flex-col items-center justify-center p-8 text-center"><BookOpen className="mb-4 text-teal-600" size={42}/><h2 className="mb-2 font-bold">ยังไม่มีบทเรียนที่บันทึกไว้</h2><p className="mb-5 text-sm text-slate-500">เริ่มไมโครโฟนหรือทดลองข้อความตัวอย่างแล้วกดบันทึกบทเรียน</p><NavLink className="btn-primary" to="/live">เริ่มคำบรรยาย <ArrowRight size={16}/></NavLink></div>:<div className="grid gap-5 lg:grid-cols-[340px_1fr]"><div className="space-y-3">{lessons.map(x=><button key={x.id} onClick={()=>{setSelected(x.id);setAiNotice('')}} className={`panel w-full p-4 text-left transition hover:border-teal-400 ${selected===x.id?'!border-teal-500':''}`}><div className="mb-2 font-bold">{x.title}</div><div className="flex items-center gap-2 text-xs text-slate-500"><Clock size={14}/>{new Date(x.date).toLocaleString('th-TH')} · {x.segments.length} ข้อความ</div></button>)}</div><div className="panel min-h-72 p-6">{active?<><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{active.title}</h2><div className="flex gap-2"><button className="btn-outline !px-3 !py-2" onClick={()=>downloadText(`hearmind-${active.id.slice(0,8)}.txt`,active.segments.map(x=>x.text).join('\n'))}><Download size={16}/>TXT</button><button className="btn-primary !px-3 !py-2" onClick={()=>openLessonInAI(active)}><Sparkles size={16}/>ส่งไปแชท AI</button><button className="btn-outline !px-3 !py-2" onClick={()=>copyForLangMind(active)}><BookOpen size={16}/>คัดลอกเพื่อถาม AI</button><button className="btn-outline !px-3 !py-2 !text-rose-600" 
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
><Trash2 size={16}/>ลบ</button></div></div><div className="space-y-4">{active.segments.map(s=><p key={s.id} className="border-l-2 border-teal-500 pl-4 text-sm leading-8">{s.text}</p>)}</div>{aiNotice&&<div role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-800 dark:border-teal-900 dark:bg-teal-900/20 dark:text-teal-200">{aiNotice}<div className="mt-2"><a href={LANGMIND_AGENT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">เปิด HearMind AI Agent v4 ใน LANGMIND</a></div></div>}</>:<div className="flex min-h-64 items-center justify-center text-sm text-slate-500">เลือกบทเรียนทางด้านซ้ายเพื่อดูรายละเอียด</div>}</div></div>}<p className="mt-5 text-xs leading-6 text-slate-500">สามารถส่งบทเรียนเข้าแชทภายในเว็บไซต์ผ่าน LANGMIND API ได้โดยตรง หรือใช้วิธีคัดลอกไปวางใน LANGMIND ภายนอก · ควรตรวจสอบข้อมูลส่วนบุคคลก่อนส่งให้ AI</p></>}

// Diagnostic: test the authenticated Edge Function and LANGMIND API without sending saved lessons.
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

      if (data?.ready === true && typeof data.answer === 'string' && data.answer.trim()) {
        setResult('✅ เชื่อม Supabase Edge Function และ LANGMIND API สำเร็จ ได้รับคำตอบจาก HearMind AI แล้ว');
      } else if (data?.ready === false) {
        setResult('⚠️ Edge Function ยังไม่เปิดใช้งาน LANGMIND API');
      } else {
        setResult('⚠️ Edge Function ตอบกลับแล้ว แต่รูปแบบคำตอบไม่ตรงกับที่คาดหวัง กรุณาตรวจสอบ Response');
      }
    } catch (e) {
      setResult(`⚠️ ${e instanceof Error ? e.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setTesting(false);
    }
  };

  return <section className="panel mt-5 p-6">
    <h2 className="mb-2 flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-teal-600"/>ทดสอบ Edge Function (Phase 4)</h2>
    <p className="mb-4 text-sm leading-7 text-slate-500 dark:text-slate-400">ทดสอบส่งข้อความตัวอย่างผ่าน Supabase Edge Function ไปยัง LANGMIND API โดยไม่ส่งบทเรียนที่บันทึกไว้</p>
    <button className="btn-primary" onClick={run} disabled={testing}>
      {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ Supabase'}
    </button>
    {result && <p role="status" className="mt-4 rounded-xl bg-slate-100 p-4 text-sm leading-7 text-slate-800 dark:bg-slate-800 dark:text-slate-100">{result}</p>}
  </section>;
}
function SettingsPage({theme,setTheme}:{theme:Theme,setTheme:(t:Theme)=>void}){return <><Title eyebrow="Preferences" title="การตั้งค่า" description="ปรับรูปแบบการแสดงผลและตรวจสอบข้อจำกัดของระบบต้นแบบ"/><div className="grid gap-5 lg:grid-cols-2"><section className="panel p-6"><h2 className="mb-5 flex items-center gap-2 font-bold"><Monitor size={19} className="text-teal-600"/>Adaptive Theme</h2><div className="space-y-3">{([{v:'system',name:'ตามอุปกรณ์',icon:Monitor},{v:'light',name:'โหมดสว่าง',icon:Sun},{v:'dark',name:'โหมดมืด',icon:Moon}] as const).map(({v,name,icon:Icon})=><button key={v} onClick={()=>setTheme(v)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${theme===v?'border-teal-500 bg-teal-50 dark:bg-teal-900/20':'border-slate-200 dark:border-slate-700'}`}><span className="flex items-center gap-3 text-sm font-semibold"><Icon size={19}/>{name}</span>{theme===v&&<Check size={18} className="text-teal-600"/>}</button>)}</div></section><section className="panel p-6"><h2 className="mb-5 flex items-center gap-2 font-bold"><Keyboard size={19} className="text-teal-600"/>การเข้าถึง</h2><ul className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><li>• เพิ่มหรือลดขนาดข้อความคำบรรยายได้ที่หน้ารับเสียง</li><li>• ปุ่มและเมนูรองรับการใช้งานด้วยคีย์บอร์ด</li><li>• แสดงสถานะไมโครโฟนด้วยข้อความร่วมกับสี</li><li>• มีการแสดงข้อความชั่วคราวระหว่างประมวลผล</li></ul></section></div><div className="panel mt-5 p-6"><h2 className="mb-3 font-bold">สถานะการพัฒนา</h2><div className="grid gap-3 text-sm md:grid-cols-2"><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ คำบรรยายภาษาไทยบนอุปกรณ์ปัจจุบัน</div><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ บันทึกและส่งออกข้อความในเครื่อง</div><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ ห้องเรียนออนไลน์แบบหลายอุปกรณ์</div><div className="rounded-xl bg-teal-50 p-4 text-teal-800 dark:bg-teal-900/20 dark:text-teal-200">✓ เชื่อมต่อ LANGMIND AI Agent ผ่าน API</div></div></div><AgentConnectionTest/></>}
export default function App(){const {theme,setTheme}=useTheme();return <Shell theme={theme} setTheme={setTheme}><Routes><Route path="/" element={<Dashboard/>}/><Route path="/live" element={<Captions source="teacher"/>}/><Route path="/classroom" element={<ClassroomHome/>}/><Route path="/classroom/:id" element={<ClassroomRoom/>}/><Route path="/personal" element={<Captions source="student"/>}/><Route path="/lessons" element={<Lessons/>}/><Route path="/agent" element={<LangMindAgentPage/>}/><Route path="/settings" element={<SettingsPage theme={theme} setTheme={setTheme}/>}/><Route path="*" element={<div className="panel p-10 text-center"><h1 className="mb-3 text-2xl font-bold">ไม่พบหน้านี้</h1><NavLink to="/" className="btn-primary">กลับหน้าหลัก</NavLink></div>}/></Routes></Shell>}
