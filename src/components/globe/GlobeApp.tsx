import { useEffect, useState, type ComponentType } from "react";
import "@fontsource/fraunces/latin-500.css";
import "@fontsource/fraunces/latin-ext-500.css";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/fraunces/latin-ext-600.css";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-ext-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-ext-500.css";
import { Overlay } from "@/components/globe/Overlay";

type SceneProps = { onReady: () => void };

export function GlobeApp() {
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancel = false;
    void import("@/components/globe/GlobeScene").then((mod) => {
      if (!cancel) setScene(() => mod.GlobeScene);
    });
    const timer = window.setTimeout(() => setFailed(true), 8000);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="globe-stage fixed inset-0 overflow-hidden bg-bg text-fg select-none">
      <div className="absolute inset-0">
        {Scene ? <Scene onReady={() => setReady(true)} /> : null}
      </div>
      <div className="vignette pointer-events-none absolute inset-0" />
      {!ready ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">
          {failed ? "This view needs WebGL." : "Charting the globe"}
        </p>
      ) : null}
      <Overlay />
    </main>
  );
}
