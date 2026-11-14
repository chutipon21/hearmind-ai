# HearMind AI — Phase 1

Accessible Thai-language lecture captioning prototype built with React, TypeScript, Tailwind CSS and Vite.

## Features

- Adaptive Theme: Light / Dark / System (saved in localStorage)
- Dashboard and teacher/student entry points
- Live Captions (teacher's device microphone)
- Personal Captions (student's device microphone)
- Thai speech recognition (`th-TH`) using the browser Web Speech API
- Interim/final transcripts, adjustable caption size
- Explicit consent checkbox before microphone activation
- Local lesson history, TXT export, delete
- Responsive design and keyboard focus states

**Important limitations:** Phase 1 is a **single-device prototype**. The teacher and student pages do not exchange captions between devices. LANGMIND, MCP, authentication, Supabase, cloud storage, AI summarization and real classroom sessions are **not integrated**. Speech recognition accuracy and support vary by browser and network. Browser speech recognition may process audio on third-party servers; do not assume it is private or offline. Ask for informed consent from all relevant participants before recording/transcribing classroom speech.

## Run locally (VS Code)

Requirements: Node.js 20.19+ or Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the localhost address printed by Vite (typically http://localhost:5173).

```bash
npm run typecheck
npm run build
npm run preview
```

For microphone testing use Chrome or Edge on desktop, and **HTTPS** or `localhost`. Safari/Firefox may not expose compatible SpeechRecognition APIs. A successful browser API check does not guarantee speech recognition will function on the current device/network.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New Project** and import that repository.
3. Framework: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. `vercel.json` configures SPA route rewrites.
5. Test the microphone permission on the deployed HTTPS URL.

No environment variables are needed for Phase 1. **Never put secret API keys into `VITE_` environment variables**, as those are exposed to browsers.

## Phase 2 roadmap

1. Supabase Auth + RLS for classroom memberships.
2. Classroom creation/joining, real-time transcript distribution and reconnect logic.
3. Server-side STT provider evaluation, speaker labels and error handling.
4. Secure backend/MCP integration and LANGMIND capability validation.
5. Co-design and testing with deaf/hard-of-hearing students; privacy, consent and retention policies.

## Data handling

Final transcript segments are saved only to browser `localStorage` when you click **บันทึกบทเรียน**. `localStorage` is not encrypted and is unsuitable for sensitive or shared-device deployments. Temporary transcript state exists in memory while the page is open. `ส่งออก .txt` downloads a local file. Delete saved lessons via **บทเรียนของฉัน**.
