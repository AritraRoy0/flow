"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Side = "PRO" | "CON";
type Speech = { type: string; side: Side; duration: number; elapsed: number; startedAt?: number };
type AnalysisNode = { id: string; text: string; replies: AnalysisNode[] };
type Argument = { id: string; side: Side; speechType: string; title: string; analysis: AnalysisNode[]; examples: string[]; responses: string[]; answered: boolean };
type Poi = { id: string; status: "accepted" | "declined"; text: string; speech: string };

const defaultSpeeches: Speech[] = [
  { type: "PM", side: "PRO", duration: 420, elapsed: 0 }, { type: "LO", side: "CON", duration: 480, elapsed: 0 },
  { type: "MG", side: "PRO", duration: 480, elapsed: 0 }, { type: "MO", side: "CON", duration: 480, elapsed: 0 },
  { type: "PMR", side: "PRO", duration: 300, elapsed: 0 }, { type: "LOR", side: "CON", duration: 300, elapsed: 0 },
];
const starterArguments: Argument[] = [
  { id: "p1", side: "PRO", speechType: "PM", title: "Contention 1", analysis: [{ id: "p1-a1", text: "The policy changes the default in a meaningful way.", replies: [] }], examples: [], responses: [], answered: false },
  { id: "p2", side: "PRO", speechType: "PM", title: "Framework", analysis: [{ id: "p2-a1", text: "Prioritize the side that best protects agency and access.", replies: [{ id: "p2-a1-r1", text: "Compare the status quo against the proposed change.", replies: [] }] }], examples: [], responses: [], answered: false },
  { id: "c1", side: "CON", speechType: "LO", title: "Case response", analysis: [{ id: "c1-a1", text: "The mechanism does not reach the people it promises to help.", replies: [] }], examples: ["A policy can look universal while missing the least-resourced group."], responses: ["Ask for a concrete link between the mechanism and the impact."], answered: true },
];
const createAnalysisNode = (text = "") => ({ id: crypto.randomUUID(), text, replies: [] });
const normalizeAnalysis = (analysis: unknown): AnalysisNode[] => Array.isArray(analysis) ? analysis.map((item) => typeof item === "string" ? createAnalysisNode(item) : { id: (item as AnalysisNode).id ?? crypto.randomUUID(), text: (item as AnalysisNode).text ?? "", replies: normalizeAnalysis((item as AnalysisNode).replies) }) : [];
const formatTime = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0")}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, "0")}`;

export default function Home() {
  const [motion, setMotion] = useState("This House Would Ban Social Media");
  const [proTeam, setProTeam] = useState("Northbridge");
  const [conTeam, setConTeam] = useState("Harbor");
  const [speeches, setSpeeches] = useState<Speech[]>(defaultSpeeches); const [current, setCurrent] = useState(0); const [running, setRunning] = useState(false);
  const [roundStarted, setRoundStarted] = useState(true); const [argumentsList, setArgumentsList] = useState<Argument[]>(starterArguments); const [pois, setPois] = useState<Poi[]>([]); const [now, setNow] = useState(0);
  const [note, setNote] = useState("Trace their mechanism before the next speech."); const [showSetup, setShowSetup] = useState(false); const [newArgument, setNewArgument] = useState<{ title: string; claim?: string }>({ title: "" }); const [argumentSide, setArgumentSide] = useState<Side>("PRO"); const [showArgumentForm, setShowArgumentForm] = useState(false); const [poiText, setPoiText] = useState(""); const [lastSaved, setLastSaved] = useState("just now");
  const activeSpeech = speeches[current];
  const displayedElapsed = activeSpeech.elapsed + (running && activeSpeech.startedAt && now ? Math.floor((now - activeSpeech.startedAt) / 1000) : 0);
  const remaining = Math.max(0, activeSpeech.duration - displayedElapsed); const progress = Math.min(100, (displayedElapsed / activeSpeech.duration) * 100);
  const sideArgs = useMemo(() => ({ pro: argumentsList.filter((argument) => argument.side === "PRO"), con: argumentsList.filter((argument) => argument.side === "CON") }), [argumentsList]);
  const activePois = pois.filter((poi) => poi.speech === activeSpeech.type);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const stored = window.localStorage.getItem("flow-round"); if (!stored) return; try { const data = JSON.parse(stored); const restoredArguments = (data.arguments ?? starterArguments).map((argument: Argument, index: number) => ({ ...argument, speechType: argument.speechType ?? (index === 2 ? "LO" : "PM"), analysis: normalizeAnalysis(argument.analysis), examples: argument.examples ?? [] })); setMotion(data.motion ?? "This House Would Ban Social Media"); setProTeam(data.proTeam ?? "Northbridge"); setConTeam(data.conTeam ?? "Harbor"); setSpeeches(data.speeches?.length === 6 ? data.speeches : defaultSpeeches); setCurrent(Math.min(data.current ?? 0, 5)); setArgumentsList(restoredArguments); setPois(data.pois ?? []); setNote(data.note ?? ""); }
    catch { window.localStorage.removeItem("flow-round"); }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => { setSpeeches((items) => items.map((speech, index) => index === current && running && speech.startedAt && Date.now() - speech.startedAt >= (speech.duration - speech.elapsed) * 1000 ? { ...speech, elapsed: speech.duration, startedAt: undefined } : speech)); }, 250); return () => window.clearInterval(timer); }, [current, running]);
  useEffect(() => { const timer = window.setTimeout(() => { window.localStorage.setItem("flow-round", JSON.stringify({ motion, proTeam, conTeam, speeches, current, arguments: argumentsList, pois, note })); setLastSaved("just now"); }, 350); return () => window.clearTimeout(timer); }, [motion, proTeam, conTeam, speeches, current, argumentsList, pois, note]);
  useEffect(() => { const timer = window.setInterval(() => setLastSaved((value) => value === "just now" ? "a moment ago" : value), 30000); return () => window.clearInterval(timer); }, []);

  const toggleTimer = () => { if (remaining === 0) return; setRunning((value) => !value); setSpeeches((items) => items.map((speech, index) => index === current ? { ...speech, elapsed: running && speech.startedAt ? speech.elapsed + Math.floor((Date.now() - speech.startedAt) / 1000) : speech.elapsed, startedAt: running ? undefined : Date.now() } : speech)); };
  const adjustTime = (amount: number) => setSpeeches((items) => items.map((speech, index) => index === current ? { ...speech, duration: Math.max(30, speech.duration + amount) } : speech));
  const goToSpeech = (index: number) => { if (running || index === current) return; setCurrent(index); setRoundStarted(true); };
  const addArgument = (event: FormEvent) => { event.preventDefault(); if (!newArgument.title.trim()) return; setArgumentsList((items) => [...items, { id: crypto.randomUUID(), side: argumentSide, speechType: activeSpeech.type, title: newArgument.title, analysis: [], examples: [], responses: [], answered: false }]); setNewArgument({ title: "" }); setShowArgumentForm(false); };
  const addPoi = (status: Poi["status"]) => { setPois((items) => [...items, { id: crypto.randomUUID(), status, text: poiText || "No text added", speech: activeSpeech.type }]); setPoiText(""); };
  const resetRound = () => { if (!window.confirm("Reset this round? This will remove all arguments, notes, POIs, and timer progress.")) return; setSpeeches(defaultSpeeches); setCurrent(0); setRunning(false); setRoundStarted(false); setArgumentsList(starterArguments); setPois([]); setNote(""); window.localStorage.removeItem("flow-round"); };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") { event.preventDefault(); toggleTimer(); }
      if (event.key === "ArrowRight") goToSpeech(Math.min(5, current + 1));
      if (event.key === "ArrowLeft") goToSpeech(Math.max(0, current - 1));
      if (event.key === "+" || event.key === "=") adjustTime(30);
      if (event.key === "-") adjustTime(-30);
      if (event.key.toLowerCase() === "n") document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
      if (event.key.toLowerCase() === "p") addPoi("accepted");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return <main className="app-shell console-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">F</span><span>flow<span className="brand-dot">.</span></span></div><div className="round-meta"><span className="live-dot" />LIVE ROUND <span className="meta-divider">/</span> APDA <span className="autosave">Saved {lastSaved}</span></div><div className="top-actions"><button className="icon-button" aria-label="Toggle theme">◐</button><button className="ghost-button" onClick={() => setShowSetup(!showSetup)}>Round setup</button><button className="reset-button" onClick={resetRound}>Reset round</button><button className="avatar">R</button></div></header>
    <section className="round-strip"><div><span className="eyebrow">CURRENT MOTION</span><h1>{motion}</h1><p><span className="team-tag pro-tag">PRO</span>{proTeam}<span className="versus">vs</span><span className="team-tag con-tag">CON</span>{conTeam}</p></div><div className="round-status"><span>ROUND 01</span><strong>{roundStarted ? "IN PROGRESS" : "SETUP"}</strong></div></section>
    {showSetup && <section className="setup-panel"><div><label>Motion<input value={motion} onChange={(event) => setMotion(event.target.value)} /></label><label>Pro team<input value={proTeam} onChange={(event) => setProTeam(event.target.value)} /></label><label>Con team<input value={conTeam} onChange={(event) => setConTeam(event.target.value)} /></label></div><button className="primary-button" onClick={() => { setShowSetup(false); setRoundStarted(true); }}>Save round</button></section>}
    <section className="workspace"><aside className="speech-rail"><div className="rail-heading"><span className="eyebrow">SPEECH ORDER</span><span>6 TOTAL</span></div><div className="speech-list">{speeches.map((speech, index) => <button className={`speech-row ${index === current ? "active" : ""}`} key={speech.type} onClick={() => goToSpeech(index)}><span className={`speech-side ${speech.side === "PRO" ? "pro-side" : "con-side"}`}>{speech.side}</span><span className="speech-name"><strong>{speech.type}</strong><small>{index < current ? "Complete" : index === current ? "Speaking now" : "Upcoming"}</small></span><span className="speech-time">{formatTime(speech.duration)}</span></button>)}</div><div className="rail-footer"><span className="key-hint">SPACE</span><span>Pause / resume</span></div></aside>
      <div className="main-stage"><div className="timer-card"><div className="timer-context"><span className={`side-pill ${activeSpeech.side === "PRO" ? "pro-pill" : "con-pill"}`}>{activeSpeech.side === "PRO" ? "PROPOSITION" : "OPPOSITION"}</span><span>Speech {current + 1} of 6</span><span className="timer-speaker">{activeSpeech.side === "PRO" ? proTeam : conTeam}</span></div><div className="timer-face"><span className="current-role">{activeSpeech.type}</span><span className="timer-value">{formatTime(remaining)}</span><span className={`timer-state ${remaining === 0 ? "expired" : running ? "is-running" : ""}`}>{remaining === 0 ? "TIME EXPIRED" : running ? "SPEAKING" : "PAUSED"}</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="timer-controls"><button className="adjust-button" onClick={() => adjustTime(-30)}>- 30 sec</button><button className="primary-button timer-toggle" onClick={toggleTimer}>{remaining === 0 ? "Time expired" : running ? "Pause timer" : "Resume timer"}<span>{running ? "Ⅱ" : "▶"}</span></button><button className="adjust-button" onClick={() => adjustTime(30)}>+ 30 sec</button></div><div className="timer-lower"><button onClick={() => goToSpeech(Math.max(0, current - 1))}>← Previous</button><span>{remaining <= 60 && remaining > 0 ? "One minute warning" : "Timer is timestamp-based"}</span><button onClick={() => goToSpeech(Math.min(5, current + 1))}>Next speech →</button></div></div><div className="flow-header"><div><span className="eyebrow">LIVE FLOW</span><h2>Argument map</h2></div><button className="primary-button add-button" onClick={() => { setArgumentSide(activeSpeech.side); setShowArgumentForm(!showArgumentForm); }}>+ Add argument</button></div>{showArgumentForm && <form className="argument-form" onSubmit={addArgument}><select aria-label="Argument side" value={argumentSide} onChange={(event) => setArgumentSide(event.target.value as Side)}><option value="PRO">Add to Pro</option><option value="CON">Add to Con</option></select><input autoFocus placeholder="Argument title" value={newArgument.title} onChange={(event) => setNewArgument({ ...newArgument, title: event.target.value })} /><input placeholder="Claim or note" value={newArgument.claim} onChange={(event) => setNewArgument({ ...newArgument, claim: event.target.value })} /><button className="primary-button">Add to {argumentSide === "PRO" ? "Pro" : "Con"}</button></form>}<div className="flow-grid"><FlowColumn side="PRO" argumentsList={sideArgs.pro} setArgumentsList={setArgumentsList} /><FlowColumn side="CON" argumentsList={sideArgs.con} setArgumentsList={setArgumentsList} /></div></div>
      <aside className="notes-rail"><section className="panel-section"><div className="panel-heading"><div><span className="eyebrow">ACTIVE SPEECH</span><h3>{activeSpeech.type} notes</h3></div><span className="note-count">{note.length}</span></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture a thought..." /><div className="note-tip">⌘ Notes autosave as you type</div></section><section className="panel-section poi-section"><div className="panel-heading"><div><span className="eyebrow">POINTS OF INFORMATION</span><h3>POI tracker</h3></div><span className="poi-total">{activePois.length}</span></div><div className="poi-stats"><span><strong>{activePois.filter((poi) => poi.status === "accepted").length}</strong> accepted</span><span><strong>{activePois.filter((poi) => poi.status === "declined").length}</strong> declined</span></div><input value={poiText} onChange={(event) => setPoiText(event.target.value)} placeholder="Optional POI note" /><div className="poi-actions"><button onClick={() => addPoi("accepted")}>Take POI</button><button onClick={() => addPoi("declined")}>Decline</button></div>{activePois.map((poi) => <div className="poi-item" key={poi.id}><span className={poi.status === "accepted" ? "poi-accepted" : "poi-declined"}>{poi.status === "accepted" ? "TAKEN" : "DECLINED"}</span><span>{poi.text}</span></div>)}</section></aside></section>
    <footer className="app-footer"><span>Flow is local-first. Your round stays on this device.</span><span><kbd>SPACE</kbd> Timer <kbd>N</kbd> Note <kbd>→</kbd> Next speech</span></footer>
  </main>;
}

function FlowColumn({ side, argumentsList, setArgumentsList }: { side: Side; argumentsList: Argument[]; setArgumentsList: React.Dispatch<React.SetStateAction<Argument[]>> }) {
  const openForm = () => window.dispatchEvent(new CustomEvent<Side>("open-argument-form", { detail: side }));
  const updateArgument = (id: string, patch: Partial<Argument>) => setArgumentsList((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeArgument = (id: string) => setArgumentsList((items) => items.filter((item) => item.id !== id));
  return <section className={`flow-column ${side === "PRO" ? "pro-column" : "con-column"}`}><div className="column-heading"><div><span className={`team-tag ${side === "PRO" ? "pro-tag" : "con-tag"}`}>{side}</span><strong>{side === "PRO" ? "Proposition" : "Opposition"}</strong></div><div className="column-tools"><span>{argumentsList.length} {argumentsList.length === 1 ? "argument" : "arguments"}</span><button className="column-add" aria-label={`Add ${side === "PRO" ? "proposition" : "opposition"} argument`} onClick={openForm}>+</button></div></div><div className="argument-stack">{argumentsList.map((argument) => <EditableArgumentCard key={argument.id} argument={argument} updateArgument={updateArgument} removeArgument={removeArgument} />)}</div></section>;
}

function EditableArgumentCard({ argument, updateArgument, removeArgument }: { argument: Argument; updateArgument: (id: string, patch: Partial<Argument>) => void; removeArgument: (id: string) => void }) {
  const updateExamples = (index: number, value: string) => updateArgument(argument.id, { examples: argument.examples.map((line, lineIndex) => lineIndex === index ? value : line) });
  const addExample = () => updateArgument(argument.id, { examples: [...argument.examples, ""] });
  const removeExample = (index: number) => updateArgument(argument.id, { examples: argument.examples.filter((_, lineIndex) => lineIndex !== index) });
  const updateAnalysis = (analysis: AnalysisNode[]) => updateArgument(argument.id, { analysis });
  return <article className="argument-card"><div className="argument-top"><div><input className="argument-title-input" aria-label="Argument title" value={argument.title} onChange={(event) => updateArgument(argument.id, { title: event.target.value })} /><span className="source-speech">From {argument.speechType}</span></div><div className="card-actions"><button aria-label="Toggle answered state" onClick={() => updateArgument(argument.id, { answered: !argument.answered })}>{argument.answered ? "✓" : "○"}</button><button className="remove-card" aria-label={`Remove ${argument.title}`} onClick={() => removeArgument(argument.id)}>×</button></div></div><AnalysisTree nodes={argument.analysis} updateNodes={updateAnalysis} /><EditableLines label="Examples" lines={argument.examples} updateLine={updateExamples} removeLine={removeExample} addLine={addExample} />{argument.responses.map((response, index) => <div className="response-card" key={`${argument.id}-${index}`}><div className="response-card-top"><span>RESPONSE {index + 1}</span><small>{argument.speechType}</small></div><p>{response}</p></div>)}<div className="argument-bottom"><span className={argument.answered ? "answered" : "unanswered"}>{argument.answered ? "Answered" : "Needs response"}</span><button onClick={() => updateArgument(argument.id, { responses: [...argument.responses, "Add a response from this speech."], answered: true })}>+ Response</button></div></article>;
}

function AnalysisTree({ nodes, updateNodes }: { nodes: AnalysisNode[]; updateNodes: (nodes: AnalysisNode[]) => void }) {
  const updateNode = (id: string, patch: Partial<AnalysisNode>) => updateNodes(nodes.map((node) => node.id === id ? { ...node, ...patch } : node));
  const removeNode = (id: string) => updateNodes(nodes.filter((node) => node.id !== id));
  const addNode = () => updateNodes([...nodes, createAnalysisNode()]);
  return <section className="analysis-tree"><div className="line-heading"><span>Analysis</span><button onClick={addNode}>+ Analysis</button></div>{nodes.map((node) => <AnalysisNodeEditor key={node.id} node={node} depth={0} updateNode={updateNode} removeNode={removeNode} />)}</section>;
}

function AnalysisNodeEditor({ node, depth, updateNode, removeNode }: { node: AnalysisNode; depth: number; updateNode: (id: string, patch: Partial<AnalysisNode>) => void; removeNode: (id: string) => void }) {
  const updateReplies = (replies: AnalysisNode[]) => updateNode(node.id, { replies });
  const addReply = () => updateReplies([...node.replies, createAnalysisNode()]);
  return <div className={`analysis-node depth-${depth % 2 === 0 ? "pro" : "con"}`}><div className="analysis-node-row"><input aria-label={`Analysis depth ${depth + 1}`} value={node.text} placeholder="Add analysis..." onChange={(event) => updateNode(node.id, { text: event.target.value })} /><button aria-label="Remove analysis item" onClick={() => removeNode(node.id)}>×</button></div><div className="analysis-replies">{node.replies.map((reply) => <AnalysisNodeEditor key={reply.id} node={reply} depth={depth + 1} updateNode={(id, patch) => updateReplies(node.replies.map((item) => item.id === id ? { ...item, ...patch } : item))} removeNode={(id) => updateReplies(node.replies.filter((item) => item.id !== id))} />)}</div><button className="add-reply" onClick={addReply}>+ Reply</button></div>;
}

function EditableLines({ label, lines, updateLine, removeLine, addLine }: { label: string; lines: string[]; updateLine: (index: number, value: string) => void; removeLine: (index: number) => void; addLine: () => void }) {
  return <section className="editable-lines"><div className="line-heading"><span>{label}</span><button onClick={addLine}>+ {label}</button></div>{lines.map((line, index) => <div className="line-item" key={`${label}-${index}`}><input aria-label={`${label} ${index + 1}`} value={line} placeholder={`Add ${label.toLowerCase()}...`} onChange={(event) => updateLine(index, event.target.value)} /><button aria-label={`Remove ${label} ${index + 1}`} onClick={() => removeLine(index)}>×</button></div>)}</section>;
}
