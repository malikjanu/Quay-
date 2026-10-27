import { PLACES, formatCoord, type Place } from "@/data/places";
import { useGlobe, type GlobeMode } from "@/components/globe/store";

const MODE_LABEL: Record<GlobeMode, string> = {
  drift: "Drifting",
  paused: "Paused",
  held: "Held",
};

function PlaceButton({ place }: { place: Place }) {
  const selected = useGlobe((s) => s.selectedId === place.id);
  const hover = useGlobe((s) => s.hover);
  const select = useGlobe((s) => s.select);

  return (
    <li>
      <button
        id={`place-${place.id}`}
        type="button"
        aria-pressed={selected}
        className={
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left " +
          "transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
          (selected ? "bg-surface-2 text-fg" : "text-fg hover:bg-surface-2")
        }
        onMouseEnter={() => hover(place.id)}
        onMouseLeave={() => hover(null)}
        onFocus={() => hover(place.id)}
        onBlur={() => hover(null)}
        onClick={() => select(place.id)}
      >
        <span className="flex items-center gap-3">
          <span
            className={"size-1.5 shrink-0 rounded-full " + (selected ? "bg-accent" : "bg-border")}
            aria-hidden="true"
          />
          <span className="font-medium">{place.name}</span>
        </span>
        <span className="shrink-0 text-sm text-muted">{place.region}</span>
      </button>
    </li>
  );
}

function Status() {
  const mode = useGlobe((s) => s.mode);
  return (
    <p className="flex items-center gap-2 text-sm text-muted">
      <span
        className={"size-1.5 rounded-full bg-accent " + (mode === "drift" ? "drift-dot" : "")}
        aria-hidden="true"
      />
      <span>{MODE_LABEL[mode]}</span>
    </p>
  );
}

export function Overlay() {
  const selectedId = useGlobe((s) => s.selectedId);
  const mode = useGlobe((s) => s.mode);
  const release = useGlobe((s) => s.release);
  const resetView = useGlobe((s) => s.resetView);
  const place = PLACES.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      <header className="flex items-start justify-between gap-4 p-4 md:p-6">
        <div className="max-w-sm">
          <p className="text-xs font-medium text-subtle">Observatory</p>
          <h1 className="font-display text-3xl leading-tight font-medium tracking-tight text-fg md:text-4xl">
            Meridian
          </h1>
          <p className="mt-2 max-w-[34ch] text-sm leading-normal text-muted">
            Drag to turn the globe. Choose a place to hold the view.
          </p>
          <div className="mt-4 hidden md:block">
            <Status />
          </div>
        </div>
      </header>

      <aside
        className={
          "pointer-events-auto mx-3 mb-3 flex min-h-0 max-h-[min(46dvh,28rem)] flex-col overflow-hidden " +
          "rounded-3xl border border-border bg-surface p-4 text-fg " +
          "md:absolute md:inset-y-4 md:right-4 md:mx-0 md:mb-0 md:max-h-none md:w-80"
        }
      >
        <div className="shrink-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted">Featured</h2>
            <span className="text-xs text-subtle tabular-nums">{PLACES.length} places</span>
          </div>
          <div className="mb-3 md:hidden">
            <Status />
          </div>
          {place ? (
            <div key={place.id} className="detail-enter mb-3 border-b border-border pb-4">
              <p className="font-display text-2xl leading-tight font-medium tracking-tight">
                {place.name}
              </p>
              <p className="mt-1 text-sm text-muted">{place.region}</p>
              <p className="mt-3 text-sm leading-normal text-fg">{place.note}</p>
              <p className="mt-2 font-mono text-xs text-subtle tabular-nums">
                {formatCoord(place.lat, place.lon)}
              </p>
              {mode === "held" ? (
                <button
                  type="button"
                  className="mt-4 min-h-11 w-full rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg"
                  onClick={release}
                >
                  Resume drift
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <ul className="place-list flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
          {PLACES.map((item) => (
            <PlaceButton key={item.id} place={item} />
          ))}
        </ul>

        <div className="shrink-0 pt-3">
          <button
            type="button"
            className="min-h-11 w-full rounded-lg border border-border px-4 text-sm font-medium text-fg"
            onClick={resetView}
          >
            Reset view
          </button>
        </div>
      </aside>
    </div>
  );
}
