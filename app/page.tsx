"use client";

import {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Side = "GOV" | "OPP";
type Status = "open" | "answered" | "dropped" | "turned";

type Speech = {
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

type AnalysisNode = {
  id: string;
  text: string;
  side: Side;
  speech: string;
  replies: AnalysisNode[];
};

type Argument = {
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

type Poi = {
  id: string;
  status: "accepted" | "declined";
  text: string;
  speech: string;
  at: number;
};

type Theme = "dark" | "light";
type Filter = "all" | "open" | "answered" | "dropped" | "turned" | "starred";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "flow-round-v2";
const LEGACY_KEY = "flow-round";

const SPEECH_TEMPLATE: Omit<Speech, "elapsed" | "startedAt" | "speaker">[] = [
  { key: "PMC", role: "Prime Minister Constructive", side: "GOV", duration: 7 * 60, poi: true },
  { key: "LOC", role: "Leader of Opposition Constructive", side: "OPP", duration: 8 * 60, poi: true },
  { key: "MG", role: "Member of Government", side: "GOV", duration: 8 * 60, poi: true },
  { key: "MO", role: "Member of Opposition", side: "OPP", duration: 8 * 60, poi: true },
  { key: "LOR", role: "Leader of Opposition Rebuttal", side: "OPP", duration: 4 * 60, poi: false },
  { key: "PMR", role: "Prime Minister Rebuttal", side: "GOV", duration: 5 * 60, poi: false },
];

const DEFAULT_SPEAKERS: Record<string, string> = {
  PMC: "PM",
  LOC: "LO",
  MG: "MG",
  MO: "MO",
  LOR: "LO",
  PMR: "PM",
};

const PROTECTED_TIME = 60;
const DEFAULT_GRACE = 15;

const STATUS_META: Record<Status, { label: string; hint: string }> = {
  open: { label: "Open", hint: "Still live — nobody has answered this yet" },
  answered: { label: "Answered", hint: "The other side has responded to this" },
  dropped: { label: "Dropped", hint: "Conceded — the other side never touched it" },
  turned: { label: "Turned", hint: "The other side turned this back on them" },
};

const STATUS_ORDER: Status[] = ["open", "answered", "dropped", "turned"];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "dropped", label: "Dropped" },
  { key: "turned", label: "Turned" },
  { key: "starred", label: "Voters" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const uid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const pad = (value: number) => Math.floor(value).toString().padStart(2, "0");

const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${pad(safe / 60)}:${pad(safe % 60)}`;
};

const other = (side: Side): Side => (side === "GOV" ? "OPP" : "GOV");

const sideName = (side: Side) => (side === "GOV" ? "Government" : "Opposition");

const makeSpeeches = (): Speech[] =>
  SPEECH_TEMPLATE.map((speech) => ({
    ...speech,
    elapsed: 0,
    startedAt: undefined,
    speaker: DEFAULT_SPEAKERS[speech.key] ?? speech.key,
  }));

const makeNode = (side: Side, speech: string, text = ""): AnalysisNode => ({
  id: uid(),
  text,
  side,
  speech,
  replies: [],
});

const sampleUBIDebate = (): { arguments: Argument[]; pois: Poi[]; notes: Record<string, string>; motion: string; govTeam: string; oppTeam: string; roundLabel: string } => ({
  motion: "THW Implement Universal Basic Income (UBI)",
  govTeam: "Affirm",
  oppTeam: "Negate",
  roundLabel: "UBI Sample Debate",
  arguments: [
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Framework: Stability and freedom are the evaluation criteria",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "We should evaluate policies by their ability to stabilize income and expand real freedom from coercion.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: Freedom isn't just absence of coercion, it requires resources and opportunity.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "Exactly — and UBI provides the baseline resources that enable opportunity.",
                  side: "GOV",
                  speech: "MG",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Contention 1: UBI eliminates welfare cliffs and poverty traps",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Current welfare creates benefit cliffs where taking a raise means losing support — making work economically irrational.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: People still respond to marginal incentives; they're not purely trapped.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "But when the marginal return is negative, rational actors avoid it. UBI makes every additional hour worked a strict gain.",
                  side: "GOV",
                  speech: "MG",
                  replies: [
                    {
                      id: uid(),
                      text: "Then work disincentives come from the cost of living, not the cliff.",
                      side: "OPP",
                      speech: "MO",
                      replies: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          text: "Admin burden of means-testing excludes those most in need — proof, paperwork, stable housing all required.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: But digitization makes admin easier now than before.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "Even digitized, it requires stable internet, literacy, mental bandwidth poverty strips away.",
                  side: "GOV",
                  speech: "MG",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [
        "Welfare cliff in US: earn $1 more, lose $3 in benefits",
        "60% of eligible UK families don't claim disability benefits due to application complexity",
        "Universal child allowance has 95%+ uptake vs. means-tested TANF at 26% uptake",
      ],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Contention 2: UBI is an automatic recession stabilizer",
      status: "open",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Recessions spiral when consumers cut spending → business layoffs → more consumers cut spending. UBI breaks the loop.",
          side: "GOV",
          speech: "PMC",
          replies: [],
        },
        {
          id: uid(),
          text: "Low-income households spend nearly 100% of marginal income, creating high multiplier. UBI targets exactly who spends most.",
          side: "GOV",
          speech: "PMC",
          replies: [],
        },
      ],
      examples: [
        "2008 tax rebates: each $1 rebate to low-income households generated $1.50-$2.00 in spending",
        "Finland UBI trial 2017-2018 showed improved well-being without employment reduction",
      ],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Disadvantage: Institutional failure — enforcement through broken systems",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI relies on IRS to distribute automatically, but IRS is underfunded and fails in crises.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: Actually, IRS already runs direct deposit tax refunds; UBI uses existing infrastructure.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "Existing systems also fail — stimulus checks in 2020 took months for homeless populations.",
                  side: "OPP",
                  speech: "MO",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Disadvantage: Inflation — too much money chasing finite goods",
      status: "turned",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI injects trillions into the economy; prices will spike especially in housing and essentials.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: UBI is redistribution, not new money. It transfers from high-MPC wealthy to high-MPC poor.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "But that still increases aggregate demand if funded by taxes (which have lag) or deficit spending.",
                  side: "OPP",
                  speech: "MO",
                  replies: [
                    {
                      id: uid(),
                      text: "Yet UBI stabilizes demand swings — status quo has sharp drops and spikes that worsen inflation dynamics.",
                      side: "GOV",
                      speech: "PMR",
                      replies: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Impact turn: UBI creates dependency and reduces autonomy",
      status: "answered",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Unconditional income support reduces the incentive to improve oneself or seek stable employment.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: Dependency emerges from instability, not support. UBI enables long-term planning and skill development.",
              side: "GOV",
              speech: "MG",
              replies: [],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "MG",
      title: "Extension: Labor market rebalancing (rising reservation wage)",
      status: "open",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI raises the minimum acceptable job quality — workers refuse exploitation, forcing employers to compete on wages/conditions.",
          side: "GOV",
          speech: "MG",
          replies: [],
        },
      ],
      examples: ["Post-pandemic wage growth in service industries shows workers reject low-wage roles when alternatives exist"],
    },
  ],
  pois: [
    {
      id: uid(),
      status: "accepted",
      text: "Don't means-tested systems already give more to those in need?",
      speech: "PMC",
      at: 120,
    },
    {
      id: uid(),
      status: "declined",
      text: "Is $1000/month enough to live on?",
      speech: "LOC",
      at: 240,
    },
    {
      id: uid(),
      status: "accepted",
      text: "How is UBI funded without massive tax increases?",
      speech: "MG",
      at: 380,
    },
  ],
  notes: {
    PMC: "Framework clash on stability+freedom vs. efficiency. Block their concern about cost by pointing to hidden existing costs (emergency services, incarceration, etc.). Lead with welfare cliffs.",
    LOC: "Their institutional failure arg is their best. Focus on IRS dysfunction and underfunding. Don't cede that UBI is simple delivery — maintenance burden matters.",
    MG: "They'll push inflation. Use multiplier econ: redistribution stabilizes demand. Also their dependency arg is backwards — instability causes dependency.",
    MO: "They'll extend inflation and maybe add labor shortage. Labor shortage is actually good — forces wage competition. Inflation needs continuous excess demand.",
    LOR: "Summary: Status quo has cliffs + volatility + hidden costs + dependency. UBI has one clear mechanism. Institutional concerns real but solvable.",
    PMR: "They chose patchwork over replacement. We chose coherent system over fragmented failure. Economic rationality is on our side.",
  },
});

const starterArguments = (): Argument[] => sampleUBIDebate().arguments;

/* -- tree operations ------------------------------------------------- */

const cloneNodes = (nodes: AnalysisNode[]): AnalysisNode[] =>
  nodes.map((node) => ({ ...node, replies: cloneNodes(node.replies) }));

const listAt = (tree: AnalysisNode[], path: number[]): AnalysisNode[] => {
  let list = tree;
  for (let index = 0; index < path.length - 1; index += 1) {
    list = list[path[index]].replies;
  }
  return list;
};

const sideForDepth = (argSide: Side, depth: number): Side =>
  depth % 2 === 0 ? argSide : other(argSide);

const retagSides = (nodes: AnalysisNode[], argSide: Side, depth: number): void => {
  nodes.forEach((node) => {
    node.side = sideForDepth(argSide, depth);
    retagSides(node.replies, argSide, depth + 1);
  });
};

const countNodes = (nodes: AnalysisNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countNodes(node.replies), 0);

const nodeMatches = (nodes: AnalysisNode[], needle: string): boolean =>
  nodes.some(
    (node) => node.text.toLowerCase().includes(needle) || nodeMatches(node.replies, needle),
  );

/* -- persistence ----------------------------------------------------- */

type Persisted = {
  version: 2;
  motion: string;
  govTeam: string;
  oppTeam: string;
  roundLabel: string;
  grace: number;
  speeches: Speech[];
  current: number;
  argumentsList: Argument[];
  pois: Poi[];
  notes: Record<string, string>;
};

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const reviveNodes = (raw: unknown, argSide: Side, speech: string, depth: number): AnalysisNode[] => {
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

const reviveArgument = (raw: unknown): Argument => {
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

const reviveSpeeches = (raw: unknown): Speech[] => {
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

const readStored = (): Partial<Persisted> | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const argsRaw = Array.isArray(data.argumentsList)
      ? data.argumentsList
      : Array.isArray(data.arguments)
        ? data.arguments
        : [];
    const notes =
      data.notes && typeof data.notes === "object"
        ? (data.notes as Record<string, string>)
        : typeof data.note === "string"
          ? { PMC: data.note }
          : {};
    return {
      motion: asString(data.motion),
      govTeam: asString(data.govTeam) || asString(data.proTeam),
      oppTeam: asString(data.oppTeam) || asString(data.conTeam),
      roundLabel: asString(data.roundLabel),
      grace: typeof data.grace === "number" ? data.grace : DEFAULT_GRACE,
      speeches: reviveSpeeches(data.speeches),
      current: typeof data.current === "number" ? Math.min(Math.max(0, data.current), 5) : 0,
      argumentsList: (argsRaw as unknown[]).map(reviveArgument),
      pois: Array.isArray(data.pois) ? (data.pois as Poi[]) : [],
      notes,
    };
  } catch {
    return null;
  }
};

/* -- export ---------------------------------------------------------- */

const nodesToText = (nodes: AnalysisNode[], depth: number): string =>
  nodes
    .map((node) => {
      const indent = "  ".repeat(depth);
      const head = `${indent}- [${node.side}${node.speech ? ` · ${node.speech}` : ""}] ${node.text || "—"}`;
      const kids = nodesToText(node.replies, depth + 1);
      return kids ? `${head}\n${kids}` : head;
    })
    .join("\n");

const buildExport = (state: {
  motion: string;
  govTeam: string;
  oppTeam: string;
  roundLabel: string;
  speeches: Speech[];
  argumentsList: Argument[];
  pois: Poi[];
  notes: Record<string, string>;
}) => {
  const lines: string[] = [];
  lines.push(`# ${state.motion || "Untitled motion"}`);
  lines.push("");
  lines.push(`**${state.roundLabel || "Round"}** — GOV: ${state.govTeam || "—"} · OPP: ${state.oppTeam || "—"}`);
  lines.push("");
  lines.push("## Speech times");
  state.speeches.forEach((speech) => {
    lines.push(
      `- **${speech.key}** (${speech.side}${speech.speaker ? `, ${speech.speaker}` : ""}) — ${formatClock(
        speech.elapsed,
      )} used of ${formatClock(speech.duration)}`,
    );
  });
  (["GOV", "OPP"] as Side[]).forEach((side) => {
    lines.push("");
    lines.push(`## ${sideName(side)}`);
    const owned = state.argumentsList.filter((argument) => argument.side === side);
    if (!owned.length) lines.push("_Nothing flowed._");
    owned.forEach((argument) => {
      lines.push("");
      lines.push(
        `### ${argument.starred ? "★ " : ""}${argument.title} — _${STATUS_META[argument.status].label}_ (${argument.speech})`,
      );
      const tree = nodesToText(argument.analysis, 0);
      if (tree) lines.push(tree);
      argument.examples.filter(Boolean).forEach((example) => lines.push(`  * eg. ${example}`));
    });
  });
  const notes = Object.entries(state.notes).filter(([, value]) => value.trim());
  if (notes.length) {
    lines.push("");
    lines.push("## Notes");
    notes.forEach(([key, value]) => lines.push(`- **${key}**: ${value.replace(/\n/g, " ")}`));
  }
  if (state.pois.length) {
    lines.push("");
    lines.push("## Points of information");
    state.pois.forEach((poi) =>
      lines.push(`- **${poi.speech}** — ${poi.status === "accepted" ? "Taken" : "Declined"}: ${poi.text}`),
    );
  }
  return lines.join("\n");
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
html body { background: #12201b; }
html[data-flow-theme="light"] body { background: #f7f3dc; }

/* globals.css sets overflow-x:hidden on html/body, which makes them scroll
   containers and breaks the sticky topbar and rails. \`clip\` clips the same
   way without creating one. The :root/child selectors out-specify it. */
html:root { overflow-x: clip; }
html:root > body { overflow-x: clip; }

.f-app {
  /* Legal Pad / Chalkboard: the two surfaces an actual debater flows a
     round on. Light mode is a ruled legal pad — blue ballpoint for
     Government, red ballpoint for Opposition, a highlighter mustard for
     warnings, a torn-page cream for cards. Dark mode is a chalkboard —
     the same two-pen logic redrawn in sky-blue and coral chalk. */
  --gov: #333333;
  --opp: #666666;
  --warn: #ff9900;
  --danger: #cc0000;
  --violet: #770077;

  --bg: #ffffff;
  --bg-grad: radial-gradient(1100px 560px at 10% -10%, #17281f 0%, transparent 60%),
             radial-gradient(900px 480px at 100% 0%, #142219 0%, transparent 55%), #12201b;
  --panel: #f5f5f5;
  --panel-2: #eeeeee;
  --raised: #e8e8e8;
  --line: #cccccc;
  --line-soft: #dddddd;
  --text: #000000;
  --dim: #555555;
  --faint: #999999;
  --primary: #000000;
  --primary-ink: #ffffff;
  --gov-bg: rgba(111, 184, 230, .16);
  --opp-bg: rgba(226, 131, 124, .16);
  --warn-bg: rgba(232, 201, 92, .18);
  --danger-bg: rgba(209, 96, 47, .2);
  --violet-bg: rgba(180, 139, 224, .18);
  --shadow: 0 18px 42px rgba(0, 0, 0, .5);
  --ring: rgba(232, 201, 92, .55);

  --font-ui: var(--font-geist-sans), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: var(--font-geist-mono), "SFMono-Regular", "JetBrains Mono", Consolas, monospace;
  --font-hand: var(--font-caveat), "Segoe Print", "Bradley Hand", cursive;

  position: relative;
  min-height: 100vh;
  background: var(--bg-grad);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.006em;
}

.f-app[data-theme="light"] {
  --gov: #000000;
  --opp: #333333;
  --warn: #ff9900;
  --danger: #cc0000;
  --violet: #770077;

  --bg: #ffffff;
  --bg-grad: radial-gradient(1200px 600px at 6% -8%, rgba(255, 255, 255, .55), transparent 60%),
             repeating-linear-gradient(to bottom, transparent 0, transparent 25px, rgba(74, 98, 138, .15) 25px, rgba(74, 98, 138, .15) 26px),
             #f7f3dc;
  --panel: #fafafa;
  --panel-2: #f0f0f0;
  --raised: #e8e8e8;
  --line: #d0d0d0;
  --line-soft: #e0e0e0;
  --text: #000000;
  --dim: #444444;
  --faint: #888888;
  --primary: #000000;
  --primary-ink: #ffffff;
  --gov-bg: rgba(31, 90, 168, .12);
  --opp-bg: rgba(191, 58, 46, .12);
  --warn-bg: rgba(169, 118, 15, .14);
  --danger-bg: rgba(138, 42, 34, .13);
  --violet-bg: rgba(106, 76, 147, .13);
  --shadow: 0 10px 26px rgba(60, 50, 20, .1);
  --ring: rgba(31, 90, 168, .45);
}

/* The legal pad's red margin rule — a thin line in the empty gutter, never
   under any card, so it can't collide with content at any breakpoint. */
.f-app[data-theme="light"]::before {
  content: "";
  position: absolute; top: 0; bottom: 0; left: 10px; width: 1px;
  background: rgba(191, 58, 46, .4);
  pointer-events: none; z-index: 0;
}
@media (max-width: 900px) {
  .f-app[data-theme="light"]::before { display: none; }
}

.f-app *, .f-app *::before, .f-app *::after { box-sizing: border-box; }
.f-app button, .f-app input, .f-app textarea, .f-app select {
  font: inherit; color: inherit; letter-spacing: inherit;
}
.f-app button { cursor: pointer; border: 0; background: none; padding: 0; }
.f-app button:disabled { cursor: default; opacity: .35; }
.f-app button:disabled:hover { background: none; color: inherit; }
.f-app textarea { resize: none; }
.f-app :focus { outline: none; }
.f-app :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 6px; }
.f-app ::selection { background: rgba(232, 201, 92, .4); }

/* Three-voice type system: Caveat (handwriting) carries the motion and the
   wordmark like a pen scrawl at the top of the pad; Geist Mono marks every
   label, tag, chip and digit like a typed transcript; Geist Sans does the
   talking everywhere else — body copy, inputs, buttons. */
.f-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.f-eyebrow {
  font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .13em;
  text-transform: uppercase; color: var(--faint);
}

/* ---------- topbar ---------- */
.f-top {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 16px;
  height: 52px; padding: 0 20px;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
}
.f-brand {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-hand); font-weight: 700;
  font-size: 21px; letter-spacing: 0;
}
.f-brand-mark {
  display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px;
  background: linear-gradient(150deg, var(--gov), var(--warn));
  color: #131b16; font-family: var(--font-ui); font-weight: 800;
  font-size: 12px;
}
.f-brand em { font-style: normal; color: var(--opp); }
.f-top-divider { width: 1px; height: 18px; background: var(--line); }
.f-live { display: flex; align-items: center; gap: 7px; color: var(--dim); font-size: 11px; }
.f-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); }
.f-dot.on { background: var(--gov); box-shadow: 0 0 0 3px var(--gov-bg); animation: f-pulse 2s ease-in-out infinite; }
@keyframes f-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
.f-saved { color: var(--faint); font-size: 11px; margin-left: auto; white-space: nowrap; }
.f-top-actions { display: flex; align-items: center; gap: 6px; }

.f-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 29px; padding: 0 11px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--panel);
  color: var(--dim); font-size: 11.5px; font-weight: 520;
  transition: background .14s ease, color .14s ease, border-color .14s ease, transform .1s ease;
}
.f-btn:hover { color: var(--text); border-color: color-mix(in srgb, var(--line) 40%, var(--dim)); background: var(--raised); }
.f-btn:active { transform: translateY(1px); }
.f-btn.icon { width: 29px; padding: 0; justify-content: center; font-size: 13px; }
.f-btn.primary {
  background: var(--primary); color: var(--primary-ink);
  border-color: transparent; font-weight: 600;
}
.f-btn.primary:hover { background: var(--primary); filter: brightness(.93); color: var(--primary-ink); }
.f-btn.danger:hover { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 45%, transparent); }
.f-btn[aria-pressed="true"] { color: var(--text); border-color: color-mix(in srgb, var(--gov) 50%, transparent); background: var(--gov-bg); }

/* ---------- round strip ---------- */
.f-strip {
  display: flex; align-items: flex-end; gap: 28px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--line);
}
.f-strip-main { flex: 1; min-width: 0; }
/* Qualified with the element type so this beats ".f-app textarea{font:inherit}"
   on specificity — a class alone would tie and lose the handwriting face. */
textarea.f-motion {
  display: block; width: 100%; margin-top: 2px; padding: 2px 8px 2px 9px;
  border: 1px solid transparent; border-radius: 9px; background: transparent;
  font-family: var(--font-hand); font-weight: 700; font-size: clamp(28px, 3.4vw, 44px);
  line-height: 1.3; letter-spacing: 0; color: var(--text);
  overflow: hidden;
  transition: background .15s ease, border-color .15s ease;
}
.f-motion::placeholder { color: var(--faint); }
.f-motion:hover { border-color: var(--line); }
.f-motion:focus { border-color: var(--line); background: var(--panel); }
.f-teams { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 12px; padding-left: 9px; }
.f-team { display: flex; align-items: center; gap: 8px; }
.f-team input {
  width: 150px; padding: 4px 8px; border-radius: 7px;
  border: 1px solid transparent; background: transparent; color: var(--text); font-size: 12.5px;
}
.f-team input:hover { border-color: var(--line); }
.f-team input:focus { border-color: var(--line); background: var(--panel); }
.f-vs { color: var(--faint); font-family: var(--font-ui); font-style: italic; font-size: 12.5px; }

.f-tag {
  display: inline-flex; align-items: center; height: 19px; padding: 0 7px;
  border-radius: 5px; font-family: var(--font-mono); font-size: 9.5px;
  font-weight: 700; letter-spacing: .08em;
}
.f-tag.gov { color: var(--gov); background: var(--gov-bg); }
.f-tag.opp { color: var(--opp); background: var(--opp-bg); }

.f-strip-side { display: flex; gap: 10px; flex-wrap: wrap; }
.f-stat {
  min-width: 74px; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--line); background: var(--panel);
}
.f-stat b { display: block; margin-top: 3px; font-size: 18px; font-weight: 600; letter-spacing: -.03em; }
.f-stat.gov b { color: var(--gov); }
.f-stat.opp b { color: var(--opp); }

/* ---------- layout ---------- */
.f-grid {
  display: grid;
  grid-template-columns: 296px minmax(0, 1fr) 290px;
  gap: 20px; align-items: start;
  padding: 20px 24px 40px;
}
.f-col { display: grid; gap: 14px; }
.f-left { position: sticky; top: 68px; }
.f-right { position: sticky; top: 68px; }

.f-panel {
  border: 1px solid var(--line); border-radius: 14px;
  background: var(--panel); overflow: hidden;
}
.f-panel-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 11px 13px; border-bottom: 1px solid var(--line-soft);
}
.f-panel-body { padding: 13px; }
.f-count {
  display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px;
  border-radius: 6px; background: var(--raised); color: var(--dim);
  font-family: var(--font-mono); font-size: 10.5px; font-weight: 650;
}

/* ---------- timer ---------- */
.f-timer {
  /* The timer is a little chalkboard clock bolted to the wall — it stays
     board-dark and chalk-bright in both page themes rather than flipping
     to a white slab in Legal Pad mode. */
  --gov: #333333; --gov-bg: rgba(111, 184, 230, .2);
  --opp: #666666; --opp-bg: rgba(226, 131, 124, .22);
  --warn: #ff9900; --warn-bg: rgba(232, 201, 92, .2);
  --danger: #cc0000; --danger-bg: rgba(209, 96, 47, .22);
  --violet: #770077; --violet-bg: rgba(180, 139, 224, .2);

  position: relative; overflow: hidden;
  border-radius: 14px; border: 1px solid #333333;
  background: linear-gradient(168deg, #f5f5f5 0%, #eeeeee 55%, #e8e8e8 100%);
  color: #000000; box-shadow: var(--shadow);
}
.f-app[data-theme="light"] .f-timer { border-color: #cccccc; }
.f-timer::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(520px 180px at 50% -30%, rgba(232, 201, 92, .13), transparent 70%);
}
.f-timer.warn { border-color: color-mix(in srgb, var(--warn) 45%, #2c4136); }
.f-timer.over { border-color: color-mix(in srgb, var(--danger) 55%, #2c4136); }
.f-timer-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 14px 0; position: relative; z-index: 1;
}
.f-timer-role { padding: 10px 14px 0; position: relative; z-index: 1; }
.f-timer-role strong { font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
.f-timer-role span { display: block; margin-top: 2px; color: #666666; font-size: 11px; }
.f-timer-face { position: relative; z-index: 1; display: grid; justify-items: center; padding: 14px 14px 12px; }
.f-clock {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: clamp(52px, 5.6vw, 68px); font-weight: 600; line-height: 1;
  letter-spacing: -.045em; color: #000000;
  transition: color .3s ease;
}
.f-timer.warn .f-clock { color: var(--warn); }
.f-timer.over .f-clock { color: var(--danger); }
.f-clock-sub { margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 10.5px; color: #666666; }
.f-phase {
  display: inline-flex; align-items: center; gap: 6px; height: 21px; padding: 0 9px;
  border-radius: 6px; font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; letter-spacing: .1em;
  background: rgba(255, 255, 255, .07); color: #444444;
}
.f-phase.poi { color: var(--gov); background: var(--gov-bg); }
.f-phase.protect { color: var(--violet); background: var(--violet-bg); }
.f-phase.warn { color: var(--warn); background: var(--warn-bg); }
.f-phase.over { color: var(--danger); background: var(--danger-bg); }

.f-track {
  position: relative; z-index: 1; height: 6px; margin: 4px 14px 0;
  border-radius: 99px; background: #e8e8e8; overflow: hidden;
}
.f-track-poi { position: absolute; top: 0; bottom: 0; background: rgba(232, 201, 92, .18); }
.f-track-fill {
  /* Chalk drawn across the board: green while there's time, then the
     warn/over states below redraw it in yellow and red chalk. */
  position: absolute; top: 0; bottom: 0; left: 0; border-radius: 99px;
  background: linear-gradient(90deg, #999999, #666666);
  transition: width .18s linear, background .3s ease;
}
.f-timer.warn .f-track-fill { background: linear-gradient(90deg, #e8c95c, #e2837c); }
.f-timer.over .f-track-fill { background: linear-gradient(90deg, #c2502a, #d1602f); }
.f-track-mark { position: absolute; top: -2px; bottom: -2px; width: 1.5px; background: rgba(255, 255, 255, .35); }
.f-track-legend {
  position: relative; z-index: 1; display: flex; justify-content: space-between;
  padding: 6px 14px 0; font-family: var(--font-mono); color: #666666; font-size: 9.5px;
}

.f-timer-controls {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 38px 1fr 38px; gap: 7px; padding: 13px 14px 0;
}
.f-tbtn {
  display: grid; place-items: center; height: 36px; border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, .13); color: #333333;
  font-size: 11px; font-weight: 600;
  transition: background .14s ease, border-color .14s ease, color .14s ease;
}
.f-tbtn:hover { background: #e8e8e8; color: #fff; }
.f-tbtn.go {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--gov); border-color: transparent; color: #ffffff;
  font-size: 12.5px; font-weight: 700;
}
.f-tbtn.go:hover { background: color-mix(in srgb, var(--gov) 88%, #fff); color: #ffffff; }
.f-tbtn.go.pause { background: #e8e8e8; color: #000000; }
.f-tbtn.go.pause:hover { background: #d8d8d8; }
.f-timer-foot {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding: 9px 14px; border-top: 1px solid rgba(255, 255, 255, .07);
  color: #666666; font-size: 10.5px;
}
.f-timer-foot button { color: #444444; font-size: 10.5px; }
.f-timer-foot button:hover { color: #fff; }
.f-flash {
  position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: 14px;
  animation: f-flash .85s ease-out 1;
}
@keyframes f-flash {
  0% { background: #d8d8d8; }
  100% { background: rgba(255, 255, 255, 0); }
}

/* ---------- speech list ---------- */
.f-speeches { display: grid; gap: 4px; padding: 7px; }
.f-speech {
  display: grid; grid-template-columns: 3px 1fr auto; align-items: center; gap: 10px;
  padding: 8px 10px 8px 8px; border-radius: 9px;
  border: 1px solid transparent; text-align: left;
  transition: background .13s ease, border-color .13s ease;
}
.f-speech:hover { background: var(--panel-2); }
.f-speech-bar { align-self: stretch; border-radius: 99px; background: var(--line); }
.f-speech.gov .f-speech-bar { background: color-mix(in srgb, var(--gov) 55%, transparent); }
.f-speech.opp .f-speech-bar { background: color-mix(in srgb, var(--opp) 55%, transparent); }
.f-speech.active { background: var(--raised); border-color: var(--line); }
.f-speech.active.gov .f-speech-bar { background: var(--gov); }
.f-speech.active.opp .f-speech-bar { background: var(--opp); }
.f-speech.done { opacity: .62; }
.f-speech-name { min-width: 0; }
.f-speech-name strong { display: block; font-size: 12.5px; font-weight: 620; letter-spacing: -.01em; }
.f-speech-name span {
  display: block; margin-top: 1px; color: var(--faint); font-size: 10.5px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.f-speech-time { text-align: right; color: var(--dim); font-size: 10.5px; }
.f-speech-time i { display: block; font-style: normal; color: var(--faint); font-size: 9.5px; margin-top: 1px; }
.f-speech-time.over { color: var(--danger); }

/* ---------- board ---------- */
.f-board-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-bottom: 2px;
}
.f-seg { display: inline-flex; padding: 3px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel); }
.f-seg button {
  height: 24px; padding: 0 10px; border-radius: 7px; color: var(--dim);
  font-size: 11px; font-weight: 550; transition: background .13s ease, color .13s ease;
}
.f-seg button:hover { color: var(--text); }
.f-seg button[aria-pressed="true"] { background: var(--raised); color: var(--text); }
.f-search {
  display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 10px;
  border-radius: 9px; border: 1px solid var(--line); background: var(--panel); color: var(--faint);
}
.f-search:focus-within { border-color: color-mix(in srgb, var(--ring) 55%, var(--line)); }
.f-search input { width: 150px; min-width: 0; background: transparent; border: 0; color: var(--text); font-size: 12px; }
.f-search input::placeholder { color: var(--faint); }
.f-search > button { color: var(--faint); font-size: 13px; line-height: 1; }
.f-search > button:hover { color: var(--text); }

.f-board { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.f-column { display: grid; gap: 9px; min-width: 0; }
.f-col-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 2px 9px; border-top: 2px solid var(--line);
}
.f-column.gov .f-col-head { border-color: var(--gov); }
.f-column.opp .f-col-head { border-color: var(--opp); }
.f-col-head strong { font-size: 13px; font-weight: 620; letter-spacing: -.01em; }
.f-col-meta { display: flex; align-items: center; gap: 8px; color: var(--faint); font-size: 10.5px; }

.f-card {
  border: 1px solid var(--line); border-radius: 12px; background: var(--panel);
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.f-card:hover { border-color: color-mix(in srgb, var(--line) 45%, var(--dim)); box-shadow: var(--shadow); }
.f-card.starred { border-color: color-mix(in srgb, var(--warn) 45%, var(--line)); }
.f-card-top { display: flex; align-items: flex-start; gap: 8px; padding: 10px 10px 8px; }
.f-card-grip {
  display: grid; place-items: center; width: 18px; height: 18px; margin-top: 1px;
  border-radius: 5px; color: var(--faint); font-size: 9px;
  transition: transform .18s ease, color .13s ease;
}
.f-card-grip:hover { color: var(--text); }
.f-card-grip.open { transform: rotate(90deg); }
.f-card-main { flex: 1; min-width: 0; }
.f-card-title {
  display: block; width: 100%; padding: 1px 5px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  font-size: 13.5px; font-weight: 600; letter-spacing: -.012em; line-height: 1.32;
  color: var(--text); overflow: hidden;
}
.f-card-title:hover { border-color: var(--line-soft); }
.f-card-title:focus { border-color: var(--line); background: var(--panel-2); }
.f-card-meta { display: flex; align-items: center; gap: 6px; margin: 5px 0 0 5px; color: var(--faint); font-size: 10px; }
.f-card-tools { display: flex; align-items: center; gap: 2px; }
.f-icon {
  display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px;
  color: var(--faint); font-size: 12px; transition: background .13s ease, color .13s ease;
}
.f-icon:hover { background: var(--raised); color: var(--text); }
.f-icon.on { color: var(--warn); }
.f-icon.del:hover { color: var(--danger); }

.f-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px;
  border-radius: 6px; border: 1px solid transparent;
  font-family: var(--font-mono); font-size: 10px; font-weight: 620; letter-spacing: 0;
}
.f-chip .f-dot { width: 5px; height: 5px; }
.f-chip.open { color: var(--warn); background: var(--warn-bg); }
.f-chip.open .f-dot { background: var(--warn); }
.f-chip.answered { color: var(--gov); background: var(--gov-bg); }
.f-chip.answered .f-dot { background: var(--gov); }
.f-chip.dropped { color: var(--violet); background: var(--violet-bg); }
.f-chip.dropped .f-dot { background: var(--violet); }
.f-chip.turned { color: var(--opp); background: var(--opp-bg); }
.f-chip.turned .f-dot { background: var(--opp); }
.f-chip.ghost { color: var(--faint); background: var(--panel-2); border-color: var(--line-soft); font-weight: 550; }
/* A status chip is a <button> when it's clickable (cycling status) — that
   makes ".f-app button{font:inherit}" outrank ".f-chip" on specificity and
   silently drop it back to Geist. Bump the button case explicitly. */
button.f-chip { font-family: var(--font-mono); }

.f-card-body { padding: 0 10px 10px; }
.f-nodes { display: grid; gap: 3px; }
.f-node { display: grid; gap: 3px; }
.f-node-row {
  position: relative; display: flex; align-items: flex-start; gap: 6px;
  padding: 4px 4px 4px 7px; border-radius: 8px;
  border: 1px solid transparent; border-left: 2px solid var(--line);
  transition: background .12s ease, border-color .12s ease;
}
.f-node-row.gov { border-left-color: color-mix(in srgb, var(--gov) 70%, transparent); }
.f-node-row.opp { border-left-color: color-mix(in srgb, var(--opp) 70%, transparent); }
.f-node-row:hover { background: var(--panel-2); }
.f-node-row:focus-within { background: var(--panel-2); border-color: var(--line); }
.f-node-row.gov:focus-within { border-left-color: var(--gov); }
.f-node-row.opp:focus-within { border-left-color: var(--opp); }
.f-node-text {
  flex: 1; min-width: 0; padding: 1px 2px; border: 0; background: transparent;
  color: var(--text); font-size: 12.2px; line-height: 1.45; overflow: hidden;
}
.f-node-text::placeholder { color: var(--faint); }
/* Always rendered as a <button> (it flips side on click) — qualify the
   selector for the same specificity reason as button.f-chip above. */
button.f-node-side {
  flex: 0 0 auto; margin-top: 2px; height: 16px; padding: 0 5px; border-radius: 4px;
  font-family: var(--font-mono); font-size: 8.5px; font-weight: 750; letter-spacing: 0;
}
.f-node-side.gov { color: var(--gov); background: var(--gov-bg); }
.f-node-side.opp { color: var(--opp); background: var(--opp-bg); }
.f-node-acts { display: flex; align-items: center; gap: 1px; opacity: 0; transition: opacity .13s ease; }
.f-node-row:hover .f-node-acts, .f-node-row:focus-within .f-node-acts { opacity: 1; }
.f-node-acts button {
  display: grid; place-items: center; width: 20px; height: 20px; border-radius: 5px;
  color: var(--faint); font-size: 11px;
}
.f-node-acts button:hover { background: var(--raised); color: var(--text); }
.f-node-kids { margin-left: 11px; padding-left: 8px; border-left: 1px dashed var(--line); display: grid; gap: 3px; }

.f-add {
  display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; padding: 3px 7px;
  border-radius: 6px; color: var(--faint); font-size: 10.5px; font-weight: 550;
}
.f-add:hover { background: var(--panel-2); color: var(--text); }

.f-examples { margin-top: 9px; padding-top: 9px; border-top: 1px dashed var(--line-soft); }
.f-line { display: flex; align-items: center; gap: 5px; margin-top: 4px; }
.f-line input {
  flex: 1; min-width: 0; padding: 5px 8px; border-radius: 7px;
  border: 1px solid var(--line-soft); background: var(--panel-2);
  color: var(--dim); font-size: 11.5px;
}
.f-line input:focus { border-color: var(--line); color: var(--text); }

.f-card-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px; border-top: 1px solid var(--line-soft);
}

.f-composer {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border: 1px dashed var(--line); border-radius: 11px; background: transparent;
  transition: border-color .14s ease, background .14s ease;
}
.f-composer:focus-within { border-style: solid; background: var(--panel); }
.f-composer span { color: var(--faint); font-size: 14px; line-height: 1; }
.f-composer input { flex: 1; min-width: 0; background: transparent; border: 0; color: var(--text); font-size: 12.5px; }
.f-composer input::placeholder { color: var(--faint); }

.f-empty {
  padding: 22px 14px; border: 1px dashed var(--line); border-radius: 11px;
  color: var(--faint); font-size: 11.5px; text-align: center; line-height: 1.6;
}

/* ---------- right rail ---------- */
.f-notes {
  width: 100%; min-height: 128px; padding: 10px 12px; border: 0;
  background: transparent; color: var(--text); font-size: 12.5px; line-height: 1.6;
  resize: vertical;
}
.f-notes::placeholder { color: var(--faint); }
.f-poi-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.f-poi-stat { padding: 8px 10px; border-radius: 9px; background: var(--panel-2); }
.f-poi-stat b { display: block; margin-top: 2px; font-size: 17px; font-weight: 620; letter-spacing: -.02em; }
.f-poi-stat.yes b { color: var(--gov); }
.f-poi-stat.no b { color: var(--opp); }
.f-poi-input {
  width: 100%; padding: 8px 10px; border-radius: 9px;
  border: 1px solid var(--line); background: var(--panel-2); color: var(--text); font-size: 12px;
}
.f-poi-input::placeholder { color: var(--faint); }
.f-poi-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 8px; }
.f-poi-actions .f-btn { justify-content: center; height: 30px; }
.f-poi-list { display: grid; gap: 1px; margin-top: 11px; }
.f-poi-item {
  display: flex; align-items: flex-start; gap: 8px; padding: 7px 2px;
  border-top: 1px solid var(--line-soft); color: var(--dim); font-size: 11.5px; line-height: 1.4;
}
.f-poi-item b { flex: 0 0 auto; font-family: var(--font-mono); font-size: 9px; font-weight: 750; letter-spacing: .04em; }
.f-poi-item.yes b { color: var(--gov); }
.f-poi-item.no b { color: var(--opp); }
.f-poi-item button { margin-left: auto; color: var(--faint); font-size: 12px; }
.f-poi-item button:hover { color: var(--danger); }
.f-poi-locked {
  padding: 9px 11px; border-radius: 9px; background: var(--violet-bg);
  color: var(--violet); font-size: 11px; line-height: 1.45;
}

.f-legend { display: grid; gap: 7px; }
.f-legend-row { display: flex; align-items: center; gap: 8px; color: var(--dim); font-size: 11px; }
.f-legend-row span:last-child { color: var(--faint); }

/* ---------- overlays ---------- */
.f-scrim {
  position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 24px;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
  animation: f-fade .16s ease-out;
}
@keyframes f-fade { from { opacity: 0 } to { opacity: 1 } }
.f-sheet {
  width: min(680px, 100%); max-height: 86vh; overflow: auto;
  border: 1px solid var(--line); border-radius: 16px; background: var(--panel);
  box-shadow: 0 30px 80px rgba(0, 0, 0, .5);
  animation: f-rise .18s cubic-bezier(.2, .8, .3, 1);
}
@keyframes f-rise { from { opacity: 0; transform: translateY(10px) scale(.99) } to { opacity: 1; transform: none } }
.f-sheet-head {
  position: sticky; top: 0; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  padding: 15px 18px; border-bottom: 1px solid var(--line); background: var(--panel);
}
.f-sheet-head h2 { font-size: 15px; font-weight: 620; letter-spacing: -.015em; }
.f-sheet-body { padding: 18px; display: grid; gap: 18px; }
.f-field { display: grid; gap: 6px; }
.f-field > span { color: var(--faint); font-size: 10.5px; font-weight: 620; letter-spacing: .1em; text-transform: uppercase; }
.f-field input, .f-field textarea {
  width: 100%; padding: 9px 11px; border-radius: 9px;
  border: 1px solid var(--line); background: var(--panel-2); color: var(--text); font-size: 13px;
}
.f-field input:focus, .f-field textarea:focus { border-color: color-mix(in srgb, var(--ring) 60%, var(--line)); }
.f-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.f-setup-speech {
  display: grid; grid-template-columns: 46px 1fr 112px; align-items: center; gap: 10px;
  padding: 8px 0; border-top: 1px solid var(--line-soft);
}
.f-setup-speech input { padding: 7px 9px; font-size: 12.5px; }
.f-dur { display: flex; align-items: center; gap: 4px; }
.f-dur button {
  display: grid; place-items: center; width: 24px; height: 26px; border-radius: 6px;
  border: 1px solid var(--line); color: var(--dim); font-size: 12px;
}
.f-dur button:hover { color: var(--text); background: var(--raised); }
.f-dur b { flex: 1; text-align: center; font-family: var(--font-mono); font-size: 12px; font-weight: 550; }

.f-keys { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.f-key-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 5px 0; border-bottom: 1px solid var(--line-soft); }
.f-key-row span { color: var(--dim); font-size: 12px; }
.f-kbd {
  display: inline-grid; place-items: center; min-width: 22px; height: 21px; padding: 0 6px;
  border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 6px;
  background: var(--panel-2); color: var(--dim);
  font-family: var(--font-mono); font-size: 10.5px;
}

.f-toast {
  position: fixed; left: 50%; bottom: 26px; z-index: 95; transform: translateX(-50%);
  padding: 9px 16px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--raised); color: var(--text); font-size: 12px;
  box-shadow: var(--shadow); animation: f-toast .2s ease-out;
}
@keyframes f-toast { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translate(-50%, 0) } }

/* ---------- responsive ---------- */
@media (max-width: 1240px) {
  .f-grid { grid-template-columns: 272px minmax(0, 1fr); }
  .f-right { position: static; grid-column: 1 / -1; }
  .f-right { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
}
@media (max-width: 900px) {
  .f-strip { flex-direction: column; align-items: stretch; gap: 16px; }
  .f-grid { grid-template-columns: minmax(0, 1fr); padding: 16px 16px 40px; }
  .f-left { position: static; }
  .f-board { grid-template-columns: 1fr; }
  .f-right { grid-template-columns: 1fr; }
  .f-top { padding: 0 14px; }
  .f-strip { padding: 18px 16px 16px; }
  .f-saved { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .f-app *, .f-app *::before, .f-app *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`;

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function AutoTextarea({
  value,
  onChange,
  focused,
  onFocused,
  className,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  focused?: boolean;
  onFocused?: () => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    if (!focused) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    onFocused?.();
  }, [focused, onFocused]);

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={1}
      className={className}
      value={value}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
    />
  );
}

function StatusChip({ status, onClick }: { status: Status; onClick?: () => void }) {
  const meta = STATUS_META[status];
  const content = (
    <>
      <i className="f-dot" />
      {meta.label}
    </>
  );
  if (!onClick) return <span className={`f-chip ${status}`}>{content}</span>;
  return (
    <button type="button" className={`f-chip ${status}`} onClick={onClick} title={`${meta.hint} — click to change`}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Analysis tree                                                      */
/* ------------------------------------------------------------------ */

type NodeHandlers = {
  onText: (path: number[], text: string) => void;
  onEnter: (path: number[]) => void;
  onReply: (path: number[]) => void;
  onRemove: (path: number[]) => void;
  onIndent: (path: number[]) => void;
  onOutdent: (path: number[]) => void;
  onFlip: (path: number[]) => void;
  focusKey: string | null;
  clearFocus: () => void;
  argId: string;
};

function NodeList({
  nodes,
  path,
  handlers,
}: {
  nodes: AnalysisNode[];
  path: number[];
  handlers: NodeHandlers;
}) {
  return (
    <div className="f-nodes">
      {nodes.map((node, index) => (
        <NodeRow key={node.id} node={node} path={[...path, index]} handlers={handlers} />
      ))}
    </div>
  );
}

function NodeRow({
  node,
  path,
  handlers,
}: {
  node: AnalysisNode;
  path: number[];
  handlers: NodeHandlers;
}) {
  const key = `${handlers.argId}:${path.join(".")}`;
  const tone = node.side === "GOV" ? "gov" : "opp";

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handlers.onEnter(path);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) handlers.onOutdent(path);
      else handlers.onIndent(path);
      return;
    }
    if (event.key === "Backspace" && node.text === "" && node.replies.length === 0) {
      event.preventDefault();
      handlers.onRemove(path);
    }
  };

  return (
    <div className="f-node">
      <div className={`f-node-row ${tone}`}>
        <button
          type="button"
          className={`f-node-side ${tone}`}
          onClick={() => handlers.onFlip(path)}
          title={`${sideName(node.side)}${node.speech ? ` · ${node.speech}` : ""} — click to flip side`}
        >
          {node.side}
        </button>
        <AutoTextarea
          className="f-node-text"
          aria-label={`Analysis, ${sideName(node.side)}`}
          placeholder="Add analysis…  ⏎ next line · ⇥ indent"
          value={node.text}
          onChange={(value) => handlers.onText(path, value)}
          onKeyDown={onKeyDown}
          focused={handlers.focusKey === key}
          onFocused={handlers.clearFocus}
        />
        <span className="f-node-acts">
          <button type="button" onClick={() => handlers.onReply(path)} title="Add a reply beneath (⇥ on a new line)">
            ↳
          </button>
          <button type="button" onClick={() => handlers.onRemove(path)} title="Remove this line">
            ×
          </button>
        </span>
      </div>
      {node.replies.length > 0 && (
        <div className="f-node-kids">
          <NodeList nodes={node.replies} path={path} handlers={handlers} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Argument card                                                      */
/* ------------------------------------------------------------------ */

function ArgumentCard({
  argument,
  currentSpeech,
  patch,
  remove,
  focusKey,
  setFocusKey,
}: {
  argument: Argument;
  currentSpeech: string;
  patch: (id: string, next: Partial<Argument>) => void;
  remove: (id: string) => void;
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
}) {
  const tone = argument.side === "GOV" ? "gov" : "opp";

  // `retag` re-derives every side from depth. Only the structural moves need it;
  // a manual side flip must survive, so plain edits leave the tags alone.
  const writeTree = (mutate: (tree: AnalysisNode[]) => number[] | void, retag = false) => {
    const tree = cloneNodes(argument.analysis);
    const nextPath = mutate(tree);
    if (retag) retagSides(tree, argument.side, 0);
    patch(argument.id, { analysis: tree });
    if (nextPath) setFocusKey(`${argument.id}:${nextPath.join(".")}`);
  };

  const handlers: NodeHandlers = {
    argId: argument.id,
    focusKey,
    clearFocus: () => setFocusKey(null),
    onText: (path, text) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        list[path[path.length - 1]].text = text;
      }),
    onEnter: (path) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        const index = path[path.length - 1];
        const node = makeNode(list[index].side, currentSpeech);
        list.splice(index + 1, 0, node);
        return [...path.slice(0, -1), index + 1];
      }),
    onReply: (path) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        const node = list[path[path.length - 1]];
        node.replies.push(makeNode(other(node.side), currentSpeech));
        return [...path, node.replies.length - 1];
      }),
    onRemove: (path) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        const index = path[path.length - 1];
        list.splice(index, 1);
        // Land the caret on the line above so backspacing through a stack keeps flowing.
        if (index > 0) return [...path.slice(0, -1), index - 1];
      }),
    onIndent: (path) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        const index = path[path.length - 1];
        if (index === 0) return;
        const previous = list[index - 1];
        const [node] = list.splice(index, 1);
        previous.replies.push(node);
        return [...path.slice(0, -1), index - 1, previous.replies.length - 1];
      }, true),
    onOutdent: (path) =>
      writeTree((tree) => {
        if (path.length < 2) return;
        const parentPath = path.slice(0, -1);
        const parentList = listAt(tree, parentPath);
        const parentIndex = parentPath[parentPath.length - 1];
        const list = parentList[parentIndex].replies;
        const [node] = list.splice(path[path.length - 1], 1);
        parentList.splice(parentIndex + 1, 0, node);
        return [...parentPath.slice(0, -1), parentIndex + 1];
      }, true),
    onFlip: (path) =>
      writeTree((tree) => {
        const list = listAt(tree, path);
        const node = list[path[path.length - 1]];
        node.side = other(node.side);
      }),
  };

  const addRoot = () =>
    writeTree((tree) => {
      tree.push(makeNode(argument.side, currentSpeech));
      return [tree.length - 1];
    });

  const cycleStatus = () => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(argument.status) + 1) % STATUS_ORDER.length];
    patch(argument.id, { status: next });
  };

  const setExample = (index: number, value: string) =>
    patch(argument.id, {
      examples: argument.examples.map((line, i) => (i === index ? value : line)),
    });

  return (
    <article className={`f-card ${argument.starred ? "starred" : ""}`}>
      <div className="f-card-top">
        <button
          type="button"
          className={`f-card-grip ${argument.collapsed ? "" : "open"}`}
          onClick={() => patch(argument.id, { collapsed: !argument.collapsed })}
          aria-expanded={!argument.collapsed}
          title={argument.collapsed ? "Expand" : "Collapse"}
        >
          ▶
        </button>
        <div className="f-card-main">
          <AutoTextarea
            className="f-card-title"
            aria-label="Argument title"
            placeholder="Name this argument…"
            value={argument.title}
            onChange={(value) => patch(argument.id, { title: value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            focused={focusKey === `title:${argument.id}`}
            onFocused={() => setFocusKey(null)}
          />
          <div className="f-card-meta">
            <span className={`f-tag ${tone}`}>{argument.side}</span>
            <span>from {argument.speech}</span>
            {argument.collapsed && countNodes(argument.analysis) > 0 && (
              <span>· {countNodes(argument.analysis)} lines</span>
            )}
          </div>
        </div>
        <div className="f-card-tools">
          <button
            type="button"
            className={`f-icon ${argument.starred ? "on" : ""}`}
            onClick={() => patch(argument.id, { starred: !argument.starred })}
            aria-pressed={argument.starred}
            title="Mark as a voting issue"
          >
            {argument.starred ? "★" : "☆"}
          </button>
          <button
            type="button"
            className="f-icon del"
            onClick={() => remove(argument.id)}
            title={`Delete “${argument.title}”`}
          >
            ×
          </button>
        </div>
      </div>

      {!argument.collapsed && (
        <>
          <div className="f-card-body">
            <NodeList nodes={argument.analysis} path={[]} handlers={handlers} />
            <button type="button" className="f-add" onClick={addRoot}>
              + line
            </button>

            {argument.examples.length > 0 && (
              <div className="f-examples">
                <span className="f-eyebrow">Examples</span>
                {argument.examples.map((line, index) => (
                  <div className="f-line" key={`${argument.id}-ex-${index}`}>
                    <input
                      aria-label={`Example ${index + 1}`}
                      placeholder="Concrete example…"
                      value={line}
                      onChange={(event) => setExample(index, event.target.value)}
                    />
                    <button
                      type="button"
                      className="f-icon del"
                      onClick={() =>
                        patch(argument.id, {
                          examples: argument.examples.filter((_, i) => i !== index),
                        })
                      }
                      title="Remove example"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="f-card-foot">
            <StatusChip status={argument.status} onClick={cycleStatus} />
            <button
              type="button"
              className="f-add"
              onClick={() => patch(argument.id, { examples: [...argument.examples, ""] })}
            >
              + example
            </button>
          </div>
        </>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const sample = sampleUBIDebate();
  const [theme, setTheme] = useState<Theme>("light");
  const [motion, setMotion] = useState(sample.motion);
  const [govTeam, setGovTeam] = useState(sample.govTeam);
  const [oppTeam, setOppTeam] = useState(sample.oppTeam);
  const [roundLabel, setRoundLabel] = useState(sample.roundLabel);
  const [grace, setGrace] = useState(DEFAULT_GRACE);

  const [speeches, setSpeeches] = useState<Speech[]>(makeSpeeches);
  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [argumentsList, setArgumentsList] = useState<Argument[]>(sample.arguments);
  const [pois, setPois] = useState<Poi[]>(sample.pois);
  const [notes, setNotes] = useState<Record<string, string>>(sample.notes);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Record<Side, string>>({ GOV: "", OPP: "" });
  const [poiText, setPoiText] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const [sheet, setSheet] = useState<"setup" | "keys" | null>(null);
  const [sound, setSound] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const govInputRef = useRef<HTMLInputElement>(null);
  const oppInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const speech = speeches[current];

  /* -- derived timer values ---------------------------------------- */
  const elapsed =
    speech.elapsed +
    (running && speech.startedAt ? Math.max(0, Math.floor((now - speech.startedAt) / 1000)) : 0);
  const remaining = speech.duration - elapsed;
  const overBy = Math.max(0, -remaining);
  const pastGrace = overBy > grace;
  const progress = Math.min(100, (elapsed / speech.duration) * 100);
  const poiOpen = speech.poi && elapsed >= PROTECTED_TIME && elapsed <= speech.duration - PROTECTED_TIME;

  const phase: "protected" | "poi" | "warn" | "over" | "grace" = (() => {
    if (remaining <= 0) return pastGrace ? "over" : "grace";
    if (remaining <= PROTECTED_TIME) return "warn";
    if (poiOpen) return "poi";
    return "protected";
  })();

  const phaseLabel =
    phase === "over"
      ? "PAST GRACE"
      : phase === "grace"
        ? "GRACE PERIOD"
        : phase === "warn"
          ? speech.poi
            ? "PROTECTED · LAST MINUTE"
            : "LAST MINUTE"
          : phase === "poi"
            ? "POIs OPEN"
            : speech.poi
              ? "PROTECTED · FIRST MINUTE"
              : "NO POIs — REBUTTAL";

  const phaseTone =
    phase === "over" ? "over" : phase === "grace" ? "warn" : phase === "warn" ? "warn" : phase === "poi" ? "poi" : "protect";

  const timerTone = remaining <= 0 ? "over" : remaining <= PROTECTED_TIME ? "warn" : "";

  /* -- load --------------------------------------------------------- */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("flow-theme");
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    const data = readStored();
    setHydrated(true);
    if (!data) return;
    if (data.motion) setMotion(data.motion);
    if (data.govTeam) setGovTeam(data.govTeam);
    if (data.oppTeam) setOppTeam(data.oppTeam);
    if (data.roundLabel) setRoundLabel(data.roundLabel);
    if (typeof data.grace === "number") setGrace(data.grace);
    if (data.speeches) setSpeeches(data.speeches);
    if (typeof data.current === "number") setCurrent(data.current);
    if (data.argumentsList) setArgumentsList(data.argumentsList);
    if (data.pois) setPois(data.pois);
    if (data.notes) setNotes(data.notes);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* -- theme on <html> so the page background follows --------------- */
  useEffect(() => {
    document.documentElement.dataset.flowTheme = theme;
    window.localStorage.setItem("flow-theme", theme);
  }, [theme]);

  /* -- ticking only while the clock runs ---------------------------- */
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [running]);

  /* -- autosave ----------------------------------------------------- */
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const payload: Persisted = {
        version: 2,
        motion,
        govTeam,
        oppTeam,
        roundLabel,
        grace,
        speeches: speeches.map((item) => ({ ...item, startedAt: undefined })),
        current,
        argumentsList,
        pois,
        notes,
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSavedAt(Date.now());
      } catch {
        /* storage full or blocked — the round stays in memory */
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [hydrated, motion, govTeam, oppTeam, roundLabel, grace, speeches, current, argumentsList, pois, notes]);

  /* -- audible signals ---------------------------------------------- */
  const beep = useCallback(
    (times: number) => {
      if (!sound) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audioRef.current = audioRef.current ?? new Ctor();
        const ctx = audioRef.current;
        for (let index = 0; index < times; index += 1) {
          const start = ctx.currentTime + index * 0.2;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 660;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        }
      } catch {
        /* audio unavailable */
      }
    },
    [sound],
  );

  useEffect(() => {
    if (!running) return;
    const marks: { id: string; at: number; beeps: number }[] = [
      { id: "poi-open", at: PROTECTED_TIME, beeps: 1 },
      { id: "poi-close", at: speech.duration - PROTECTED_TIME, beeps: 1 },
      { id: "time", at: speech.duration, beeps: 2 },
      { id: "grace", at: speech.duration + grace, beeps: 3 },
    ];
    marks.forEach((mark) => {
      const key = `${speech.key}-${mark.id}`;
      if (elapsed >= mark.at && !firedRef.current.has(key)) {
        firedRef.current.add(key);
        beep(mark.beeps);
      }
    });
  }, [elapsed, running, speech.key, speech.duration, grace, beep]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /* -- timer actions ------------------------------------------------ */
  const commit = useCallback(
    (index: number, extra: Partial<Speech> = {}) =>
      setSpeeches((items) =>
        items.map((item, i) =>
          i === index
            ? {
                ...item,
                elapsed: item.startedAt
                  ? item.elapsed + Math.max(0, Math.floor((Date.now() - item.startedAt) / 1000))
                  : item.elapsed,
                startedAt: undefined,
                ...extra,
              }
            : item,
        ),
      ),
    [],
  );

  const toggle = useCallback(() => {
    setNow(Date.now());
    if (running) {
      commit(current);
      setRunning(false);
    } else {
      setSpeeches((items) =>
        items.map((item, i) => (i === current ? { ...item, startedAt: Date.now() } : item)),
      );
      setRunning(true);
    }
  }, [running, current, commit]);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), speeches.length - 1);
      if (next === current) return;
      if (running) commit(current);
      setRunning(false);
      setCurrent(next);
    },
    [current, running, commit, speeches.length],
  );

  const adjust = useCallback(
    (delta: number) =>
      setSpeeches((items) =>
        items.map((item, i) =>
          i === current ? { ...item, duration: Math.max(30, item.duration + delta) } : item,
        ),
      ),
    [current],
  );

  const resetSpeech = useCallback(() => {
    setRunning(false);
    firedRef.current = new Set([...firedRef.current].filter((key) => !key.startsWith(`${speech.key}-`)));
    setSpeeches((items) =>
      items.map((item, i) => (i === current ? { ...item, elapsed: 0, startedAt: undefined } : item)),
    );
  }, [current, speech.key]);

  /* -- flow actions -------------------------------------------------- */
  const patchArgument = useCallback(
    (id: string, next: Partial<Argument>) =>
      setArgumentsList((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item))),
    [],
  );

  const removeArgument = useCallback(
    (id: string) => setArgumentsList((items) => items.filter((item) => item.id !== id)),
    [],
  );

  const addArgument = useCallback(
    (side: Side, title: string) => {
      const clean = title.trim();
      if (!clean) return;
      const id = uid();
      setArgumentsList((items) => [
        ...items,
        {
          id,
          side,
          speech: speech.key,
          title: clean,
          status: "open",
          starred: false,
          collapsed: false,
          analysis: [makeNode(side, speech.key)],
          examples: [],
        },
      ]);
      setDraft((value) => ({ ...value, [side]: "" }));
      setFocusKey(`${id}:0`);
    },
    [speech.key],
  );

  const addPoi = useCallback(
    (status: Poi["status"]) => {
      setPois((items) => [
        ...items,
        { id: uid(), status, text: poiText.trim() || "No note", speech: speech.key, at: Date.now() },
      ]);
      setPoiText("");
    },
    [poiText, speech.key],
  );

  const resetRound = useCallback(() => {
    if (!window.confirm("Reset the whole round? Arguments, notes, POIs and all times will be cleared.")) return;
    setSpeeches(makeSpeeches());
    setCurrent(0);
    setRunning(false);
    setArgumentsList([]);
    setPois([]);
    setNotes({});
    firedRef.current = new Set();
    setSheet(null);
    setToast("Round cleared");
  }, []);

  const copyFlow = useCallback(async () => {
    const text = buildExport({ motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, pois, notes });
    try {
      await navigator.clipboard.writeText(text);
      setToast("Flow copied to clipboard");
    } catch {
      setToast("Clipboard blocked — try the download instead");
    }
  }, [motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, pois, notes]);

  const downloadFlow = useCallback(() => {
    const text = buildExport({ motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, pois, notes });
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(motion || "flow").slice(0, 48).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "flow"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Flow downloaded");
  }, [motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, pois, notes]);

  /* -- keyboard ------------------------------------------------------ */
  // Kept in refs so the listener can bind once and still see fresh values.
  const currentRef = useRef(current);
  const actions = useRef({ toggle, goTo, adjust, resetSpeech, copyFlow, addPoi });
  useEffect(() => {
    currentRef.current = current;
    actions.current = { toggle, goTo, adjust, resetSpeech, copyFlow, addPoi };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if (event.key === "Escape") {
        setSheet(null);
        if (typing) target?.blur();
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case " ":
          event.preventDefault();
          actions.current.toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          actions.current.goTo(currentRef.current + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          actions.current.goTo(currentRef.current - 1);
          break;
        case "+":
        case "=":
          actions.current.adjust(30);
          break;
        case "-":
        case "_":
          actions.current.adjust(-30);
          break;
        case "g":
          event.preventDefault();
          govInputRef.current?.focus();
          break;
        case "o":
          event.preventDefault();
          oppInputRef.current?.focus();
          break;
        case "n":
          event.preventDefault();
          notesRef.current?.focus();
          break;
        case "p":
          actions.current.addPoi("accepted");
          break;
        case "P":
          actions.current.addPoi("declined");
          break;
        case "r":
          actions.current.resetSpeech();
          break;
        case "t":
          setTheme((value) => (value === "dark" ? "light" : "dark"));
          break;
        case "e":
          void actions.current.copyFlow();
          break;
        case "?":
          setSheet((value) => (value === "keys" ? null : "keys"));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -- board data ----------------------------------------------------- */
  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      argumentsList.filter((argument) => {
        if (filter === "starred" && !argument.starred) return false;
        if (filter !== "all" && filter !== "starred" && argument.status !== filter) return false;
        if (!needle) return true;
        return (
          argument.title.toLowerCase().includes(needle) ||
          argument.examples.some((line) => line.toLowerCase().includes(needle)) ||
          nodeMatches(argument.analysis, needle)
        );
      }),
    [argumentsList, filter, needle],
  );

  const bySide = useMemo(
    () => ({
      GOV: visible.filter((argument) => argument.side === "GOV"),
      OPP: visible.filter((argument) => argument.side === "OPP"),
    }),
    [visible],
  );

  const tally = useMemo(() => {
    const seed = () => ({ open: 0, answered: 0, dropped: 0, turned: 0, total: 0, starred: 0 });
    const result = { GOV: seed(), OPP: seed() };
    argumentsList.forEach((argument) => {
      const bucket = result[argument.side];
      bucket[argument.status] += 1;
      bucket.total += 1;
      if (argument.starred) bucket.starred += 1;
    });
    return result;
  }, [argumentsList]);

  const speechPois = pois.filter((poi) => poi.speech === speech.key);
  const savedLabel = savedAt ? "All changes saved" : "Local only";

  /* ------------------------------------------------------------------ */

  return (
    <main className="f-app" data-theme={theme}>
      <style href="flow-app-styles" precedence="high" dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ---------------- topbar ---------------- */}
      <header className="f-top">
        <div className="f-brand">
          <span className="f-brand-mark">F</span>
          flow<em>.</em>
        </div>
        <span className="f-top-divider" />
        <div className="f-live">
          <i className={`f-dot ${running ? "on" : ""}`} />
          {running ? `${speech.key} speaking` : "Clock paused"}
          <span style={{ color: "var(--faint)" }}>· APDA</span>
        </div>
        <span className="f-saved">{savedLabel}</span>
        <div className="f-top-actions">
          <button
            type="button"
            className="f-btn"
            onClick={() => {
              const sample = sampleUBIDebate();
              setMotion(sample.motion);
              setGovTeam(sample.govTeam);
              setOppTeam(sample.oppTeam);
              setRoundLabel(sample.roundLabel);
              setArgumentsList(sample.arguments);
              setPois(sample.pois);
              setNotes(sample.notes);
              setToast("Sample UBI debate loaded!");
            }}
            title="Load a sample debate flow"
          >
            📚 Load sample
          </button>
          <button
            type="button"
            className="f-btn icon"
            aria-pressed={sound}
            onClick={() => setSound((value) => !value)}
            title={sound ? "Signal chimes on" : "Signal chimes off"}
          >
            {sound ? "🔔" : "🔕"}
          </button>
          <button
            type="button"
            className="f-btn icon"
            onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            title="Toggle theme (T)"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button type="button" className="f-btn" onClick={() => setSheet("keys")} title="Keyboard shortcuts (?)">
            ⌘ Keys
          </button>
          <button type="button" className="f-btn" onClick={() => setSheet("setup")}>
            Round setup
          </button>
          <button type="button" className="f-btn primary" onClick={copyFlow} title="Copy the whole flow (E)">
            Copy flow
          </button>
        </div>
      </header>

      {/* ---------------- round strip ---------------- */}
      <section className="f-strip">
        <div className="f-strip-main">
          <span className="f-eyebrow">{roundLabel} · Motion</span>
          <AutoTextarea
            className="f-motion"
            aria-label="Motion"
            placeholder="Type the motion…"
            value={motion}
            onChange={setMotion}
          />
          <div className="f-teams">
            <span className="f-team">
              <span className="f-tag gov">GOV</span>
              <input
                aria-label="Government team"
                placeholder="Government team"
                value={govTeam}
                onChange={(event) => setGovTeam(event.target.value)}
              />
            </span>
            <span className="f-vs">versus</span>
            <span className="f-team">
              <span className="f-tag opp">OPP</span>
              <input
                aria-label="Opposition team"
                placeholder="Opposition team"
                value={oppTeam}
                onChange={(event) => setOppTeam(event.target.value)}
              />
            </span>
          </div>
        </div>
        <div className="f-strip-side">
          <div className="f-stat gov">
            <span className="f-eyebrow">Gov live</span>
            <b>{tally.GOV.open + tally.GOV.dropped}</b>
          </div>
          <div className="f-stat opp">
            <span className="f-eyebrow">Opp live</span>
            <b>{tally.OPP.open + tally.OPP.dropped}</b>
          </div>
          <div className="f-stat">
            <span className="f-eyebrow">Voters</span>
            <b>{tally.GOV.starred + tally.OPP.starred}</b>
          </div>
        </div>
      </section>

      {/* ---------------- workspace ---------------- */}
      <div className="f-grid">
        {/* ---- left: timer + speech order ---- */}
        <div className="f-col f-left">
          <div className={`f-timer ${timerTone}`}>
            <span className="f-flash" key={`${speech.key}-${phase}`} />
            <div className="f-timer-head">
              <span className={`f-tag ${speech.side === "GOV" ? "gov" : "opp"}`}>{speech.side}</span>
              <span className="f-mono" style={{ color: "#9db3a4", fontSize: 11 }}>
                Speech {current + 1} of {speeches.length}
              </span>
            </div>
            <div className="f-timer-role">
              <strong>
                {speech.key} · {speech.speaker || "—"}
              </strong>
              <span>{speech.role}</span>
            </div>
            <div className="f-timer-face">
              <span className="f-clock">
                {remaining < 0 ? `+${formatClock(overBy)}` : formatClock(remaining)}
              </span>
              <span className="f-clock-sub">
                <span className={`f-phase ${phaseTone}`}>{phaseLabel}</span>
                <span className="f-mono">
                  {formatClock(elapsed)} / {formatClock(speech.duration)}
                </span>
              </span>
            </div>
            <div className="f-track">
              {speech.poi && (
                <span
                  className="f-track-poi"
                  style={{
                    left: `${(PROTECTED_TIME / speech.duration) * 100}%`,
                    right: `${(PROTECTED_TIME / speech.duration) * 100}%`,
                  }}
                />
              )}
              <span className="f-track-fill" style={{ width: `${progress}%` }} />
              {speech.poi && (
                <>
                  <span className="f-track-mark" style={{ left: `${(PROTECTED_TIME / speech.duration) * 100}%` }} />
                  <span
                    className="f-track-mark"
                    style={{ left: `${((speech.duration - PROTECTED_TIME) / speech.duration) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="f-track-legend">
              <span>0:00</span>
              <span>{speech.poi ? "POI window" : "no POIs"}</span>
              <span>{formatClock(speech.duration)}</span>
            </div>
            <div className="f-timer-controls">
              <button type="button" className="f-tbtn" onClick={() => adjust(-30)} title="Shorten by 30s (−)">
                −30
              </button>
              <button
                type="button"
                className={`f-tbtn go ${running ? "pause" : ""}`}
                onClick={toggle}
                title="Start or pause (Space)"
              >
                {running ? "❚❚ Pause" : remaining < 0 ? "▶ Resume" : elapsed > 0 ? "▶ Resume" : "▶ Start speech"}
              </button>
              <button type="button" className="f-tbtn" onClick={() => adjust(30)} title="Lengthen by 30s (+)">
                +30
              </button>
            </div>
            <div className="f-timer-foot">
              <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0}>
                ← Prev
              </button>
              <button type="button" onClick={resetSpeech} title="Reset this speech clock (R)">
                ↺ Reset speech
              </button>
              <button type="button" onClick={() => goTo(current + 1)} disabled={current === speeches.length - 1}>
                Next →
              </button>
            </div>
          </div>

          <section className="f-panel">
            <div className="f-panel-head">
              <span className="f-eyebrow">Speech order</span>
              <span className="f-count">{speeches.length}</span>
            </div>
            <div className="f-speeches">
              {speeches.map((item, index) => {
                const used = index === current ? elapsed : item.elapsed;
                const isOver = used > item.duration;
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`f-speech ${item.side === "GOV" ? "gov" : "opp"} ${
                      index === current ? "active" : ""
                    } ${index < current ? "done" : ""}`}
                    onClick={() => goTo(index)}
                  >
                    <span className="f-speech-bar" />
                    <span className="f-speech-name">
                      <strong>
                        {item.key}
                        {item.speaker ? ` · ${item.speaker}` : ""}
                      </strong>
                      <span>{item.role}</span>
                    </span>
                    <span className={`f-speech-time f-mono ${isOver ? "over" : ""}`}>
                      {formatClock(used)}
                      <i>of {formatClock(item.duration)}</i>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ---- centre: the flow ---- */}
        <div className="f-col">
          <div className="f-board-bar">
            <div className="f-seg" role="group" aria-label="Filter arguments">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="f-search">
              <span aria-hidden>⌕</span>
              <input
                placeholder="Search the flow…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search the flow"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} title="Clear search" aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
            <span style={{ marginLeft: "auto", color: "var(--faint)", fontSize: 11 }}>
              {visible.length} of {argumentsList.length} shown
            </span>
          </div>

          <div className="f-board">
            {(["GOV", "OPP"] as Side[]).map((side) => {
              const tone = side === "GOV" ? "gov" : "opp";
              const list = bySide[side];
              const counts = tally[side];
              return (
                <section className={`f-column ${tone}`} key={side}>
                  <div className="f-col-head">
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`f-tag ${tone}`}>{side}</span>
                      <strong>{sideName(side)}</strong>
                    </span>
                    <span className="f-col-meta">
                      <span>{counts.open} open</span>
                      <span>·</span>
                      <span>{counts.total} total</span>
                    </span>
                  </div>

                  {list.map((argument) => (
                    <ArgumentCard
                      key={argument.id}
                      argument={argument}
                      currentSpeech={speech.key}
                      patch={patchArgument}
                      remove={removeArgument}
                      focusKey={focusKey}
                      setFocusKey={setFocusKey}
                    />
                  ))}

                  {list.length === 0 && (
                    <p className="f-empty">
                      {argumentsList.some((argument) => argument.side === side)
                        ? "Nothing matches this filter."
                        : `Nothing flowed for ${sideName(side).toLowerCase()} yet.`}
                      <br />
                      Type below to add the first argument.
                    </p>
                  )}

                  <div className="f-composer">
                    <span aria-hidden>+</span>
                    <input
                      ref={side === "GOV" ? govInputRef : oppInputRef}
                      placeholder={`New ${side} argument — logged to ${speech.key}  (${side === "GOV" ? "G" : "O"})`}
                      value={draft[side]}
                      aria-label={`New ${sideName(side)} argument`}
                      onChange={(event) => setDraft((value) => ({ ...value, [side]: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addArgument(side, draft[side]);
                        }
                      }}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* ---- right: notes, POIs, legend ---- */}
        <div className="f-col f-right">
          <section className="f-panel">
            <div className="f-panel-head">
              <span className="f-eyebrow">{speech.key} notes</span>
              <span className="f-count">{(notes[speech.key] ?? "").length}</span>
            </div>
            <textarea
              ref={notesRef}
              className="f-notes"
              placeholder={`Scratch notes for ${speech.key} — cross-applications, tags, questions for POIs…`}
              aria-label={`Notes for ${speech.key}`}
              value={notes[speech.key] ?? ""}
              onChange={(event) =>
                setNotes((value) => ({ ...value, [speech.key]: event.target.value }))
              }
            />
          </section>

          <section className="f-panel">
            <div className="f-panel-head">
              <span className="f-eyebrow">Points of information</span>
              <span className="f-count">{speechPois.length}</span>
            </div>
            <div className="f-panel-body">
              {speech.poi ? (
                <>
                  <div className="f-poi-stats">
                    <div className="f-poi-stat yes">
                      <span className="f-eyebrow">Taken</span>
                      <b>{speechPois.filter((poi) => poi.status === "accepted").length}</b>
                    </div>
                    <div className="f-poi-stat no">
                      <span className="f-eyebrow">Declined</span>
                      <b>{speechPois.filter((poi) => poi.status === "declined").length}</b>
                    </div>
                  </div>
                  {!poiOpen && (
                    <p className="f-poi-locked">
                      Protected time — POIs are not in order right now.
                    </p>
                  )}
                  <input
                    className="f-poi-input"
                    style={{ marginTop: poiOpen ? 0 : 8 }}
                    placeholder="What was asked?"
                    aria-label="Point of information note"
                    value={poiText}
                    onChange={(event) => setPoiText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addPoi("accepted");
                    }}
                  />
                  <div className="f-poi-actions">
                    <button type="button" className="f-btn" onClick={() => addPoi("accepted")}>
                      Taken (P)
                    </button>
                    <button type="button" className="f-btn" onClick={() => addPoi("declined")}>
                      Declined (⇧P)
                    </button>
                  </div>
                  <div className="f-poi-list">
                    {speechPois.map((poi) => (
                      <div className={`f-poi-item ${poi.status === "accepted" ? "yes" : "no"}`} key={poi.id}>
                        <b>{poi.status === "accepted" ? "TAKEN" : "DECL"}</b>
                        <span>{poi.text}</span>
                        <button
                          type="button"
                          onClick={() => setPois((items) => items.filter((item) => item.id !== poi.id))}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="f-poi-locked">
                  {speech.key} is a rebuttal — points of information are not in order for the whole speech.
                </p>
              )}
            </div>
          </section>

          <section className="f-panel">
            <div className="f-panel-head">
              <span className="f-eyebrow">Status key</span>
              <button type="button" className="f-btn" onClick={downloadFlow} style={{ height: 24 }}>
                Download .md
              </button>
            </div>
            <div className="f-panel-body">
              <div className="f-legend">
                {STATUS_ORDER.map((status) => (
                  <div className="f-legend-row" key={status}>
                    <StatusChip status={status} />
                    <span>{STATUS_META[status].hint}</span>
                  </div>
                ))}
                <div className="f-legend-row">
                  <span className="f-chip ghost">★ Voter</span>
                  <span>Pull this through in the rebuttal</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ---------------- sheets ---------------- */}
      {sheet === "setup" && (
        <div className="f-scrim" role="dialog" aria-modal="true" aria-label="Round setup" onMouseDown={() => setSheet(null)}>
          <div className="f-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="f-sheet-head">
              <h2>Round setup</h2>
              <button type="button" className="f-btn icon" onClick={() => setSheet(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="f-sheet-body">
              <label className="f-field">
                <span>Motion</span>
                <textarea rows={2} value={motion} onChange={(event) => setMotion(event.target.value)} />
              </label>
              <div className="f-field-row">
                <label className="f-field">
                  <span>Government</span>
                  <input value={govTeam} onChange={(event) => setGovTeam(event.target.value)} />
                </label>
                <label className="f-field">
                  <span>Opposition</span>
                  <input value={oppTeam} onChange={(event) => setOppTeam(event.target.value)} />
                </label>
              </div>
              <div className="f-field-row">
                <label className="f-field">
                  <span>Round label</span>
                  <input value={roundLabel} onChange={(event) => setRoundLabel(event.target.value)} />
                </label>
                <label className="f-field">
                  <span>Grace period (seconds)</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={grace}
                    onChange={(event) => setGrace(Math.max(0, Math.min(60, Number(event.target.value) || 0)))}
                  />
                </label>
              </div>

              <div className="f-field">
                <span>Speakers &amp; times</span>
                <div>
                  {speeches.map((item, index) => (
                    <div className="f-setup-speech" key={item.key}>
                      <strong style={{ fontSize: 12.5 }}>{item.key}</strong>
                      <input
                        aria-label={`${item.key} speaker`}
                        placeholder="Speaker name"
                        value={item.speaker}
                        onChange={(event) =>
                          setSpeeches((items) =>
                            items.map((row, i) =>
                              i === index ? { ...row, speaker: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <span className="f-dur">
                        <button
                          type="button"
                          onClick={() =>
                            setSpeeches((items) =>
                              items.map((row, i) =>
                                i === index ? { ...row, duration: Math.max(30, row.duration - 30) } : row,
                              ),
                            )
                          }
                          aria-label={`Shorten ${item.key}`}
                        >
                          −
                        </button>
                        <b>{formatClock(item.duration)}</b>
                        <button
                          type="button"
                          onClick={() =>
                            setSpeeches((items) =>
                              items.map((row, i) =>
                                i === index ? { ...row, duration: row.duration + 30 } : row,
                              ),
                            )
                          }
                          aria-label={`Lengthen ${item.key}`}
                        >
                          +
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="f-btn danger" onClick={resetRound}>
                  Reset round
                </button>
                <span style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="f-btn"
                    onClick={() => setSpeeches((items) => items.map((item, index) => ({
                      ...item,
                      duration: SPEECH_TEMPLATE[index].duration,
                    })))}
                  >
                    Restore APDA times
                  </button>
                  <button type="button" className="f-btn primary" onClick={() => setSheet(null)}>
                    Done
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {sheet === "keys" && (
        <div className="f-scrim" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={() => setSheet(null)}>
          <div className="f-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="f-sheet-head">
              <h2>Keyboard shortcuts</h2>
              <button type="button" className="f-btn icon" onClick={() => setSheet(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="f-sheet-body">
              <div className="f-keys">
                {[
                  ["Space", "Start / pause the speech clock"],
                  ["← →", "Previous / next speech"],
                  ["+ −", "Add or remove 30 seconds"],
                  ["R", "Reset the current speech clock"],
                  ["G", "New Government argument"],
                  ["O", "New Opposition argument"],
                  ["N", "Jump to this speech's notes"],
                  ["P", "Log a taken POI"],
                  ["⇧P", "Log a declined POI"],
                  ["E", "Copy the whole flow"],
                  ["T", "Toggle light / dark"],
                  ["Esc", "Close this, or leave a field"],
                ].map(([key, label]) => (
                  <div className="f-key-row" key={key}>
                    <span>{label}</span>
                    <kbd className="f-kbd">{key}</kbd>
                  </div>
                ))}
              </div>
              <div className="f-field">
                <span>Inside an argument</span>
                <div className="f-keys">
                  {[
                    ["⏎", "New line at the same level"],
                    ["⇥", "Indent — becomes a reply to the line above"],
                    ["⇧⇥", "Outdent one level"],
                    ["⌫", "Delete an empty line"],
                  ].map(([key, label]) => (
                    <div className="f-key-row" key={key}>
                      <span>{label}</span>
                      <kbd className="f-kbd">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ color: "var(--faint)", fontSize: 11.5, lineHeight: 1.6 }}>
                Replies alternate sides automatically, so an indented line under a GOV point is tagged OPP.
                Click any side tag to override it. Everything is stored in this browser only — nothing leaves the device.
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="f-toast">{toast}</div>}
    </main>
  );
}
