import type { ColorPalette } from "./types";

/**
 * Single source of truth for scientific colour ramps.
 * The Cesium globe, the Water Column 3D canvas and every on-screen legend/colorbar
 * derive their colours from this function, so a legend always describes the
 * colours actually drawn for a value.
 */
export function paletteHsl(t: number, palette: ColorPalette): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  if (palette === "viridis") return [275 - 225 * x, 72, 36 + 20 * x];
  if (palette === "icefire") {
    const hue = x < 0.5 ? 220 - 40 * (x / 0.5) : 185 - 170 * ((x - 0.5) / 0.5);
    return [hue, 82, 47 + 10 * Math.abs(x - 0.5)];
  }
  return [220 - 173 * x, 82, 50 + 8 * x];
}

const GRADIENT_STOPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

/** CSS linear-gradient that reproduces the renderer ramp for legends and colorbars. */
export function paletteCssGradient(palette: ColorPalette, direction = "90deg"): string {
  const stops = GRADIENT_STOPS.map((t) => {
    const [h, s, l] = paletteHsl(t, palette);
    return `hsl(${h.toFixed(1)} ${s}% ${l.toFixed(1)}%) ${(t * 100).toFixed(1)}%`;
  });
  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}

