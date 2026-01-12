import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { strategicPoints } from "@/lib/strategicPoints";
import { renderCapitalPopup } from "@/components/map/popups";
import { useMapLayer } from "./useMapLayer";
import type { SatelliteFocus } from "@/components/SatelliteView";

type UseCapitalsLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void;
};

export function useCapitalsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseCapitalsLayerProps) {
  const capitalsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: strategicPoints.map((p) => ({
        type: "Feature" as const,
        properties: {
          ...p,
          entities: Array.isArray(p.entities)
            ? p.entities.join(", ")
            : p.entities,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lon, p.lat],
        },
      })),
    }),
    []
  );

  const eventHandlers = useMemo(
    () => ({
      "capitals-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: p.country ?? p.name,
            label: p.name,
          });
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const p = e.features?.[0]?.properties;
          if (!p || !popupRef.current) return;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderCapitalPopup({
                name: p.name,
                status: p.status,
                summary: p.summary,
                entities: p.entities,
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
    [map, onSelectSatelliteFocus, popupRef]
  );

  return useMapLayer({
    map,
    sourceId: "capitals",
    sourceConfig: {
      type: "geojson",
      data: capitalsGeoJSON,
    },
    layers: [
      {
        id: "capitals-layer",
        type: "circle",
        source: "capitals",
        paint: {
          "circle-radius": 6,
          "circle-color": "#365314",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: "capitals-labels",
        type: "symbol",
        source: "capitals",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#e5e7eb",
          "text-halo-color": "#020617",
          "text-halo-width": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  });
}
