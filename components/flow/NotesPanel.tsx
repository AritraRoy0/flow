import type { Dispatch, RefObject, SetStateAction } from "react";

type NotesPanelProps = {
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  notesRef: RefObject<HTMLTextAreaElement | null>;
};

// One running notepad for the whole round, so cross-applications and tags
// written during the PMC are still in front of you in the PMR.
export function NotesPanel({
  notes,
  setNotes,
  notesRef,
}: NotesPanelProps) {
  return (
    <section className="f-panel f-notes-panel">
      <div className="f-panel-head">
        <span className="f-eyebrow">Round notes</span>
        <span className="f-count">{notes.length}</span>
      </div>
      <textarea
        ref={notesRef}
        className="f-notes"
        placeholder="Notes for the whole round — they stay put across every speech. Cross-applications, tags, things to hit in rebuttal…"
        aria-label="Round notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
    </section>
  );
}
