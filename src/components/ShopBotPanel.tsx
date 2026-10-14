import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, RotateCcw, SendHorizontal, Settings, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToolResults } from "@/components/ToolCards";
import { buildHistory, checkHealth, clean, getApiUrl, sendChat, setApiUrl, type ChatMessage } from "@/lib/shopbot";

export type Conn = "unknown" | "ok" | "fail";

const SUGGESTIONS = [
  "Find wireless headphones under ₹3,000",
  "Where is my order ORD1024?",
  "Cheapest laptop under ₹50,000 with 10% off",
  "Show me smartwatches",
  "Where is order ORD9999?",
];

export function Avatar({ small }: { small?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ${small ? "h-7 w-7" : "h-10 w-10"}`}>
      <Sparkles className={small ? "h-3.5 w-3.5" : "h-5 w-5"} aria-hidden />
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className="rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:bg-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
      {children}
    </button>
  );
}

let idc = 0;
const nid = () => `m${++idc}`;

export function ShopBotPanel({ open, onClose, pending, onConsumed, conn, setConn }: {
  open: boolean; onClose: () => void; pending: string | null; onConsumed: () => void; conn: Conn; setConn: (c: Conn) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const msgsRef = useRef(messages);
  msgsRef.current = messages;

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 1000);
    if (!text || busyRef.current) return;
    const history = buildHistory(msgsRef.current);
    busyRef.current = true;
    setBusy(true);
    setMessages((m) => [...m, { id: nid(), role: "user", content: text }]);
    setInput("");
    const base = getApiUrl();
    const r = await sendChat(base, text, history);
    if (r.kind === "ok") {
      setMessages((m) => [...m, { id: nid(), role: "assistant", content: r.data.reply, toolCalls: r.data.tool_calls }]);
      setConn("ok");
    } else {
      setMessages((m) => [...m, { id: nid(), role: "error", content: r.text }]);
      if (r.kind === "network") setConn("fail");
    }
    busyRef.current = false;
    setBusy(false);
  };

  useEffect(() => {
    if (open && pending) { void send(pending); onConsumed(); }
  }, [open, pending]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => taRef.current?.focus(), 250);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !settingsOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, settingsOpen]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 4 * 22 + 16) + "px";
  }, [input]);

  const dot = conn === "ok" ? "bg-success" : conn === "fail" ? "bg-destructive" : "bg-muted-foreground";

  return (
    <>
      <div onClick={onClose} aria-hidden
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside role="dialog" aria-modal="true" aria-label="ShopBot assistant" aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-soft transition-transform duration-250 ease-out sm:w-[420px] sm:rounded-l-2xl ${open ? "translate-x-0" : "pointer-events-none translate-x-full"}`}>
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">ShopBot</h2>
              <span className={`h-2 w-2 rounded-full ${dot}`} title={`Connection: ${conn}`} aria-label={`Connection ${conn}`} />
            </div>
            <p className="text-xs text-muted-foreground">AI shopping assistant</p>
          </div>
          <IconBtn label="New chat" onClick={() => setMessages([])}><RotateCcw className="h-4 w-4" /></IconBtn>
          <IconBtn label="Settings" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" /></IconBtn>
          <IconBtn label="Close" onClick={onClose}><X className="h-4 w-4" /></IconBtn>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-lg font-semibold">Hi! I'm ShopBot 👋</p>
              <p className="text-sm text-muted-foreground">I can find products, check your orders and work out discounts. Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border border-border bg-raised px-3 py-1.5 text-left text-xs transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.content}</div>
              </div>
            ) : m.role === "error" ? (
              <div key={m.id} className="flex gap-2">
                <div className="flex max-w-[90%] gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span>{m.content}</span>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2">
                <Avatar small />
                <div className="min-w-0 flex-1">
                  <div className="md inline-block max-w-full break-words rounded-2xl rounded-tl-md bg-raised px-3.5 py-2 text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  <ToolResults toolCalls={m.toolCalls} />
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar small />
              <span className="flex gap-1 rounded-2xl bg-raised px-3 py-2.5">
                {[0, 1, 2].map((i) => <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </span>
              ShopBot is thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-1.5 focus-within:border-primary">
            <textarea ref={taRef} rows={1} maxLength={1000} value={input} aria-label="Message ShopBot"
              placeholder="Ask about products, orders or discounts…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-[22px] outline-none placeholder:text-muted-foreground" />
            <button aria-label="Send" disabled={!input.trim() || busy} onClick={() => send(input)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity duration-200 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">ShopBot can make mistakes. Product and order details come from Demo Bazaar's tools.</p>
        </div>
      </aside>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} setConn={setConn} />
    </>
  );
}

function SettingsDialog({ open, onOpenChange, setConn }: { open: boolean; onOpenChange: (o: boolean) => void; setConn: (c: Conn) => void }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  useEffect(() => { if (open) { setUrl(getApiUrl()); setResult(null); } }, [open]);

  const test = async () => {
    const u = clean(url);
    setTesting(true);
    try {
      const h = await checkHealth(u);
      const tools = h.tools?.length ? h.tools.join(", ") : "no tools yet";
      setResult({ ok: true, text: `Connected · model: ${h.model ?? "unknown"} · tools: ${tools}` });
      setConn("ok");
    } catch {
      setResult({ ok: false, text: `Can't reach ${u}` });
      setConn("fail");
    }
    setTesting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Run the workshop backend on your computer, then use http://localhost:8000. Chrome may ask to let this site access apps on your device: click Allow.</DialogDescription>
        </DialogHeader>
        <label className="text-sm font-medium" htmlFor="api-url">Backend URL</label>
        <input id="api-url" value={url} onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        {result && <p className={`text-sm ${result.ok ? "text-success" : "text-destructive"}`}>{result.text}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={test} disabled={testing}
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-raised disabled:opacity-50">
            {testing ? "Testing…" : "Test connection"}
          </button>
          <button onClick={() => { setApiUrl(url); onOpenChange(false); }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
