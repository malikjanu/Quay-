import { create } from "zustand";

export type GlobeMode = "drift" | "paused" | "held";

type GlobeState = {
  selectedId: string | null;
  hoveredId: string | null;
  mode: GlobeMode;
  focusNonce: number;
  resetNonce: number;
  select: (id: string) => void;
  hover: (id: string | null) => void;
  release: () => void;
  resetView: () => void;
  setMode: (mode: GlobeMode) => void;
};

export const useGlobe = create<GlobeState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  mode: "drift",
  focusNonce: 0,
  resetNonce: 0,
  select: (id) =>
    set({
      selectedId: id,
      mode: "held",
      focusNonce: get().focusNonce + 1,
    }),
  hover: (id) => {
    if (get().hoveredId === id) return;
    set({ hoveredId: id });
  },
  release: () => set({ mode: "drift", selectedId: null, hoveredId: null }),
  resetView: () =>
    set({
      mode: "drift",
      selectedId: null,
      hoveredId: null,
      resetNonce: get().resetNonce + 1,
    }),
  setMode: (mode) => {
    if (get().mode === mode) return;
    set({ mode });
  },
}));
