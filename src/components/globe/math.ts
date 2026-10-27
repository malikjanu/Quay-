import { Vector3 } from "three";

export const HOME_RADIUS = 2.92;
export const HOME_PHI = 1.18;
export const HOME_THETA = 0.22;
export const FOCUS_RADIUS = 1.82;
export const PHI_MIN = 0.34;
export const PHI_MAX = Math.PI - 0.34;
export const SPIN = 0.085;

export function latLonToVector(lat: number, lon: number, radius: number, target: Vector3) {
  const azimuth = ((lon + 180) * Math.PI) / 180;
  const polar = ((90 - lat) * Math.PI) / 180;
  const sinPolar = Math.sin(polar);
  target.set(
    -Math.cos(azimuth) * sinPolar * radius,
    Math.cos(polar) * radius,
    Math.sin(azimuth) * sinPolar * radius,
  );
  return target;
}

export function shortestAngle(current: number, desired: number) {
  let theta = desired;
  while (theta - current > Math.PI) theta -= Math.PI * 2;
  while (current - theta > Math.PI) theta += Math.PI * 2;
  return theta;
}

export function dampAngle(current: number, target: number, lambda: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * lambda;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
