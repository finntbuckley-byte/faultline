import Link from "next/link";
import { Logo } from "@/components/ui";

const STEPS = [
  {
    n: "1",
    title: "Scan the machine",
    body: "Every machine gets a QR sticker. The operator scans it with their phone. No app and no login.",
  },
  {
    n: "2",
    title: "Say or snap the fault",
    body: "Photograph the error screen, say what's happening, or type it. FaultLine reads the code off the display.",
  },
  {
    n: "3",
    title: "Fix it from the manual",
    body: "Safety step first, then fix steps pulled from that machine's own manual, each citing the page it came from.",
  },
];

const FEATURES = [
  ["Grounded, never guessed", "Every step cites the page and passage it came from. If the manual doesn't cover the fault, FaultLine says so and escalates."],
  ["Work orders that write themselves", "Escalate in one tap. The technician gets the symptom, photo, what was already tried, the likely cause and the parts to bring."],
  ["A live floor", "Every machine on one screen, green to red in real time. Put it on the smoko-room TV."],
  ["Knowledge that stays", "Every confirmed fix becomes a plant note that future triage uses. When your best fitter leaves, their fixes don't."],
  ["Patterns you'd miss", "“CNC-01: 4 limit alarms this week, all night shift.” FaultLine spots repeat faults and tells you the root fix."],
  ["Minutes to set up", "Upload the PDF manuals you already have and print the QR sheet. That's it."],
];

const PLANS = [
  { name: "Starter", price: "Free", unit: "", body: "Up to 3 machines, 1 site. Full triage and work orders.", cta: "Start free" },
  { name: "Plant", price: "$19", unit: "per machine / month", body: "Unlimited users, insights, knowledge capture, alerts.", cta: "Try the demo", featured: true },
  { name: "Multi-site", price: "Talk to us", unit: "", body: "Several plants, sensor/PLC bridge, SSO and custom retention.", cta: "Contact" },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <a href="#how" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-text sm:block">How it works</a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-text sm:block">Pricing</a>
          <Link href="/floor" className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-black">
            Open live demo
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="mb-4 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              AI maintenance for small plants
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Every manual becomes a technician on shift.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              When a machine faults at 2am, the operator is alone with a 200-page PDF. FaultLine turns that manual into safety-first fix steps
              in seconds, and turns every fault into a work order and a record your plant learns from.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/floor" className="rounded-xl bg-accent px-5 py-3 font-semibold text-black">
                See the live floor
              </Link>
              <Link href="/m/cnc-01" className="rounded-xl border border-line px-5 py-3 font-semibold hover:border-muted">
                Try the operator view
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Demo plant: Kauri Timber Co., Christchurch. Real manuals, real AI.</p>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>CNC-01 · Operator</span>
              <span className="rounded-full bg-warn/15 px-2 py-0.5 font-semibold text-warn">Fault reported</span>
            </div>
            <div className="rounded-xl border-2 border-bad/60 bg-bad/10 p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-bad">Safety first</div>
              Don&apos;t force the gantry by hand. Use the jog controls to move off the limit switch.
            </div>
            <ol className="mt-3 grid gap-2 text-sm">
              {["Hit Unlock in Candle to clear the Alarm state.", "Set the jog step to 10.", "Jog away from the activated limit switch.", "Run a homing cycle to restore position."].map((t, i) => (
                <li key={t} className="flex items-start gap-3 rounded-lg border border-line bg-panel-2 p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg text-xs font-semibold">{i + 1}</span>
                  <span className="flex-1">{t}</span>
                  <span className="rounded-md border border-accent/50 px-1.5 text-xs text-accent">p.42</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how" className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-panel p-5">
                <div className="grid size-9 place-items-center rounded-lg bg-accent font-semibold text-black">{s.n}</div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold">Built for the plant floor</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold">Pricing</h2>
          <p className="mt-1 text-muted">One avoided hour of downtime usually pays for a year. Prices in NZD, excl. GST.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`flex flex-col rounded-2xl border p-5 ${p.featured ? "border-accent bg-accent/5" : "border-line bg-panel"}`}>
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-3 text-3xl font-semibold">{p.price}</div>
                <div className="h-5 text-sm text-muted">{p.unit}</div>
                <p className="mt-3 flex-1 text-sm text-muted">{p.body}</p>
                <Link href="/floor" className={`mt-5 rounded-xl py-2.5 text-center font-semibold ${p.featured ? "bg-accent text-black" : "border border-line"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <span>Built in 48 hours at SaaSathon 2, University of Canterbury.</span>
        </div>
      </footer>
    </div>
  );
}
