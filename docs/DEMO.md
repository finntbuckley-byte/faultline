# Demo run sheet: 5 min pitch + 3 min Q&A

## Before you go on (10 min before)
- **Laptop 1 (projector):** open https://faultline-ashy.vercel.app/floor, go full screen, then Simulator → **Reset floor**. Turn **Show QR codes** on.
- **Laptop 2 or a teammate's phone:** open `/work-orders` (the "technician").
- **Judge phone:** a spare phone with the camera ready. Wi-Fi or a hotspot tested.
- **Printed material:** the QR sheet (`/qr`), plus a printed or on-screen photo of each error display (below).
- **Warm-up:** run one report on `/m/cnc-01` so the servers are warm, then **Reset floor**.

## The two real faults (both answered from the real manuals)
| Machine | How to trigger | What to report | Expected answer |
|---|---|---|---|
| **CNC-01** (Genmitsu 3018-PROVer) | Simulator → *CNC-01 · Y-axis hard limit* | Tap **Report ALARM:1**, or say "stopped mid-cut, Candle says Alarm, gantry is against the end" | Unlock in Candle → jog step 10 → jog off the switch → re-home (p.42) |
| **Label-01** (Zebra ZD421) | Simulator → *Label-01 · Print head open* | Photo of a display showing **PRINTHEAD OPEN**, or say "red light, says printhead open" | Let the printhead cool (p.56) → close the cover until the latches snap (p.274) → call a technician if it persists |

The other machines (saw, conveyor, compressor, dust extractor) show **"Demo guidance"** because no manual is loaded for them. Use them only for the escalation beat.

## Script
1. **0:00 Hook.** The floor is all green. "Christchurch timber plant, 2am. One operator. The CNC just stopped. The manual's a 50-page PDF."
2. **0:30 Problem and customer.** Small NZ manufacturers have one fitter, if any. Downtime costs hundreds of dollars an hour, and the knowledge lives in people's heads.
3. **0:50 Live fault.** Inject the CNC fault. The tile turns amber and the conveyors either side stop.
4. **1:00 Operator.** Hand the judge a phone. They scan CNC-01's QR and tap **Report ALARM:1**. About 5 s later: safety step, then 4 steps, each tagged **p.42**. Tap p.42 to show the real manual page with the passage highlighted.
5. **2:00 Fix.** The judge ticks the steps and taps **Resolved**. The tile goes green.
6. **2:20 Photo.** On Label-01, photograph the printhead-open screen. FaultLine reads the code off the photo and answers from the 352-page Zebra guide.
7. **3:00 Escalate.** Inject the compressor fault and tap **Escalate**. The work order appears on laptop 2, pre-filled with what was already tried. Assign Sam.
8. **3:30 Replay.** **Replay last week**: 7 days in 30 s. The AI insight cards land: "CNC-01 Y-axis limit faults repeat nightly, 5.9 h downtime".
9. **4:10 Business.** $19 per machine per month; one avoided hour of downtime pays for a year. Customers come back because every fault makes the history more valuable. Why now: AI can finally read the manuals.
10. **4:40 Close.** "Every manual becomes a technician on shift."

## Q&A prep
- **"MaintainX / UpKeep already exist."** Those are logbooks operators have to type into. FaultLine does the diagnosis, from the machine's own manual, with no data entry.
- **"What if the AI is wrong?"**
  - It only uses retrieved manual text, and every step cites a page.
  - Steps pointing at pages it didn't retrieve are dropped.
  - Safety comes first, and escalation is one tap away.
  - When the manual doesn't cover the fault, it says so.
- **"How long to set up?"** Upload the PDF manuals you already have and print the QR sheet. The Zebra guide (352 pages) was indexed in under a minute.
- **"Data and privacy?"** Each plant's manuals and faults are private. The database locks out public access, and everything goes through the server.
- **"What's next?"**
  - maintenance schedules generated from the manuals' service intervals
  - parts in stock
  - SMS/Teams alerts
  - a PLC/sensor bridge so faults open automatically
