import type { Dispatch, SetStateAction } from "react";
import { SPEECH_TEMPLATE } from "@/lib/flow/constants";
import { formatClock } from "@/lib/flow/helpers";
import type { Speech } from "@/lib/flow/types";

type SetupSheetProps = {
  onClose: () => void;
  motion: string;
  setMotion: (value: string) => void;
  govTeam: string;
  setGovTeam: (value: string) => void;
  oppTeam: string;
  setOppTeam: (value: string) => void;
  roundLabel: string;
  setRoundLabel: (value: string) => void;
  grace: number;
  setGrace: (value: number) => void;
  speeches: Speech[];
  setSpeeches: Dispatch<SetStateAction<Speech[]>>;
  resetRound: () => void;
};

export function SetupSheet({
  onClose,
  motion,
  setMotion,
  govTeam,
  setGovTeam,
  oppTeam,
  setOppTeam,
  roundLabel,
  setRoundLabel,
  grace,
  setGrace,
  speeches,
  setSpeeches,
  resetRound,
}: SetupSheetProps) {
  return (
    <div className="f-scrim" role="dialog" aria-modal="true" aria-label="Round setup" onMouseDown={onClose}>
      <div className="f-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="f-sheet-head">
          <h2>Round setup</h2>
          <button type="button" className="f-btn icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="f-sheet-body">
          <label className="f-field">
            <span>Motion</span>
            <textarea rows={2} value={motion} onChange={(event) => setMotion(event.target.value)} />
          </label>
          <div className="f-field-row">
            <label className="f-field">
              <span>Government</span>
              <input value={govTeam} onChange={(event) => setGovTeam(event.target.value)} />
            </label>
            <label className="f-field">
              <span>Opposition</span>
              <input value={oppTeam} onChange={(event) => setOppTeam(event.target.value)} />
            </label>
          </div>
          <div className="f-field-row">
            <label className="f-field">
              <span>Round label</span>
              <input value={roundLabel} onChange={(event) => setRoundLabel(event.target.value)} />
            </label>
            <label className="f-field">
              <span>Grace period (seconds)</span>
              <input
                type="number"
                min={0}
                max={60}
                value={grace}
                onChange={(event) => setGrace(Math.max(0, Math.min(60, Number(event.target.value) || 0)))}
              />
            </label>
          </div>

          <div className="f-field">
            <span>Speakers &amp; times</span>
            <div>
              {speeches.map((item, index) => (
                <div className="f-setup-speech" key={item.key}>
                  <strong style={{ fontSize: 12.5 }}>{item.key}</strong>
                  <input
                    aria-label={`${item.key} speaker`}
                    placeholder="Speaker name"
                    value={item.speaker}
                    onChange={(event) =>
                      setSpeeches((items) =>
                        items.map((row, i) =>
                          i === index ? { ...row, speaker: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <span className="f-dur">
                    <button
                      type="button"
                      onClick={() =>
                        setSpeeches((items) =>
                          items.map((row, i) =>
                            i === index ? { ...row, duration: Math.max(30, row.duration - 30) } : row,
                          ),
                        )
                      }
                      aria-label={`Shorten ${item.key}`}
                    >
                      −
                    </button>
                    <b>{formatClock(item.duration)}</b>
                    <button
                      type="button"
                      onClick={() =>
                        setSpeeches((items) =>
                          items.map((row, i) =>
                            i === index ? { ...row, duration: row.duration + 30 } : row,
                          ),
                        )
                      }
                      aria-label={`Lengthen ${item.key}`}
                    >
                      +
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" className="f-btn danger" onClick={resetRound}>
              Reset round
            </button>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="f-btn"
                onClick={() => setSpeeches((items) => items.map((item, index) => ({
                  ...item,
                  duration: SPEECH_TEMPLATE[index].duration,
                })))}
              >
                Restore APDA times
              </button>
              <button type="button" className="f-btn primary" onClick={onClose}>
                Done
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
