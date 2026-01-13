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

/* ===================== COUNTRY COORDINATES ===================== */
// Coordenadas ajustadas para evitar superposiciones con capitales
const COUNTRY_COORDS: Record<string, [number, number][]> = {
  // Venezuela - centro del país (lejos de Caracas)
  "Venezuela": [
    [-66.0, 7.0],     // Centro
    [-64.5, 6.5],     // Este
    [-67.5, 8.0],     // Oeste
    [-65.0, 4.5],     // Sur
  ],
  
  // USA - por regiones/estados
  "United States": [
    [-95.7, 37.0],    // Centro
    [-118.2, 34.0],   // California
    [-87.6, 41.8],    // Illinois
    [-95.3, 29.7],    // Texas
    [-112.0, 33.4],   // Arizona
    [-84.3, 33.7],    // Georgia
    [-122.3, 47.6],   // Washington
    [-104.9, 39.7],   // Colorado
    [-93.2, 44.9],    // Minnesota
    [-122.6, 45.5],   // Oregon
    [-71.0, 42.3],    // Massachusetts
    [-80.1, 25.7],    // Florida
  ],
  
  // Russia - por regiones
  "Russia": [
    [37.6, 55.7],     // Moscú región
    [30.3, 59.9],     // San Petersburgo
    [82.9, 55.0],     // Novosibirsk
    [60.6, 56.8],     // Yekaterinburg
    [92.8, 56.0],     // Krasnoyarsk
    [131.8, 43.1],    // Vladivostok
    [104.2, 52.2],    // Irkutsk
    [49.1, 55.7],     // Kazan
    [39.7, 47.2],     // Rostov
    [135.0, 48.4],    // Khabarovsk
  ],
  
  "Russian Federation": [
    [37.6, 55.7],     // Moscú región
    [30.3, 59.9],     // San Petersburgo
    [82.9, 55.0],     // Novosibirsk
    [60.6, 56.8],     // Yekaterinburg
    [92.8, 56.0],     // Krasnoyarsk
    [131.8, 43.1],    // Vladivostok
    [104.2, 52.2],    // Irkutsk
    [49.1, 55.7],     // Kazan
    [39.7, 47.2],     // Rostov
    [135.0, 48.4],    // Khabarovsk
  ],
  
  // China - por regiones
  "China": [
    [116.4, 39.9],    // Beijing
    [121.4, 31.2],    // Shanghai
    [113.2, 23.1],    // Guangzhou
    [114.0, 22.5],    // Shenzhen
    [104.0, 30.5],    // Chengdu
    [114.3, 30.5],    // Wuhan
    [120.1, 30.2],    // Hangzhou
    [108.9, 34.3],    // Xi'an
    [126.5, 45.8],    // Harbin
    [102.8, 24.8],    // Kunming
  ],
  
  // Ukraine
  "Ukraine": [
    [30.5, 50.4],     // Kyiv
    [36.2, 49.9],     // Kharkiv
    [35.0, 48.4],     // Dnipro
    [30.7, 46.4],     // Odesa
    [24.0, 49.8],     // Lviv
    [35.1, 47.8],     // Zaporizhzhia
  ],
  
  // Syria
  "Syria": [
    [36.2, 33.5],     // Damascus
    [37.1, 36.2],     // Aleppo
    [36.7, 34.7],     // Homs
    [36.6, 35.9],     // Idlib
    [39.0, 35.9],     // Raqqa
  ],
  
  // Israel
  "Israel": [
    [35.2, 31.7],     // Jerusalem
    [34.7, 32.0],     // Tel Aviv
    [34.9, 32.7],     // Haifa
    [34.8, 31.2],     // Sur
  ],
  
  // Iran
  "Iran": [
    [51.3, 35.6],     // Tehran
    [51.6, 32.6],     // Isfahan
    [59.5, 36.2],     // Mashhad
    [46.2, 38.0],     // Tabriz
  ],
  
  // Turkey
  "Turkey": [
    [32.8, 39.9],     // Ankara
    [28.9, 41.0],     // Istanbul
    [27.1, 38.4],     // Izmir
    [37.0, 37.0],     // Sur
  ],
}

// Sistema de dispersión para múltiples eventos en el mismo país
const eventPositionMap = new Map<string, number>()

function getEventCoordinates(event: Event): [number, number] {
  // Si el evento ya tiene coordenadas específicas, usarlas
  if (event.lon && event.lat) {
    return [event.lon, event.lat]
  }
  
  const country = event.country
  if (!country) return [0, 0]
  
  // Obtener ubicaciones disponibles para este país
  const locations = COUNTRY_COORDS[country]
  
  if (!locations || locations.length === 0) {
    // Si no hay ubicaciones predefinidas, usar coordenadas del evento
    return [event.lon || 0, event.lat || 0]
  }
  
  // Obtener índice para este país (rotación entre ubicaciones)
  const currentIndex = eventPositionMap.get(country) || 0
  const location = locations[currentIndex % locations.length]
  
  // Incrementar índice para el próximo evento
  eventPositionMap.set(country, currentIndex + 1)
  
  // Añadir jitter pequeño para evitar superposición exacta
  const jitter = 0.3 // ~33km
  return [
    location[0] + (Math.random() - 0.5) * jitter,
    location[1] + (Math.random() - 0.5) * jitter,
  ]
}

export function useEventsLayer({
  map,
  events,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseEventsLayerProps) {
  /* ===================== GEOJSON ===================== */
  const eventsGeoJSON = useMemo(() => {
    // Resetear mapa de posiciones al recalcular
    eventPositionMap.clear()
    
    return {
      type: "FeatureCollection" as const,
      features: events.filter(hasCoordinates).map((e) => {
        const [lon, lat] = getEventCoordinates(e)
        
        return {
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
            coordinates: [lon, lat],
          },
        }
      }),
    }
  }, [events]);

  /* ===================== EVENTS ===================== */
  const eventHandlers = useMemo(
    () => ({
      "events-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;
          sessionStorage.setItem("event-origin", "map");

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