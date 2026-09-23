import type { Dispatch, RefObject, SetStateAction } from "react";
import { FILTERS } from "@/lib/flow/constants";
import { sideName } from "@/lib/flow/helpers";
import type { Argument, Filter, Side, SideTally, Speech } from "@/lib/flow/types";
import { ArgumentCard } from "./ArgumentCard";
import { IconPlus, IconSearch, IconX } from "./Icons";

type FlowBoardProps = {
  filter: Filter;
  setFilter: (filter: Filter) => void;
  query: string;
  setQuery: (query: string) => void;
  visible: Argument[];
  argumentsList: Argument[];
  bySide: Record<Side, Argument[]>;
  tally: Record<Side, SideTally>;
  speech: Speech;
  patchArgument: (id: string, next: Partial<Argument>) => void;
  removeArgument: (id: string) => void;
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
  govInputRef: RefObject<HTMLInputElement | null>;
  oppInputRef: RefObject<HTMLInputElement | null>;
  draft: Record<Side, string>;
  setDraft: Dispatch<SetStateAction<Record<Side, string>>>;
  addArgument: (side: Side, title: string) => void;
};

export function FlowBoard({
  filter,
  setFilter,
  query,
  setQuery,
  visible,
  argumentsList,
  bySide,
  tally,
  speech,
  patchArgument,
  removeArgument,
  focusKey,
  setFocusKey,
  govInputRef,
  oppInputRef,
  draft,
  setDraft,
  addArgument,
}: FlowBoardProps) {
  return (
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
          <IconSearch size={14} />
          <input
            placeholder="Search the flow…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search the flow"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} title="Clear search" aria-label="Clear search">
              <IconX size={13} />
            </button>
          )}
        </div>
        <span className="f-shown f-mono">
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
                <span className="f-col-name">
                  <span className={`f-tag ${tone}`}>{side}</span>
                  <strong>{sideName(side)}</strong>
                </span>
                <span className="f-col-meta f-mono">
                  <span>{counts.open} open</span>
                  <span aria-hidden>·</span>
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

              <div className={`f-composer ${tone}`}>
                <span className="f-composer-plus" aria-hidden>
                  <IconPlus size={12} />
                </span>
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
  );
}
