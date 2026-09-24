import type { Dispatch, SetStateAction } from "react";
import type { Speech, Theme } from "@/lib/flow/types";
import { IconBell, IconBellOff, IconBook, IconCopy, IconKeyboard, IconMoon, IconReset, IconSliders, IconSun } from "./Icons";

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
  resetRound: () => void;
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
  resetRound,
}: TopBarProps) {
  return (
    <header className="f-top">
      <div className="f-brand">
        <span className="f-brand-mark">f</span>
        <span>
          flow<em>.</em>
        </span>
      </div>
      <span className="f-top-divider" />
      <div className={`f-live ${running ? "on" : ""}`}>
        <i className={`f-dot ${running ? "on" : ""}`} />
        {running ? `${speech.key} speaking` : "Clock paused"}
        <span className="f-live-format">APDA</span>
      </div>
      <span className="f-saved">
        <i className="f-saved-dot" />
        {savedLabel}
      </span>
      <div className="f-top-actions">
        <button
          type="button"
          className="f-btn ghost"
          onClick={onLoadSample}
          title="Load a sample debate flow"
        >
          <IconBook />
          <span className="f-btn-label">Load sample</span>
        </button>
        <button
          type="button"
          className="f-btn ghost danger"
          onClick={resetRound}
          title="Reset the whole round"
        >
          <IconReset />
          <span className="f-btn-label">Reset round</span>
        </button>
        <span className="f-top-divider" />
        <button
          type="button"
          className="f-btn icon ghost"
          aria-pressed={sound}
          aria-label={sound ? "Signal chimes on" : "Signal chimes off"}
          onClick={() => setSound((value) => !value)}
          title={sound ? "Signal chimes on" : "Signal chimes off"}
        >
          {sound ? <IconBell /> : <IconBellOff />}
        </button>
        <button
          type="button"
          className="f-btn icon ghost"
          aria-label="Toggle theme"
          onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
          title="Toggle theme (T)"
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <button
          type="button"
          className="f-btn icon ghost"
          aria-label="Keyboard shortcuts"
          onClick={() => openSheet("keys")}
          title="Keyboard shortcuts (?)"
        >
          <IconKeyboard />
        </button>
        <button type="button" className="f-btn" onClick={() => openSheet("setup")} title="Round setup">
          <IconSliders />
          <span className="f-btn-label">Round setup</span>
        </button>
        <button type="button" className="f-btn primary" onClick={copyFlow} title="Copy the whole flow (E)">
          <IconCopy />
          <span className="f-btn-label">Copy flow</span>
        </button>
      </div>
    </header>
  );
}
