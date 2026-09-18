import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Speech } from "@/lib/flow/types";

type NotesPanelProps = {
  speech: Speech;
  notes: Record<string, string>;
  setNotes: Dispatch<SetStateAction<Record<string, string>>>;
  notesRef: RefObject<HTMLTextAreaElement | null>;
};

export function NotesPanel({
  speech,
  notes,
  setNotes,
  notesRef,
}: NotesPanelProps) {
  return (
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
  );
}
