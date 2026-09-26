import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  EllipsoidTerrainProvider,
  GridImageryProvider,
  HorizontalOrigin,
  LabelStyle,
  PointPrimitiveCollection,
  PolylineCollection,
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
  const dynamicPrimitivesRef = useRef<Array<PointPrimitiveCollection | PolylineCollection>>([]);
  const profileIdsRef = useRef<string[]>([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);

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
      terrainProvider: new EllipsoidTerrainProvider(),
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY
    });

    viewer.imageryLayers.addImageryProvider(
      new GridImageryProvider({
        color: Color.fromCssColorString("#21445b").withAlpha(0.45),
        glowColor: Color.fromCssColorString("#061723").withAlpha(0.35),
        backgroundColor: Color.fromCssColorString("#071a27")
      })
    );

    viewer.scene.backgroundColor = Color.fromCssColorString("#020a11");
    viewer.scene.globe.baseColor = Color.fromCssColorString("#071a27");
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.translucency.enabled = true;
    viewer.scene.globe.translucency.frontFaceAlpha = 0.72;
    viewer.scene.globe.translucency.backFaceAlpha = 0.28;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(68.5, 13.0, 780_000),
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
      const collection = new PointPrimitiveCollection();
      for (const [lon, lat, depth, value] of volume.points) {
        collection.add({
          position: Cartesian3.fromDegrees(lon, lat, -depth * verticalExaggeration),
          pixelSize: 3.4,
          color: scalarColor(value, volume.minimum, volume.maximum, volume.variable).withAlpha(0.72),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        });
      }
      viewer.scene.primitives.add(collection);
      dynamicPrimitivesRef.current.push(collection);
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
          material: color
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
      <div className="globe-overlay legend-card">
        <span>{legendLabel}</span>
        <div className="gradient-bar" />
        <div className="legend-values">
          <span>{legendMin?.toFixed(3) ?? "—"}</span>
          <span>{legendUnits ?? ""}</span>
          <span>{legendMax?.toFixed(3) ?? "—"}</span>
        </div>
      </div>
      {currents && (
        <div className="globe-overlay current-note">
          Selected-depth vectors projected above the globe for readability · {currents.depth_m.toFixed(2)} m
        </div>
      )}
    </main>
  );
}
