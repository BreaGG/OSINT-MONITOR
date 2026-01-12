import { useMemo, useEffect } from "react";
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
  /* ===================== GEOJSON ===================== */
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
            categoryColors[e.category as keyof typeof categoryColors]?.color ??
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

  /* ===================== EVENTS ===================== */
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

  /* ===================== PULSE ANIMATION ===================== */
  useEffect(() => {
    if (!map || !map.getLayer("events-layer")) return;

    let pulse = 0;
    let direction = 1;
    let rafId: number;

    const animate = () => {
      pulse += direction * 0.03;

      if (pulse >= 1) direction = -1;
      if (pulse <= 0) direction = 1;

      /* 🔥 AQUÍ AJUSTAS EL TAMAÑO BASE + PULSO 🔥 */
      map.setPaintProperty("events-layer", "circle-radius", 16 + pulse * 16);
      // ↑ 10 = tamaño base
      // ↑ 4  = cuánto crece al pulsar

      map.setPaintProperty("events-layer", "circle-opacity", 0.6 + pulse * 0.4);

      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(rafId);
  }, [map]);

  /* ===================== MAP LAYER ===================== */
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
          /* 🔴 TAMAÑO BASE (si no quieres animación) */
          "circle-radius": 16, // ← tamaño inicial

          /* COLOR */
          "circle-color": ["get", "color"],

          /* GLOW */
          "circle-blur": 0.9,

          /* OPACIDAD */
          "circle-opacity": 0.85,

          /* ❌ SIN BORDE */
          "circle-stroke-width": 0,
        },
      },
    ],
    eventHandlers,
    visible,
  });
}
