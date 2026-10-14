export type Product = { id: string; name: string; category: string; price: number; rating: number; in_stock: boolean };
export type ToolCall = { name: string; arguments: Record<string, unknown>; result: unknown };
export type ChatResponse = { reply: string; tool_calls: ToolCall[] };
export type Health = { status: string; model?: string; tools?: string[] };

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; toolCalls: ToolCall[] }
  | { id: string; role: "error"; content: string };

export const DEFAULT_URL = "http://localhost:8000";
const KEY = "shopbot.apiUrl";

export const clean = (u: string) => u.trim().replace(/\/+$/, "") || DEFAULT_URL;

export function getApiUrl(): string {
  try {
    return clean(localStorage.getItem(KEY) || DEFAULT_URL);
  } catch {
    return DEFAULT_URL;
  }
}
export function setApiUrl(u: string) {
  try {
    localStorage.setItem(KEY, clean(u));
  } catch {
    /* ignore */
  }
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const formatINR = (n: number) => inr.format(n);

export function formatDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function checkHealth(url: string): Promise<Health> {
  const res = await fetch(`${clean(url)}/health`);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export function buildHistory(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export async function sendChat(base: string, message: string, history: ReturnType<typeof buildHistory>) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000);
  try {
    let res: Response;
    try {
      res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: ctrl.signal,
      });
    } catch (e) {
      if (ctrl.signal.aborted) return { kind: "error" as const, text: "ShopBot took too long to answer. Please try again." };
      return {
        kind: "network" as const,
        text: `Can't reach the ShopBot server at ${base}. Make sure the backend is running, and if Chrome asked to access apps on your device, click Allow.`,
      };
    }
    if (!res.ok) {
      let text = "Sorry, that message couldn't be sent.";
      try {
        const j = await res.json();
        if (typeof j?.detail === "string") text = j.detail;
      } catch {
        /* ignore */
      }
      return { kind: "error" as const, text };
    }
    const data = (await res.json()) as ChatResponse;
    return { kind: "ok" as const, data: { reply: data.reply ?? "", tool_calls: Array.isArray(data.tool_calls) ? data.tool_calls : [] } };
  } catch {
    if (ctrl.signal.aborted) return { kind: "error" as const, text: "ShopBot took too long to answer. Please try again." };
    return { kind: "error" as const, text: "Sorry, that message couldn't be sent." };
  } finally {
    clearTimeout(t);
  }
}
