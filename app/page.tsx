import Link from "next/link";
import { Logo } from "@/components/ui";

export const metadata = {
  title: "FaultLine: the manual, on shift",
  description: "Scan the machine. Say what's wrong. Get the fix, straight from the manual, with the page to prove it.",
};

const STEPS = [
  { text: "Hit Unlock in Candle to clear the Alarm state.", page: 42 },
  { text: "Set the jog step to 10.", page: 42 },
  { text: "Jog away from the activated limit switch.", page: 42 },
  { text: "Run a homing cycle to restore position.", page: 42 },
];

function Chevron() {
  return (
    <svg viewBox="0 0 8 14" className="ml-1 inline size-[0.7em] -translate-y-px" aria-hidden>
      <path d="M1.5 1.5 6.5 7l-5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A quiet, device-like frame around a live-looking operator screen. */
function Phone() {
  return (
    <div className="relative mx-auto w-[300px] rounded-[52px] text-left bg-[#1d1d1f] p-[10px] shadow-float ring-1 ring-black/10 sm:w-[320px]">
      <div className="overflow-hidden rounded-[42px] bg-[#f5f5f7] text-[#1d1d1f]">
        <div className="flex items-center justify-between px-7 pb-1 pt-3.5 text-[13px] font-semibold">
          <span>2:04</span>
          <span className="h-[26px] w-[92px] rounded-full bg-[#1d1d1f]" aria-hidden />
          <span className="flex gap-1" aria-hidden>
            <span className="h-2.5 w-4 rounded-[3px] border border-[#1d1d1f]/70" />
          </span>
        </div>
        <div className="px-5 pb-6 pt-3">
          <div className="text-[13px] text-[#6e6e73]">Bay 2 · Genmitsu 3018</div>
          <div className="text-[28px] font-bold tracking-tight">CNC-01</div>
          <div className="mt-3 rounded-2xl bg-white p-3.5 text-[13px] leading-snug shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
            <div className="mb-1 text-[11px] font-semibold text-[#d70015]">Safety first</div>
            Don&apos;t force the gantry by hand. Jog it off the switch.
          </div>
          <div className="mt-2.5 divide-y divide-[#e3e3e8] overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
            {STEPS.map((s, i) => (
              <div key={s.text} className="flex items-start gap-3 px-3.5 py-3 text-[13px] leading-snug">
                <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#f5f5f7] text-[11px] font-semibold text-[#6e6e73]">{i + 1}</span>
                <span className="flex-1">{s.text}</span>
                <span className="shrink-0 text-[11px] font-medium text-[#0071e3]">p.{s.page}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-semibold">
            <span className="rounded-xl bg-[#0071e3] py-2.5 text-center text-white">Fixed</span>
            <span className="rounded-xl bg-white py-2.5 text-center text-[#0071e3]">Get a tech</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TILES: { title: string; body: string; span?: string }[] = [
  {
    title: "Grounded. Never guessed.",
    body: "Every step comes from the machine's own manual and links to the exact page and passage. If the manual doesn't cover it, FaultLine says so.",
    span: "md:col-span-2",
  },
  { title: "No app. No login.", body: "Operators scan the sticker on the machine. That's the whole onboarding." },
  { title: "Work orders that write themselves.", body: "Escalate once. The technician gets the photo, what's been tried, the likely cause and the parts to bring." },
  {
    title: "Knowledge that stays.",
    body: "Every confirmed fix becomes a note FaultLine uses next time. When your best fitter leaves, their fixes don't.",
    span: "md:col-span-2",
  },
];

const PLANS = [
  { name: "Starter", price: "Free", note: "Up to 3 machines", items: ["Manual-grounded fixes", "Work orders", "Live floor"] },
  { name: "Plant", price: "$19", note: "per machine, per month", items: ["Everything in Starter", "Pattern insights", "Knowledge capture", "Alerts"], featured: true },
  { name: "Multi-site", price: "Let's talk", note: "For groups of plants", items: ["Everything in Plant", "Sensor and PLC bridge", "Single sign-on"] },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-panel">
      <header className="glass sticky top-0 z-40 border-b border-line/60">
        <div className="mx-auto flex h-12 max-w-[980px] items-center gap-6 px-5">
          <Logo />
          <nav className="ml-auto flex items-center gap-6 text-[13px] text-muted">
            <a href="#how" className="hidden transition-colors hover:text-text sm:block">How it works</a>
            <a href="#pricing" className="hidden transition-colors hover:text-text sm:block">Pricing</a>
            <Link href="/floor" className="rounded-full bg-accent px-3.5 py-1 font-medium text-white transition-opacity hover:opacity-90">
              Try the demo
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="overflow-hidden px-5 pb-20 pt-16 text-center sm:pt-24">
          <p className="fade-in text-[17px] font-semibold text-muted">FaultLine</p>
          <h1 className="fade-in mx-auto mt-2 max-w-[820px] text-[44px] font-semibold leading-[1.05] sm:text-[72px]" style={{ animationDelay: "60ms" }}>
            The manual, on&nbsp;shift.
          </h1>
          <p className="fade-in mx-auto mt-5 max-w-[560px] text-[19px] leading-relaxed text-muted sm:text-[21px]" style={{ animationDelay: "120ms" }}>
            Scan the machine. Say what&apos;s wrong. Get the fix, straight from the manual, with the page to prove it.
          </p>
          <div className="fade-in mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[17px]" style={{ animationDelay: "180ms" }}>
            <Link href="/floor" className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90">
              Open the live floor
            </Link>
            <Link href="/m/cnc-01" className="font-medium text-accent hover:underline">
              Try it on your phone
              <Chevron />
            </Link>
          </div>
          <div className="fade-in mt-16" style={{ animationDelay: "260ms" }}>
            <Phone />
          </div>
        </section>

        {/* Numbers */}
        <section className="border-y border-line bg-bg px-5 py-16">
          <dl className="mx-auto grid max-w-[980px] gap-10 text-center sm:grid-cols-3">
            {[
              ["5 s", "from scan to fix steps"],
              ["Every step", "cites its page in the manual"],
              ["0", "forms for operators to fill in"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-[40px] font-semibold tracking-tight sm:text-[48px]">{n}</dt>
                <dd className="mt-1 text-[17px] text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section id="how" className="px-5 py-24">
          <div className="mx-auto max-w-[980px]">
            <h2 className="max-w-[640px] text-[36px] font-semibold leading-tight sm:text-[48px]">
              2am. One operator. <span className="text-muted">A 200&#8209;page&nbsp;PDF.</span>
            </h2>
            <p className="mt-5 max-w-[620px] text-[19px] leading-relaxed text-muted">
              Small plants run on one fitter, if they&apos;re lucky. When a machine stops on night shift, the fix is usually in the manual. Nobody has time to find it.
            </p>
            <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-3">
              {[
                ["Scan", "Every machine gets a QR sticker. Point a phone at it, with no app to install."],
                ["Tell it", "Photograph the error screen, say what's happening, or type it. FaultLine reads the code off the display."],
                ["Fix it", "A safety step first, then the fix, pulled from that machine's own manual. Tap any step to see the page."],
              ].map(([t, b], i) => (
                <li key={t}>
                  <div className="font-display text-[15px] font-semibold text-accent">Step {i + 1}</div>
                  <h3 className="mt-2 text-[24px] font-semibold">{t}</h3>
                  <p className="mt-2 text-[17px] leading-relaxed text-muted">{b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Bento */}
        <section className="bg-bg px-5 py-24">
          <div className="mx-auto max-w-[980px]">
            <h2 className="text-[36px] font-semibold leading-tight sm:text-[48px]">Made for the plant floor.</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {TILES.map((t) => (
                <article key={t.title} className={`rounded-[28px] bg-panel p-8 shadow-card sm:p-10 ${t.span ?? ""}`}>
                  <h3 className="text-[24px] font-semibold leading-snug">{t.title}</h3>
                  <p className="mt-3 text-[17px] leading-relaxed text-muted">{t.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Dark statement */}
        <section className="bg-[#000] px-5 py-28 text-center text-[#f5f5f7]">
          <h2 className="mx-auto max-w-[760px] text-[36px] font-semibold leading-tight sm:text-[56px]">
            &ldquo;CNC-01 has hit its Y limit four times this week. All on night shift.&rdquo;
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[19px] leading-relaxed text-[#a1a1a6]">
            FaultLine spots repeat faults across the week and names the root fix, so the same alarm stops coming back.
          </p>
          <Link href="/floor" className="mt-8 inline-block text-[17px] font-medium text-[#2997ff] hover:underline">
            Watch last week replay on the live floor
            <Chevron />
          </Link>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-5 py-24">
          <div className="mx-auto max-w-[980px]">
            <h2 className="text-center text-[36px] font-semibold sm:text-[48px]">Simple pricing.</h2>
            <p className="mt-3 text-center text-[19px] text-muted">One avoided hour of downtime usually pays for a year. NZD, excl. GST.</p>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <div key={p.name} className={`flex flex-col rounded-[28px] p-8 ${p.featured ? "bg-bg ring-2 ring-accent" : "bg-bg"}`}>
                  <div className="text-[17px] font-semibold">{p.name}</div>
                  <div className="mt-4 font-display text-[40px] font-semibold tracking-tight">{p.price}</div>
                  <div className="text-[14px] text-muted">{p.note}</div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[15px]">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2.5">
                        <svg viewBox="0 0 16 16" className="mt-1 size-3.5 shrink-0 text-accent" aria-hidden>
                          <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/floor"
                    className={`mt-8 rounded-full py-2.5 text-center text-[15px] font-medium transition-opacity hover:opacity-90 ${p.featured ? "bg-accent text-white" : "bg-panel text-accent"}`}
                  >
                    {p.featured ? "Try the demo" : "Get started"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-bg px-5 py-8 text-[12px] text-muted">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-3">
          <span>Built in 48 hours at SaaSathon 2, University of Canterbury.</span>
          <span>Demo plant: Kauri Timber Co., Christchurch.</span>
        </div>
      </footer>
    </div>
  );
}
