import { STATUS_META } from "@/lib/flow/constants";
import type { Status } from "@/lib/flow/types";

export function StatusChip({ status, onClick }: { status: Status; onClick?: () => void }) {
  const meta = STATUS_META[status];
  const content = (
    <>
      <i className="f-dot" />
      {meta.label}
    </>
  );
  if (!onClick) return <span className={`f-chip ${status}`}>{content}</span>;
  return (
    <button type="button" className={`f-chip ${status}`} onClick={onClick} title={`${meta.hint} — click to change`}>
      {content}
    </button>
  );
}
