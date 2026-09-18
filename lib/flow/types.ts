export type Side = "GOV" | "OPP";
export type Status = "open" | "answered" | "dropped" | "turned";

export type Speech = {
  key: string;
  role: string;
  side: Side;
  duration: number;
  /** Whether points of information may be offered during this speech. */
  poi: boolean;
  elapsed: number;
  startedAt?: number;
  speaker: string;
};

export type AnalysisNode = {
  id: string;
  text: string;
  side: Side;
  speech: string;
  replies: AnalysisNode[];
};

export type Argument = {
  id: string;
  side: Side;
  speech: string;
  title: string;
  status: Status;
  starred: boolean;
  collapsed: boolean;
  analysis: AnalysisNode[];
  examples: string[];
};

/** Who is ahead on a clash right now. */
export type Lean = "GOV" | "OPP" | "even";
/** How much of the round rides on a clash. */
export type Weight = "high" | "medium" | "low";

export type Clash = {
  id: string;
  title: string;
  lean: Lean;
  weight: Weight;
  starred: boolean;
  collapsed: boolean;
  /** Speech the clash was first written down in. */
  speech: string;
  /** The comparative — why this side wins it and why it outweighs the rest. */
  weighing: string;
  analysis: AnalysisNode[];
  examples: string[];
};

export type Poi = {
  id: string;
  status: "accepted" | "declined";
  text: string;
  speech: string;
  at: number;
};

export type Theme = "dark" | "light";
export type Filter = "all" | "open" | "answered" | "dropped" | "turned" | "starred";

/** Argument counts for one side, by status. */
export type SideTally = Record<Status, number> & { total: number; starred: number };

/** How many clashes each side is ahead on, plus how many are voters. */
export type ClashTally = Record<Lean, number> & { key: number };
