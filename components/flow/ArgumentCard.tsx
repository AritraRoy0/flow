import { STATUS_ORDER } from "@/lib/flow/constants";
import { countNodes } from "@/lib/flow/tree";
import type { Argument } from "@/lib/flow/types";
import { buildTreeHandlers, NodeList } from "./AnalysisTree";
import { AutoTextarea } from "./AutoTextarea";
import { ExampleList } from "./ExampleList";
import { IconChevronRight, IconStar, IconX } from "./Icons";
import { StatusChip } from "./StatusChip";

export function ArgumentCard({
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

  const { handlers, addRoot } = buildTreeHandlers({
    ownerId: argument.id,
    analysis: argument.analysis,
    rootSide: argument.side,
    retag: "depth",
    currentSpeech,
    commit: (analysis) => patch(argument.id, { analysis }),
    focusKey,
    setFocusKey,
  });

  const cycleStatus = () => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(argument.status) + 1) % STATUS_ORDER.length];
    patch(argument.id, { status: next });
  };

  return (
    <article className={`f-card ${tone} ${argument.starred ? "starred" : ""}`}>
      <div className="f-card-top">
        <button
          type="button"
          className={`f-card-grip ${argument.collapsed ? "" : "open"}`}
          onClick={() => patch(argument.id, { collapsed: !argument.collapsed })}
          aria-expanded={!argument.collapsed}
          title={argument.collapsed ? "Expand" : "Collapse"}
        >
          <IconChevronRight size={13} />
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
            <IconStar size={14} filled={argument.starred} />
          </button>
          <button
            type="button"
            className="f-icon del"
            onClick={() => remove(argument.id)}
            title={`Delete “${argument.title}”`}
          >
            <IconX size={14} />
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
                <ExampleList
                  ownerId={argument.id}
                  examples={argument.examples}
                  onChange={(examples) => patch(argument.id, { examples })}
                  placeholder="Concrete example…"
                />
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
