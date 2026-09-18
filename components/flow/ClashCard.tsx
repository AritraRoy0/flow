import { LEAN_META, LEAN_ORDER, WEIGHT_META, WEIGHT_ORDER } from "@/lib/flow/constants";
import { countNodes } from "@/lib/flow/tree";
import type { Clash, Side } from "@/lib/flow/types";
import { buildTreeHandlers, NodeList } from "./AnalysisTree";
import { AutoTextarea } from "./AutoTextarea";
import { ExampleList } from "./ExampleList";

export function ClashCard({
  clash,
  currentSpeech,
  currentSide,
  patch,
  remove,
  focusKey,
  setFocusKey,
}: {
  clash: Clash;
  currentSpeech: string;
  currentSide: Side;
  patch: (id: string, next: Partial<Clash>) => void;
  remove: (id: string) => void;
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
}) {
  const { handlers, addRoot } = buildTreeHandlers({
    ownerId: clash.id,
    analysis: clash.analysis,
    // A clash belongs to neither team, so a fresh root line is tagged with
    // whoever holds the floor — that's nearly always who you're flowing.
    rootSide: currentSide,
    retag: "branch",
    currentSpeech,
    commit: (analysis) => patch(clash.id, { analysis }),
    focusKey,
    setFocusKey,
  });

  const cycleWeight = () => {
    const next = WEIGHT_ORDER[(WEIGHT_ORDER.indexOf(clash.weight) + 1) % WEIGHT_ORDER.length];
    patch(clash.id, { weight: next });
  };

  const lines = countNodes(clash.analysis);
  const leanTone = clash.lean === "GOV" ? "gov" : clash.lean === "OPP" ? "opp" : "even";

  return (
    <article className={`f-clash lean-${clash.lean} ${clash.starred ? "starred" : ""}`}>
      <div className="f-clash-top">
        <button
          type="button"
          className={`f-card-grip ${clash.collapsed ? "" : "open"}`}
          onClick={() => patch(clash.id, { collapsed: !clash.collapsed })}
          aria-expanded={!clash.collapsed}
          title={clash.collapsed ? "Expand" : "Collapse"}
        >
          ▶
        </button>
        <div className="f-card-main">
          <AutoTextarea
            className="f-clash-name"
            aria-label="Clash name"
            placeholder="Name this clash…"
            value={clash.title}
            onChange={(value) => patch(clash.id, { title: value })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            focused={focusKey === `clash-title:${clash.id}`}
            onFocused={() => setFocusKey(null)}
          />
          <div className="f-card-meta">
            <span className={`f-tag ${leanTone}`} title={LEAN_META[clash.lean].hint}>
              {LEAN_META[clash.lean].short}
            </span>
            <span>noted in {clash.speech}</span>
            {lines > 0 && <span>· {lines} lines</span>}
            {clash.examples.length > 0 && <span>· {clash.examples.length} eg</span>}
            {clash.collapsed && <span>· {WEIGHT_META[clash.weight].label}</span>}
          </div>
        </div>
        <div className="f-card-tools">
          <button
            type="button"
            className={`f-icon ${clash.starred ? "on" : ""}`}
            onClick={() => patch(clash.id, { starred: !clash.starred })}
            aria-pressed={clash.starred}
            title="Mark as a voting clash"
          >
            {clash.starred ? "★" : "☆"}
          </button>
          <button
            type="button"
            className="f-icon del"
            onClick={() => remove(clash.id)}
            title={`Delete “${clash.title || "this clash"}”`}
          >
            ×
          </button>
        </div>
      </div>

      {!clash.collapsed && (
        <>
          <div className="f-weigh-bar">
            <div className="f-lean" role="group" aria-label="Who is ahead on this clash">
              {LEAN_ORDER.map((lean) => (
                <button
                  type="button"
                  key={lean}
                  className={lean === "GOV" ? "gov" : lean === "OPP" ? "opp" : "even"}
                  aria-pressed={clash.lean === lean}
                  onClick={() => patch(clash.id, { lean })}
                  title={LEAN_META[lean].hint}
                >
                  {LEAN_META[lean].short}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`f-chip w-${clash.weight}`}
              onClick={cycleWeight}
              title={`${WEIGHT_META[clash.weight].hint} — click to change`}
            >
              <i className="f-dot" />
              {WEIGHT_META[clash.weight].label}
            </button>
          </div>

          <div className="f-card-body">
            <div className="f-clash-sec">
              <span className="f-eyebrow">Analysis</span>
              <NodeList nodes={clash.analysis} path={[]} handlers={handlers} />
              <button type="button" className="f-add" onClick={addRoot}>
                + line
              </button>
            </div>

            <div className="f-clash-sec">
              <span className="f-eyebrow">Examples &amp; dropped evidence</span>
              <ExampleList
                ownerId={clash.id}
                examples={clash.examples}
                onChange={(examples) => patch(clash.id, { examples })}
                placeholder="Example, card, or evidence they dropped…"
              />
              <button
                type="button"
                className="f-add"
                onClick={() => patch(clash.id, { examples: [...clash.examples, ""] })}
              >
                + example
              </button>
            </div>

            <div className="f-clash-sec">
              <span className="f-eyebrow">Weighing</span>
              <AutoTextarea
                className="f-weigh-note"
                aria-label={`Weighing for ${clash.title || "this clash"}`}
                placeholder="Why this side wins it — and why it outweighs the other clashes. Magnitude, probability, timeframe, reversibility…"
                value={clash.weighing}
                onChange={(value) => patch(clash.id, { weighing: value })}
              />
            </div>
          </div>
        </>
      )}
    </article>
  );
}
