import { PROTECTED_TIME } from "@/lib/flow/constants";
import { formatClock } from "@/lib/flow/helpers";
import type { TimerView } from "@/lib/flow/timer";
import type { Speech } from "@/lib/flow/types";

type TimerCardProps = {
  speech: Speech;
  current: number;
  speeches: Speech[];
  running: boolean;
  timer: TimerView;
  toggle: () => void;
  goTo: (index: number) => void;
  adjust: (delta: number) => void;
  resetSpeech: () => void;
};

export function TimerCard({
  speech,
  current,
  speeches,
  running,
  timer,
  toggle,
  goTo,
  adjust,
  resetSpeech,
}: TimerCardProps) {
  const { elapsed, remaining, overBy, progress, phase, phaseLabel, phaseTone, timerTone } = timer;

  return (
    <div className={`f-timer ${timerTone}`}>
      <span className="f-flash" key={`${speech.key}-${phase}`} />
      <div className="f-timer-head">
        <span className={`f-tag ${speech.side === "GOV" ? "gov" : "opp"}`}>{speech.side}</span>
        <span className="f-mono" style={{ color: "#9db3a4", fontSize: 11 }}>
          Speech {current + 1} of {speeches.length}
        </span>
      </div>
      <div className="f-timer-role">
        <strong>
          {speech.key} · {speech.speaker || "—"}
        </strong>
        <span>{speech.role}</span>
      </div>
      <div className="f-timer-face">
        <span className="f-clock">
          {remaining < 0 ? `+${formatClock(overBy)}` : formatClock(remaining)}
        </span>
        <span className="f-clock-sub">
          <span className={`f-phase ${phaseTone}`}>{phaseLabel}</span>
          <span className="f-mono">
            {formatClock(elapsed)} / {formatClock(speech.duration)}
          </span>
        </span>
      </div>
      <div className="f-track">
        {speech.poi && (
          <span
            className="f-track-poi"
            style={{
              left: `${(PROTECTED_TIME / speech.duration) * 100}%`,
              right: `${(PROTECTED_TIME / speech.duration) * 100}%`,
            }}
          />
        )}
        <span className="f-track-fill" style={{ width: `${progress}%` }} />
        {speech.poi && (
          <>
            <span className="f-track-mark" style={{ left: `${(PROTECTED_TIME / speech.duration) * 100}%` }} />
            <span
              className="f-track-mark"
              style={{ left: `${((speech.duration - PROTECTED_TIME) / speech.duration) * 100}%` }}
            />
          </>
        )}
      </div>
      <div className="f-track-legend">
        <span>0:00</span>
        <span>{speech.poi ? "POI window" : "no POIs"}</span>
        <span>{formatClock(speech.duration)}</span>
      </div>
      <div className="f-timer-controls">
        <button type="button" className="f-tbtn" onClick={() => adjust(-30)} title="Shorten by 30s (−)">
          −30
        </button>
        <button
          type="button"
          className={`f-tbtn go ${running ? "pause" : ""}`}
          onClick={toggle}
          title="Start or pause (Space)"
        >
          {running ? "❚❚ Pause" : remaining < 0 ? "▶ Resume" : elapsed > 0 ? "▶ Resume" : "▶ Start speech"}
        </button>
        <button type="button" className="f-tbtn" onClick={() => adjust(30)} title="Lengthen by 30s (+)">
          +30
        </button>
      </div>
      <div className="f-timer-foot">
        <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0}>
          ← Prev
        </button>
        <button type="button" onClick={resetSpeech} title="Reset this speech clock (R)">
          ↺ Reset speech
        </button>
        <button type="button" onClick={() => goTo(current + 1)} disabled={current === speeches.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
