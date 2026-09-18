import type { Dispatch, SetStateAction } from "react";
import type { Poi, Speech } from "@/lib/flow/types";

type PoiPanelProps = {
  speech: Speech;
  speechPois: Poi[];
  poiOpen: boolean;
  poiText: string;
  setPoiText: (text: string) => void;
  addPoi: (status: Poi["status"]) => void;
  setPois: Dispatch<SetStateAction<Poi[]>>;
};

export function PoiPanel({
  speech,
  speechPois,
  poiOpen,
  poiText,
  setPoiText,
  addPoi,
  setPois,
}: PoiPanelProps) {
  return (
    <section className="f-panel">
      <div className="f-panel-head">
        <span className="f-eyebrow">Points of information</span>
        <span className="f-count">{speechPois.length}</span>
      </div>
      <div className="f-panel-body">
        {speech.poi ? (
          <>
            <div className="f-poi-stats">
              <div className="f-poi-stat yes">
                <span className="f-eyebrow">Taken</span>
                <b>{speechPois.filter((poi) => poi.status === "accepted").length}</b>
              </div>
              <div className="f-poi-stat no">
                <span className="f-eyebrow">Declined</span>
                <b>{speechPois.filter((poi) => poi.status === "declined").length}</b>
              </div>
            </div>
            {!poiOpen && (
              <p className="f-poi-locked">
                Protected time — POIs are not in order right now.
              </p>
            )}
            <input
              className="f-poi-input"
              style={{ marginTop: poiOpen ? 0 : 8 }}
              placeholder="What was asked?"
              aria-label="Point of information note"
              value={poiText}
              onChange={(event) => setPoiText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addPoi("accepted");
              }}
            />
            <div className="f-poi-actions">
              <button type="button" className="f-btn" onClick={() => addPoi("accepted")}>
                Taken (P)
              </button>
              <button type="button" className="f-btn" onClick={() => addPoi("declined")}>
                Declined (⇧P)
              </button>
            </div>
            <div className="f-poi-list">
              {speechPois.map((poi) => (
                <div className={`f-poi-item ${poi.status === "accepted" ? "yes" : "no"}`} key={poi.id}>
                  <b>{poi.status === "accepted" ? "TAKEN" : "DECL"}</b>
                  <span>{poi.text}</span>
                  <button
                    type="button"
                    onClick={() => setPois((items) => items.filter((item) => item.id !== poi.id))}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="f-poi-locked">
            {speech.key} is a rebuttal — points of information are not in order for the whole speech.
          </p>
        )}
      </div>
    </section>
  );
}
