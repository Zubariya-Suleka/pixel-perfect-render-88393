import { useState } from "react";
import { Headphones, Laptop, Smartphone, Watch, Speaker, Mouse, Package, ShoppingBag } from "lucide-react";
import { formatDate, formatINR, type Product, type ToolCall } from "@/lib/shopbot";

export const categoryIcon = (c: string) =>
  ({ headphones: Headphones, laptops: Laptop, smartphones: Smartphone, smartwatches: Watch, speakers: Speaker, accessories: Mouse })[
    c?.toLowerCase()
  ] ?? ShoppingBag;

const isObj = (r: unknown): r is Record<string, any> => !!r && typeof r === "object";

function ProductCard({ p }: { p: Product }) {
  const Icon = categoryIcon(p.category);
  return (
    <div className={`w-40 shrink-0 rounded-2xl border border-border bg-card p-2 ${p.in_stock ? "" : "opacity-60"}`}>
      <div className="flex aspect-square items-center justify-center rounded-xl bg-tile">
        <Icon className="h-10 w-10 text-primary" aria-hidden />
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{p.name}</p>
      <p className="mt-1 text-sm font-bold text-primary">{formatINR(p.price)}</p>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className="text-warning">★ {p.rating}</span>
        <span className={`rounded-full px-2 py-0.5 ${p.in_stock ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          {p.in_stock ? "In stock" : "Out of stock"}
        </span>
      </div>
    </div>
  );
}

const statusClass = (s: string) => {
  const k = s.toLowerCase();
  if (k === "delivered") return "bg-success/15 text-success";
  if (k === "shipped" || k === "out for delivery") return "bg-info/15 text-info";
  if (k === "processing") return "bg-warning/15 text-warning";
  if (k === "cancelled" || k === "returned") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function Card({ tc }: { tc: ToolCall }) {
  const r = tc.result;
  if (!isObj(r) || "error" in r) return null;
  if (tc.name === "search_products") {
    const ps: Product[] = Array.isArray(r.products) ? r.products : [];
    if (!ps.length) return null;
    return (
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ps.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    );
  }
  if (tc.name === "check_order") {
    if (r.found === false)
      return <div className="rounded-2xl border border-destructive/60 px-3 py-2 text-xs text-destructive">Order {r.order_id} not found</div>;
    if (r.found !== true) return null;
    return (
      <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" aria-hidden /> {r.order_id}
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(String(r.status))}`}>{r.status}</span>
        </div>
        <p className="text-xs">{r.items}</p>
        <Row k="Ordered on" v={formatDate(r.order_date)} />
        {r.estimated_delivery && <Row k="Estimated delivery" v={formatDate(r.estimated_delivery)} />}
        <Row k="Total" v={formatINR(r.total)} />
      </div>
    );
  }
  if (tc.name === "calculate_discount" && typeof r.final_price === "number") {
    return (
      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground line-through">{formatINR(r.original_price)}</p>
        <p className="text-2xl font-bold text-primary">{formatINR(r.final_price)}</p>
        <p className="text-xs text-success">
          You save {formatINR(r.discount_amount)} ({r.discount_percent}% off)
        </p>
      </div>
    );
  }
  return null;
}

const chipLabel: Record<string, string> = {
  search_products: "🔍 Searched products",
  check_order: "📦 Checked order",
  calculate_discount: "🏷️ Calculated discount",
};

export function ToolResults({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (!toolCalls.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {toolCalls.map((tc, i) => <Card key={i} tc={tc} />)}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        {toolCalls.filter((t) => chipLabel[t.name]).map((t, i) => (
          <span key={i} className="rounded-full border border-border px-2 py-0.5">{chipLabel[t.name]}</span>
        ))}
        <button onClick={() => setOpen((o) => !o)} className="rounded-full px-2 py-0.5 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {open ? "Hide details" : "Show details"}
        </button>
      </div>
      {open && (
        <div className="space-y-2">
          {toolCalls.map((tc, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-2">
              <p className="mb-1 font-mono text-xs font-semibold text-primary">{tc.name}</p>
              <pre className="max-h-60 overflow-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify({ arguments: tc.arguments, result: tc.result }, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
