import { AutoTextarea } from "./AutoTextarea";

/* Shared by argument and clash cards: concrete examples, cards, and the
   pieces of evidence the other side let go. */
export function ExampleList({
  ownerId,
  examples,
  onChange,
  placeholder,
}: {
  ownerId: string;
  examples: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <>
      {examples.map((line, index) => (
        <div className="f-line" key={`${ownerId}-ex-${index}`}>
          {/* A dropped card is often a sentence, not a phrase — let it wrap
              rather than scroll sideways out of sight. */}
          <AutoTextarea
            aria-label={`Example ${index + 1}`}
            placeholder={placeholder}
            value={line}
            onChange={(value) => onChange(examples.map((item, i) => (i === index ? value : item)))}
          />
          <button
            type="button"
            className="f-icon del"
            onClick={() => onChange(examples.filter((_, i) => i !== index))}
            title="Remove example"
          >
            ×
          </button>
        </div>
      ))}
    </>
  );
}
