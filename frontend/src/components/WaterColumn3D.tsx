import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent
} from "react";

import type { ColorPalette, ColorScaleMode, CurrentsVolumeResponse, VolumeResponse } from "../types";

interface Props {
  volume: VolumeResponse | null;
  currentsVolume: CurrentsVolumeResponse | null;
  selectedDepthM: number;
  verticalExaggeration: number;
  opacity: number;
  colorPalette: ColorPalette;
  colorScale: ColorScaleMode;
  colorMinimum: number;
  colorMaximum: number;
  isoSurfaceEnabled: boolean;
  isoValue: number;
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
  u?: number;
  v?: number;
}

interface HoverPoint {
  longitude: number;
  latitude: number;
  depth: number;
  value: number;
  u?: number;
  v?: number;
}

const DEFAULT_ORBIT = { yaw: -0.72, pitch: -0.46, zoom: 1 };

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function colourFor(
  value: number,
  minimum: number,
  maximum: number,
  palette: ColorPalette,
  scale: ColorScaleMode,
  alpha: number
): string {
  const safeMin = Number.isFinite(minimum) ? minimum : value;
  const safeMax = Number.isFinite(maximum) && maximum > safeMin ? maximum : safeMin + 1e-12;
  const useLog = scale === "log" && safeMin > 0 && safeMax > 0 && value > 0;
  const raw = useLog
    ? (Math.log(value) - Math.log(safeMin)) / Math.max(Math.log(safeMax) - Math.log(safeMin), 1e-12)
    : (value - safeMin) / Math.max(safeMax - safeMin, 1e-12);
  const t = clamp(raw, 0, 1);
  let hue = 220 - 173 * t;
  let saturation = 82;
  let lightness = 49 + 10 * t;
  if (palette === "viridis") {
    hue = 275 - 225 * t;
    saturation = 72;
    lightness = 36 + 20 * t;
  } else if (palette === "icefire") {
    hue = t < 0.5 ? 220 - 40 * (t / 0.5) : 185 - 170 * ((t - 0.5) / 0.5);
    saturation = 82;
    lightness = 47 + 10 * Math.abs(t - 0.5);
  }
  return "hsla(" + hue.toFixed(1) + ", " + saturation + "%, " + lightness.toFixed(1) + "%, " + alpha.toFixed(3) + ")";
}

type ScientificVertex = [number, number, number];
type IsoTriangle = [ScientificVertex, ScientificVertex, ScientificVertex];

function vertexKey(vertex: ScientificVertex): string {
  return vertex.map((value) => value.toPrecision(12)).join("|");
}

function buildIsoTriangles(volume: VolumeResponse, isoValue: number, limit = 12000): IsoTriangle[] {
  const longitudes = Array.from(new Set(volume.points.map((point) => point[0]))).sort((a, b) => a - b);
  const latitudes = Array.from(new Set(volume.points.map((point) => point[1]))).sort((a, b) => a - b);
  const depths = Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
  const values = new Map<string, number>();
  for (const [lon, lat, depth, value] of volume.points) {
    values.set(vertexKey([lon, lat, depth]), value);
  }

  const tetrahedra = [
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
    [0, 5, 1, 6]
  ] as const;
  const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as const;
  const triangles: IsoTriangle[] = [];

  const interpolate = (a: ScientificVertex, b: ScientificVertex, va: number, vb: number): ScientificVertex => {
    const denominator = vb - va;
    const t = Math.abs(denominator) < 1e-12 ? 0.5 : clamp((isoValue - va) / denominator, 0, 1);
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  };

  for (let di = 0; di < depths.length - 1 && triangles.length < limit; di += 1) {
    for (let yi = 0; yi < latitudes.length - 1 && triangles.length < limit; yi += 1) {
      for (let xi = 0; xi < longitudes.length - 1 && triangles.length < limit; xi += 1) {
        const x0 = longitudes[xi], x1 = longitudes[xi + 1];
        const y0 = latitudes[yi], y1 = latitudes[yi + 1];
        const z0 = depths[di], z1 = depths[di + 1];
        const corners: ScientificVertex[] = [
          [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
          [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
        ];
        const cornerValues = corners.map((vertex) => values.get(vertexKey(vertex)));
        if (cornerValues.some((value) => value == null || !Number.isFinite(value))) continue;

        for (const tetra of tetrahedra) {
          const vertices = tetra.map((index) => corners[index]);
          const tetraValues = tetra.map((index) => cornerValues[index] as number);
          const intersections: ScientificVertex[] = [];
          const seen = new Set<string>();

          for (const [ea, eb] of edges) {
            const va = tetraValues[ea];
            const vb = tetraValues[eb];
            const da = va - isoValue;
            const db = vb - isoValue;
            let point: ScientificVertex | null = null;
            if (Math.abs(da) < 1e-12) point = vertices[ea];
            else if (Math.abs(db) < 1e-12) point = vertices[eb];
            else if (da * db < 0) point = interpolate(vertices[ea], vertices[eb], va, vb);
            if (point) {
              const key = vertexKey(point);
              if (!seen.has(key)) {
                seen.add(key);
                intersections.push(point);
              }
            }
          }

          if (intersections.length === 3) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
          } else if (intersections.length === 4) {
            triangles.push([intersections[0], intersections[1], intersections[2]]);
            if (triangles.length < limit) triangles.push([intersections[0], intersections[2], intersections[3]]);
          }
          if (triangles.length >= limit) break;
        }
      }
    }
  }
  return triangles;
}

export function WaterColumn3D({
  volume,
  currentsVolume,
  selectedDepthM,
  verticalExaggeration,
  opacity,
  colorPalette,
  colorScale,
  colorMinimum,
  colorMaximum,
  isoSurfaceEnabled,
  isoValue,
  theme
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const zoomAnimationRef = useRef<number | null>(null);
  const projectedRef = useRef<ProjectedPoint[]>([]);
  const [orbit, setOrbit] = useState(DEFAULT_ORBIT);
  const [hover, setHover] = useState<HoverPoint | null>(null);

  const depthLevels = useMemo(() => {
    if (volume) return Array.from(new Set(volume.points.map((point) => point[2]))).sort((a, b) => a - b);
    return currentsVolume?.depths_m.slice().sort((a, b) => a - b) ?? [];
  }, [volume, currentsVolume]);

  const spatialPoints = useMemo<Array<[number, number, number, number]>>(
    () => volume
      ? volume.points
      : currentsVolume
        ? currentsVolume.vectors.map(([longitude, latitude, depth, , , speed]) => [longitude, latitude, depth, speed])
        : [],
    [volume, currentsVolume]
  );

  const dataLabel = volume?.label ?? (currentsVolume ? "Current speed" : "Ocean field");
  const dataUnits = volume?.units ?? currentsVolume?.units ?? "";
  const dataTime = volume?.time ?? currentsVolume?.time ?? "";

  const isoTriangles = useMemo(
    () => (volume && isoSurfaceEnabled ? buildIsoTriangles(volume, isoValue) : []),
    [volume, isoSurfaceEnabled, isoValue]
  );

  const selectedDepth = useMemo(() => {
    if (depthLevels.length === 0) return selectedDepthM;
    return depthLevels.reduce((nearest, depth) =>
      Math.abs(depth - selectedDepthM) < Math.abs(nearest - selectedDepthM) ? depth : nearest
    );
  }, [depthLevels, selectedDepthM]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spatialPoints.length === 0) return;

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

      const longitudes = spatialPoints.map((point) => point[0]);
      const latitudes = spatialPoints.map((point) => point[1]);
      const depths = spatialPoints.map((point) => point[2]);
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
      // Fit the initial scientific box inside the dedicated canvas, leaving
      // room for readable inspection and camera controls on compact screens.
      const baseScale = Math.min(width * 0.95, Math.max(140, height - 145) * 1.35);

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

      if (isoSurfaceEnabled && isoTriangles.length > 0) {
        const isoFill = colourFor(isoValue, colorMinimum, colorMaximum, colorPalette, colorScale, 0.15);
        const isoStroke = colourFor(isoValue, colorMinimum, colorMaximum, colorPalette, colorScale, 0.72);
        for (const triangle of isoTriangles) {
          const screen = triangle.map(([longitude, latitude, depth]) => projectScientific(longitude, latitude, depth));
          drawPolygon(screen, isoStroke, isoFill, 0.7);
        }
      }

      const projected: ProjectedPoint[] = [];
      if (volume) {
        for (const [longitude, latitude, depth, value] of volume.points) {
          const screen = projectScientific(longitude, latitude, depth);
          projected.push({
            ...screen,
            longitude,
            latitude,
            depth,
            value,
            selected: Math.abs(depth - selectedDepth) < 1e-8
          });
        }

        projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
        for (const point of projected) {
          const pointAlpha = point.selected ? Math.min(1, opacity + 0.28) : opacity;
          context.beginPath();
          context.arc(point.x, point.y, point.selected ? 3.2 : 1.65, 0, Math.PI * 2);
          context.fillStyle = colourFor(point.value, colorMinimum, colorMaximum, colorPalette, colorScale, pointAlpha);
          context.fill();
          if (point.selected) {
            context.strokeStyle = dark ? "rgba(244, 253, 255, 0.55)" : "rgba(18, 65, 82, 0.42)";
            context.lineWidth = 0.6;
            context.stroke();
          }
        }
      } else if (currentsVolume) {
        const maxVectors = 2600;
        const vectorStride = Math.max(1, Math.ceil(currentsVolume.vectors.length / maxVectors));
        const displayScaleDegrees = 0.55;
        for (let index = 0; index < currentsVolume.vectors.length; index += vectorStride) {
          const [longitude, latitude, depth, u, v, speed] = currentsVolume.vectors[index];
          const start = projectScientific(longitude, latitude, depth);
          const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.25);
          const end = projectScientific(
            longitude + (u * displayScaleDegrees) / cosLat,
            latitude + v * displayScaleDegrees,
            depth
          );
          const selected = Math.abs(depth - selectedDepth) < 1e-8;
          const alpha = selected ? Math.min(1, opacity + 0.22) : Math.max(0.16, opacity * 0.48);
          const stroke = colourFor(speed, colorMinimum, colorMaximum, colorPalette, colorScale, alpha);
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.strokeStyle = stroke;
          context.lineWidth = selected ? 2.2 : 1.05;
          context.stroke();

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.max(Math.hypot(dx, dy), 1e-9);
          const ux = dx / length;
          const uy = dy / length;
          const headLength = selected ? 5.5 : 3.8;
          context.beginPath();
          context.moveTo(end.x, end.y);
          context.lineTo(end.x - ux * headLength - uy * headLength * 0.55, end.y - uy * headLength + ux * headLength * 0.55);
          context.moveTo(end.x, end.y);
          context.lineTo(end.x - ux * headLength + uy * headLength * 0.55, end.y - uy * headLength - ux * headLength * 0.55);
          context.strokeStyle = stroke;
          context.lineWidth = selected ? 1.8 : 1;
          context.stroke();

          projected.push({
            ...start,
            longitude,
            latitude,
            depth,
            value: speed,
            selected,
            u,
            v
          });
        }
      }
      projected.sort((a, b) => b.cameraDepth - a.cameraDepth);
      projectedRef.current = projected;

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
  }, [volume, currentsVolume, spatialPoints, selectedDepth, verticalExaggeration, opacity, orbit, theme, colorPalette, colorScale, colorMinimum, colorMaximum, isoSurfaceEnabled, isoValue, isoTriangles]);

  useEffect(() => () => {
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
  }, []);

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
            value: nearest.value,
            u: nearest.u,
            v: nearest.v
          }
        : null
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchDistanceRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHover(null);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) {
      inspectNearest(event.clientX, event.clientY);
      return;
    }

    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const previous = pinchDistanceRef.current;
      if (previous && distance > 0) {
        setOrbit(current => ({ ...current, zoom: clamp(current.zoom * distance / previous, 0.62, 1.9) }));
      }
      pinchDistanceRef.current = distance;
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
    pointersRef.current.delete(event.pointerId);
    pinchDistanceRef.current = null;
    const remaining = pointersRef.current.values().next().value;
    dragRef.current = remaining ? { active: true, ...remaining } : { active: false, x: 0, y: 0 };
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!remaining && event.type !== "pointercancel") inspectNearest(event.clientX, event.clientY);
  };

  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (zoomAnimationRef.current != null) window.cancelAnimationFrame(zoomAnimationRef.current);
    zoomAnimationRef.current = null;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1);
    const factor = Math.exp(-clamp(delta, -100, 100) * 0.002);
    setOrbit(current => ({ ...current, zoom: clamp(current.zoom * factor, 0.62, 1.9) }));
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

  if (!volume && !currentsVolume) {
    return (
      <main className="globe-shell water-column-shell water-column-loading">
        <div className="water-column-loading-card">
          <strong>Loading verified water-column evidence…</strong>
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
      data-color-palette={colorPalette}
      data-color-scale={colorScale}
      data-iso-enabled={isoSurfaceEnabled ? "true" : "false"}
      data-iso-triangles={isoTriangles.length}
      data-current-vector-count={currentsVolume?.vectors.length ?? 0}
      data-current-depth-count={currentsVolume?.depths_m.length ?? 0}
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
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          if (!dragRef.current.active) setHover(null);
        }}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      />

      <div className="globe-overlay top-left water-column-summary">
        <div>
          <span className="live-dot" />
          <strong>SCIENTIFIC WATER-COLUMN 3D</strong>
        </div>
        <span>{dataLabel} · {dataUnits}</span>
        <small>{depthLevels.length} genuine depth levels · {dataTime.replace("T", " ").replace("Z", " UTC")}</small>
        {volume && isoSurfaceEnabled && (
          <small>Isosurface {isoValue.toFixed(3)} {dataUnits} · {isoTriangles.length.toLocaleString()} extracted triangles</small>
        )}
      </div>

      <div className="globe-overlay water-column-selected">
        <span>SELECTED LAYER</span>
        <strong>{selectedDepth.toFixed(2)} m</strong>
        <small>Depth (m, positive down)</small>
      </div>

      <div className="globe-overlay water-column-legend">
        <span>{dataLabel}</span>
        <div className="gradient-bar" data-palette={colorPalette} />
        <div className="legend-values">
          <span>{colorMinimum.toFixed(3)}</span>
          <span>{dataUnits}</span>
          <span>{colorMaximum.toFixed(3)}</span>
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
          <span>{dataLabel}: {hover.value.toFixed(4)} {dataUnits}</span>
          {currentsVolume && hover.u != null && hover.v != null && (
            <span>u {hover.u.toFixed(4)} · v {hover.v.toFixed(4)} {dataUnits}</span>
          )}
        </div>
      )}

      <div className="globe-overlay interaction-hint water-column-hint">
        Drag to orbit · smooth wheel/buttons to zoom · arrows / +/- · R reset
      </div>

      <div className="globe-overlay volume-note water-column-note">
        {currentsVolume ? "HORIZONTAL u/v AT GENUINE DEPTHS · NO VERTICAL w INFERRED" : "CANONICAL MODEL VALUES"} · visual depth ×{verticalExaggeration} · opacity {Math.round(opacity * 100)}% · geometry only
      </div>
    </main>
  );
}
