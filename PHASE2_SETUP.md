# HearMind AI — Phase 2 (Supabase Classroom)

## 1. Supabase configuration

1. Create/open your Supabase project.
2. Go to **Authentication → Providers → Anonymous Sign-ins** and enable anonymous sign-ins. This is different from the public `anon` API key.
3. Go to **SQL Editor → New query**. Paste the full `supabase/setup.sql` and run it once. The SQL creates classroom, membership and caption tables, RLS policies, secure create/join RPC functions and Realtime publication.
4. Go to **Project Settings → API** (or Connect) and copy the **Project URL** and **publishable/anon key**. Never copy the `service_role` or secret key into frontend files.
5. Copy `.env.example` to `.env` in the project root and fill in the two `VITE_` variables. Restart the Vite server.

## 2. Run locally

```powershell
npm install
npm run typecheck
npm run dev
```

Open http://localhost:5173. For testing across two devices, deploy to Vercel (HTTPS) or use a trusted HTTPS tunnel. A plain `http://192.168.x.x` address generally cannot access the microphone on another device.

## 3. Test teacher and student

1. Teacher opens **ห้องเรียนออนไลน์**, enters a lesson title, and selects **สร้างห้องเรียน**.
2. Teacher shares the six-character room code.
3. Student opens the site in a separate browser/device, opens **ห้องเรียนออนไลน์**, enters the code, and selects **เข้าร่วมห้องเรียน**.
4. Teacher checks consent, starts the microphone and speaks Thai. Only *finalized* recognition text is sent to Supabase.
5. Student receives new captions via Supabase Postgres Changes; a 5-second database refresh serves as fallback. Both can adjust caption font size and save/export a local transcript.
6. Teacher can close the room. After closing, new joins and teacher caption writes are blocked. Already-joined members may still read the room history.

## 4. Deploy to Vercel

- Import repository in Vercel, framework **Vite**.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project → Settings → Environment Variables.
- Deploy. Verify the microphone permission and Thai speech recognition in Chrome/Edge over HTTPS.

## Architecture and limits

- Original Phase 1 dashboard, local captions, personal microphone, adaptive theme and local lessons are preserved.
- The new shared classroom stores finalized **text**, not raw audio, in Supabase. Students do not need to enable their microphone to view teacher captions.
- Authentication is **anonymous** (browser-scoped). The classroom code grants membership. It is suitable for an invited prototype, not a fully verified institutional identity system. Never publish room codes publicly.
- RLS allows only joined users to read classroom data, and only the creator to publish captions or close the room. Captions are retained in Supabase until deleted; add retention/deletion and moderation before use with real students.
- No participant-count/presence tracking or LANGMIND integration is claimed in this phase.
- Browser speech recognition can be inaccurate and may use a third-party speech service. Obtain meaningful consent from teacher and participants before use. This system does not replace sign-language interpretation.
- For production, add verified accounts, role management, abuse prevention/rate limits, transcript retention policies and security review.

Note: `package-lock.json` from Phase 1 was removed because the new Supabase dependency needs a fresh dependency resolution. Run `npm install` to regenerate it, and commit the resulting lockfile before deploying.
