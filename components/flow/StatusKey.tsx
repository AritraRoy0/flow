import { STATUS_META, STATUS_ORDER } from "@/lib/flow/constants";
import { StatusChip } from "./StatusChip";

type StatusKeyProps = {
  downloadFlow: () => void;
};

export function StatusKey({
  downloadFlow,
}: StatusKeyProps) {
  return (
    <section className="f-panel">
      <div className="f-panel-head">
        <span className="f-eyebrow">Status key</span>
        <button type="button" className="f-btn" onClick={downloadFlow} style={{ height: 24 }}>
          Download .md
        </button>
      </div>
      <div className="f-panel-body">
        <div className="f-legend">
          {STATUS_ORDER.map((status) => (
            <div className="f-legend-row" key={status}>
              <StatusChip status={status} />
              <span>{STATUS_META[status].hint}</span>
            </div>
          ))}
          <div className="f-legend-row">
            <span className="f-chip ghost">★ Voter</span>
            <span>Pull this through in the rebuttal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
