"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_GRACE, PROTECTED_TIME, STORAGE_KEY } from "@/lib/flow/constants";
import { buildExport } from "@/lib/flow/export";
import { makeClash, makeNode, makeSpeeches, uid } from "@/lib/flow/helpers";
import { readStored, type Persisted } from "@/lib/flow/persistence";
import { sampleUBIDebate } from "@/lib/flow/sample";
import { elapsedFor, getTimerView } from "@/lib/flow/timer";
import { nodeMatches } from "@/lib/flow/tree";
import type { Argument, Clash, ClashTally, Filter, Side, SideTally, Speech, Theme } from "@/lib/flow/types";
import { ClashesSection } from "./ClashesSection";
import { FlowBoard } from "./FlowBoard";
import { KeysSheet } from "./KeysSheet";
import { NotesPanel } from "./NotesPanel";
import { RoundStrip } from "./RoundStrip";
import { SetupSheet } from "./SetupSheet";
import { SpeechOrder } from "./SpeechOrder";
import { StatusKey } from "./StatusKey";
import { TimerCard } from "./TimerCard";
import { TopBar } from "./TopBar";
import "./flow.css";

export function FlowApp() {
  const sample = sampleUBIDebate();
  const [theme, setTheme] = useState<Theme>("light");
  const [motion, setMotion] = useState(sample.motion);
  const [govTeam, setGovTeam] = useState(sample.govTeam);
  const [oppTeam, setOppTeam] = useState(sample.oppTeam);
  const [roundLabel, setRoundLabel] = useState(sample.roundLabel);
  const [grace, setGrace] = useState(DEFAULT_GRACE);

  const [speeches, setSpeeches] = useState<Speech[]>(makeSpeeches);
  const [current, setCurrent] = useState(0);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [argumentsList, setArgumentsList] = useState<Argument[]>(sample.arguments);
  const [clashes, setClashes] = useState<Clash[]>(sample.clashes);
  const [notes, setNotes] = useState(sample.notes);

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Record<Side, string>>({ GOV: "", OPP: "" });
  const [clashDraft, setClashDraft] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const [sheet, setSheet] = useState<"setup" | "keys" | null>(null);
  const [sound, setSound] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const govInputRef = useRef<HTMLInputElement>(null);
  const oppInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const clashInputRef = useRef<HTMLInputElement>(null);

  const speech = speeches[current];

  /* -- derived timer values ---------------------------------------- */
  const elapsed = elapsedFor(speech, running, now);
  const timer = getTimerView(speech, elapsed, grace);

  /* -- load --------------------------------------------------------- */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("flow-theme");
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    const data = readStored();
    setHydrated(true);
    if (!data) return;
    if (data.motion) setMotion(data.motion);
    if (data.govTeam) setGovTeam(data.govTeam);
    if (data.oppTeam) setOppTeam(data.oppTeam);
    if (data.roundLabel) setRoundLabel(data.roundLabel);
    if (typeof data.grace === "number") setGrace(data.grace);
    if (data.speeches) setSpeeches(data.speeches);
    if (typeof data.current === "number") setCurrent(data.current);
    if (data.argumentsList) setArgumentsList(data.argumentsList);
    if (data.clashes) setClashes(data.clashes);
    if (typeof data.notes === "string") setNotes(data.notes);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* -- theme on <html> so the page background follows --------------- */
  useEffect(() => {
    document.documentElement.dataset.flowTheme = theme;
    window.localStorage.setItem("flow-theme", theme);
  }, [theme]);

  /* -- ticking only while the clock runs ---------------------------- */
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [running]);

  /* -- autosave ----------------------------------------------------- */
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const payload: Persisted = {
        version: 3,
        motion,
        govTeam,
        oppTeam,
        roundLabel,
        grace,
        speeches: speeches.map((item) => ({ ...item, startedAt: undefined })),
        current,
        argumentsList,
        clashes,
        notes,
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSavedAt(Date.now());
      } catch {
        /* storage full or blocked — the round stays in memory */
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [hydrated, motion, govTeam, oppTeam, roundLabel, grace, speeches, current, argumentsList, clashes, notes]);

  /* -- audible signals ---------------------------------------------- */
  const beep = useCallback(
    (times: number) => {
      if (!sound) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audioRef.current = audioRef.current ?? new Ctor();
        const ctx = audioRef.current;
        for (let index = 0; index < times; index += 1) {
          const start = ctx.currentTime + index * 0.2;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 660;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        }
      } catch {
        /* audio unavailable */
      }
    },
    [sound],
  );

  useEffect(() => {
    if (!running) return;
    const marks: { id: string; at: number; beeps: number }[] = [
      { id: "poi-open", at: PROTECTED_TIME, beeps: 1 },
      { id: "poi-close", at: speech.duration - PROTECTED_TIME, beeps: 1 },
      { id: "time", at: speech.duration, beeps: 2 },
      { id: "grace", at: speech.duration + grace, beeps: 3 },
    ];
    marks.forEach((mark) => {
      const key = `${speech.key}-${mark.id}`;
      if (elapsed >= mark.at && !firedRef.current.has(key)) {
        firedRef.current.add(key);
        beep(mark.beeps);
      }
    });
  }, [elapsed, running, speech.key, speech.duration, grace, beep]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSample = useCallback(() => {
    const sample = sampleUBIDebate();
    setMotion(sample.motion);
    setGovTeam(sample.govTeam);
    setOppTeam(sample.oppTeam);
    setRoundLabel(sample.roundLabel);
    setArgumentsList(sample.arguments);
    setClashes(sample.clashes);
    setNotes(sample.notes);
    setToast("Sample UBI debate loaded!");
  }, []);

  /* -- timer actions ------------------------------------------------ */
  const commit = useCallback(
    (index: number, extra: Partial<Speech> = {}) =>
      setSpeeches((items) =>
        items.map((item, i) =>
          i === index
            ? {
                ...item,
                elapsed: item.startedAt
                  ? item.elapsed + Math.max(0, Math.floor((Date.now() - item.startedAt) / 1000))
                  : item.elapsed,
                startedAt: undefined,
                ...extra,
              }
            : item,
        ),
      ),
    [],
  );

  const toggle = useCallback(() => {
    setNow(Date.now());
    if (running) {
      commit(current);
      setRunning(false);
    } else {
      setSpeeches((items) =>
        items.map((item, i) => (i === current ? { ...item, startedAt: Date.now() } : item)),
      );
      setRunning(true);
    }
  }, [running, current, commit]);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), speeches.length - 1);
      if (next === current) return;
      if (running) commit(current);
      setRunning(false);
      setCurrent(next);
    },
    [current, running, commit, speeches.length],
  );

  const adjust = useCallback(
    (delta: number) =>
      setSpeeches((items) =>
        items.map((item, i) =>
          i === current ? { ...item, duration: Math.max(30, item.duration + delta) } : item,
        ),
      ),
    [current],
  );

  const resetSpeech = useCallback(() => {
    setRunning(false);
    firedRef.current = new Set([...firedRef.current].filter((key) => !key.startsWith(`${speech.key}-`)));
    setSpeeches((items) =>
      items.map((item, i) => (i === current ? { ...item, elapsed: 0, startedAt: undefined } : item)),
    );
  }, [current, speech.key]);

  /* -- flow actions -------------------------------------------------- */
  const patchArgument = useCallback(
    (id: string, next: Partial<Argument>) =>
      setArgumentsList((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item))),
    [],
  );

  const removeArgument = useCallback(
    (id: string) => setArgumentsList((items) => items.filter((item) => item.id !== id)),
    [],
  );

  const addArgument = useCallback(
    (side: Side, title: string) => {
      const clean = title.trim();
      if (!clean) return;
      const id = uid();
      setArgumentsList((items) => [
        ...items,
        {
          id,
          side,
          speech: speech.key,
          title: clean,
          status: "open",
          starred: false,
          collapsed: false,
          analysis: [makeNode(side, speech.key)],
          examples: [],
        },
      ]);
      setDraft((value) => ({ ...value, [side]: "" }));
      setFocusKey(`${id}:0`);
    },
    [speech.key],
  );

  const patchClash = useCallback(
    (id: string, next: Partial<Clash>) =>
      setClashes((items) => items.map((item) => (item.id === id ? { ...item, ...next } : item))),
    [],
  );

  const removeClash = useCallback(
    (id: string) => setClashes((items) => items.filter((item) => item.id !== id)),
    [],
  );

  const addClash = useCallback(
    (title: string) => {
      const clean = title.trim();
      if (!clean) return;
      const clash = makeClash(clean, speech.key, speech.side);
      setClashes((items) => [...items, clash]);
      setClashDraft("");
      setFocusKey(`${clash.id}:0`);
    },
    [speech.key, speech.side],
  );

  // The band sits below the fold, so the shortcut has to bring it into view
  // before the caret lands in it.
  const jumpToClashes = useCallback(() => {
    const input = clashInputRef.current;
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus({ preventScroll: true });
  }, []);

  const resetRound = useCallback(() => {
    if (!window.confirm("Reset the whole round? Arguments, clashes, notes and all times will be cleared.")) return;
    setSpeeches(makeSpeeches());
    setCurrent(0);
    setRunning(false);
    setArgumentsList([]);
    setClashes([]);
    setNotes("");
    firedRef.current = new Set();
    setSheet(null);
    setToast("Round cleared");
  }, []);

  const copyFlow = useCallback(async () => {
    const text = buildExport({ motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, clashes, notes });
    try {
      await navigator.clipboard.writeText(text);
      setToast("Flow copied to clipboard");
    } catch {
      setToast("Clipboard blocked — try the download instead");
    }
  }, [motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, clashes, notes]);

  const downloadFlow = useCallback(() => {
    const text = buildExport({ motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, clashes, notes });
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(motion || "flow").slice(0, 48).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "flow"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Flow downloaded");
  }, [motion, govTeam, oppTeam, roundLabel, speeches, argumentsList, clashes, notes]);

  /* -- keyboard ------------------------------------------------------ */
  // Kept in refs so the listener can bind once and still see fresh values.
  const currentRef = useRef(current);
  const actions = useRef({ toggle, goTo, adjust, resetSpeech, copyFlow, jumpToClashes });
  useEffect(() => {
    currentRef.current = current;
    actions.current = { toggle, goTo, adjust, resetSpeech, copyFlow, jumpToClashes };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if (event.key === "Escape") {
        setSheet(null);
        if (typing) target?.blur();
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case " ":
          event.preventDefault();
          actions.current.toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          actions.current.goTo(currentRef.current + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          actions.current.goTo(currentRef.current - 1);
          break;
        case "+":
        case "=":
          actions.current.adjust(30);
          break;
        case "-":
        case "_":
          actions.current.adjust(-30);
          break;
        case "g":
          event.preventDefault();
          govInputRef.current?.focus();
          break;
        case "o":
          event.preventDefault();
          oppInputRef.current?.focus();
          break;
        case "n":
          event.preventDefault();
          notesRef.current?.focus();
          break;
        case "c":
          event.preventDefault();
          actions.current.jumpToClashes();
          break;
        case "r":
          actions.current.resetSpeech();
          break;
        case "t":
          setTheme((value) => (value === "dark" ? "light" : "dark"));
          break;
        case "e":
          void actions.current.copyFlow();
          break;
        case "?":
          setSheet((value) => (value === "keys" ? null : "keys"));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -- board data ----------------------------------------------------- */
  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      argumentsList.filter((argument) => {
        if (filter === "starred" && !argument.starred) return false;
        if (filter !== "all" && filter !== "starred" && argument.status !== filter) return false;
        if (!needle) return true;
        return (
          argument.title.toLowerCase().includes(needle) ||
          argument.examples.some((line) => line.toLowerCase().includes(needle)) ||
          nodeMatches(argument.analysis, needle)
        );
      }),
    [argumentsList, filter, needle],
  );

  const bySide = useMemo(
    () => ({
      GOV: visible.filter((argument) => argument.side === "GOV"),
      OPP: visible.filter((argument) => argument.side === "OPP"),
    }),
    [visible],
  );

  const tally = useMemo((): Record<Side, SideTally> => {
    const seed = () => ({ open: 0, answered: 0, dropped: 0, turned: 0, total: 0, starred: 0 });
    const result = { GOV: seed(), OPP: seed() };
    argumentsList.forEach((argument) => {
      const bucket = result[argument.side];
      bucket[argument.status] += 1;
      bucket.total += 1;
      if (argument.starred) bucket.starred += 1;
    });
    return result;
  }, [argumentsList]);

  // Status filters are argument-only concepts, so clashes answer to the
  // search box and to Voters (starred) — anything else leaves them all up.
  const visibleClashes = useMemo(
    () =>
      clashes.filter((clash) => {
        if (filter === "starred" && !clash.starred) return false;
        if (!needle) return true;
        return (
          clash.title.toLowerCase().includes(needle) ||
          clash.weighing.toLowerCase().includes(needle) ||
          clash.examples.some((line) => line.toLowerCase().includes(needle)) ||
          nodeMatches(clash.analysis, needle)
        );
      }),
    [clashes, filter, needle],
  );

  const clashTally = useMemo((): ClashTally => {
    const result = { GOV: 0, OPP: 0, even: 0, key: 0 };
    clashes.forEach((clash) => {
      result[clash.lean] += 1;
      if (clash.starred) result.key += 1;
    });
    return result;
  }, [clashes]);

  const savedLabel = savedAt ? "All changes saved" : "Local only";

  /* ------------------------------------------------------------------ */

  return (
    <main className="f-app" data-theme={theme}>
      <TopBar
        running={running}
        speech={speech}
        savedLabel={savedLabel}
        onLoadSample={loadSample}
        sound={sound}
        setSound={setSound}
        theme={theme}
        setTheme={setTheme}
        openSheet={setSheet}
        copyFlow={copyFlow}
        resetRound={resetRound}
      />

      <RoundStrip
        roundLabel={roundLabel}
        motion={motion}
        setMotion={setMotion}
        govTeam={govTeam}
        setGovTeam={setGovTeam}
        oppTeam={oppTeam}
        setOppTeam={setOppTeam}
        tally={tally}
      />

      <div className="f-grid">
        {/* ---- left: timer + speech order ---- */}
        <div className="f-col f-left">
          <TimerCard
            speech={speech}
            current={current}
            speeches={speeches}
            running={running}
            timer={timer}
            toggle={toggle}
            goTo={goTo}
            adjust={adjust}
            resetSpeech={resetSpeech}
          />
          <SpeechOrder speeches={speeches} current={current} elapsed={elapsed} goTo={goTo} />
        </div>

        {/* ---- centre: the flow ---- */}
        <FlowBoard
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          visible={visible}
          argumentsList={argumentsList}
          bySide={bySide}
          tally={tally}
          speech={speech}
          patchArgument={patchArgument}
          removeArgument={removeArgument}
          focusKey={focusKey}
          setFocusKey={setFocusKey}
          govInputRef={govInputRef}
          oppInputRef={oppInputRef}
          draft={draft}
          setDraft={setDraft}
          addArgument={addArgument}
        />

        {/* ---- right: notes, legend ---- */}
        <div className="f-col f-right">
          <NotesPanel notes={notes} setNotes={setNotes} notesRef={notesRef} />
          <StatusKey downloadFlow={downloadFlow} />
        </div>
      </div>

      <ClashesSection
        clashes={clashes}
        visibleClashes={visibleClashes}
        clashTally={clashTally}
        speech={speech}
        clashInputRef={clashInputRef}
        clashDraft={clashDraft}
        setClashDraft={setClashDraft}
        addClash={addClash}
        patchClash={patchClash}
        removeClash={removeClash}
        focusKey={focusKey}
        setFocusKey={setFocusKey}
      />

      {sheet === "setup" && (
        <SetupSheet
          onClose={() => setSheet(null)}
          motion={motion}
          setMotion={setMotion}
          govTeam={govTeam}
          setGovTeam={setGovTeam}
          oppTeam={oppTeam}
          setOppTeam={setOppTeam}
          roundLabel={roundLabel}
          setRoundLabel={setRoundLabel}
          grace={grace}
          setGrace={setGrace}
          speeches={speeches}
          setSpeeches={setSpeeches}
        />
      )}

      {sheet === "keys" && <KeysSheet onClose={() => setSheet(null)} />}

      {toast && <div className="f-toast">{toast}</div>}
    </main>
  );
}
