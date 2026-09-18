"use client";

import { KeyboardEvent as ReactKeyboardEvent } from "react";
import { makeNode, other, sideName } from "@/lib/flow/helpers";
import { cloneNodes, listAt, retagBranch, retagSides } from "@/lib/flow/tree";
import type { AnalysisNode, Side } from "@/lib/flow/types";
import { AutoTextarea } from "./AutoTextarea";

export type NodeHandlers = {
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

export function NodeList({
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

export function NodeRow({
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

/* Arguments and clashes edit the same tree with the same keys; they differ
   only in where a fresh root line's side comes from and how a structural
   move re-tags sides. An argument belongs to one team, so depth decides the
   side. A clash belongs to both, so only the moved branch is re-tagged. */
export function buildTreeHandlers({
  ownerId,
  analysis,
  rootSide,
  retag,
  currentSpeech,
  commit,
  focusKey,
  setFocusKey,
}: {
  ownerId: string;
  analysis: AnalysisNode[];
  rootSide: Side;
  retag: "depth" | "branch";
  currentSpeech: string;
  commit: (analysis: AnalysisNode[]) => void;
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
}): { handlers: NodeHandlers; addRoot: () => void } {
  // `structural` marks the moves that change depth. Only those re-derive
  // sides, so a manual side flip survives every plain edit.
  const writeTree = (mutate: (tree: AnalysisNode[]) => number[] | void, structural = false) => {
    const tree = cloneNodes(analysis);
    const nextPath = mutate(tree);
    if (structural && retag === "depth") retagSides(tree, rootSide, 0);
    commit(tree);
    if (nextPath) setFocusKey(`${ownerId}:${nextPath.join(".")}`);
  };

  const handlers: NodeHandlers = {
    argId: ownerId,
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
        if (retag === "branch") retagBranch(node, other(previous.side));
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
      tree.push(makeNode(rootSide, currentSpeech));
      return [tree.length - 1];
    });

  return { handlers, addRoot };
}
