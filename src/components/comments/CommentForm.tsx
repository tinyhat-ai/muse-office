"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import "./comments.css";

export type ApiResult = { ok: true; data?: unknown } | { ok: false; error?: string };
type Target = { task: string; note?: never; project?: never } | { note: string; task?: never; project?: never } | { project: string; task?: never; note?: never };
type Payload = Target & { body: string; reply_to?: number | null };

export async function postComment(payload: Payload, files: File[] = []): Promise<ApiResult> {
  const form = new FormData();
  if (payload.task) form.set("task", payload.task);
  if (payload.note) form.set("note", payload.note);
  if (payload.project) form.set("project", payload.project);
  form.set("body", payload.body);
  if (payload.reply_to != null) form.set("reply_to", String(payload.reply_to));
  files.forEach((file) => form.append("files", file));
  try {
    const res = await fetch("/api/comments", { method: "POST", body: form });
    const data = await res.json().catch(() => null) as ApiResult | null;
    return data ?? { ok: false, error: "That did not save. Try again." };
  } catch { return { ok: false, error: "Could not reach the Office. Try again." }; }
}

type Props = Target & {
  replyTo?: number | null; placeholder: string; buttonLabel: string; compact?: boolean;
  id?: string; autoFocus?: boolean; onDone?: () => void;
};

export function CommentForm({ task, note, project, replyTo, placeholder, buttonLabel, compact, id, autoFocus, onDone }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [openingMic, setOpeningMic] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, startTransition] = useTransition();
  const busy = sending || refreshing;

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => {
    mounted.current = true;
    const policy = (document as Document & { featurePolicy?: { allowsFeature(name: string): boolean } }).featurePolicy;
    setCanRecord(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined" && (policy?.allowsFeature("microphone") ?? true));
    if (autoFocus) ref.current?.focus();
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks();
    };
  }, [autoFocus]);

  function addFiles(incoming: File[]) {
    setError("");
    setFiles((current) => {
      const next = [...current, ...incoming];
      if (next.length > 5 || next.some((f) => !f.size || f.size > 10 * 1024 * 1024) || next.reduce((sum, f) => sum + f.size, 0) > 20 * 1024 * 1024) {
        setError("Attach up to 5 files, 10 MB each and 20 MB in total.");
        return current;
      }
      return next;
    });
  }

  async function startRecording() {
    if (openingMic || recording || busy || lock.current) return;
    setOpeningMic(true); setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((value) => MediaRecorder.isTypeSupported(value));
      const rec = new MediaRecorder(media, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      let size = 0;
      rec.ondataavailable = (event) => {
        if (event.data.size) { chunks.push(event.data); size += event.data.size; }
        if (size > 10 * 1024 * 1024 && rec.state === "recording") rec.stop();
      };
      rec.onstop = () => {
        stopTracks(); recorder.current = null;
        if (!mounted.current) return;
        setRecording(false);
        if (chunks.length) {
          const mime = rec.mimeType || chunks[0].type;
          const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
          addFiles([new File(chunks, `Voice message.${ext}`, { type: mime })]);
        }
      };
      rec.onerror = () => { stopTracks(); setRecording(false); setError("Recording failed. You can attach an audio file instead."); };
      recorder.current = rec; rec.start(1000); setRecording(true);
      timer.current = setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 120000);
    } catch {
      stopTracks(); setError("Microphone unavailable here. You can attach an audio file instead.");
    } finally { if (mounted.current) setOpeningMic(false); }
  }

  async function submit() {
    if (busy || lock.current || recording || openingMic || (!body.trim() && !files.length)) return;
    lock.current = true; setSending(true); setError("");
    const target: Target = task ? { task } : note ? { note } : { project: project! };
    const res = await postComment({ ...target, body: body.trim(), reply_to: replyTo }, files);
    lock.current = false; setSending(false);
    if (!res.ok) { setError(res.error || "That did not save. Try again."); return; }
    setBody(""); setFiles([]);
    startTransition(() => router.refresh()); onDone?.();
  }
  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && !event.altKey && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      event.preventDefault(); void submit();
    }
  }
  return <form className={`oc-form${compact ? " compact" : ""}`} onSubmit={(e) => { e.preventDefault(); void submit(); }}>
    <textarea ref={ref} id={id} name="body" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={onKey}
      onPaste={(event) => { const incoming = Array.from(event.clipboardData.files); if (incoming.length) { event.preventDefault(); addFiles(incoming); } }}
      placeholder={placeholder} aria-label={placeholder} rows={compact ? 1 : 2} disabled={busy} />
    {files.length > 0 && <ul className="oc-files">{files.map((f, i) => <li key={`${i}-${f.name}`}>
      <span>{f.name}</span><button type="button" aria-label={`Remove ${f.name}`} disabled={busy} onClick={() => setFiles((all) => all.filter((_, n) => n !== i))}>×</button>
    </li>)}</ul>}
    <div className="oc-actions">
      <input ref={picker} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif,audio/webm,audio/ogg,audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/aac,application/pdf,text/plain,text/markdown,.md,.txt,.m4a" onChange={(e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
      <button type="button" className="oc-icon" aria-label="Attach files" title="Attach files" disabled={busy || recording} onClick={() => picker.current?.click()}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11-8.5 8.5a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.9-2.9l8.5-8.5" /></svg>
      </button>
      {canRecord && <button type="button" className="oc-icon" aria-label={recording ? "Stop recording" : "Record voice message"} title={recording ? "Stop recording" : "Record voice message"} disabled={busy || openingMic} onClick={() => recording ? recorder.current?.stop() : void startRecording()}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{recording ? <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /> : <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>}</svg>
      </button>}
      {recording && <span role="status">Recording…</span>}
      <button type="submit" className="oc-icon oc-send" aria-label={busy ? "Sending…" : buttonLabel} title={busy ? "Sending…" : buttonLabel} disabled={busy || recording || openingMic || (!body.trim() && !files.length)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
      </button>
    </div>
    {error && <p className="oc-error" role="alert">{error}</p>}
  </form>;
}

export function ReplyToggle({ task, note, project, replyTo, label, placeholder }: Target & { replyTo: number; label: string; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const target: Target = task ? { task } : note ? { note } : { project: project! };
  return <>
    <button type="button" className={`tk-reply${open ? " open" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Cancel" : label}</button>
    {open && <div className="tk-rbox"><CommentForm {...target} replyTo={replyTo} placeholder={placeholder} buttonLabel="Reply" compact autoFocus onDone={() => setOpen(false)} /></div>}
  </>;
}
