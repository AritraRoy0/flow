import type { RefObject } from "react";
import type { Clash, ClashTally, Speech } from "@/lib/flow/types";
import { ClashCard } from "./ClashCard";

type ClashesSectionProps = {
  clashes: Clash[];
  visibleClashes: Clash[];
  clashTally: ClashTally;
  speech: Speech;
  clashInputRef: RefObject<HTMLInputElement | null>;
  clashDraft: string;
  setClashDraft: (value: string) => void;
  addClash: (title: string) => void;
  patchClash: (id: string, next: Partial<Clash>) => void;
  removeClash: (id: string) => void;
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
};

export function ClashesSection({
  clashes,
  visibleClashes,
  clashTally,
  speech,
  clashInputRef,
  clashDraft,
  setClashDraft,
  addClash,
  patchClash,
  removeClash,
  focusKey,
  setFocusKey,
}: ClashesSectionProps) {
  return (
    <section className="f-clashes" aria-label="Clashes and weighing">
      <div className="f-clash-head">
        <span className="f-clash-title">
          <strong>Clashes &amp; weighing</strong>
          <i>Where the round is actually won — open in every speech</i>
        </span>
        <span className="f-tally">
          <span className="f-tally-pill gov" title="Clashes Government is currently ahead on">
            GOV <b>{clashTally.GOV}</b>
          </span>
          <span className="f-tally-pill" title="Clashes nobody has broken open yet">
            EVEN <b>{clashTally.even}</b>
          </span>
          <span className="f-tally-pill opp" title="Clashes Opposition is currently ahead on">
            OPP <b>{clashTally.OPP}</b>
          </span>
          {clashTally.key > 0 && (
            <span className="f-tally-pill" title="Clashes marked as voting issues">
              ★ <b>{clashTally.key}</b>
            </span>
          )}
        </span>
      </div>

      <div className="f-composer" style={{ marginBottom: 12 }}>
        <span aria-hidden>+</span>
        <input
          ref={clashInputRef}
          placeholder={`New clash — noted in ${speech.key}  (C)`}
          aria-label="New clash"
          value={clashDraft}
          onChange={(event) => setClashDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addClash(clashDraft);
            }
          }}
        />
      </div>

      {visibleClashes.length > 0 ? (
        <div className="f-clash-grid">
          {visibleClashes.map((clash) => (
            <ClashCard
              key={clash.id}
              clash={clash}
              currentSpeech={speech.key}
              currentSide={speech.side}
              patch={patchClash}
              remove={removeClash}
              focusKey={focusKey}
              setFocusKey={setFocusKey}
            />
          ))}
        </div>
      ) : (
        <p className="f-empty">
          {clashes.length
            ? "No clash matches this filter."
            : "No clashes yet — name the two or three questions this round turns on."}
          <br />
          Each one holds its own analysis, its examples and dropped evidence, and the comparative you
          will give in the rebuttal.
        </p>
      )}
    </section>
  );
}
