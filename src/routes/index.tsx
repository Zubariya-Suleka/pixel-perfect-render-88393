import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headphones, Laptop, Mouse, Search, ShoppingBag, Smartphone, Sparkles, Speaker, Watch } from "lucide-react";
import { ShopBotPanel, type Conn } from "@/components/ShopBotPanel";
import { checkHealth, getApiUrl } from "@/lib/shopbot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Demo Bazaar — Shop smarter with ShopBot" },
      { name: "description", content: "A fictional electronics store with ShopBot, an AI shopping assistant for products, orders and discounts." },
      { property: "og:title", content: "Demo Bazaar — Shop smarter with ShopBot" },
      { property: "og:description", content: "Ask ShopBot about products, track orders and check discounts in plain English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { name: "Headphones", Icon: Headphones },
  { name: "Laptops", Icon: Laptop },
  { name: "Smartphones", Icon: Smartphone },
  { name: "Smartwatches", Icon: Watch },
  { name: "Speakers", Icon: Speaker },
  { name: "Accessories", Icon: Mouse },
];

const btn = "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Index() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [conn, setConn] = useState<Conn>("unknown");
  const [q, setQ] = useState("");

  const ping = () => checkHealth(getApiUrl()).then(() => setConn("ok"), () => setConn("fail"));
  useEffect(() => { ping(); }, []);
  useEffect(() => { if (open) ping(); }, [open]);

  const ask = (text?: string) => { if (text?.trim()) setPending(text.trim()); setOpen(true); };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex shrink-0 items-center gap-2 font-bold">
            <ShoppingBag className="h-6 w-6 text-primary" aria-hidden />
            <span className="hidden sm:inline">Demo Bazaar</span>
          </div>
          <form className="relative min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); ask(q); setQ(""); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or ask ShopBot…" aria-label="Search or ask ShopBot"
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary" />
          </form>
          <button onClick={() => ask()} className="hidden items-center gap-2 rounded-full border border-primary/50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 md:inline-flex">
            <Sparkles className="h-4 w-4" aria-hidden /> Ask ShopBot
          </button>
        </div>
      </nav>

      <main>
        <section className="bg-hero">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Shop smarter with <span className="text-primary">ShopBot</span></h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">Ask about products, track your orders and check discounts in plain English.</p>
            <button onClick={() => ask()} className={`${btn} mt-8`}><Sparkles className="h-4 w-4" aria-hidden /> Ask ShopBot</button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ name, Icon }) => (
              <button key={name} onClick={() => ask(`Show me ${name.toLowerCase()}`)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-tile p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary focus-visible:outline-2 focus-visible:outline-ring">
                <Icon className="h-9 w-9 text-primary transition-transform duration-200 group-hover:scale-110" aria-hidden />
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Demo Bazaar is a fictional store for a workshop. All products and orders are sample data.
      </footer>

      {!open && (
        <button onClick={() => ask()} aria-label="Ask ShopBot" className={`${btn} fixed bottom-5 right-5 z-30 p-4 sm:px-5 sm:py-3`}>
          <Sparkles className="h-5 w-5" aria-hidden /> <span className="hidden sm:inline">Ask ShopBot</span>
        </button>
      )}

      <ShopBotPanel open={open} onClose={() => setOpen(false)} pending={pending} onConsumed={() => setPending(null)} conn={conn} setConn={setConn} />
    </div>
  );
}
