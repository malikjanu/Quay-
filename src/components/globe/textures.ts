import {
  CanvasTexture,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import { LAND } from "@/data/land";

const EARTH_W = 2048;
const EARTH_H = 1024;

function traceRings(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: boolean,
) {
  for (const poly of LAND) {
    ctx.beginPath();
    for (const ring of poly) {
      let started = false;
      let prevLon = 0;
      for (const [lon, lat] of ring) {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else if (Math.abs(lon - prevLon) > 180) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        prevLon = lon;
      }
      ctx.closePath();
    }
    if (stroke) ctx.stroke();
    else ctx.fill("evenodd");
  }
}

const LAND_BANDS: [number, number, string][] = [
  [-90, -72, "#e4e9e4"],
  [-72, -55, "#9aa696"],
  [-55, -32, "#7d8b72"],
  [-32, -16, "#8a8268"],
  [-16, 16, "#6d8160"],
  [16, 32, "#8a8268"],
  [32, 55, "#7d8b72"],
  [55, 72, "#9aa696"],
  [72, 90, "#e4e9e4"],
];

export function createEarthTextures(): { map: Texture; roughness: Texture } {
  const canvas = document.createElement("canvas");
  canvas.width = EARTH_W;
  canvas.height = EARTH_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the globe.");

  const ocean = ctx.createLinearGradient(0, 0, 0, EARTH_H);
  ocean.addColorStop(0, "#16344c");
  ocean.addColorStop(0.16, "#0d2438");
  ocean.addColorStop(0.42, "#16486c");
  ocean.addColorStop(0.58, "#1b587f");
  ocean.addColorStop(0.84, "#0e2438");
  ocean.addColorStop(1, "#143048");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, EARTH_W, EARTH_H);

  for (const [lat0, lat1, color] of LAND_BANDS) {
    const yTop = ((90 - lat1) / 180) * EARTH_H;
    const yBot = ((90 - lat0) / 180) * EARTH_H;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, yTop, EARTH_W, Math.max(1, yBot - yTop));
    ctx.clip();
    ctx.fillStyle = color;
    traceRings(ctx, EARTH_W, EARTH_H, false);
    ctx.restore();
  }

  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "rgba(236, 234, 228, 0.28)";
  traceRings(ctx, EARTH_W, EARTH_H, true);

  ctx.beginPath();
  ctx.strokeStyle = "rgba(214, 222, 230, 0.14)";
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * EARTH_H;
    ctx.moveTo(0, y);
    ctx.lineTo(EARTH_W, y);
  }
  for (let lon = -150; lon < 180; lon += 30) {
    const x = ((lon + 180) / 360) * EARTH_W;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, EARTH_H);
  }
  ctx.stroke();

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = 1024;
  roughCanvas.height = 512;
  const rctx = roughCanvas.getContext("2d");
  if (!rctx) throw new Error("Could not draw the globe.");
  rctx.fillStyle = "#2a2a2a";
  rctx.fillRect(0, 0, 1024, 512);
  rctx.fillStyle = "#c8c8c8";
  traceRings(rctx, 1024, 512, false);
  const roughness = new CanvasTexture(roughCanvas);
  roughness.colorSpace = NoColorSpace;
  roughness.anisotropy = 4;
  roughness.needsUpdate = true;

  return { map, roughness };
}

function hash2(ix: number, iy: number) {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function createCloudTexture(): Texture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw clouds.");
  const image = ctx.createImageData(w, h);
  const data = image.data;
  for (let y = 0; y < h; y++) {
    const v = y / h;
    const latFade = Math.sin(v * Math.PI);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      let n = 0;
      let amp = 0.55;
      let freq = 2.4;
      for (let o = 0; o < 4; o++) {
        n += amp * valueNoise(u * freq * 4, v * freq * 2);
        freq *= 2;
        amp *= 0.5;
      }
      const alpha = Math.pow(Math.max(0, (n - 0.66) / 0.34), 1.7) * latFade;
      const i = (y * w + x) * 4;
      data[i] = 236;
      data[i + 1] = 242;
      data[i + 2] = 246;
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createGlowTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw marker glow.");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(244, 247, 252, 0.95)");
  g.addColorStop(0.22, "rgba(214, 226, 238, 0.55)");
  g.addColorStop(0.55, "rgba(186, 206, 224, 0.16)");
  g.addColorStop(1, "rgba(186, 206, 224, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
