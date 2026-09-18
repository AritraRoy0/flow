import type { SideTally, Side } from "@/lib/flow/types";
import { AutoTextarea } from "./AutoTextarea";

type RoundStripProps = {
  roundLabel: string;
  motion: string;
  setMotion: (value: string) => void;
  govTeam: string;
  setGovTeam: (value: string) => void;
  oppTeam: string;
  setOppTeam: (value: string) => void;
  tally: Record<Side, SideTally>;
};

export function RoundStrip({
  roundLabel,
  motion,
  setMotion,
  govTeam,
  setGovTeam,
  oppTeam,
  setOppTeam,
  tally,
}: RoundStripProps) {
  return (
    <section className="f-strip">
      <div className="f-strip-main">
        <span className="f-eyebrow">{roundLabel} · Motion</span>
        <AutoTextarea
          className="f-motion"
          aria-label="Motion"
          placeholder="Type the motion…"
          value={motion}
          onChange={setMotion}
        />
        <div className="f-teams">
          <span className="f-team">
            <span className="f-tag gov">GOV</span>
            <input
              aria-label="Government team"
              placeholder="Government team"
              value={govTeam}
              onChange={(event) => setGovTeam(event.target.value)}
            />
          </span>
          <span className="f-vs">versus</span>
          <span className="f-team">
            <span className="f-tag opp">OPP</span>
            <input
              aria-label="Opposition team"
              placeholder="Opposition team"
              value={oppTeam}
              onChange={(event) => setOppTeam(event.target.value)}
            />
          </span>
        </div>
      </div>
      <div className="f-strip-side">
        <div className="f-stat gov">
          <span className="f-eyebrow">Gov live</span>
          <b>{tally.GOV.open + tally.GOV.dropped}</b>
        </div>
        <div className="f-stat opp">
          <span className="f-eyebrow">Opp live</span>
          <b>{tally.OPP.open + tally.OPP.dropped}</b>
        </div>
        <div className="f-stat">
          <span className="f-eyebrow">Voters</span>
          <b>{tally.GOV.starred + tally.OPP.starred}</b>
        </div>
      </div>
    </section>
  );
}
