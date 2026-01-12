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
      {
        id: "hotzones-layer",
        type: "circle",
        source: "hot-zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "intensity"],
            1.2,
            40,
            3.5,
            120,
          ],
          "circle-color": [
            "match",
            ["get", "level"],
            "critical",
            "#dc2626",
            "active",
            "#ef4444",
            "watch",
            "#fca5a5",
            "#fca5a5",
          ],
          "circle-opacity": 0.12,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#991b1b",
        },
      },
      {
        id: "hotzones-critical-halo",
        type: "circle",
        source: "hot-zones",
        filter: ["==", ["get", "level"], "critical"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 60, 5, 180],
          "circle-color": "#dc2626",
          "circle-opacity": 0.08,
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
