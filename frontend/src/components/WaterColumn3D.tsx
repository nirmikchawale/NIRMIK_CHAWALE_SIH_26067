import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent
} from "react";

import { cssColorFor, gradientCss } from "../colorScale";
import type { ColorTransfer, ViewMode, VolumeResponse } from "../types";

interface Props {
  volume: VolumeResponse | null;
  selectedDepthM: number;
  verticalExaggeration: number;
  opacity: number;
  viewMode: ViewMode;
  colorTransfer: ColorTransfer;
  theme: "dark" | "light";
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

interface ScientificPoint {
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
}

type ScientificTriangle = [ScientificPoint, ScientificPoint, ScientificPoint];

const TETRAHEDRA: number[][] = [
  [0, 5, 1, 6],
  [0, 1, 2, 6],
  [0, 2, 3, 6],
  [0, 3, 7, 6],
  [0, 7, 4, 6],
  [0, 4, 5, 6]
];

function scientificKey(longitude: number, latitude: number, depth: number): string {
  return longitude.toFixed(8) + "|" + latitude.toFixed(8) + "|" + depth.toFixed(8);
}

function interpolateIso(a: ScientificPoint, b: ScientificPoint, threshold: number): ScientificPoint | null {
  const av = a.value - threshold;
  const bv = b.value - threshold;
  if (!Number.isFinite(av) || !Number.isFinite(bv)) return null;
  if (Math.abs(av) < 1e-12 && Math.abs(bv) < 1e-12) return null;
  if (av * bv > 0) return null;
  const denominator = b.value - a.value;
  if (Math.abs(denominator) < 1e-12) return null;
  const t = clamp((threshold - a.value) / denominator, 0, 1);
  return {
    longitude: a.longitude + (b.longitude - a.longitude) * t,
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    depth: a.depth + (b.depth - a.depth) * t,
    value: threshold
  };
}

function extractIsosurface(volume: VolumeResponse, threshold: number): ScientificTriangle[] {
  const longitudes = Array.from(new Set(volume.points.map(([lon]) => lon))).sort((a, b) => a - b);
  const latitudes = Array.from(new Set(volume.points.map(([, lat]) => lat))).sort((a, b) => a - b);
  const depths = Array.from(new Set(volume.points.map(([, , depth]) => depth))).sort((a, b) => a - b);
  const values = new Map<string, number>();
  for (const [longitude, latitude, depth, value] of volume.points) {
    values.set(scientificKey(longitude, latitude, depth), value);
  }

  const triangles: ScientificTriangle[] = [];
  const tetraEdges: Array<[number, number]> = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];

  for (let zi = 0; zi < depths.length - 1; zi += 1) {
    for (let yi = 0; yi < latitudes.length - 1; yi += 1) {
      for (let xi = 0; xi < longitudes.length - 1; xi += 1) {
        const coordinates: Array<[number, number, number]> = [
          [longitudes[xi], latitudes[yi], depths[zi]],
          [longitudes[xi + 1], latitudes[yi], depths[zi]],
          [longitudes[xi + 1], latitudes[yi + 1], depths[zi]],
          [longitudes[xi], latitudes[yi + 1], depths[zi]],
          [longitudes[xi], latitudes[yi], depths[zi + 1]],
          [longitudes[xi + 1], latitudes[yi], depths[zi + 1]],
          [longitudes[xi + 1], latitudes[yi + 1], depths[zi + 1]],
          [longitudes[xi], latitudes[yi + 1], depths[zi + 1]]
        ];
        const cube = coordinates.map(([longitude, latitude, depth]) => {
          const value = values.get(scientificKey(longitude, latitude, depth));
          return value == null ? null : { longitude, latitude, depth, value };
        });
        if (cube.some((point) => point == null)) continue;

        for (const tetra of TETRAHEDRA) {
          const vertices = tetra.map((index) => cube[index] as ScientificPoint);
          const intersections: ScientificPoint[] = [];
          const seen = new Set<string>();
          for (const [aIndex, bIndex] of tetraEdges) {
            const point = interpolateIso(vertices[aIndex], vertices[bIndex], threshold);
            if (!point) continue;
            const key = scientificKey(point.longitude, point.latitude, point.depth);
            if (seen.has(key)) continue;
            seen.add(key);
            intersections.push(point);
          }
          if (intersections.length === 3) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
          } else if (intersections.length >= 4) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
            triangles.push([intersections[0], intersections[2], intersections[3]]);
          }
        }
      }
    }
  }
  return triangles;
}

export function WaterColumn3D({
  volume,
  selectedDepthM,
  verticalExaggeration,
  opacity,
  viewMode,
  colorTransfer,
  theme
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const zoomAnimationRef = useRef<number | null>(null);
  const projectedRef = useRef<ProjectedPoint[]>([]);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [hover, setHover] = useState<HoverPoint | null>(null);

  const depthLevels = useMemo(() => {
    if (!volume) return [];
    return Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
  }, [volume]);

  const isosurfaceTriangles = useMemo(() => {
    if (!volume || viewMode !== "isosurface") return [];
    return extractIsosurface(volume, colorTransfer.isosurfaceValue);
  }, [volume, viewMode, colorTransfer.isosurfaceValue]);

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

      if (viewMode === "isosurface") {
        const triangles = isosurfaceTriangles
          .map((triangle) => {
            const points = triangle.map((point) => ({
              ...projectScientific(point.longitude, point.latitude, point.depth),
              scientific: point
            }));
            return {
              points,
              cameraDepth: points.reduce((sum, point) => sum + point.cameraDepth, 0) / points.length
            };
          })
          .sort((a, b) => b.cameraDepth - a.cameraDepth);

        for (const triangle of triangles) {
          context.beginPath();
          context.moveTo(triangle.points[0].x, triangle.points[0].y);
          context.lineTo(triangle.points[1].x, triangle.points[1].y);
          context.lineTo(triangle.points[2].x, triangle.points[2].y);
          context.closePath();
          context.fillStyle = cssColorFor(colorTransfer.isosurfaceValue, colorTransfer, Math.min(0.82, opacity + 0.2));
          context.fill();
          context.strokeStyle = dark ? "rgba(239, 253, 255, 0.26)" : "rgba(27, 73, 90, 0.22)";
          context.lineWidth = 0.55;
          context.stroke();
        }
      } else {
        for (const point of projected) {
          const pointAlpha = point.selected ? Math.min(1, opacity + 0.28) : opacity;
          context.beginPath();
          context.arc(point.x, point.y, point.selected ? 3.2 : 1.65, 0, Math.PI * 2);
          context.fillStyle = cssColorFor(point.value, colorTransfer, pointAlpha);
          context.fill();
          if (point.selected) {
            context.strokeStyle = dark ? "rgba(244, 253, 255, 0.55)" : "rgba(18, 65, 82, 0.42)";
            context.lineWidth = 0.6;
            context.stroke();
          }
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
  }, [volume, selectedDepth, verticalExaggeration, opacity, orbit, theme, viewMode, colorTransfer, isosurfaceTriangles]);

  const smoothWaterZoomTo = (targetZoom: number) => {
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }

    const startZoom = orbit.zoom;
    const target = clamp(targetZoom, 0.62, 1.9);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOrbit((current) => ({ ...current, zoom: target }));
      return;
    }
    const startedAt = performance.now();
    const durationMs = 420;

    const animate = (now: number) => {
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      const zoom = startZoom + (target - startZoom) * eased;
      setOrbit((current) => ({ ...current, zoom }));

      if (raw < 1) {
        zoomAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    zoomAnimationRef.current = window.requestAnimationFrame(animate);
  };

  const smoothWaterZoom = (direction: "in" | "out") => {
    const factor = direction === "in" ? 1.28 : 0.78;
    smoothWaterZoomTo(orbit.zoom * factor);
  };

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
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    smoothWaterZoomTo(orbit.zoom * factor);
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
      smoothWaterZoom(event.key === "-" ? "out" : "in");
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      smoothWaterZoomTo(DEFAULT_ORBIT.zoom);
      setOrbit((current) => ({ ...current, yaw: DEFAULT_ORBIT.yaw, pitch: DEFAULT_ORBIT.pitch }));
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
      data-render-mode={viewMode}
      data-isosurface-triangles={isosurfaceTriangles.length}
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

      <div className="globe-overlay top-left water-column-summary">
        <div>
          <span className="live-dot" />
          <strong>{viewMode === "isosurface" ? "EXTRACTED ISOSURFACE 3D" : "SCIENTIFIC WATER-COLUMN 3D"}</strong>
        </div>
        <span>{volume.label} · {volume.units}</span>
        <small>
          {viewMode === "isosurface"
            ? `${isosurfaceTriangles.length.toLocaleString()} threshold triangles · ${colorTransfer.isosurfaceValue.toFixed(3)} ${volume.units}`
            : `${depthLevels.length} genuine depth levels`}
          {" · "}{volume.time.replace("T", " ").replace("Z", " UTC")}
        </small>
      </div>

      <div className="globe-overlay water-column-selected">
        <span>SELECTED LAYER</span>
        <strong>{selectedDepth.toFixed(2)} m</strong>
        <small>Depth (m, positive down)</small>
      </div>

      <div className="globe-overlay water-column-legend">
        <span>{volume.label}</span>
        <div className="gradient-bar" style={{ background: gradientCss(colorTransfer.palette) }} />
        <div className="legend-values">
          <span>{colorTransfer.minimum.toFixed(3)}</span>
          <span>{volume.units}</span>
          <span>{colorTransfer.maximum.toFixed(3)}</span>
        </div>
      </div>

      <div className="globe-overlay smooth-zoom-controls water-column-smooth-zoom" aria-label="Water-Column 3D smooth zoom">
        <span>WATER-COLUMN ZOOM</span>
        <div>
          <button type="button" aria-label="Zoom out Water-Column 3D" onClick={() => smoothWaterZoom("out")}>−</button>
          <button
            type="button"
            aria-label="Reset Water-Column 3D view"
            onClick={() => {
              smoothWaterZoomTo(DEFAULT_ORBIT.zoom);
              setOrbit((current) => ({ ...current, yaw: DEFAULT_ORBIT.yaw, pitch: DEFAULT_ORBIT.pitch }));
            }}
          >◎</button>
          <button type="button" aria-label="Zoom in Water-Column 3D" onClick={() => smoothWaterZoom("in")}>+</button>
        </div>
        <small>420 ms eased scientific-box zoom</small>
      </div>

      <div className="globe-overlay water-column-axis-key">
        <span>AXES</span>
        <strong>Longitude °E · Latitude °N · Depth m ↓</strong>
        <small>Depth remains positive down; exaggeration changes display geometry only.</small>
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
        Drag to orbit · smooth wheel/buttons to zoom · arrows / +/- · R reset
      </div>

      <div className="globe-overlay volume-note water-column-note">
        {viewMode === "isosurface"
          ? `MARCHING-TETRAHEDRA ISOSURFACE · threshold ${colorTransfer.isosurfaceValue.toFixed(3)} ${volume.units} · ${isosurfaceTriangles.length.toLocaleString()} triangles`
          : `CANONICAL MODEL VALUES · visual depth ×${verticalExaggeration} · opacity ${Math.round(opacity * 100)}% · geometry only`}
      </div>
    </main>
  );
}
