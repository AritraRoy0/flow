import type { Dispatch, SetStateAction } from "react";
import type { Speech, Theme } from "@/lib/flow/types";

type TopBarProps = {
  running: boolean;
  speech: Speech;
  savedLabel: string;
  onLoadSample: () => void;
  sound: boolean;
  setSound: Dispatch<SetStateAction<boolean>>;
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  openSheet: (sheet: "setup" | "keys") => void;
  copyFlow: () => void;
};

export function TopBar({
  running,
  speech,
  savedLabel,
  onLoadSample,
  sound,
  setSound,
  theme,
  setTheme,
  openSheet,
  copyFlow,
}: TopBarProps) {
  return (
    <header className="f-top">
      <div className="f-brand">
        <span className="f-brand-mark">F</span>
        flow<em>.</em>
      </div>
      <span className="f-top-divider" />
      <div className="f-live">
        <i className={`f-dot ${running ? "on" : ""}`} />
        {running ? `${speech.key} speaking` : "Clock paused"}
        <span style={{ color: "var(--faint)" }}>· APDA</span>
      </div>
      <span className="f-saved">{savedLabel}</span>
      <div className="f-top-actions">
        <button
          type="button"
          className="f-btn"
          onClick={onLoadSample}
          title="Load a sample debate flow"
        >
          📚 Load sample
        </button>
        <button
          type="button"
          className="f-btn icon"
          aria-pressed={sound}
          onClick={() => setSound((value) => !value)}
          title={sound ? "Signal chimes on" : "Signal chimes off"}
        >
          {sound ? "🔔" : "🔕"}
        </button>
        <button
          type="button"
          className="f-btn icon"
          onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
          title="Toggle theme (T)"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button type="button" className="f-btn" onClick={() => openSheet("keys")} title="Keyboard shortcuts (?)">
          ⌘ Keys
        </button>
        <button type="button" className="f-btn" onClick={() => openSheet("setup")}>
          Round setup
        </button>
        <button type="button" className="f-btn primary" onClick={copyFlow} title="Copy the whole flow (E)">
          Copy flow
        </button>
      </div>
    </header>
  );
}
