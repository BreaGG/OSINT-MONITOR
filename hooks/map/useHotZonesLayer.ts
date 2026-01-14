import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { computeHotZones } from "@/lib/map/helpers";
import { Event } from "@/lib/types";
import { useMapLayer } from "./useMapLayer";

type UseHotZonesLayerProps = {
  map: mapboxgl.Map | null;
  events: Event[];
  visible: boolean;
};

export function useHotZonesLayer({
  map,
  events,
  visible,
}: UseHotZonesLayerProps) {
  // Calcular hot zones
  const hotZones = useMemo(() => computeHotZones(events), [events]);

  // Preparar datos GeoJSON
  const hotZonesGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: hotZones.map((z) => ({
        type: "Feature" as const,
        properties: {
          count: z.count,
          intensity: z.intensity,
          level: z.level,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [z.lon, z.lat],
        },
      })),
    }),
    [hotZones]
  );

  const result = useMapLayer({
    map,
    sourceId: "hot-zones",
    sourceConfig: {
      type: "geojson",
      data: hotZonesGeoJSON,
    },
    layers: [
      // OUTER GLOW - NATO Style
      {
        id: "hotzones-outer-glow",
        type: "circle",
        source: "hot-zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            1.2,
            60,
            3.5,
            140,
          ],
          "circle-color": [
            "match",
            ["get", "level"],
            "critical",
            "#dc2626", // Red oscuro
            "active",
            "#f97316", // Orange
            "watch",
            "#eab308", // Yellow
            "#eab308",
          ],
          "circle-opacity": 0.08,
          "circle-blur": 1,
        },
      },
      
      // MAIN CIRCLE - Definido
      {
        id: "hotzones-main",
        type: "circle",
        source: "hot-zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            1.2,
            35,
            3.5,
            100,
          ],
          "circle-color": [
            "match",
            ["get", "level"],
            "critical",
            "#dc2626",
            "active",
            "#f97316",
            "watch",
            "#eab308",
            "#eab308",
          ],
          "circle-opacity": 0.15,
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "match",
            ["get", "level"],
            "critical",
            "#991b1b", // Dark red
            "active",
            "#c2410c", // Dark orange
            "watch",
            "#a16207", // Dark yellow
            "#a16207",
          ],
          "circle-stroke-opacity": 0.6,
        },
      },

      // INNER CORE - Bright center
      {
        id: "hotzones-core",
        type: "circle",
        source: "hot-zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            1.2,
            8,
            3.5,
            14,
          ],
          "circle-color": [
            "match",
            ["get", "level"],
            "critical",
            "#fca5a5", // Light red
            "active",
            "#fdba74", // Light orange
            "watch",
            "#fde047", // Light yellow
            "#fde047",
          ],
          "circle-opacity": 0.8,
          "circle-blur": 0.2,
        },
      },

      // PULSE EFFECT - Solo para critical
      {
        id: "hotzones-critical-pulse",
        type: "circle",
        source: "hot-zones",
        filter: ["==", ["get", "level"], "critical"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            70,
            5,
            200,
          ],
          "circle-color": "#dc2626",
          "circle-opacity": 0.05,
          "circle-blur": 1.5,
        },
      },

      // DASHED RING - NATO style perimeter
      {
        id: "hotzones-perimeter",
        type: "circle",
        source: "hot-zones",
        filter: ["in", ["get", "level"], ["literal", ["critical", "active"]]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            1.2,
            50,
            3.5,
            120,
          ],
          "circle-color": "transparent",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "match",
            ["get", "level"],
            "critical",
            "#ef4444",
            "active",
            "#fb923c",
            "#fb923c",
          ],
          "circle-stroke-opacity": 0.4,
        },
      },
    ],
    visible,
  });

  return {
    ...result,
    hotZones, // Retornar también para mostrar el contador
  };
}