import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const configured=Boolean(url&&key);
export const supabase=configured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true}}):null;
export async function ensureAnonymousAuth(){
 if(!supabase)throw new Error('ยังไม่ได้ตั้งค่า Supabase ในไฟล์ .env');
 const {data:{session}}=await supabase.auth.getSession();
 if(session)return session.user.id;
 const {data,error}=await supabase.auth.signInAnonymously();
 if(error)throw new Error(`เข้าสู่ระบบแบบไม่ระบุตัวตนไม่สำเร็จ: ${error.message} (ตรวจสอบ Anonymous Sign-ins ใน Supabase Auth)`);
 if(!data.user)throw new Error('ไม่พบข้อมูลผู้ใช้');
 return data.user.id;
}
