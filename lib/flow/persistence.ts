import { DEFAULT_GRACE, LEAN_ORDER, LEGACY_KEY, SPEECH_TEMPLATE, STATUS_ORDER, STORAGE_KEY, WEIGHT_ORDER } from "./constants";
import { makeNode, makeSpeeches, other, uid } from "./helpers";
import { sideForDepth } from "./tree";
import type { AnalysisNode, Argument, Clash, Lean, Side, Speech, Status, Weight } from "./types";

export type Persisted = {
  version: 3;
  motion: string;
  govTeam: string;
  oppTeam: string;
  roundLabel: string;
  grace: number;
  speeches: Speech[];
  current: number;
  argumentsList: Argument[];
  clashes: Clash[];
  notes: string;
};

export const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

// Older rounds kept a notepad per speech; stitch them into the shared one
// in speaking order so nothing is lost.
export const reviveNotes = (raw: unknown): string => {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";
  const bySpeech = raw as Record<string, unknown>;
  const order = [
    ...SPEECH_TEMPLATE.map((speech) => speech.key),
    ...Object.keys(bySpeech).filter((key) => !SPEECH_TEMPLATE.some((speech) => speech.key === key)),
  ];
  return order
    .map((key) => [key, asString(bySpeech[key]).trim()] as const)
    .filter(([, text]) => text)
    .map(([key, text]) => `${key}: ${text}`)
    .join("\n\n");
};

export const reviveNodes = (raw: unknown, argSide: Side, speech: string, depth: number): AnalysisNode[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return makeNode(sideForDepth(argSide, depth), speech, item);
    const node = item as Partial<AnalysisNode>;
    return {
      id: asString(node.id) || uid(),
      text: asString(node.text),
      side: node.side === "GOV" || node.side === "OPP" ? node.side : sideForDepth(argSide, depth),
      speech: asString(node.speech, speech),
      replies: reviveNodes(node.replies, argSide, speech, depth + 1),
    };
  });
};

export const reviveArgument = (raw: unknown): Argument => {
  const item = (raw ?? {}) as Record<string, unknown>;
  const legacySide = item.side === "CON" || item.side === "OPP" ? "OPP" : "GOV";
  const speech = asString(item.speech) || asString(item.speechType) || "PMC";
  const status: Status = STATUS_ORDER.includes(item.status as Status)
    ? (item.status as Status)
    : item.answered
      ? "answered"
      : "open";
  const analysis = reviveNodes(item.analysis, legacySide, speech, 0);
  // Legacy rounds kept responses in a flat array; fold them into the clash tree.
  const legacyResponses = Array.isArray(item.responses) ? (item.responses as unknown[]) : [];
  legacyResponses.forEach((response) => {
    const text = asString(response);
    if (!text) return;
    const target = analysis[analysis.length - 1];
    const node = makeNode(other(legacySide), speech, text);
    if (target) target.replies.push(node);
    else analysis.push(node);
  });
  return {
    id: asString(item.id) || uid(),
    side: legacySide,
    speech,
    title: asString(item.title, "Untitled argument"),
    status,
    starred: item.starred === true,
    collapsed: item.collapsed === true,
    analysis,
    examples: Array.isArray(item.examples) ? (item.examples as unknown[]).map((l) => asString(l)) : [],
  };
};

export const reviveClash = (raw: unknown): Clash => {
  const item = (raw ?? {}) as Record<string, unknown>;
  const speech = asString(item.speech) || "PMC";
  const lean: Lean = LEAN_ORDER.includes(item.lean as Lean) ? (item.lean as Lean) : "even";
  const weight: Weight = WEIGHT_ORDER.includes(item.weight as Weight)
    ? (item.weight as Weight)
    : "medium";
  // Roots keep whatever side they were tagged with; only missing tags fall back.
  const analysis = reviveNodes(item.analysis, lean === "OPP" ? "OPP" : "GOV", speech, 0);
  return {
    id: asString(item.id) || uid(),
    title: asString(item.title, "Untitled clash"),
    lean,
    weight,
    starred: item.starred === true,
    collapsed: item.collapsed === true,
    speech,
    weighing: asString(item.weighing),
    analysis,
    examples: Array.isArray(item.examples) ? (item.examples as unknown[]).map((l) => asString(l)) : [],
  };
};

export const reviveSpeeches = (raw: unknown): Speech[] => {
  const base = makeSpeeches();
  if (!Array.isArray(raw)) return base;
  return base.map((speech) => {
    const stored = (raw as unknown[]).find(
      (item) => (item as Speech)?.key === speech.key,
    ) as Partial<Speech> | undefined;
    if (!stored) return speech;
    return {
      ...speech,
      duration: typeof stored.duration === "number" ? Math.max(30, stored.duration) : speech.duration,
      elapsed: typeof stored.elapsed === "number" ? Math.max(0, stored.elapsed) : 0,
      startedAt: undefined,
      speaker: asString(stored.speaker, speech.speaker),
    };
  });
};

export const readStored = (): Partial<Persisted> | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const argsRaw = Array.isArray(data.argumentsList)
      ? data.argumentsList
      : Array.isArray(data.arguments)
        ? data.arguments
        : [];
    const notes = reviveNotes(data.notes ?? data.note);
    return {
      motion: asString(data.motion),
      govTeam: asString(data.govTeam) || asString(data.proTeam),
      oppTeam: asString(data.oppTeam) || asString(data.conTeam),
      roundLabel: asString(data.roundLabel),
      grace: typeof data.grace === "number" ? data.grace : DEFAULT_GRACE,
      speeches: reviveSpeeches(data.speeches),
      current: typeof data.current === "number" ? Math.min(Math.max(0, data.current), 5) : 0,
      argumentsList: (argsRaw as unknown[]).map(reviveArgument),
      clashes: Array.isArray(data.clashes) ? (data.clashes as unknown[]).map(reviveClash) : [],
      notes,
    };
  } catch {
    return null;
  }
};
