import { LEAN_META, STATUS_META, WEIGHT_META, WEIGHT_ORDER } from "./constants";
import { formatClock, sideName } from "./helpers";
import type { AnalysisNode, Argument, Clash, Poi, Side, Speech } from "./types";

export const nodesToText = (nodes: AnalysisNode[], depth: number): string =>
  nodes
    .map((node) => {
      const indent = "  ".repeat(depth);
      const head = `${indent}- [${node.side}${node.speech ? ` · ${node.speech}` : ""}] ${node.text || "—"}`;
      const kids = nodesToText(node.replies, depth + 1);
      return kids ? `${head}\n${kids}` : head;
    })
    .join("\n");

export const buildExport = (state: {
  motion: string;
  govTeam: string;
  oppTeam: string;
  roundLabel: string;
  speeches: Speech[];
  argumentsList: Argument[];
  clashes: Clash[];
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
  if (state.clashes.length) {
    lines.push("");
    lines.push("## Clashes & weighing");
    // Round-winning clashes first — that's the order a rebuttal wants them in.
    [...state.clashes]
      .sort((a, b) => WEIGHT_ORDER.indexOf(a.weight) - WEIGHT_ORDER.indexOf(b.weight))
      .forEach((clash) => {
        lines.push("");
        lines.push(
          `### ${clash.starred ? "★ " : ""}${clash.title} — _${LEAN_META[clash.lean].label}_ · ${
            WEIGHT_META[clash.weight].label
          } (noted in ${clash.speech})`,
        );
        const tree = nodesToText(clash.analysis, 0);
        if (tree) lines.push(tree);
        clash.examples.filter(Boolean).forEach((example) => lines.push(`  * eg. ${example}`));
        if (clash.weighing.trim()) {
          lines.push("");
          lines.push(`> **Weighing:** ${clash.weighing.replace(/\n/g, " ")}`);
        }
      });
  }
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
