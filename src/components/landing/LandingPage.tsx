import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarClock,
  Check,
  Inbox,
  LineChart,
  Mail,
  Menu,
  ScanSearch,
  X,
  type LucideIcon,
} from "lucide-react";

import "@fontsource/fraunces/latin-500.css";
import "@fontsource/fraunces/latin-500-italic.css";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-600.css";

const STORAGE_KEY = "quay-signups";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#customers", label: "Customers" },
] as const;

const LOGOS = ["Halden & Co", "Kite Freight", "Vireo Labs", "Marlowe", "Northspan", "Fieldwork"];

const STEPS = [
  {
    title: "Connect the ledger",
    body: "Read-only at first. Open invoices and a year of payment history import in minutes from QuickBooks, Xero, or NetSuite.",
  },
  {
    title: "See who will slip",
    body: "Quay ranks the book by risk and drafts the next note. Approve the first week yourself, or let routine reminders go.",
  },
  {
    title: "Work the exceptions",
    body: "Disputes, large balances, and anyone who asked for a person land with your team. Everything else collects itself.",
  },
];

const FEATURES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Slip radar",
    body: "Every open invoice scored by how likely it is to land late — before the due date, not after the apology.",
    icon: ScanSearch,
  },
  {
    title: "Notes that sound like you",
    body: "Sequences in your voice, with the invoice, the amount, and one clear ask. Never “per my last email.”",
    icon: Mail,
  },
  {
    title: "Promises, kept honest",
    body: "When a customer says Friday, Quay remembers Friday and only follows up if the cash does not arrive.",
    icon: CalendarClock,
  },
  {
    title: "A cash week, not a spreadsheet",
    body: "See what is likely to land this week, what is stuck, and what still needs a person on it.",
    icon: LineChart,
  },
  {
    title: "Ledgers you already run",
    body: "Payments reconcile back to QuickBooks, Xero, and NetSuite so the book and the inbox finally agree.",
    icon: ArrowLeftRight,
  },
  {
    title: "One thread per invoice",
    body: "Disputes, partial payments, and promises stay on the invoice. Nobody hunts through a shared mailbox.",
    icon: Inbox,
  },
];

const STATS = [
  { value: "11", unit: "days", label: "median drop in DSO in the first quarter" },
  { value: "38%", unit: "", label: "fewer reminders sent by hand" },
  { value: "4", unit: "hrs", label: "given back to a controller each week" },
];

const QUOTES = [
  {
    quote:
      "We stopped the Monday chase meeting. Quay already knew who had promised to pay and who was going quiet.",
    name: "Priya Raman",
    role: "Controller, Halden & Co",
  },
  {
    quote:
      "DSO moved 14 days in a quarter. Customers actually replied, because the notes did not sound like a robot.",
    name: "Jonah Ell",
    role: "Head of Finance, Kite Freight",
  },
  {
    quote:
      "I can see Thursday’s cash without exporting a thing. Close is calmer, and collectors do actual collection.",
    name: "Mara Chen",
    role: "VP Finance, Vireo Labs",
  },
];

type Tier = {
  name: string;
  monthly: number | null;
  blurb: string;
  points: string[];
  cta: string;
  featured: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Pilot",
    monthly: 49,
    blurb: "For a controller who still sends reminders from their own inbox.",
    points: ["1 ledger connection", "Up to $500k open AR", "Email sequences", "Promise tracking"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Harbor",
    monthly: 189,
    blurb: "For a finance team that wants the chase list gone.",
    points: [
      "3 ledger connections",
      "Up to $5M open AR",
      "Shared collections inbox",
      "Cash forecast",
      "Slack alerts",
    ],
    cta: "Start free",
    featured: true,
  },
  {
    name: "Fleet",
    monthly: null,
    blurb: "For multi-entity groups with their own playbook.",
    points: ["Unlimited entities", "SSO and roles", "Custom sequences", "Dedicated onboarding"],
    cta: "Talk to us",
    featured: false,
  },
];

const LEDGER = [
  { customer: "Halden & Co", meta: "INV-2041 · day 18", amount: "$12,400", state: "Sequence 2", tone: "accent" },
  { customer: "Kite Freight", meta: "INV-1988 · day 6", amount: "$41,200", state: "Promised Fri", tone: "fg" },
  { customer: "Vireo Labs", meta: "INV-2110 · day 2", amount: "$8,750", state: "Watching", tone: "muted" },
  { customer: "Marlowe", meta: "INV-1890 · cleared", amount: "$22,100", state: "Paid", tone: "fg" },
] as const;

function readSignups(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function useSignups() {
  const [emails, setEmails] = useState<string[]>([]);

  useEffect(() => {
    setEmails(readSignups());
  }, []);

  function add(email: string): "saved" | "duplicate" | "error" {
    const next = email.trim().toLowerCase();
    if (emails.includes(next)) return "duplicate";
    const updated = [...emails, next];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      return "error";
    }
    setEmails(updated);
    return "saved";
  }

  return { emails, add };
}

function monthlyPrice(monthly: number, annual: boolean) {
  if (!annual) return monthly;
  return Math.round((monthly * 10) / 12);
}

function SignupForm({
  idPrefix,
  emails,
  add,
  tone,
}: {
  idPrefix: string;
  emails: string[];
  add: (email: string) => "saved" | "duplicate" | "error";
  tone: "default" | "inverse";
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const latest = emails[emails.length - 1];
  const inputId = `${idPrefix}-email`;
  const errorId = `${idPrefix}-error`;
  const inverse = tone === "inverse";

  if (latest && !editing) {
    return (
      <div role="status" className="rounded-2xl bg-surface px-5 py-4 shadow-card">
        <p className="font-medium text-fg">You’re in. We’ll write to {latest}.</p>
        <p className="mt-1 text-sm text-muted">
          14 days on Harbor. No card. We’ll only use this to set up your trial.
        </p>
        <button
          type="button"
          className="press mt-3 inline-flex h-11 items-center text-sm font-medium text-accent"
          onClick={() => {
            setEditing(true);
            setError(null);
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a work email, like you@company.com.");
      return;
    }
    const result = add(value);
    if (result === "duplicate") {
      setError("That email is already on the list.");
      return;
    }
    if (result === "error") {
      setError("Couldn’t save that in this browser. Try again.");
      return;
    }
    setEmail("");
    setError(null);
    setEditing(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label
        htmlFor={inputId}
        className={`mb-2 block text-sm font-medium ${inverse ? "text-on-inverse" : "text-fg"}`}
      >
        Work email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          className="h-12 min-w-0 flex-1 rounded-xl bg-surface px-4 text-fg shadow-card placeholder:text-muted"
        />
        <button
          type="submit"
          className="press inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent pl-5 pr-4 font-medium text-accent-fg hover:bg-accent-hover sm:w-auto"
        >
          Start free
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className={`mt-2 text-sm ${inverse ? "text-accent-on-dark" : "text-accent"}`}>
          {error}
        </p>
      ) : (
        <p className={`mt-2 text-sm ${inverse ? "text-on-inverse-muted" : "text-muted"}`}>
          14 days on Harbor. No card. We’ll only email you about the trial.
        </p>
      )}
    </form>
  );
}

function Header({
  open,
  onToggle,
  onNavigate,
}: {
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <a href="#top" className="flex h-11 items-center gap-2" onClick={onNavigate}>
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent font-display text-lg leading-none text-accent-fg">
            Q
          </span>
          <span className="font-display text-xl text-fg">Quay</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-muted hover:text-fg">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#start"
            onClick={onNavigate}
            className="press inline-flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            Start free
          </a>
          <button
            type="button"
            className="press inline-flex size-11 items-center justify-center rounded-xl text-fg md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={onToggle}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-border px-5 py-3 md:hidden" aria-label="Mobile">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onNavigate}
                  className="flex h-11 items-center text-base font-medium text-fg"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function LedgerPreview() {
  return (
    <aside className="rounded-2xl bg-surface p-5 shadow-card sm:p-6" aria-label="Sample collections board">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Open this week</p>
          <p className="mt-2 font-display text-4xl tabular-nums text-fg sm:text-5xl">$184,220</p>
        </div>
        <p className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">Live book</p>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
        <div className="h-full w-2/3 rounded-full bg-accent" />
      </div>
      <p className="mt-2 text-sm text-muted">62% of this month’s book already collected</p>
      <ul className="mt-4">
        {LEDGER.map((row) => (
          <li key={row.customer} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-fg">{row.customer}</p>
              <p className="text-sm text-muted">{row.meta}</p>
            </div>
            <div className="text-right">
              <p className="font-medium tabular-nums text-fg">{row.amount}</p>
              <p
                className={`text-sm ${
                  row.tone === "accent" ? "text-accent" : row.tone === "muted" ? "text-muted" : "text-fg"
                }`}
              >
                {row.state}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const { emails, add } = useSignups();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div id="top" className="bg-bg text-fg">
      <div className="h-1 bg-accent" aria-hidden="true" />
      <Header open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} onNavigate={closeMenu} />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="rise text-sm font-medium text-accent">Accounts receivable</p>
            <h1 className="rise rise-2 mt-3 font-display text-5xl leading-none text-fg sm:text-6xl">
              Get paid without the chase.
            </h1>
            <p className="rise rise-3 mt-5 max-w-xl text-lg text-muted">
              Quay watches every open invoice, predicts who will pay late, and sends a note that sounds like
              your team. Cash shows up. The chase list shrinks.
            </p>
            <div className="rise rise-4 mt-8 max-w-xl">
              <SignupForm idPrefix="hero" emails={emails} add={add} tone="default" />
              <a
                href="#pricing"
                className="mt-4 inline-flex h-11 items-center gap-2 text-sm font-medium text-fg"
              >
                See pricing
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="rise rise-4">
            <LedgerPreview />
          </div>
        </section>

        <section className="border-y border-border" aria-label="Customers">
          <div className="mx-auto max-w-6xl px-5 py-8">
            <p className="text-center text-sm text-muted">Controllers at</p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {LOGOS.map((name) => (
                <li key={name} className="font-display text-lg text-fg">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="product" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <h2 className="max-w-xl font-display text-4xl text-fg sm:text-5xl">
              A shorter path from invoice to cash.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Quay does not replace your ledger. It watches the gap between “sent” and “paid,” and only pulls
              a human in when a human should be there.
            </p>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <p className="font-display text-sm tabular-nums text-accent">0{index + 1}</p>
                  <h3 className="mt-3 font-display text-2xl text-fg">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 pb-20 md:pb-24">
            <h2 className="max-w-xl font-display text-4xl text-fg sm:text-5xl">
              Everything between sent and paid.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              One place for risk, reminders, promises, and the cash you can actually plan around.
            </p>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="bg-surface p-6 sm:p-8">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-display text-xl text-fg">{feature.title}</h3>
                  <p className="mt-2 text-muted">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Results" className="border-y border-border">
          <dl className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 md:py-16">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-5xl tabular-nums leading-none text-fg">
                  {stat.value}
                  {stat.unit ? <span className="ml-2 text-2xl text-muted">{stat.unit}</span> : null}
                </dt>
                <dd className="mt-3 max-w-xs text-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="customers" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <h2 className="max-w-xl font-display text-4xl text-fg sm:text-5xl">
              Finance teams who stopped chasing.
            </h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {QUOTES.map((item) => (
                <figure key={item.name} className="flex h-full flex-col justify-between rounded-2xl bg-surface p-6 shadow-card">
                  <blockquote className="font-display text-xl italic leading-snug text-fg">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-8">
                    <p className="font-medium text-fg">{item.name}</p>
                    <p className="text-sm text-muted">{item.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <h2 className="max-w-xl font-display text-4xl text-fg sm:text-5xl">
              Pricing that follows your book.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Start on Harbor for 14 days. Move up when the open balance does. Prices in USD, cancel any time.
            </p>
            <div
              className="mt-8 inline-flex w-full max-w-sm rounded-full bg-surface p-1 shadow-card sm:w-auto"
              role="group"
              aria-label="Billing period"
            >
              <button
                type="button"
                aria-pressed={!annual}
                onClick={() => setAnnual(false)}
                className={`press h-11 flex-1 rounded-full px-4 text-sm font-medium sm:flex-none sm:px-5 ${
                  annual ? "text-muted" : "bg-fg text-on-inverse"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={annual}
                onClick={() => setAnnual(true)}
                className={`press h-11 flex-1 rounded-full px-4 text-sm font-medium sm:flex-none sm:px-5 ${
                  annual ? "bg-fg text-on-inverse" : "text-muted"
                }`}
              >
                Annual
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">
              {annual
                ? "Annual prices shown per month, with two months free."
                : "Prefer annual? Two months are free."}
            </p>
            <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
              {TIERS.map((tier) => {
                const price = tier.monthly == null ? null : monthlyPrice(tier.monthly, annual);
                return (
                  <article
                    key={tier.name}
                    className={`flex flex-col rounded-2xl p-6 shadow-card sm:p-8 ${
                      tier.featured ? "order-first bg-fg text-on-inverse lg:order-none" : "bg-surface text-fg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl">{tier.name}</h3>
                      {tier.featured ? (
                        <p className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-fg">
                          Most teams
                        </p>
                      ) : null}
                    </div>
                    <p className={`mt-3 text-sm ${tier.featured ? "text-on-inverse-muted" : "text-muted"}`}>
                      {tier.blurb}
                    </p>
                    <p className="mt-6 font-display text-5xl tabular-nums leading-none">
                      {price == null ? "Custom" : `$${price}`}
                    </p>
                    <p className={`mt-2 text-sm ${tier.featured ? "text-on-inverse-muted" : "text-muted"}`}>
                      {price == null
                        ? "Scoped to your entities"
                        : annual
                          ? "per month, billed annually"
                          : "per month"}
                    </p>
                    {annual && tier.monthly != null ? (
                      <p
                        className={`mt-1 text-sm line-through tabular-nums ${
                          tier.featured ? "text-on-inverse-muted" : "text-muted"
                        }`}
                      >
                        ${tier.monthly} monthly
                      </p>
                    ) : null}
                    <ul className="mt-6 flex flex-1 flex-col gap-3">
                      {tier.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm">
                          <Check
                            className={`mt-0.5 size-4 shrink-0 ${tier.featured ? "text-accent-on-dark" : "text-accent"}`}
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#start"
                      className={`press mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl pl-5 pr-4 font-medium ${
                        tier.featured
                          ? "bg-accent text-accent-fg hover:bg-accent-hover"
                          : "bg-fg text-on-inverse"
                      }`}
                    >
                      {tier.cta}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="start" className="scroll-mt-20 bg-fg text-on-inverse">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
            <h2 className="font-display text-4xl sm:text-5xl">Put the chase list down.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-on-inverse-muted">
              Start a 14-day Harbor trial, or tell us about a larger book. Same form either way — we reply to
              the address you leave.
            </p>
            <div className="mx-auto mt-8 max-w-lg text-left">
              <SignupForm idPrefix="close" emails={emails} add={add} tone="inverse" />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl text-fg">Quay</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Accounts receivable, without the chase. Where invoices come in.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="inline-flex h-11 items-center text-sm text-muted hover:text-fg">
                {item.label}
              </a>
            ))}
            <a href="#start" className="inline-flex h-11 items-center text-sm font-medium text-accent">
              Start free
            </a>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-8">
          <p className="text-sm text-muted">© 2026 Quay</p>
        </div>
      </footer>
    </div>
  );
}
