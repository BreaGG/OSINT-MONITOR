import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { activeConflicts } from "@/lib/activeConflicts";
import { renderConflictPopup } from "@/components/map/popups";
import { useMapLayer } from "./useMapLayer";
import type { SatelliteFocus } from "@/components/SatelliteView";

type UseConflictsLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void;
};

export function useConflictsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseConflictsLayerProps) {
  const conflictsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: activeConflicts.map((c) => ({
        type: "Feature" as const,
        properties: {
          ...c,
          belligerents: Array.isArray(c.belligerents)
            ? c.belligerents.join(", ")
            : c.belligerents,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [c.lon, c.lat],
        },
      })),
    }),
    []
  );

  const eventHandlers = useMemo(
    () => ({
      "conflicts-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const c = e.features?.[0]?.properties;
          if (!c) return;

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: c.name,
            label: `Conflict · ${c.name}`,
          });
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const c = e.features?.[0]?.properties;
          if (!c || !popupRef.current) return;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderConflictPopup({
                name: c.name,
                startDate: c.startDate,
                level: c.level,
                casualties: c.casualties,
                displaced: c.displaced,
                description: c.description,
                belligerents: c.belligerents,
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
    sourceId: "conflicts",
    sourceConfig: {
      type: "geojson",
      data: conflictsGeoJSON,
    },
    layers: [
      {
        id: "conflicts-layer",
        type: "symbol",
        source: "conflicts",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#fecaca",
          "text-halo-color": "#7f1d1d",
          "text-halo-width": 1.5,
        },
      },
    ],
    eventHandlers,
    visible,
  });
}
