import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { categoryColors } from "@/lib/categoryColors";
import { hasCoordinates } from "@/lib/map/helpers";
import { renderEventPopup } from "@/components/map/popups";
import { useMapLayer } from "./useMapLayer";
import type { SatelliteFocus } from "@/components/SatelliteView";

type UseEventsLayerProps = {
  map: mapboxgl.Map | null;
  events: Event[];
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void;
};

export function useEventsLayer({
  map,
  events,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseEventsLayerProps) {
  // Preparar datos GeoJSON
  const eventsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: events.filter(hasCoordinates).map((e) => ({
        type: "Feature" as const,
        properties: {
          id: e.id,
          title: e.title,
          country: e.country,
          category: e.category,
          color:
            categoryColors[e.category as keyof typeof categoryColors]?.color ||
            "#9ca3af",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [e.lon, e.lat],
        },
      })),
    }),
    [events]
  );

  // Event handlers
  const eventHandlers = useMemo(
    () => ({
      "events-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: p.country ?? "Selected area",
            label: p.title,
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
              renderEventPopup({
                title: p.title,
                country: p.country,
                category: p.category,
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

  // Usar el hook
  return useMapLayer({
    map,
    sourceId: "events",
    sourceConfig: {
      type: "geojson",
      data: eventsGeoJSON,
    },
    layers: [
      {
        id: "events-layer",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": 4,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
    eventHandlers,
    visible,
  });
}
