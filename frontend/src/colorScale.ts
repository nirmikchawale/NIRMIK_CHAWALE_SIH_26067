import type { ColorPaletteId, ColorScaleMode, ColorTransfer } from "./types";

const PALETTES: Record<ColorPaletteId, string[]> = {
  thermal: ["#163b9e", "#2aa7c9", "#f2d35e", "#e4524d"],
  haline: ["#4b148c", "#2d6cc0", "#22b8a7", "#d7f171"],
  viridis: ["#440154", "#31688e", "#35b779", "#fde725"],
  icefire: ["#1f4e9e", "#86d6e7", "#f7f7f2", "#e67a4f", "#8e1b3d"]
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

export function normaliseScalar(
  value: number,
  minimum: number,
  maximum: number,
  scale: ColorScaleMode
): number {
  if (!Number.isFinite(value) || !Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) {
    return 0.5;
  }
  if (scale === "log" && minimum > 0 && maximum > 0 && value > 0) {
    const lo = Math.log10(minimum);
    const hi = Math.log10(maximum);
    return clamp((Math.log10(value) - lo) / Math.max(hi - lo, 1e-12), 0, 1);
  }
  return clamp((value - minimum) / Math.max(maximum - minimum, 1e-12), 0, 1);
}

export function cssColorFor(value: number, transfer: ColorTransfer, alpha = 1): string {
  const stops = PALETTES[transfer.palette];
  const t = normaliseScalar(value, transfer.minimum, transfer.maximum, transfer.scale);
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = hexToRgb(stops[index]);
  const b = hexToRgb(stops[index + 1]);
  const rgb = a.map((channel, i) => Math.round(channel + (b[i] - channel) * local));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamp(alpha, 0, 1).toFixed(3)})`;
}

export function gradientCss(palette: ColorPaletteId): string {
  return `linear-gradient(90deg, ${PALETTES[palette].join(", ")})`;
}

export function paletteLabel(palette: ColorPaletteId): string {
  return {
    thermal: "Thermal",
    haline: "Haline",
    viridis: "Viridis",
    icefire: "Ice–Fire"
  }[palette];
}
