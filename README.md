# FaultLine

> Every manual becomes a technician on shift.

FaultLine is AI maintenance software for small plants.
1. An operator scans the QR code on a machine.
2. They report the fault by photo, voice or text.
3. They get safety-first fix steps drawn from that machine's own manual, each citing its page.

If they can't fix it, one tap sends a pre-filled work order to a technician. A live floor board shows every machine. AI insight cards pick out repeat faults.

**Live:** https://faultline-ashy.vercel.app. Built in 48 hours at SaaSathon 2 (University of Canterbury, 25–27 Sep 2026).

| Route | What |
|---|---|
| `/` | Landing page and pricing |
| `/floor` | Live plant floor: QR codes, simulator, replay of last week, AI insights |
| `/m/[machineId]` | Operator view (mobile, no login): report by photo, voice or text, then cited triage |
| `/work-orders` | Technician queue: assign, record root cause, close |
| `/qr` | Printable QR stickers |

## How the AI works
1. **Photo** (`gpt-4.1-mini`, vision): reads the error code and display text, e.g. `PRINTHEAD OPEN`.
2. **Voice:** live speech-to-text in the browser. Where that isn't supported, the recorded audio goes to `gpt-4o-mini-transcribe`.
3. **Retrieval:** the report is embedded with `text-embedding-3-small` and matched against that machine's manual chunks in Supabase pgvector. Chunks containing the exact error code are added too.
4. **Triage** (`gpt-4.1`, Structured Outputs):
   - uses only the retrieved excerpts
   - puts a safety step first
   - every step cites its page with a verbatim quote
   - steps citing pages that weren't retrieved are dropped
   - fixes previously confirmed on the same machine are included as plant notes
5. **Fallback:** if a machine has no manual, or the AI can't be reached, curated demo content is used, clearly labelled "Demo guidance".
6. **Insights:** `gpt-4.1-mini` summarises last week's history and today's faults into pattern cards.

Manuals loaded:
- `cnc-01`: Genmitsu 3018-PROVer (50 pages)
- `label-01`: Zebra ZD421/ZD621 (352 pages)

## Stack
- Next.js 16 (App Router), Tailwind v4, deployed on Vercel.
- Supabase:
  - Postgres with pgvector, and Storage for the manual PDFs
  - Row-level security is on for every table with no policies, so all access goes through server routes using the secret key.
- Live plant state is one versioned `plant_state` row, updated with optimistic concurrency. Every screen polls about once a second, and `lib/reducer.ts` holds all the state transitions.

## Local development
```bash
npm install
cp .env.example .env.local        # add OpenAI and Supabase values
npx supabase link --project-ref <ref>
npx supabase db push              # applies supabase/migrations
npm run ingest -- --machine cnc-01 --file manuals/cnc.pdf --title "Machine manual"
npm run dev -- -H 0.0.0.0         # phones on the same Wi-Fi can scan the QR codes
```
- Without Supabase configured, the app falls back to in-memory state.
- `OPENAI_BASE_URL` can point at an OpenAI-compatible gateway (e.g. OmniRoute) for local development.

## Deploy
```bash
npx vercel deploy --prod --yes
```
Production environment variables: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

Vendor manuals are not committed (`/manuals` is gitignored). They're stored privately in Supabase Storage.
