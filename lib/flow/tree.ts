import { other } from "./helpers";
import type { AnalysisNode, Side } from "./types";

export const cloneNodes = (nodes: AnalysisNode[]): AnalysisNode[] =>
  nodes.map((node) => ({ ...node, replies: cloneNodes(node.replies) }));

export const listAt = (tree: AnalysisNode[], path: number[]): AnalysisNode[] => {
  let list = tree;
  for (let index = 0; index < path.length - 1; index += 1) {
    list = list[path[index]].replies;
  }
  return list;
};

export const sideForDepth = (argSide: Side, depth: number): Side =>
  depth % 2 === 0 ? argSide : other(argSide);

export const retagSides = (nodes: AnalysisNode[], argSide: Side, depth: number): void => {
  nodes.forEach((node) => {
    node.side = sideForDepth(argSide, depth);
    retagSides(node.replies, argSide, depth + 1);
  });
};

/* A clash has no owning side — its root lines can belong to either team — so
   indenting inside one only re-tags the branch that actually moved. */
export const retagBranch = (node: AnalysisNode, side: Side): void => {
  node.side = side;
  node.replies.forEach((reply) => retagBranch(reply, other(side)));
};

export const countNodes = (nodes: AnalysisNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countNodes(node.replies), 0);

export const nodeMatches = (nodes: AnalysisNode[], needle: string): boolean =>
  nodes.some(
    (node) => node.text.toLowerCase().includes(needle) || nodeMatches(node.replies, needle),
  );
