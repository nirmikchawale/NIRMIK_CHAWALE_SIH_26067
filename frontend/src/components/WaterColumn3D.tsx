import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent
} from "react";

import type { VisualizationMode, VolumeResponse } from "../types";
import { Dual3DModeSwitch } from "./Dual3DModeSwitch";

interface Props {
  volume: VolumeResponse | null;
  selectedDepthM: number;
  verticalExaggeration: number;
  opacity: number;
  theme: "dark" | "light";
  visualizationMode: VisualizationMode;
  onVisualizationModeChange: (mode: VisualizationMode) => void;
}

interface ProjectedPoint {
  x: number;
  y: number;
  cameraDepth: number;
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
  selected: boolean;
}

interface HoverPoint {
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
}

const DEFAULT_ORBIT = { yaw: -0.72, pitch: -0.46, zoom: 1 };

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function colourFor(value: number, minimum: number, maximum: number, variable: string, alpha: number): string {
  const t = clamp((value - minimum) / Math.max(maximum - minimum, 1e-12), 0, 1);
  const hue = variable === "so" ? 173 - 86 * t : 220 - 173 * t;
  const lightness = 49 + 10 * t;
  return "hsla(" + hue.toFixed(1) + ", 82%, " + lightness.toFixed(1) + "%, " + alpha.toFixed(3) + ")";
}

export function WaterColumn3D({
  volume,
  selectedDepthM,
  verticalExaggeration,
  opacity,
  theme,
  visualizationMode,
  onVisualizationModeChange
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const projectedRef = useRef<ProjectedPoint[]>([]);
  const zoomAnimationRef = useRef<number | null>(null);
  const orbitRef = useRef(DEFAULT_ORBIT);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [hover, setHover] = useState<HoverPoint | null>(null);

  useEffect(() => {
    orbitRef.current = orbit;
  }, [orbit]);

  useEffect(() => () => {
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
    }
  }, []);

  const animateOrbit = (target: typeof DEFAULT_ORBIT) => {
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
    }
    const start = orbitRef.current;
    const startedAt = performance.now();
    const durationMs = 420;

    const step = (now: number) => {
      const raw = clamp((now - startedAt) / durationMs, 0, 1);
      const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      const next = {
        yaw: start.yaw + (target.yaw - start.yaw) * eased,
        pitch: start.pitch + (target.pitch - start.pitch) * eased,
        zoom: start.zoom + (target.zoom - start.zoom) * eased
      };
      orbitRef.current = next;
      setOrbit(next);
      if (raw < 1) {
        zoomAnimationRef.current = window.requestAnimationFrame(step);
      } else {
        zoomAnimationRef.current = null;
      }
    };
    zoomAnimationRef.current = window.requestAnimationFrame(step);
  };

  const smoothZoom = (factor: number) => {
    const current = orbitRef.current;
    animateOrbit({
      ...current,
      zoom: clamp(current.zoom * factor, 0.62, 1.9)
    });
  };

  const depthLevels = useMemo(() => {
    if (!volume) return [];
    return Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
  }, [volume]);

  const selectedDepth = useMemo(() => {
    if (depthLevels.length === 0) return selectedDepthM;
    return depthLevels.reduce((nearest, depth) =>
      Math.abs(depth - selectedDepthM) < Math.abs(nearest - selectedDepthM) ? depth : nearest
    );
  }, [depthLevels, selectedDepthM]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !volume || volume.points.length === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let disposed = false;

    const draw = () => {
      if (disposed) return;

      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const dark = theme === "dark";
      const background = context.createRadialGradient(
        width * 0.52,
        height * 0.42,
        12,
        width * 0.52,
        height * 0.42,
        Math.max(width, height) * 0.72
      );
      background.addColorStop(0, dark ? "#0b2634" : "#f9fcfd");
      background.addColorStop(1, dark ? "#01070c" : "#dfeaf0");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const longitudes = volume.points.map((point) => point[0]);
      const latitudes = volume.points.map((point) => point[1]);
      const depths = volume.points.map((point) => point[2]);
      const lonMin = Math.min(...longitudes);
      const lonMax = Math.max(...longitudes);
      const latMin = Math.min(...latitudes);
      const latMax = Math.max(...latitudes);
      const depthMin = Math.min(...depths);
      const depthMax = Math.max(...depths);
      const lonSpan = Math.max(lonMax - lonMin, 1e-9);
      const latSpan = Math.max(latMax - latMin, 1e-9);
      const depthSpan = Math.max(depthMax - depthMin, 1e-9);
      const depthAspect = 0.42 + 0.024 * clamp(verticalExaggeration, 1, 100);
      const baseScale = Math.min(width, height) * 2.25;

      const projectNormalised = (nx: number, ny: number, nz: number) => {
        const cosYaw = Math.cos(orbit.yaw);
        const sinYaw = Math.sin(orbit.yaw);
        const x1 = nx * cosYaw - nz * sinYaw;
        const z1 = nx * sinYaw + nz * cosYaw;

        const cosPitch = Math.cos(orbit.pitch);
        const sinPitch = Math.sin(orbit.pitch);
        const y1 = ny * cosPitch - z1 * sinPitch;
        const z2 = ny * sinPitch + z1 * cosPitch;

        const perspective = orbit.zoom / Math.max(2.25, 3.2 + z2 * 0.5);
        return {
          x: width * 0.5 + x1 * baseScale * perspective,
          y: height * 0.43 + y1 * baseScale * perspective,
          cameraDepth: z2
        };
      };

      const projectScientific = (longitude: number, latitude: number, depth: number) => {
        const nx = ((longitude - lonMin) / lonSpan - 0.5) * 2;
        const nz = ((latitude - latMin) / latSpan - 0.5) * 2;
        const ny = ((depth - depthMin) / depthSpan) * depthAspect;
        return projectNormalised(nx, ny, nz);
      };

      const gridStroke = dark ? "rgba(125, 178, 199, 0.23)" : "rgba(48, 92, 111, 0.24)";
      const strongStroke = dark ? "rgba(95, 218, 241, 0.52)" : "rgba(20, 124, 155, 0.58)";
      const selectedFill = dark ? "rgba(87, 219, 242, 0.10)" : "rgba(27, 140, 172, 0.10)";
      const selectedStroke = dark ? "rgba(111, 232, 249, 0.78)" : "rgba(15, 116, 145, 0.78)";

      const boxAt = (depthFraction: number) => {
        const y = depthFraction * depthAspect;
        return [
          projectNormalised(-1, y, -1),
          projectNormalised(1, y, -1),
          projectNormalised(1, y, 1),
          projectNormalised(-1, y, 1)
        ];
      };

      const drawPolygon = (
        points: Array<{ x: number; y: number }>,
        stroke: string,
        fill?: string,
        widthPx = 1
      ) => {
        context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.closePath();
        if (fill) {
          context.fillStyle = fill;
          context.fill();
        }
        context.strokeStyle = stroke;
        context.lineWidth = widthPx;
        context.stroke();
      };

      const topBox = boxAt(0);
      const bottomBox = boxAt(1);
      drawPolygon(topBox, strongStroke, undefined, 1.1);
      drawPolygon(bottomBox, gridStroke, undefined, 1);
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        context.moveTo(topBox[index].x, topBox[index].y);
        context.lineTo(bottomBox[index].x, bottomBox[index].y);
        context.strokeStyle = gridStroke;
        context.lineWidth = 1;
        context.stroke();
      }

      for (let tick = 1; tick < 5; tick += 1) {
        const layer = boxAt(tick / 5);
        drawPolygon(layer, gridStroke);
      }

      const selectedFraction = clamp((selectedDepth - depthMin) / depthSpan, 0, 1);
      drawPolygon(boxAt(selectedFraction), selectedStroke, selectedFill, 1.5);

      const projected: ProjectedPoint[] = volume.points.map(([longitude, latitude, depth, value]) => {
        const screen = projectScientific(longitude, latitude, depth);
        return {
          ...screen,
          longitude,
          latitude,
          depth,
          value,
          selected: Math.abs(depth - selectedDepth) < 1e-8
        };
      });

      projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
      projectedRef.current = projected;

      for (const point of projected) {
        const pointAlpha = point.selected ? Math.min(1, opacity + 0.28) : opacity;
        context.beginPath();
        context.arc(point.x, point.y, point.selected ? 3.2 : 1.65, 0, Math.PI * 2);
        context.fillStyle = colourFor(point.value, volume.minimum, volume.maximum, volume.variable, pointAlpha);
        context.fill();
        if (point.selected) {
          context.strokeStyle = dark ? "rgba(244, 253, 255, 0.55)" : "rgba(18, 65, 82, 0.42)";
          context.lineWidth = 0.6;
          context.stroke();
        }
      }

      const axisText = dark ? "rgba(201, 232, 241, 0.72)" : "rgba(33, 74, 91, 0.76)";
      context.fillStyle = axisText;
      context.font = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(lonMin.toFixed(2) + "°E", topBox[0].x - 8, topBox[0].y - 8);
      context.fillText(lonMax.toFixed(2) + "°E", topBox[1].x - 4, topBox[1].y - 8);
      context.fillText(latMin.toFixed(2) + "°N", topBox[0].x - 8, topBox[0].y + 14);
      context.fillText(latMax.toFixed(2) + "°N", topBox[3].x - 8, topBox[3].y + 14);
      context.fillText(depthMin.toFixed(2) + " m", topBox[3].x + 8, topBox[3].y);
      context.fillText(depthMax.toFixed(2) + " m", bottomBox[3].x + 8, bottomBox[3].y);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [volume, selectedDepth, verticalExaggeration, opacity, orbit, theme]);

  const inspectNearest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let nearest: ProjectedPoint | null = null;
    let nearestDistance = 13;

    for (const point of projectedRef.current) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    }

    setHover(
      nearest
        ? {
            longitude: nearest.longitude,
            latitude: nearest.latitude,
            depth: nearest.depth,
            value: nearest.value
          }
        : null
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHover(null);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) {
      inspectNearest(event.clientX, event.clientY);
      return;
    }

    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setOrbit((current) => ({
      ...current,
      yaw: current.yaw + dx * 0.008,
      pitch: clamp(current.pitch + dy * 0.006, -1.15, 0.45)
    }));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    inspectNearest(event.clientX, event.clientY);
  };

  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setOrbit((current) => ({
      ...current,
      zoom: clamp(current.zoom * (event.deltaY > 0 ? 0.92 : 1.08), 0.62, 1.9)
    }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setOrbit((current) => ({
        ...current,
        yaw: current.yaw + (event.key === "ArrowLeft" ? -0.12 : 0.12)
      }));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setOrbit((current) => ({
        ...current,
        pitch: clamp(current.pitch + (event.key === "ArrowUp" ? -0.08 : 0.08), -1.15, 0.45)
      }));
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      setOrbit((current) => ({
        ...current,
        zoom: clamp(current.zoom * (event.key === "-" ? 0.9 : 1.1), 0.62, 1.9)
      }));
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      setOrbit(DEFAULT_ORBIT);
    }
  };

  if (!volume) {
    return (
      <main className="globe-shell water-column-shell water-column-loading">
        <div className="water-column-loading-card">
          <strong>Loading verified water-column volume…</strong>
          <span>No synthetic values are substituted while the canonical volume is unavailable.</span>
        </div>
      </main>
    );
  }

  return (
    <main
      className="globe-shell water-column-shell"
      data-depth-count={depthLevels.length}
      data-opacity={opacity.toFixed(2)}
      data-yaw={orbit.yaw.toFixed(3)}
      data-zoom={orbit.zoom.toFixed(3)}
    >
      <canvas
        ref={canvasRef}
        className="water-column-canvas"
        tabIndex={0}
        role="application"
        aria-label="Interactive scientific water-column 3D"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onPointerLeave={() => {
          if (!dragRef.current.active) setHover(null);
        }}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      />

      <Dual3DModeSwitch
        activeMode={visualizationMode}
        scalarAvailable
        onChange={onVisualizationModeChange}
      />

      <div className="globe-overlay view-zoom-controls" data-label="WATER-COLUMN CAMERA">
        <button type="button" aria-label="Water-column zoom out" onClick={() => smoothZoom(0.82)}>−</button>
        <button type="button" aria-label="Reset water-column view" onClick={() => animateOrbit(DEFAULT_ORBIT)}>FIT</button>
        <button type="button" aria-label="Water-column zoom in" onClick={() => smoothZoom(1.22)}>+</button>
      </div>

      <div className="globe-overlay top-left water-column-summary">
        <div>
          <span className="live-dot" />
          <strong>SCIENTIFIC WATER-COLUMN 3D</strong>
        </div>
        <span>{volume.label} · {volume.units}</span>
        <small>{depthLevels.length} genuine depth levels · {volume.time.replace("T", " ").replace("Z", " UTC")}</small>
      </div>

      <div className="globe-overlay water-column-selected">
        <span>SELECTED LAYER</span>
        <strong>{selectedDepth.toFixed(2)} m</strong>
        <small>Depth (m, positive down)</small>
      </div>

      <div className="globe-overlay water-column-legend">
        <span>{volume.label}</span>
        <div className="gradient-bar" />
        <div className="legend-values">
          <span>{volume.minimum.toFixed(3)}</span>
          <span>{volume.units}</span>
          <span>{volume.maximum.toFixed(3)}</span>
        </div>
      </div>

      {hover && (
        <div className="globe-overlay water-column-hover">
          <strong>Scientific inspection</strong>
          <span>Lon {hover.longitude.toFixed(3)}°E · Lat {hover.latitude.toFixed(3)}°N</span>
          <span>Depth {hover.depth.toFixed(2)} m</span>
          <span>{volume.label}: {hover.value.toFixed(4)} {volume.units}</span>
        </div>
      )}

      <div className="globe-overlay interaction-hint water-column-hint">
        Drag to orbit · wheel to zoom · arrows / +/- for keyboard · R reset
      </div>

      <div className="globe-overlay volume-note water-column-note">
        CANONICAL MODEL VALUES · visual depth ×{verticalExaggeration} · opacity {Math.round(opacity * 100)}% · geometry only
      </div>
    </main>
  );
}
