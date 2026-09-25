# FaultLine: visual simulator

> Every manual becomes a technician on shift.

A base visual demo for SaaSathon 2. It has:
- a live, animated plant floor
- a phone-first operator flow reached by QR code
- technician work orders
- a fault simulator, and a "last week" replay that ends in AI insight cards

## Run it
```bash
npm install
npm run dev -- -H 0.0.0.0     # listen on your network so phones can connect
```
- On the projector, open `http://localhost:3000`.
- Phones on the same Wi-Fi or hotspot open `http://<your-laptop-IP>:3000`. The on-screen QR codes use the address the floor page was opened with, so open the floor via your LAN IP (not `localhost`) for the codes to work from phones.

## Demo flow
1. Click **Simulator**, then **CNC-01 · Y-axis hard limit**. The tile goes amber and the conveyors either side stop.
2. Click **Show QR codes**. A judge scans CNC-01's code and taps **Report ALARM:1**. The triage appears with a safety step and cited manual pages; tap **Manual p.42** to show the page.
3. Tick steps, then tap **Resolved** (the tile goes green) or **Escalate** (the tile goes blue and a work order appears at `/work-orders`).
4. On `/work-orders`, assign a technician, type a root cause, and close it.
5. Click **Replay last week**: 7 days replay in 30 seconds, then the insight cards appear.

## How it's built
- Next.js (App Router) + Tailwind.
- State lives in `app/api/state` (in memory, one server process), and the pure state logic in `lib/reducer.ts`. Every screen polls about once a second.
- `lib/data.ts` holds the demo plant, fault cards, triage content, the seeded week and the insights.
- **What's simulated:**
  - The AI: `matchCard` routes the operator's words to a fault card.
  - The manual pages (`components/ManualSheet.tsx`).
  - The shared state.
- **Next steps (see the build spec):**
  1. Replace the in-memory store with Supabase realtime.
  2. Replace `matchCard` with `/api/report`: embeddings over the real manual PDFs, plus Structured Outputs.
  3. Render real PDF pages with react-pdf.

> On Vercel, the in-memory store isn't shared between server instances. For the live demo, run it on the laptop or finish the Supabase swap.
