import { DEFAULT_SPEAKERS, SPEECH_TEMPLATE } from "./constants";
import type { AnalysisNode, Clash, Side, Speech } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export const pad = (value: number) => Math.floor(value).toString().padStart(2, "0");

export const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${pad(safe / 60)}:${pad(safe % 60)}`;
};

export const other = (side: Side): Side => (side === "GOV" ? "OPP" : "GOV");

export const sideName = (side: Side) => (side === "GOV" ? "Government" : "Opposition");

export const makeSpeeches = (): Speech[] =>
  SPEECH_TEMPLATE.map((speech) => ({
    ...speech,
    elapsed: 0,
    startedAt: undefined,
    speaker: DEFAULT_SPEAKERS[speech.key] ?? speech.key,
  }));

export const makeNode = (side: Side, speech: string, text = ""): AnalysisNode => ({
  id: uid(),
  text,
  side,
  speech,
  replies: [],
});

export const makeClash = (title: string, speech: string, side: Side): Clash => ({
  id: uid(),
  title,
  lean: "even",
  weight: "medium",
  starred: false,
  collapsed: false,
  speech,
  weighing: "",
  analysis: [makeNode(side, speech)],
  examples: [],
});
