export type Segment={id:string;text:string;at:string;source:'teacher'|'student';final:boolean};
export type Lesson={id:string;title:string;date:string;segments:Segment[]};
const KEY='hearmind-lessons-v1';
export function loadLessons():Lesson[]{try{return JSON.parse(localStorage.getItem(KEY)||'[]') as Lesson[]}catch{return []}}
export function saveLesson(title:string,segments:Segment[]){if(!segments.length)return false;const lesson:Lesson={id:crypto.randomUUID(),title,date:new Date().toISOString(),segments:segments.filter(x=>x.final)};if(!lesson.segments.length)return false;localStorage.setItem(KEY,JSON.stringify([lesson,...loadLessons()].slice(0,50)));return true}
export function removeLesson(id:string){localStorage.setItem(KEY,JSON.stringify(loadLessons().filter(x=>x.id!==id)))}
export function downloadText(filename:string,content:string){const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

import { supabase, ensureAnonymousAuth } from './supabase';

export async function saveLessonToCloud(
  title: string,
  segments: Segment[]
): Promise<string> {
  if (!supabase) {
    throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
  }

  if (!segments.length) {
    throw new Error('ไม่มีข้อความสำหรับบันทึก');
  }

  const userId = await ensureAnonymousAuth();

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      user_id: userId,
      title: title.trim() || 'บทเรียนไม่มีชื่อ',
      segments
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

export async function loadLessonsFromCloud(): Promise<Lesson[]> {
  if (!supabase) {
    throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
  }

  const userId = await ensureAnonymousAuth();

  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, segments, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`โหลดบทเรียนไม่สำเร็จ: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    date: row.created_at,
    segments: row.segments ?? [],
  }));
}

export async function deleteLessonFromCloud(
  lessonId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase");
  }

  const userId = await ensureAnonymousAuth();

  const { data, error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw new Error(`ลบบทเรียนไม่สำเร็จ: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "ไม่พบบทเรียนที่มีสิทธิ์ลบ หรือไม่สามารถลบข้อมูลได้"
    );
  }
}
