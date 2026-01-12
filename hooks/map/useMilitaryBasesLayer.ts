import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { strategicMilitaryBases } from "@/lib/strategicMilitaryBases";
import { renderMilitaryBasePopup } from "@/components/map/popups";
import { useMapLayer } from "./useMapLayer";

type UseMilitaryBasesLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
};

export function useMilitaryBasesLayer({
  map,
  visible,
  popupRef,
}: UseMilitaryBasesLayerProps) {
  const militaryBasesGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: strategicMilitaryBases.map((b) => ({
        type: "Feature" as const,
        properties: b,
        geometry: {
          type: "Point" as const,
          coordinates: [b.lon, b.lat],
        },
      })),
    }),
    []
  );

  const eventHandlers = useMemo(
    () => ({
      "military-bases-layer": {
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const b = e.features?.[0]?.properties;
          if (!b || !popupRef.current) return;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderMilitaryBasePopup({
                name: b.name,
                country: b.country,
                description: b.description,
                significance: b.significance,
              })
            )
            .addTo(map);
        },
        onMouseLeave: () => {
          if (!map) return;
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
        },
      },
    }),
    [map, popupRef]
  );

  return useMapLayer({
    map,
    sourceId: "military-bases",
    sourceConfig: {
      type: "geojson",
      data: militaryBasesGeoJSON,
    },
    layers: [
      {
        id: "military-bases-layer",
        type: "symbol",
        source: "military-bases",
        layout: {
          "text-field": "★",
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1.5,
            16,
            3,
            20,
            5,
            26,
          ],
          "text-anchor": "center",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#a855f7",
          "text-halo-color": "#020617",
          "text-halo-width": 0.75,
        },
      },
    ],
    eventHandlers,
    visible,
  });
}
