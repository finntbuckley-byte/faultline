import type { FaultCard, Machine } from "./types";

/**
 * Demo plant. Positions are tile centres on a 1000 x 600 floor.
 * Manual titles are placeholders until the real PDFs are loaded.
 */
export const MACHINES: Machine[] = [
  { id: "saw-01", name: "Saw-01", model: "Bandsaw headrig", kind: "saw", location: "Bay 1", manual: "Headrig Bandsaw Operator Manual", x: 110, y: 200, status: "running" },
  { id: "infeed", name: "Infeed", model: "Belt conveyor + VFD", kind: "conveyor", location: "Bay 1", manual: "Conveyor Drive (VFD) Manual", x: 300, y: 200, status: "running" },
  { id: "cnc-01", name: "CNC-01", model: "Genmitsu 3018-PROVer CNC router", kind: "cnc", location: "Bay 2", manual: "Genmitsu 3018-PROVer User Manual", x: 490, y: 200, status: "running" },
  { id: "label-01", name: "Label-01", model: "Zebra ZD421 label printer", kind: "printer", location: "Bay 3", manual: "Zebra ZD421/ZD621 User Guide", x: 680, y: 200, status: "running" },
  { id: "packing", name: "Packing", model: "Strapping station", kind: "packing", location: "Dispatch", manual: "Strapping Machine Manual", x: 880, y: 200, status: "running" },
  { id: "compressor", name: "Compressor", model: "Rotary screw, 11 kW", kind: "compressor", location: "Plant room", manual: "Rotary Screw Compressor Manual", x: 230, y: 460, status: "running" },
  { id: "dust", name: "Dust extractor", model: "Bag filter, 7.5 kW", kind: "extractor", location: "Plant room", manual: "Dust Extraction System Manual", x: 520, y: 460, status: "running" },
];

/** Line order for the animated product flow. */
export const LINE = ["saw-01", "infeed", "cnc-01", "label-01", "packing"];

export const FAULT_CARDS: FaultCard[] = [
  {
    id: "cnc-hard-limit",
    machineId: "cnc-01",
    label: "Y-axis hard limit",
    code: "ALARM:1",
    symptom: "Controller in Alarm state after the gantry hit a limit switch mid-cut",
    keywords: ["alarm", "limit", "alarm:1", "stopped", "gantry", "end"],
    triage: {
      summary: "Hard limit triggered: an axis reached its end-stop switch and the controller halted motion.",
      likelyCause: "Y-axis limit switch activated. Recurring pattern suggests a loose or damaged switch wire.",
      severity: "operator_fixable",
      safetyFirst: "Press the E-stop and keep hands clear of the gantry until the alarm is cleared.",
      steps: [
        { text: "Check the Y-axis travel for an obstruction or offcut jammed against the end stop.", page: 42, quote: "Remove any material or debris from the axis travel before resetting a hard-limit alarm." },
        { text: "Unlock the alarm, then jog the Y-axis away from the switch at low speed.", page: 43, quote: "After an alarm, use the unlock command and jog the axis off the limit switch before homing." },
        { text: "Inspect the Y limit switch and its connector for a loose wire.", page: 58, quote: "Intermittent limit alarms are commonly caused by loose switch wiring or a damaged connector." },
        { text: "Re-home the machine before restarting the job.", page: 44, quote: "Always perform a homing cycle after a limit alarm to restore machine coordinates." },
      ],
      parts: ["Limit switch (NC, roller)", "2-pin connector"],
    },
  },
  {
    id: "label-head-open",
    machineId: "label-01",
    label: "Print head open",
    code: "PRINTHEAD OPEN",
    symptom: "Printer status light red, display says printhead open, labels not printing",
    keywords: ["head", "open", "label", "print", "red", "flashing"],
    triage: {
      summary: "The printer has detected an open print head and paused printing.",
      likelyCause: "Print head latch not fully closed after a media change.",
      severity: "operator_fixable",
      safetyFirst: "The print head may be hot. Let it cool before touching it.",
      steps: [
        { text: "Open the cover and check the media is threaded under the guides.", page: 17, quote: "Ensure media passes under both media guides before closing the print head." },
        { text: "Press down on the print head until both sides click shut.", page: 18, quote: "Push the print head closed until it latches on both sides." },
        { text: "Press FEED once to calibrate, then resume the batch.", page: 31, quote: "Press FEED to advance one label and confirm the sensor is calibrated." },
      ],
      parts: [],
    },
  },
  {
    id: "compressor-high-temp",
    machineId: "compressor",
    label: "High discharge temp",
    code: "E-HT",
    symptom: "Compressor tripped, display shows high temperature",
    keywords: ["compressor", "temp", "hot", "temperature", "tripped", "overheat"],
    triage: {
      summary: "Compressor shut down on high discharge temperature.",
      likelyCause: "Restricted cooling airflow: blocked cooler fins or intake filter (common in dusty plants).",
      severity: "needs_technician",
      safetyFirst: "Isolate and lock out the compressor and vent the system before opening any panels.",
      steps: [
        { text: "Check the cooler fins and intake grille for sawdust build-up.", page: 63, quote: "Inspect the oil cooler for dirt or dust accumulation; clean with compressed air from the fan side." },
        { text: "Check the intake air filter indicator and replace if red.", page: 61, quote: "Replace the intake filter element when the service indicator shows red." },
        { text: "Check the oil level in the sight glass with the unit stopped.", page: 59, quote: "The oil level should be visible in the sight glass when the unit is stopped and depressurised." },
      ],
      parts: ["Intake filter element", "Compressor oil 5 L"],
    },
  },
  {
    id: "infeed-belt-squeal",
    machineId: "infeed",
    label: "Belt squeal on start-up",
    symptom: "Belt squealing on start-up, slow to get going",
    keywords: ["belt", "squeal", "squealing", "noise", "slip", "slow", "conveyor"],
    triage: {
      summary: "Drive belt slipping under start-up load.",
      likelyCause: "Low belt tension or a start ramp that is too aggressive for the loaded conveyor.",
      severity: "operator_fixable",
      safetyFirst: "Lock out the conveyor drive before touching the belt or guards.",
      steps: [
        { text: "Check belt tension: deflection should be within spec at mid-span.", page: 24, quote: "Belt deflection at mid-span should be approximately 1/64 of the span length." },
        { text: "Check the belt and pulleys for glazing or oil contamination.", page: 25, quote: "Replace belts showing glazing, cracking or oil contamination." },
        { text: "Increase the drive acceleration time so the conveyor ramps up gently.", page: 88, quote: "Increase the ramp-up time if the motor stalls or slips during acceleration." },
      ],
      parts: ["Drive belt (spare)"],
    },
  },
  {
    id: "dust-filter-dp",
    machineId: "dust",
    label: "Filter pressure high",
    code: "ΔP HIGH",
    symptom: "Extraction weak, filter pressure alarm",
    keywords: ["dust", "extraction", "filter", "pressure", "suction", "weak"],
    triage: {
      summary: "Filter differential pressure is above the alarm limit, so extraction airflow is reduced.",
      likelyCause: "Filter bags blinded; pulse-cleaning cycle not running.",
      severity: "needs_technician",
      safetyFirst: "Stop machines that rely on extraction. Dust build-up is a fire and explosion risk.",
      steps: [
        { text: "Check the pulse-cleaning compressed air supply is on and at pressure.", page: 33, quote: "The pulse-jet cleaning system requires a stable compressed air supply at the specified pressure." },
        { text: "Run a manual cleaning cycle and watch the pressure drop.", page: 35, quote: "Initiate an offline cleaning cycle and confirm differential pressure returns to normal." },
        { text: "Empty the collection bin if full.", page: 12, quote: "An overfull collection bin will reduce filter performance." },
      ],
      parts: ["Filter bags (set)"],
    },
  },
  {
    id: "saw-blade-tracking",
    machineId: "saw-01",
    label: "Blade wandering",
    symptom: "Cut wandering, blade running off the wheel crown",
    keywords: ["blade", "saw", "wander", "tracking", "cut", "wavy"],
    triage: {
      summary: "Blade tracking has drifted, so cut accuracy is degrading.",
      likelyCause: "Blade tension low or wheel tilt out of adjustment.",
      severity: "stop_now",
      safetyFirst: "Stop the saw and wait for the blade to come to a complete stop. Lock out before opening wheel covers.",
      steps: [
        { text: "Check the blade tension gauge against the spec for this blade width.", page: 21, quote: "Tension the blade to the value specified for its width before adjusting tracking." },
        { text: "Adjust the upper wheel tilt so the blade runs on the wheel crown.", page: 22, quote: "Adjust wheel tilt until the blade tracks at the centre of the wheel crown." },
        { text: "Inspect the blade for cracks at the gullets before restarting.", page: 27, quote: "Remove blades from service if cracks are found at the gullets." },
      ],
      parts: ["Spare blade"],
    },
  },
];

export const cardById = (id: string) => FAULT_CARDS.find((c) => c.id === id);
export const cardsForMachine = (machineId: string) => FAULT_CARDS.filter((c) => c.machineId === machineId);

/** Simulated AI routing: choose the fault card that best matches the operator's words. */
export function matchCard(machineId: string, report: string): FaultCard | undefined {
  const cards = cardsForMachine(machineId);
  const words = report.toLowerCase();
  let best = cards[0];
  let bestScore = -1;
  for (const card of cards) {
    const score = card.keywords.filter((k) => words.includes(k)).length + (card.code && words.includes(card.code.toLowerCase()) ? 3 : 0);
    if (score > bestScore) {
      best = card;
      bestScore = score;
    }
  }
  return best;
}

/** Seeded week of history for the replay and the insight card. */
export interface HistoryEvent {
  /** Hours from the start of the week (0-168). */
  hour: number;
  machineId: string;
  label: string;
  durationHours: number;
  night: boolean;
}

export const WEEK_HISTORY: HistoryEvent[] = [
  { hour: 3, machineId: "cnc-01", label: "Y-axis hard limit", durationHours: 1.5, night: true },
  { hour: 9, machineId: "label-01", label: "Media out", durationHours: 0.3, night: false },
  { hour: 14, machineId: "infeed", label: "Belt squeal", durationHours: 0.8, night: false },
  { hour: 22, machineId: "dust", label: "Filter pressure high", durationHours: 2, night: true },
  { hour: 27, machineId: "cnc-01", label: "Y-axis hard limit", durationHours: 1.2, night: true },
  { hour: 35, machineId: "saw-01", label: "Blade wandering", durationHours: 2.5, night: false },
  { hour: 40, machineId: "label-01", label: "Print head open", durationHours: 0.2, night: false },
  { hour: 50, machineId: "cnc-01", label: "Y-axis hard limit", durationHours: 1.8, night: true },
  { hour: 61, machineId: "compressor", label: "High discharge temp", durationHours: 3, night: false },
  { hour: 70, machineId: "packing", label: "Strap jam", durationHours: 0.5, night: true },
  { hour: 84, machineId: "infeed", label: "Drive overcurrent", durationHours: 1, night: false },
  { hour: 98, machineId: "cnc-01", label: "Y-axis hard limit", durationHours: 1.4, night: true },
  { hour: 110, machineId: "label-01", label: "Ribbon out", durationHours: 0.3, night: false },
  { hour: 121, machineId: "dust", label: "Filter pressure high", durationHours: 1.5, night: false },
  { hour: 133, machineId: "saw-01", label: "Blade wandering", durationHours: 2, night: false },
  { hour: 146, machineId: "packing", label: "Strap jam", durationHours: 0.4, night: false },
  { hour: 158, machineId: "compressor", label: "High discharge temp", durationHours: 2, night: true },
];

export const INSIGHTS = [
  {
    machineId: "cnc-01",
    title: "CNC-01: 4 Y-axis limit alarms this week",
    evidence: "All four happened on night shift, each cleared by re-homing. 5.9 h of downtime in total.",
    recommendation: "Replace the Y limit-switch connector and re-terminate the wire (manual p.58). Estimated saving: ~6 h downtime a week.",
  },
  {
    machineId: "compressor",
    title: "Compressor overheating twice, both after dusty shifts",
    evidence: "High discharge temp at hour 61 and hour 158; fins were blocked with sawdust both times.",
    recommendation: "Add a weekly cooler blow-out to the dust-extractor maintenance round (manual p.63).",
  },
];
