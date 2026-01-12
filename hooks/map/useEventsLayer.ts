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

  /* ===================== PULSE ANIMATION - ESTILO OTAN ===================== */
  useEffect(() => {
    if (!map || !visible) return;

    // Esperar a que la capa exista
    const checkLayer = setInterval(() => {
      if (map.getLayer("events-halo")) {
        clearInterval(checkLayer);
        startAnimation();
      }
    }, 100);

    let rafId: number;
    let pulse = 0;
    let direction = 1;

    const startAnimation = () => {
      const animate = () => {
        if (!map.getLayer("events-halo")) {
          cancelAnimationFrame(rafId);
          return;
        }

        // ⚙️ VELOCIDAD DE ANIMACIÓN (mayor = más rápido)
        pulse += direction * 0.01; // Ajusta entre 0.01 (lento) y 0.05 (rápido)

        if (pulse >= 1) direction = -1;
        if (pulse <= 0) direction = 1;

        try {
          // 🔵 TAMAÑO DEL HALO
          const baseRadius = 10;      // Tamaño inicial del halo
          const pulseAmount = 15;     // Cuánto crece (ajusta entre 10-50)
          map.setPaintProperty(
            "events-halo",
            "circle-radius",
            baseRadius + pulse * pulseAmount
          );

          // 💧 OPACIDAD DEL HALO
          const startOpacity = 0.4;   // Opacidad inicial (0-1)
          const fadeAmount = 0.35;    // Cuánto se desvanece
          map.setPaintProperty(
            "events-halo",
            "circle-opacity",
            startOpacity - pulse * fadeAmount
          );
        } catch (error) {
          // Silenciar errores si la capa no existe
        }

        rafId = requestAnimationFrame(animate);
      };

      animate();
    };

    return () => {
      clearInterval(checkLayer);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [map, visible]);

  /* ===================== MAP LAYER ===================== */
  // Añadir capas SIN beforeId para que estén por encima de hotzones
  return useMapLayer({
    map,
    sourceId: "events",
    sourceConfig: {
      type: "geojson",
      data: eventsGeoJSON,
    },
    layers: [
      // CAPA 1: Halo pulsante NÍTIDO
      {
        id: "events-halo",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": 10,        // ⚙️ Tamaño inicial (debe coincidir con baseRadius)
          "circle-color": ["get", "color"],
          "circle-opacity": 0.4,      // ⚙️ Opacidad inicial (debe coincidir con startOpacity)
          "circle-blur": 0,           // NÍTIDO (0 = sin blur)
        },
        // SIN beforeId para que esté por encima de hotzones
      },
      // CAPA 2: Punto central NÍTIDO
      {
        id: "events-layer",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": 10,        // ⚙️ TAMAÑO DEL PUNTO CENTRAL (ajusta entre 5-12)
          "circle-color": ["get", "color"],
          "circle-opacity": 1,        // Siempre visible al 100%
          "circle-blur": 0,           // NÍTIDO (0 = sin blur)
        },
        // SIN beforeId para que esté por encima de hotzones
      },
    ],
    eventHandlers,
    visible,
  });
}