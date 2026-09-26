import { useEffect, useRef } from "react";
import {
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
  PointPrimitiveCollection,
  PolylineCollection,
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

interface Props {
  field: FieldResponse | null;
  volume: VolumeResponse | null;
  currents: CurrentsResponse | null;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  verticalExaggeration: number;
  onSelectProfile: (profileId: string) => void;
}

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
  onSelectProfile
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const dynamicPrimitivesRef = useRef<Array<PointPrimitiveCollection | PolylineCollection | Primitive>>([]);
  const profileIdsRef = useRef<string[]>([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const depthAnimationRef = useRef<number | null>(null);
  const sliceHeightRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Viewer(containerRef.current, {
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
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY
    });

    const addGridFallback = () => {
      if (viewer.isDestroyed()) return;
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
        new GridImageryProvider({
          color: Color.fromCssColorString("#21445b").withAlpha(0.45),
          glowColor: Color.fromCssColorString("#061723").withAlpha(0.35),
          backgroundColor: Color.fromCssColorString("#071a27")
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
        viewer.imageryLayers.addImageryProvider(provider);
        viewer.scene.requestRender();
      })
      .catch(() => {
        // A missing/corrupt basemap must never take down the scientific demo.
        addGridFallback();
      });

    viewer.scene.backgroundColor = Color.fromCssColorString("#020a11");
    viewer.scene.globe.baseColor = Color.fromCssColorString("#071a27");
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = 0.88;
    viewer.scene.globe.translucency.backFaceAlpha = 0.20;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(68.5, 13.0, 1_350_000),
      duration: 0
    });

    const boundary = viewer.entities.add({
      id: "model-domain-boundary",
      polyline: {
        positions: Cartesian3.fromDegreesArray([
          67, 12, 70, 12, 70, 14, 67, 14, 67, 12
        ]),
        width: 2,
        material: Color.fromCssColorString("#4ad7f5").withAlpha(0.85)
      }
    });
    void boundary;

    viewerRef.current = viewer;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.position) as { id?: { id?: string } } | undefined;
      const id = picked?.id?.id;
      if (typeof id === "string" && id.startsWith("argo:")) {
        onSelectProfile(id.slice(5));
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
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
          pixelSize: selected ? 16 : 11,
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
            position: Cartesian3.fromDegrees(
              field.longitude[xi],
              field.latitude[yi],
              -field.depth_m * verticalExaggeration
            ),
            pixelSize: 6,
            color: scalarColor(value, field.minimum, field.maximum, field.variable),
            outlineColor: Color.fromCssColorString("#00111c"),
            outlineWidth: 0.5,
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
        const color = scalarColor(value, volume.minimum, volume.maximum, volume.variable).withAlpha(0.30);
        instances.push(
          new GeometryInstance({
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
          width: 2.2,
          material: Material.fromType("Color", { color })
        });
        heads.add({
          position: end,
          pixelSize: 4.5,
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

  const scalar = field ?? volume;
  const legendMin = scalar?.minimum ?? currents?.minimum;
  const legendMax = scalar?.maximum ?? currents?.maximum;
  const legendUnits = scalar?.units ?? currents?.units;
  const legendLabel = scalar?.label ?? (currents ? "Current speed" : "Ocean field");

  return (
    <main className="globe-shell">
      <div ref={containerRef} className="cesium-host" />
      <div className="globe-overlay top-left">
        <span className="live-dot" />
        <strong>Verified local scientific data</strong>
      </div>
      {(field || currents) && !volume && (
        <div className="globe-overlay depth-indicator">
          DEPTH PLANE · {(field?.depth_m ?? currents?.depth_m ?? 0).toFixed(2)} m
        </div>
      )}
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
          Selected-depth vectors projected above the globe for readability · {currents.depth_m.toFixed(2)} m
        </div>
      )}
    </main>
  );
}
