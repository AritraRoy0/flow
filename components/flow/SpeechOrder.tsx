import { formatClock } from "@/lib/flow/helpers";
import type { Speech } from "@/lib/flow/types";

type SpeechOrderProps = {
  speeches: Speech[];
  current: number;
  elapsed: number;
  goTo: (index: number) => void;
};

export function SpeechOrder({
  speeches,
  current,
  elapsed,
  goTo,
}: SpeechOrderProps) {
  return (
    <section className="f-panel">
      <div className="f-panel-head">
        <span className="f-eyebrow">Speech order</span>
        <span className="f-count">{speeches.length}</span>
      </div>
      <div className="f-speeches">
        {speeches.map((item, index) => {
          const used = index === current ? elapsed : item.elapsed;
          const isOver = used > item.duration;
          return (
            <button
              type="button"
              key={item.key}
              className={`f-speech ${item.side === "GOV" ? "gov" : "opp"} ${
                index === current ? "active" : ""
              } ${index < current ? "done" : ""}`}
              onClick={() => goTo(index)}
            >
              <span className="f-speech-bar" />
              <span className="f-speech-name">
                <strong>
                  {item.key}
                  {item.speaker ? ` · ${item.speaker}` : ""}
                </strong>
                <span>{item.role}</span>
              </span>
              <span className={`f-speech-time f-mono ${isOver ? "over" : ""}`}>
                {formatClock(used)}
                <i>of {formatClock(item.duration)}</i>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
