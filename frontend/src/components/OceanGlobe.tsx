import { useEffect, useRef, useState } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  ColorGeometryInstanceAttribute,
  EllipsoidTerrainProvider,
  EasingFunction,
  GeometryInstance,
  GridImageryProvider,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  HorizontalOrigin,
  LabelStyle,
  Material,
  Math as CesiumMath,
  PointPrimitiveCollection,
  PolylineCollection,
  PolylineDashMaterialProperty,
  Primitive,
  PerInstanceColorAppearance,
  Rectangle,
  RectangleGeometry,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  Viewer
} from "cesium";

import type {
  CurrentsResponse,
  FieldResponse,
  ProfileSummary,
  VisualizationMode,
  VolumeResponse
} from "../types";
import { Dual3DModeSwitch } from "./Dual3DModeSwitch";

interface Inspection {
  kind: "scalar" | "current";
  variable: string;
  longitude: number;
  latitude: number;
  depth_m: number;
  time: string;
  units: string;
  value?: number;
  u?: number;
  v?: number;
  speed?: number;
}

interface Props {
  field: FieldResponse | null;
  volume: VolumeResponse | null;
  currents: CurrentsResponse | null;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  verticalExaggeration: number;
  visualizationMode: VisualizationMode;
  scalarAvailable: boolean;
  onVisualizationModeChange: (mode: VisualizationMode) => void;
  onSelectProfile: (profileId: string) => void;
}

const DEFAULT_GLOBE_VIEW = {
  longitude: 72.0,
  latitude: 14.2,
  height: 1_900_000,
  heading: CesiumMath.toRadians(248),
  pitch: CesiumMath.toRadians(-76)
};

function scalarColor(value: number, minimum: number, maximum: number, variable: string): Color {
  const t = Math.max(0, Math.min(1, (value - minimum) / Math.max(maximum - minimum, 1e-12)));
  if (variable === "so") {
    return Color.fromHsl(0.48 - 0.24 * t, 0.78, 0.48 + 0.10 * t, 0.88);
  }
  return Color.fromHsl(0.61 - 0.48 * t, 0.82, 0.50 + 0.08 * t, 0.88);
}

export function OceanGlobe({
  field,
  volume,
  currents,
  profiles,
  selectedProfileId,
  verticalExaggeration,
  visualizationMode,
  scalarAvailable,
  onVisualizationModeChange,
  onSelectProfile
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const dynamicPrimitivesRef = useRef<Array<PointPrimitiveCollection | PolylineCollection | Primitive>>([]);
  const profileIdsRef = useRef<string[]>([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const depthAnimationRef = useRef<number | null>(null);
  const sliceHeightRef = useRef(0);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [rendererError, setRendererError] = useState("");
  const [renderScale, setRenderScale] = useState(1);
  const [antialiasing, setAntialiasing] = useState("initializing");

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let viewer: Viewer;
    try {
      viewer = new Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        infoBox: false,
        fullscreenButton: false,
        skyBox: false,
        skyAtmosphere: false,
        terrainProvider: new EllipsoidTerrainProvider(),
        msaaSamples: 4,
        requestRenderMode: true,
        maximumRenderTimeChange: Number.POSITIVE_INFINITY
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRendererError(message || "Cesium viewer initialization failed.");
      return;
    }

    const removeRenderErrorListener = viewer.scene.renderError.addEventListener((_scene, reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRendererError(message || "Cesium rendering stopped.");
    });

    const syncRenderQuality = () => {
      if (viewer.isDestroyed()) return;
      const deviceRatio = window.devicePixelRatio || 1;
      const nextScale = Math.min(2, Math.max(1.5, deviceRatio));
      viewer.resolutionScale = nextScale;
      setRenderScale(nextScale);

      if (viewer.scene.msaaSupported) {
        viewer.scene.msaaSamples = 4;
        setAntialiasing("4× MSAA");
      } else {
        viewer.scene.postProcessStages.fxaa.enabled = true;
        setAntialiasing("FXAA");
      }
      viewer.scene.requestRender();
    };

    syncRenderQuality();
    window.addEventListener("resize", syncRenderQuality);

    const addGridFallback = () => {
      if (viewer.isDestroyed()) return;
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
        new GridImageryProvider({
          color: Color.fromCssColorString("#2a6d89").withAlpha(0.52),
          glowColor: Color.fromCssColorString("#071a28").withAlpha(0.42),
          backgroundColor: Color.fromCssColorString("#082335")
        })
      );
      viewer.scene.requestRender();
    };

    // Cesium ships a low-resolution Natural Earth II tile set in Assets/Textures.
    // Use it as the default basemap so coastlines and geographic context work offline.
    void TileMapServiceImageryProvider.fromUrl(
      buildModuleUrl("Assets/Textures/NaturalEarthII"),
      { maximumLevel: 2 }
    )
      .then((provider) => {
        if (viewer.isDestroyed()) return;
        viewer.imageryLayers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.brightness = 1.10;
        layer.contrast = 1.22;
        layer.saturation = 1.02;
        viewer.scene.requestRender();
      })
      .catch(() => {
        // A missing/corrupt basemap must never take down the scientific demo.
        addGridFallback();
      });

    viewer.scene.backgroundColor = Color.fromCssColorString("#010913");
    viewer.scene.globe.baseColor = Color.fromCssColorString("#062438");
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.maximumScreenSpaceError = 1.0;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = 0.95;
    viewer.scene.globe.translucency.backFaceAlpha = 0.28;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;

    // Judge-first framing: keep the verified model window central while also
    // revealing India's west coast and enough globe curvature to read as geography,
    // not as a floating rectangular plot.
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        DEFAULT_GLOBE_VIEW.longitude,
        DEFAULT_GLOBE_VIEW.latitude,
        DEFAULT_GLOBE_VIEW.height
      ),
      orientation: {
        heading: DEFAULT_GLOBE_VIEW.heading,
        pitch: DEFAULT_GLOBE_VIEW.pitch,
        roll: 0
      },
      duration: 0
    });

    const boundary = viewer.entities.add({
      id: "model-domain-boundary",
      polyline: {
        positions: Cartesian3.fromDegreesArray([
          67, 12, 70, 12, 70, 14, 67, 14, 67, 12
        ]),
        width: 2.5,
        material: Color.fromCssColorString("#4ad7f5").withAlpha(0.85)
      }
    });
    void boundary;

    viewerRef.current = viewer;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.position) as { id?: unknown } | undefined;
      const pickedId = picked?.id as { id?: string; kind?: string; inspection?: Inspection } | undefined;
      const entityId = pickedId?.id;
      if (typeof entityId === "string" && entityId.startsWith("argo:")) {
        setInspection(null);
        onSelectProfile(entityId.slice(5));
        return;
      }
      if (pickedId?.kind === "ocean-inspection" && pickedId.inspection) {
        setInspection(pickedId.inspection);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
      removeRenderErrorListener();
      window.removeEventListener("resize", syncRenderQuality);
      clickHandlerRef.current?.destroy();
      clickHandlerRef.current = null;
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onSelectProfile]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const id of profileIdsRef.current) {
      viewer.entities.removeById(id);
    }
    viewer.entities.removeById("selected-model-cell");
    viewer.entities.removeById("selected-collocation-line");
    profileIdsRef.current = [];

    for (const profile of profiles) {
      const id = `argo:${profile.profile_id}`;
      profileIdsRef.current.push(id);
      const selected = profile.profile_id === selectedProfileId;
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(
          profile.observation_longitude,
          profile.observation_latitude,
          7_500
        ),
        point: {
          pixelSize: selected ? 17 : 12,
          color: selected
            ? Color.fromCssColorString("#ffd56a")
            : Color.fromCssColorString("#f0a93d"),
          outlineColor: Color.fromCssColorString("#ffffff"),
          outlineWidth: selected ? 3 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: selected ? `Argo ${profile.platform_id} · C${profile.cycle}` : "",
          font: "13px system-ui",
          fillColor: Color.WHITE,
          outlineColor: Color.fromCssColorString("#04111d"),
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }

    const selectedProfile = profiles.find((profile) => profile.profile_id === selectedProfileId);
    if (selectedProfile) {
      viewer.entities.add({
        id: "selected-model-cell",
        position: Cartesian3.fromDegrees(
          selectedProfile.model_cell_longitude,
          selectedProfile.model_cell_latitude,
          7_500
        ),
        point: {
          pixelSize: 14,
          color: Color.fromCssColorString("#4ad7f5"),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `Nearest model cell · ${selectedProfile.spatial_distance_km.toFixed(2)} km`,
          font: "12px system-ui",
          fillColor: Color.fromCssColorString("#b8f4ff"),
          outlineColor: Color.fromCssColorString("#04111d"),
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.TOP,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, 16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      viewer.entities.add({
        id: "selected-collocation-line",
        polyline: {
          positions: [
            Cartesian3.fromDegrees(
              selectedProfile.observation_longitude,
              selectedProfile.observation_latitude,
              7_500
            ),
            Cartesian3.fromDegrees(
              selectedProfile.model_cell_longitude,
              selectedProfile.model_cell_latitude,
              7_500
            )
          ],
          width: 3,
          material: new PolylineDashMaterialProperty({
            color: Color.fromCssColorString("#8cefff")
          })
        }
      });
    }

    viewer.scene.requestRender();
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const depth = field?.depth_m ?? currents?.depth_m;
    if (depth == null || volume) {
      viewer.entities.removeById("selected-depth-plane");
      if (depthAnimationRef.current != null) {
        window.cancelAnimationFrame(depthAnimationRef.current);
        depthAnimationRef.current = null;
      }
      viewer.scene.requestRender();
      return;
    }

    let plane = viewer.entities.getById("selected-depth-plane");
    if (!plane) {
      plane = viewer.entities.add({
        id: "selected-depth-plane",
        rectangle: {
          coordinates: Rectangle.fromDegrees(67, 12, 70, 14),
          height: -depth * verticalExaggeration,
          material: Color.fromCssColorString("#40d8f2").withAlpha(0.12),
          outline: true,
          outlineColor: Color.fromCssColorString("#55e3fa").withAlpha(0.72)
        }
      });
      sliceHeightRef.current = -depth * verticalExaggeration;
      viewer.scene.requestRender();
      return;
    }

    if (!plane.rectangle) return;
    if (depthAnimationRef.current != null) {
      window.cancelAnimationFrame(depthAnimationRef.current);
    }

    const startHeight = sliceHeightRef.current;
    const targetHeight = -depth * verticalExaggeration;
    const startedAt = performance.now();
    const durationMs = 320;

    const animate = (now: number) => {
      if (viewer.isDestroyed() || !plane?.rectangle) return;
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = raw * raw * (3 - 2 * raw);
      const height = startHeight + (targetHeight - startHeight) * eased;
      plane.rectangle.height = new ConstantProperty(height);
      sliceHeightRef.current = height;
      viewer.scene.requestRender();

      if (raw < 1) {
        depthAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        depthAnimationRef.current = null;
      }
    };

    depthAnimationRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (depthAnimationRef.current != null) {
        window.cancelAnimationFrame(depthAnimationRef.current);
        depthAnimationRef.current = null;
      }
    };
  }, [field?.depth_m, currents?.depth_m, volume, verticalExaggeration]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const primitive of dynamicPrimitivesRef.current) {
      viewer.scene.primitives.remove(primitive);
    }
    dynamicPrimitivesRef.current = [];

    if (field) {
      const collection = new PointPrimitiveCollection();
      for (let yi = 0; yi < field.latitude.length; yi += 1) {
        for (let xi = 0; xi < field.longitude.length; xi += 1) {
          const value = field.values[yi]?.[xi];
          if (value == null) continue;
          collection.add({
            id: {
              kind: "ocean-inspection",
              inspection: {
                kind: "scalar",
                variable: field.label,
                longitude: field.longitude[xi],
                latitude: field.latitude[yi],
                depth_m: field.depth_m,
                time: field.time,
                units: field.units,
                value
              } satisfies Inspection
            },
            position: Cartesian3.fromDegrees(
              field.longitude[xi],
              field.latitude[yi],
              -field.depth_m * verticalExaggeration
            ),
            pixelSize: 7,
            color: scalarColor(value, field.minimum, field.maximum, field.variable),
            outlineColor: Color.fromCssColorString("#00111c"),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          });
        }
      }
      viewer.scene.primitives.add(collection);
      dynamicPrimitivesRef.current.push(collection);
    }

    if (volume) {
      const longitudes = Array.from(new Set(volume.points.map(([lon]) => lon))).sort((a, b) => a - b);
      const latitudes = Array.from(new Set(volume.points.map(([, lat]) => lat))).sort((a, b) => a - b);
      const lonStep = longitudes.length > 1 ? Math.abs(longitudes[1] - longitudes[0]) : 0.15;
      const latStep = latitudes.length > 1 ? Math.abs(latitudes[1] - latitudes[0]) : 0.15;
      const maxCells = 5000;
      const cellStride = Math.max(1, Math.ceil(volume.points.length / maxCells));
      const instances: GeometryInstance[] = [];

      for (let index = 0; index < volume.points.length; index += cellStride) {
        const [lon, lat, depth, value] = volume.points[index];
        const color = scalarColor(value, volume.minimum, volume.maximum, volume.variable).withAlpha(0.36);
        instances.push(
          new GeometryInstance({
            id: {
              kind: "ocean-inspection",
              inspection: {
                kind: "scalar",
                variable: volume.label,
                longitude: lon,
                latitude: lat,
                depth_m: depth,
                time: volume.time,
                units: volume.units,
                value
              } satisfies Inspection
            },
            geometry: new RectangleGeometry({
              rectangle: Rectangle.fromDegrees(
                lon - lonStep * 0.48,
                lat - latStep * 0.48,
                lon + lonStep * 0.48,
                lat + latStep * 0.48
              ),
              height: -depth * verticalExaggeration,
              vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT
            }),
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(color)
            }
          })
        );
      }

      if (instances.length > 0) {
        const layeredVolume = new Primitive({
          geometryInstances: instances,
          appearance: new PerInstanceColorAppearance({
            translucent: true,
            closed: false
          }),
          asynchronous: false
        });
        viewer.scene.primitives.add(layeredVolume);
        dynamicPrimitivesRef.current.push(layeredVolume);
      }
    }

    if (currents) {
      const lines = new PolylineCollection();
      const heads = new PointPrimitiveCollection();
      const displayScaleDegrees = 1.25;
      for (const [lon, lat, u, v, speed] of currents.vectors) {
        const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.25);
        const endLon = lon + (u * displayScaleDegrees) / cosLat;
        const endLat = lat + v * displayScaleDegrees;
        const color = Color.fromHsl(
          0.56 - 0.12 * (speed / Math.max(currents.maximum, 1e-12)),
          0.9,
          0.58,
          0.9
        );
        const start = Cartesian3.fromDegrees(lon, lat, 12_000);
        const end = Cartesian3.fromDegrees(endLon, endLat, 12_000);
        lines.add({
          positions: [start, end],
          width: 2.6,
          material: Material.fromType("Color", { color })
        });

        const dx = endLon - lon;
        const dy = endLat - lat;
        const length = Math.max(Math.hypot(dx, dy), 1e-9);
        const ux = dx / length;
        const uy = dy / length;
        const px = -uy;
        const py = ux;
        const headLength = Math.min(0.16, Math.max(0.07, length * 0.34));
        const headWidth = headLength * 0.55;
        const left = Cartesian3.fromDegrees(
          endLon - ux * headLength + px * headWidth,
          endLat - uy * headLength + py * headWidth,
          12_000
        );
        const right = Cartesian3.fromDegrees(
          endLon - ux * headLength - px * headWidth,
          endLat - uy * headLength - py * headWidth,
          12_000
        );
        lines.add({
          positions: [left, end, right],
          width: 2.6,
          material: Material.fromType("Color", { color })
        });
        heads.add({
          id: {
            kind: "ocean-inspection",
            inspection: {
              kind: "current",
              variable: "Horizontal current",
              longitude: lon,
              latitude: lat,
              depth_m: currents.depth_m,
              time: currents.time,
              units: currents.units,
              u,
              v,
              speed
            } satisfies Inspection
          },
          position: end,
          pixelSize: 3.8,
          color,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        });
      }
      viewer.scene.primitives.add(lines);
      viewer.scene.primitives.add(heads);
      dynamicPrimitivesRef.current.push(lines, heads);
    }

    viewer.scene.requestRender();
  }, [field, volume, currents, verticalExaggeration]);

  const smoothGlobeZoom = (factor: number) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const position = viewer.camera.positionCartographic;
    const targetHeight = Math.min(6_000_000, Math.max(110_000, position.height * factor));
    viewer.camera.flyTo({
      destination: Cartesian3.fromRadians(position.longitude, position.latitude, targetHeight),
      orientation: {
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll
      },
      duration: 0.48,
      easingFunction: EasingFunction.QUADRATIC_IN_OUT
    });
  };

  const fitGlobeView = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        DEFAULT_GLOBE_VIEW.longitude,
        DEFAULT_GLOBE_VIEW.latitude,
        DEFAULT_GLOBE_VIEW.height
      ),
      orientation: {
        heading: DEFAULT_GLOBE_VIEW.heading,
        pitch: DEFAULT_GLOBE_VIEW.pitch,
        roll: 0
      },
      duration: 0.58,
      easingFunction: EasingFunction.QUADRATIC_IN_OUT
    });
  };

  const scalar = field ?? volume;
  const legendMin = scalar?.minimum ?? currents?.minimum;
  const legendMax = scalar?.maximum ?? currents?.maximum;
  const legendUnits = scalar?.units ?? currents?.units;
  const legendLabel = scalar?.label ?? (currents ? "Current speed" : "Ocean field");

  return (
    <main
      className="globe-shell"
      data-render-scale={renderScale.toFixed(2)}
      data-antialiasing={antialiasing}
      data-render-quality="high"
    >
      <div ref={containerRef} className="cesium-host" />
      <Dual3DModeSwitch
        activeMode={visualizationMode}
        scalarAvailable={scalarAvailable}
        onChange={onVisualizationModeChange}
      />
      <div className="globe-overlay view-zoom-controls" data-label="CESIUM CAMERA">
        <button type="button" aria-label="Globe zoom out" onClick={() => smoothGlobeZoom(1.34)}>−</button>
        <button type="button" aria-label="Fit globe to model region" onClick={fitGlobeView}>FIT</button>
        <button type="button" aria-label="Globe zoom in" onClick={() => smoothGlobeZoom(0.74)}>+</button>
      </div>
      {rendererError && (
        <div className="renderer-fallback-card" role="alert">
          <strong>3D renderer degraded</strong>
          <span>{rendererError}</span>
          <small>
            Scientific controls, provenance and evidence remain available. Reload the app; for a demo emergency use the preserved Streamlit fallback.
          </small>
        </div>
      )}
      <div className="globe-overlay top-left judge-summary">
        <div>
          <span className="live-dot" />
          <strong>INDIAN OCEAN · VERIFIED WINDOW</strong>
        </div>
        <span>67–70°E · 12–14°N · {profiles.length} Argo comparison profiles</span>
        <small>
          {scalar?.label ?? (currents ? "Currents" : "Ocean field")}
          {field ? ` · ${field.depth_m.toFixed(2)} m` : ""}
          {currents ? ` · ${currents.depth_m.toFixed(2)} m` : ""}
          {volume ? " · full water column" : ""}
        </small>
        <small className="render-quality-line">
          HD canvas ×{renderScale.toFixed(2)} · {antialiasing}
        </small>
      </div>
      {inspection && (
        <div className="globe-overlay inspection-card">
          <div className="inspection-title">
            <strong>Scientific inspection</strong>
            <button onClick={() => setInspection(null)} aria-label="Close inspection">×</button>
          </div>
          <span>{inspection.variable}</span>
          <div className="inspection-grid">
            <span>Lon</span><strong>{inspection.longitude.toFixed(4)}°</strong>
            <span>Lat</span><strong>{inspection.latitude.toFixed(4)}°</strong>
            <span>Depth</span><strong>{inspection.depth_m.toFixed(2)} m</strong>
            {inspection.kind === "scalar" ? (
              <>
                <span>Value</span><strong>{inspection.value?.toFixed(4)} {inspection.units}</strong>
              </>
            ) : (
              <>
                <span>u / v</span><strong>{inspection.u?.toFixed(4)} / {inspection.v?.toFixed(4)} {inspection.units}</strong>
                <span>Speed</span><strong>{inspection.speed?.toFixed(4)} {inspection.units}</strong>
              </>
            )}
          </div>
          <small>{inspection.time.replace("T", " ").replace("Z", " UTC")}</small>
          <small>Copernicus GLORYS12V1 · cached verified reanalysis</small>
        </div>
      )}
      {(field || currents) && !volume && (
        <div className="globe-overlay depth-indicator">
          DEPTH PLANE · {(field?.depth_m ?? currents?.depth_m ?? 0).toFixed(2)} m
        </div>
      )}
      <div className="globe-overlay interaction-hint">
        Drag to orbit · scroll to zoom · click Argo or model cells to inspect
      </div>
      <div className="globe-overlay legend-card">
        <span>{legendLabel}</span>
        <div className="gradient-bar" />
        <div className="legend-values">
          <span>{legendMin?.toFixed(3) ?? "—"}</span>
          <span>{legendUnits ?? ""}</span>
          <span>{legendMax?.toFixed(3) ?? "—"}</span>
        </div>
      </div>
      {volume && (
        <div className="globe-overlay volume-note">
          3D WATER COLUMN · stacked verified model layers · visual depth ×{verticalExaggeration}
        </div>
      )}
      {currents && (
        <div className="globe-overlay current-note">
          HORIZONTAL u/v FLOW · arrow direction + speed colour · {currents.depth_m.toFixed(2)} m · projected above globe for readability
        </div>
      )}
    </main>
  );
}
