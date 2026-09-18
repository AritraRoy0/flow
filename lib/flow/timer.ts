import { PROTECTED_TIME } from "./constants";
import type { Speech } from "./types";

export type TimerPhase = "protected" | "poi" | "warn" | "over" | "grace";

export type TimerView = {
  elapsed: number;
  remaining: number;
  overBy: number;
  progress: number;
  poiOpen: boolean;
  phase: TimerPhase;
  phaseLabel: string;
  phaseTone: string;
  timerTone: string;
};

/** Seconds spoken so far, including the live stretch since the clock started. */
export const elapsedFor = (speech: Speech, running: boolean, now: number) =>
  speech.elapsed +
  (running && speech.startedAt ? Math.max(0, Math.floor((now - speech.startedAt) / 1000)) : 0);

export const getTimerView = (speech: Speech, elapsed: number, grace: number): TimerView => {
  const remaining = speech.duration - elapsed;
  const overBy = Math.max(0, -remaining);
  const pastGrace = overBy > grace;
  const progress = Math.min(100, (elapsed / speech.duration) * 100);
  const poiOpen = speech.poi && elapsed >= PROTECTED_TIME && elapsed <= speech.duration - PROTECTED_TIME;

  const phase: TimerPhase = (() => {
    if (remaining <= 0) return pastGrace ? "over" : "grace";
    if (remaining <= PROTECTED_TIME) return "warn";
    if (poiOpen) return "poi";
    return "protected";
  })();

  const phaseLabel =
    phase === "over"
      ? "PAST GRACE"
      : phase === "grace"
        ? "GRACE PERIOD"
        : phase === "warn"
          ? speech.poi
            ? "PROTECTED · LAST MINUTE"
            : "LAST MINUTE"
          : phase === "poi"
            ? "POIs OPEN"
            : speech.poi
              ? "PROTECTED · FIRST MINUTE"
              : "NO POIs — REBUTTAL";

  const phaseTone =
    phase === "over" ? "over" : phase === "grace" ? "warn" : phase === "warn" ? "warn" : phase === "poi" ? "poi" : "protect";

  const timerTone = remaining <= 0 ? "over" : remaining <= PROTECTED_TIME ? "warn" : "";

  return { elapsed, remaining, overBy, progress, poiOpen, phase, phaseLabel, phaseTone, timerTone };
};
