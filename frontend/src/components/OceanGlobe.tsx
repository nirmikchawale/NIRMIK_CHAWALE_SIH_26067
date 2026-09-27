import { useEffect, useRef, useState } from "react";
import {
  ArcGisMapServerImageryProvider,
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  ColorGeometryInstanceAttribute,
  EllipsoidTerrainProvider,
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
  VolumeResponse
} from "../types";

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
  onSelectProfile: (profileId: string) => void;
  onEnterWaterColumn: () => void;
}

const INTRO_SESSION_KEY = "oceantwin-intro-seen";

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
  onSelectProfile,
  onEnterWaterColumn
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const enterWaterColumnRef = useRef(onEnterWaterColumn);
  const dynamicPrimitivesRef = useRef<Array<PointPrimitiveCollection | PolylineCollection | Primitive>>([]);
  const profileIdsRef = useRef<string[]>([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const depthAnimationRef = useRef<number | null>(null);
  const zoomAnimationRef = useRef<number | null>(null);
  const imageryRequestRef = useRef(0);
  const sliceHeightRef = useRef(0);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [rendererError, setRendererError] = useState("");
  const [renderScale, setRenderScale] = useState(1);
  const [antialiasing, setAntialiasing] = useState("initializing");
  const [cameraHeight, setCameraHeight] = useState(0);
  const [imageryPreference, setImageryPreference] = useState<"auto" | "offline">("auto");
  const [imageryStatus, setImageryStatus] = useState<"connecting" | "online" | "offline" | "grid">("connecting");
  const [introPhase, setIntroPhase] = useState<"idle" | "earth" | "flying" | "region">("idle");

  useEffect(() => {
    enterWaterColumnRef.current = onEnterWaterColumn;
  }, [onEnterWaterColumn]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let introTimer: number | null = null;
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

    viewer.scene.backgroundColor = Color.fromCssColorString("#010913");
    viewer.scene.globe.baseColor = Color.fromCssColorString("#062438");
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.maximumScreenSpaceError = 0.8;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = 0.95;
    viewer.scene.globe.translucency.backFaceAlpha = 0.28;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 18_000_000;
    viewer.scene.screenSpaceCameraController.inertiaZoom = 0.65;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let playOpeningTransition = !reducedMotion;
    try {
      playOpeningTransition = playOpeningTransition && window.sessionStorage.getItem(INTRO_SESSION_KEY) !== "1";
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      // Session storage is optional. The transition still remains nonessential.
    }

    if (playOpeningTransition) {
      setIntroPhase("earth");
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(69.0, 13.0, 14_000_000),
        orientation: {
          heading: 0,
          pitch: CesiumMath.toRadians(-90),
          roll: 0
        }
      });
      setCameraHeight(viewer.camera.positionCartographic.height);
      introTimer = window.setTimeout(() => {
        if (viewer.isDestroyed()) return;
        setIntroPhase("flying");
        viewer.camera.flyTo({
          destination: Rectangle.fromDegrees(66.35, 11.35, 70.65, 14.65),
          duration: 0.9,
          complete: () => {
            if (viewer.isDestroyed()) return;
            setIntroPhase("region");
            setCameraHeight(viewer.camera.positionCartographic.height);
          },
          cancel: () => {
            if (!viewer.isDestroyed()) {
              setIntroPhase("region");
              setCameraHeight(viewer.camera.positionCartographic.height);
            }
          }
        });
      }, 140);
    } else {
      setIntroPhase("region");
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(72.0, 14.2, 1_900_000),
        orientation: {
          heading: CesiumMath.toRadians(248),
          pitch: CesiumMath.toRadians(-76),
          roll: 0
        }
      });
      setCameraHeight(viewer.camera.positionCartographic.height);
    }

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
    const interruptOpeningTransition = () => {
      if (introTimer != null) {
        window.clearTimeout(introTimer);
        introTimer = null;
      }
      viewer.camera.cancelFlight();
      setIntroPhase("region");
    };
    handler.setInputAction(interruptOpeningTransition, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(interruptOpeningTransition, ScreenSpaceEventType.WHEEL);
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
        return;
      }

      const surfacePoint = viewer.camera.pickEllipsoid(
        movement.position,
        viewer.scene.globe.ellipsoid
      );
      if (!surfacePoint) return;
      const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(surfacePoint);
      const longitude = CesiumMath.toDegrees(cartographic.longitude);
      const latitude = CesiumMath.toDegrees(cartographic.latitude);
      if (longitude >= 67 && longitude <= 70 && latitude >= 12 && latitude <= 14) {
        setInspection(null);
        enterWaterColumnRef.current();
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
      removeRenderErrorListener();
      window.removeEventListener("resize", syncRenderQuality);
      if (zoomAnimationRef.current != null) {
        window.cancelAnimationFrame(zoomAnimationRef.current);
        zoomAnimationRef.current = null;
      }
      if (introTimer != null) {
        window.clearTimeout(introTimer);
        introTimer = null;
      }
      clickHandlerRef.current?.destroy();
      clickHandlerRef.current = null;
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onSelectProfile]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const requestId = ++imageryRequestRef.current;
    let removeOnlineErrorListener: (() => void) | null = null;

    const isCurrent = () =>
      !viewer.isDestroyed() && requestId === imageryRequestRef.current;

    const addGridFallback = () => {
      if (!isCurrent()) return;
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
        new GridImageryProvider({
          color: Color.fromCssColorString("#2a6d89").withAlpha(0.52),
          glowColor: Color.fromCssColorString("#071a28").withAlpha(0.42),
          backgroundColor: Color.fromCssColorString("#082335")
        })
      );
      setImageryStatus("grid");
      viewer.scene.requestRender();
    };

    const addOfflineNaturalEarth = async () => {
      if (!isCurrent()) return;
      setImageryStatus("connecting");
      try {
        const provider = await TileMapServiceImageryProvider.fromUrl(
          buildModuleUrl("Assets/Textures/NaturalEarthII"),
          { maximumLevel: 2 }
        );
        if (!isCurrent()) return;
        viewer.imageryLayers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.brightness = 1.10;
        layer.contrast = 1.22;
        layer.saturation = 1.02;
        setImageryStatus("offline");
        viewer.scene.requestRender();
      } catch {
        addGridFallback();
      }
    };

    const addOnlineWorldImagery = async () => {
      setImageryStatus("connecting");
      try {
        const provider = await ArcGisMapServerImageryProvider.fromUrl(
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
        );
        if (!isCurrent()) return;

        let tileErrorCount = 0;
        let failedOver = false;
        removeOnlineErrorListener = provider.errorEvent.addEventListener(() => {
          tileErrorCount += 1;
          if (tileErrorCount < 3 || failedOver || !isCurrent()) return;
          failedOver = true;
          void addOfflineNaturalEarth();
        });

        viewer.imageryLayers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.brightness = 1.03;
        layer.contrast = 1.12;
        layer.saturation = 1.04;
        layer.gamma = 0.96;
        setImageryStatus("online");
        viewer.scene.requestRender();
      } catch {
        await addOfflineNaturalEarth();
      }
    };

    if (imageryPreference === "offline") {
      void addOfflineNaturalEarth();
    } else {
      void addOnlineWorldImagery();
    }

    return () => {
      imageryRequestRef.current += 1;
      removeOnlineErrorListener?.();
    };
  }, [imageryPreference]);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      plane.rectangle.height = new ConstantProperty(targetHeight);
      sliceHeightRef.current = targetHeight;
      viewer.scene.requestRender();
      return;
    }
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

  const selectedProfile = profiles.find((profile) => profile.profile_id === selectedProfileId) ?? null;
  const scalar = field ?? volume;
  const legendMin = scalar?.minimum ?? currents?.minimum;
  const legendMax = scalar?.maximum ?? currents?.maximum;
  const legendUnits = scalar?.units ?? currents?.units;
  const legendLabel = scalar?.label ?? (currents ? "Current speed" : "Ocean field");


  const smoothGlobeZoom = (direction: "in" | "out") => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }

    const initialHeight = viewer.camera.positionCartographic.height;
    const minimumHeight = 115_000;
    const totalDistance =
      direction === "in"
        ? Math.max(0, Math.min(initialHeight * 0.32, initialHeight - minimumHeight))
        : Math.max(90_000, initialHeight * 0.34);

    if (totalDistance <= 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (direction === "in") viewer.camera.zoomIn(totalDistance);
      else viewer.camera.zoomOut(totalDistance);
      setCameraHeight(viewer.camera.positionCartographic.height);
      viewer.scene.requestRender();
      return;
    }

    const startedAt = performance.now();
    const durationMs = 420;
    let previousEased = 0;

    const animate = (now: number) => {
      if (viewer.isDestroyed()) return;
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      const delta = totalDistance * (eased - previousEased);
      previousEased = eased;

      if (direction === "in") viewer.camera.zoomIn(delta);
      else viewer.camera.zoomOut(delta);
      setCameraHeight(viewer.camera.positionCartographic.height);
      viewer.scene.requestRender();

      if (raw < 1) {
        zoomAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    zoomAnimationRef.current = window.requestAnimationFrame(animate);
  };

  const cancelCameraAnimation = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return null;
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }
    viewer.camera.cancelFlight();
    return viewer;
  };

  const fitStudyRegion = () => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(66.35, 11.35, 70.65, 14.65),
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.58,
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const showEarthView = () => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(69.0, 13.0, 14_000_000),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0
      },
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.7,
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const focusSelectedObservation = () => {
    if (!selectedProfile) return;
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        selectedProfile.observation_longitude,
        selectedProfile.observation_latitude,
        520_000
      ),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-76),
        roll: 0
      },
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.5,
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  return (
    <main
      className="globe-shell"
      data-render-scale={renderScale.toFixed(2)}
      data-antialiasing={antialiasing}
      data-render-quality="high"
      data-camera-height={cameraHeight.toFixed(0)}
      data-imagery-preference={imageryPreference}
      data-imagery-status={imageryStatus}
      data-imagery-failsafe="online-hd+offline-natural-earth"
    >
      <div ref={containerRef} className="cesium-host" />
      {rendererError && (
        <div className="renderer-fallback-card" role="alert">
          <strong>3D renderer degraded</strong>
          <span>{rendererError}</span>
          <small>
            Scientific controls, provenance and evidence remain available. Reload the app; for a demo emergency use the preserved Streamlit fallback.
          </small>
        </div>
      )}
      <div className="globe-overlay imagery-control" data-status={imageryStatus}>
        <span>HIGH-QUALITY BASEMAP</span>
        <strong>
          {imageryStatus === "online"
            ? "ArcGIS World Imagery · HD online"
            : imageryStatus === "offline"
              ? "Natural Earth II · offline fail-safe"
              : imageryStatus === "grid"
                ? "Scientific grid fallback"
                : "Resolving best available layer…"}
        </strong>
        <div className="imagery-control-buttons">
          <button
            type="button"
            className={imageryPreference === "auto" ? "active" : ""}
            aria-pressed={imageryPreference === "auto"}
            onClick={() => setImageryPreference("auto")}
          >
            High-res auto
          </button>
          <button
            type="button"
            className={imageryPreference === "offline" ? "active" : ""}
            aria-pressed={imageryPreference === "offline"}
            onClick={() => setImageryPreference("offline")}
          >
            Offline
          </button>
        </div>
        <small>Preferred online HD → automatic offline fallback · basemap only; scientific coordinates and values never change.</small>
      </div>
      {(introPhase === "earth" || introPhase === "flying") && (
        <div className="globe-intro-status" role="status" aria-live="polite">
          <span>OCEANTWIN ORIENTATION</span>
          <strong>{introPhase === "earth" ? "Earth" : "Indian Ocean"}</strong>
          <small>Locating verified model window · 67–70°E · 12–14°N</small>
        </div>
      )}
      {introPhase === "region" && (
        <button
          type="button"
          className="study-region-entry"
          onClick={() => enterWaterColumnRef.current()}
        >
          <span>VERIFIED STUDY REGION</span>
          <strong>Enter Water Column 3D</strong>
          <small>67–70°E · 12–14°N · same model evidence, deeper view</small>
        </button>
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
      <div className="globe-overlay smooth-zoom-controls cesium-smooth-zoom camera-control-stack" aria-label="Ocean Globe camera controls">
        <span>CAMERA</span>
        <div className="camera-zoom-row">
          <button type="button" aria-label="Zoom out Ocean Globe" title="Zoom out" onClick={() => smoothGlobeZoom("out")}>−</button>
          <button type="button" aria-label="Zoom in Ocean Globe" title="Zoom in" onClick={() => smoothGlobeZoom("in")}>+</button>
        </div>
        <div className="camera-preset-row">
          <button type="button" className="camera-preset-button" onClick={fitStudyRegion}>
            <span>FIT</span><strong>Study region</strong>
          </button>
          <button type="button" className="camera-preset-button" onClick={showEarthView}>
            <span>EARTH</span><strong>Global view</strong>
          </button>
        </div>
        <button
          type="button"
          className="camera-observation-button"
          disabled={!selectedProfile}
          onClick={focusSelectedObservation}
        >
          <span>ARGO</span>
          <strong>{selectedProfile ? `Focus ${selectedProfile.platform_id}` : "No observation selected"}</strong>
        </button>
        <small>Wheel to zoom · drag to orbit · one-click geographic presets</small>
      </div>

      <div className="globe-overlay interaction-hint">
        Drag to orbit · wheel to zoom · Fit returns to the verified study area · click evidence to inspect
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
