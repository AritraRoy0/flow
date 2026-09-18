import type { Filter, Lean, Speech, Status, Weight } from "./types";

export const STORAGE_KEY = "flow-round-v2";
export const LEGACY_KEY = "flow-round";

export const SPEECH_TEMPLATE: Omit<Speech, "elapsed" | "startedAt" | "speaker">[] = [
  { key: "PMC", role: "Prime Minister Constructive", side: "GOV", duration: 7 * 60, poi: true },
  { key: "LOC", role: "Leader of Opposition Constructive", side: "OPP", duration: 8 * 60, poi: true },
  { key: "MG", role: "Member of Government", side: "GOV", duration: 8 * 60, poi: true },
  { key: "MO", role: "Member of Opposition", side: "OPP", duration: 8 * 60, poi: true },
  { key: "LOR", role: "Leader of Opposition Rebuttal", side: "OPP", duration: 4 * 60, poi: false },
  { key: "PMR", role: "Prime Minister Rebuttal", side: "GOV", duration: 5 * 60, poi: false },
];

export const DEFAULT_SPEAKERS: Record<string, string> = {
  PMC: "PM",
  LOC: "LO",
  MG: "MG",
  MO: "MO",
  LOR: "LO",
  PMR: "PM",
};

export const PROTECTED_TIME = 60;
export const DEFAULT_GRACE = 15;

export const STATUS_META: Record<Status, { label: string; hint: string }> = {
  open: { label: "Open", hint: "Still live — nobody has answered this yet" },
  answered: { label: "Answered", hint: "The other side has responded to this" },
  dropped: { label: "Dropped", hint: "Conceded — the other side never touched it" },
  turned: { label: "Turned", hint: "The other side turned this back on them" },
};

export const STATUS_ORDER: Status[] = ["open", "answered", "dropped", "turned"];

export const LEAN_META: Record<Lean, { label: string; short: string; hint: string }> = {
  GOV: { label: "GOV ahead", short: "GOV", hint: "Government is winning this clash" },
  even: { label: "Too close", short: "EVEN", hint: "Neither side has broken this open yet" },
  OPP: { label: "OPP ahead", short: "OPP", hint: "Opposition is winning this clash" },
};

export const LEAN_ORDER: Lean[] = ["GOV", "even", "OPP"];

export const WEIGHT_META: Record<Weight, { label: string; hint: string }> = {
  high: { label: "Round-winning", hint: "Whoever takes this clash takes the round" },
  medium: { label: "Contributory", hint: "Matters, but it will not decide the round alone" },
  low: { label: "Peripheral", hint: "Don't spend rebuttal time here" },
};

export const WEIGHT_ORDER: Weight[] = ["high", "medium", "low"];

export const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "dropped", label: "Dropped" },
  { key: "turned", label: "Turned" },
  { key: "starred", label: "Voters" },
];
