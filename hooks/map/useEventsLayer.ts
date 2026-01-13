import { useMemo, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { categoryColors } from "@/lib/categoryColors";
import { hasCoordinates } from "@/lib/map/helpers";
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

          // Al hacer click, abrir el evento
          window.location.href = `/event/${encodeURIComponent(p.id)}`;
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const p = e.features?.[0]?.properties;
          if (!p || !popupRef.current) return;

          // Obtener color de la categoría
          const categoryColor = p.color || "#9ca3af";
          
          // Buscar el evento completo para obtener la descripción
          const fullEvent = events.find(ev => ev.id === p.id);
          const description = fullEvent?.summary || "";
          
          // Resumir descripción si es muy larga (máximo 150 caracteres)
          const truncatedDescription = description.length > 150 
            ? description.substring(0, 147) + "..." 
            : description;

          const content = `
            <div style="
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
              min-width: 280px;
              max-width: 320px;
              background: #000;
              border: 1px solid #334155;
              border-radius: 4px;
              overflow: hidden;
            ">
              <!-- Header -->
              <div style="
                background: ${categoryColor};
                padding: 10px 12px;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Event Report</div>
                <div style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.3px;
                  line-height: 1.3;
                ">${p.title}</div>
              </div>
              
              <!-- Body -->
              <div style="padding: 12px;">
                <!-- Category Badge -->
                ${p.category ? `
                  <div style="
                    display: inline-block;
                    background: rgba(${parseInt(categoryColor.slice(1,3), 16)}, ${parseInt(categoryColor.slice(3,5), 16)}, ${parseInt(categoryColor.slice(5,7), 16)}, 0.2);
                    color: ${categoryColor};
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    margin-bottom: 10px;
                  ">${p.category}</div>
                ` : ''}
                
                <!-- Description -->
                ${truncatedDescription ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${truncatedDescription}</div>
                ` : ''}
                
                <!-- Country -->
                ${p.country ? `
                  <div style="
                    padding-top: 10px;
                    border-top: 1px solid #1e293b;
                  ">
                    <div style="
                      font-size: 9px;
                      color: #64748b;
                      text-transform: uppercase;
                      letter-spacing: 0.3px;
                      margin-bottom: 6px;
                    ">Location</div>
                    <div style="
                      font-size: 11px;
                      color: #94a3b8;
                      line-height: 1.4;
                    ">${p.country}</div>
                  </div>
                ` : ''}
                
                <!-- Link to Event -->
                <a href="/event/${encodeURIComponent(p.id)}" style="
                  display: block;
                  margin-top: 12px;
                  padding: 8px 12px;
                  background: #1e293b;
                  color: ${categoryColor};
                  text-align: center;
                  border-radius: 3px;
                  font-size: 11px;
                  font-weight: 600;
                  text-decoration: none;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  transition: background 0.2s;
                  border: none;
                  outline: none;
                  box-shadow: none;
                " onmouseover="this.style.background='#334155';this.style.outline='none'" onmouseout="this.style.background='#1e293b'">
                  View Full Report →
                </a>
              </div>
            </div>
          `;

          // Configurar popup para que no se cierre al mover el mouse sobre él
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map);
          
          // Evitar que el popup se cierre cuando el mouse está sobre él
          const popupElement = popupRef.current.getElement();
          if (popupElement) {
            popupElement.addEventListener('mouseenter', () => {
              map.getCanvas().style.cursor = "pointer";
            });
            popupElement.addEventListener('mouseleave', () => {
              popupRef.current?.remove();
            });
          }
        },
        onMouseLeave: () => {
          if (!map) return;
          
          // Solo remover si el mouse no está sobre el popup
          setTimeout(() => {
            const popupElement = popupRef.current?.getElement();
            if (popupElement && !popupElement.matches(':hover')) {
              map.getCanvas().style.cursor = "";
              popupRef.current?.remove();
            }
          }, 100);
        },
      },
    }),
    [map, onSelectSatelliteFocus, popupRef, events]
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