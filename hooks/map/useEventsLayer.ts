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
// Coordenadas base para cada país (múltiples ubicaciones por país grande)
const COUNTRY_COORDS: Record<string, [number, number][]> = {
  // Venezuela
  "Venezuela": [
    [-66.0, 7.0],
    [-64.5, 6.5],
    [-67.5, 8.0],
    [-65.0, 4.5],
    [-65.5, 9.5],
    [-70.0, 7.5],
  ],
  
  // USA - 20 ubicaciones
  "United States": [
    [-95.7, 37.0],    // Centro (Kansas)
    [-118.2, 34.0],   // California (LA)
    [-122.4, 37.7],   // California (SF)
    [-87.6, 41.8],    // Illinois (Chicago)
    [-95.3, 29.7],    // Texas (Houston)
    [-97.7, 30.2],    // Texas (Austin)
    [-112.0, 33.4],   // Arizona (Phoenix)
    [-84.3, 33.7],    // Georgia (Atlanta)
    [-122.3, 47.6],   // Washington (Seattle)
    [-104.9, 39.7],   // Colorado (Denver)
    [-93.2, 44.9],    // Minnesota (Minneapolis)
    [-122.6, 45.5],   // Oregon (Portland)
    [-71.0, 42.3],    // Massachusetts (Boston)
    [-80.1, 25.7],    // Florida (Miami)
    [-81.6, 30.3],    // Florida (Jacksonville)
    [-74.0, 40.7],    // New York (NYC)
    [-77.0, 38.9],    // D.C./Virginia
    [-90.0, 29.9],    // Louisiana (New Orleans)
    [-105.9, 35.6],   // New Mexico (Santa Fe)
    [-116.2, 43.6],   // Idaho (Boise)
  ],
  
  // Russia - 15 ubicaciones
  "Russia": [
    [37.6, 55.7],     // Moscú
    [30.3, 59.9],     // San Petersburgo
    [82.9, 55.0],     // Novosibirsk
    [60.6, 56.8],     // Yekaterinburg
    [92.8, 56.0],     // Krasnoyarsk
    [131.8, 43.1],    // Vladivostok
    [104.2, 52.2],    // Irkutsk
    [49.1, 55.7],     // Kazan
    [39.7, 47.2],     // Rostov
    [135.0, 48.4],    // Khabarovsk
    [73.3, 54.9],     // Omsk
    [58.6, 56.3],     // Chelyabinsk
    [107.6, 51.8],    // Ulan-Ude
    [142.7, 46.9],    // Yuzhno-Sakhalinsk
    [151.9, 59.2],    // Magadan
  ],
  
  "Russian Federation": [
    [37.6, 55.7],
    [30.3, 59.9],
    [82.9, 55.0],
    [60.6, 56.8],
    [92.8, 56.0],
    [131.8, 43.1],
    [104.2, 52.2],
    [49.1, 55.7],
    [39.7, 47.2],
    [135.0, 48.4],
    [73.3, 54.9],
    [58.6, 56.3],
    [107.6, 51.8],
    [142.7, 46.9],
    [151.9, 59.2],
  ],
  
  // China - 15 ubicaciones
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
    [117.1, 36.6],    // Jinan
    [118.7, 32.0],    // Nanjing
    [106.5, 29.5],    // Chongqing
    [87.6, 43.8],     // Urumqi
    [91.1, 29.6],     // Lhasa
  ],
  
  // Ukraine - 8 ubicaciones
  "Ukraine": [
    [30.5, 50.4],     // Kyiv
    [36.2, 49.9],     // Kharkiv
    [35.0, 48.4],     // Dnipro
    [30.7, 46.4],     // Odesa
    [24.0, 49.8],     // Lviv
    [35.1, 47.8],     // Zaporizhzhia
    [26.2, 48.2],     // Chernivtsi
    [32.0, 49.4],     // Cherkasy
  ],
  
  // Syria - 7 ubicaciones
  "Syria": [
    [36.2, 33.5],     // Damascus
    [37.1, 36.2],     // Aleppo
    [36.7, 34.7],     // Homs
    [36.6, 35.9],     // Idlib
    [39.0, 35.9],     // Raqqa
    [40.9, 35.3],     // Deir ez-Zor
    [35.9, 35.5],     // Latakia
  ],
  
  // Israel - 6 ubicaciones
  "Israel": [
    [35.2, 31.7],     // Jerusalem
    [34.7, 32.0],     // Tel Aviv
    [34.9, 32.7],     // Haifa
    [34.8, 31.2],     // Beersheba
    [35.5, 32.7],     // Nazareth
    [34.8, 32.4],     // Netanya
  ],
  
  // Iran - 8 ubicaciones
  "Iran": [
    [51.3, 35.6],     // Tehran
    [51.6, 32.6],     // Isfahan
    [59.5, 36.2],     // Mashhad
    [46.2, 38.0],     // Tabriz
    [52.5, 29.6],     // Shiraz
    [48.5, 34.3],     // Qom
    [50.8, 34.6],     // Karaj
    [60.6, 38.0],     // Ashgabat region
  ],
  
  // Turkey - 8 ubicaciones
  "Turkey": [
    [32.8, 39.9],     // Ankara
    [28.9, 41.0],     // Istanbul
    [27.1, 38.4],     // Izmir
    [37.0, 37.0],     // Gaziantep
    [30.7, 36.8],     // Antalya
    [35.3, 38.7],     // Kayseri
    [38.3, 37.9],     // Malatya
    [41.0, 40.9],     // Trabzon
  ],
  
  // India - 10 ubicaciones
  "India": [
    [77.2, 28.6],     // New Delhi
    [72.8, 19.0],     // Mumbai
    [77.5, 12.9],     // Bangalore
    [80.2, 13.0],     // Chennai
    [88.3, 22.5],     // Kolkata
    [78.4, 17.4],     // Hyderabad
    [72.5, 23.0],     // Ahmedabad
    [75.8, 11.2],     // Calicut
    [85.3, 23.3],     // Ranchi
    [76.9, 8.5],      // Trivandrum
  ],
  
  // Brazil - 8 ubicaciones
  "Brazil": [
    [-47.9, -15.7],   // Brasília
    [-43.9, -19.9],   // Belo Horizonte
    [-46.6, -23.5],   // São Paulo
    [-43.2, -22.9],   // Rio de Janeiro
    [-51.2, -30.0],   // Porto Alegre
    [-49.2, -25.4],   // Curitiba
    [-48.5, -27.5],   // Florianópolis
    [-38.5, -12.9],   // Salvador
  ],
  
  // Canada - 8 ubicaciones
  "Canada": [
    [-75.6, 45.4],    // Ottawa
    [-79.3, 43.6],    // Toronto
    [-73.5, 45.5],    // Montreal
    [-123.1, 49.2],   // Vancouver
    [-114.0, 51.0],   // Calgary
    [-113.4, 53.5],   // Edmonton
    [-97.1, 49.8],    // Winnipeg
    [-52.7, 47.5],    // St. John's
  ],
}

// Sistema de dispersión en espiral (EXACTAMENTE como signals)
const eventPositions = new Map<string, number>()

function addJitter(coords: [number, number], eventId: string): [number, number] {
  // Crear key única basada en coordenadas
  const key = `${coords[0].toFixed(4)}_${coords[1].toFixed(4)}`
  
  // Obtener cuántos eventos ya hay en esta ubicación exacta
  const existingCount = eventPositions.get(key) || 0
  eventPositions.set(key, existingCount + 1)
  
  // Si es el primer evento, usar el centro exacto
  if (existingCount === 0) {
    return coords
  }
  
  // Golden angle spiral para distribución óptima
  const GOLDEN_ANGLE = 137.508 // grados
  const angle = (existingCount * GOLDEN_ANGLE) * (Math.PI / 180)
  
  // Distancia crece con sqrt para espiral uniforme
  // AUMENTADO: 0.8 grados = ~88km radio base (antes 0.5 = ~55km)
  const baseRadius = 0.8
  const distance = baseRadius * Math.sqrt(existingCount)
  
  return [
    coords[0] + distance * Math.cos(angle),
    coords[1] + distance * Math.sin(angle),
  ]
}

function getEventCoordinates(event: Event): [number, number] | null {
  const country = event.country
  if (!country || country === "Unknown") return null
  
  // Si el evento tiene coordenadas específicas, usarlas directamente
  if (event.lon && event.lat) {
    return addJitter([event.lon, event.lat], event.id)
  }
  
  // Buscar ubicaciones predefinidas para este país
  const locations = COUNTRY_COORDS[country]
  
  if (!locations || locations.length === 0) {
    console.warn(`⚠️ No coordinates for country: ${country}`)
    return null
  }
  
  // Usar hash del ID para asignar ubicación consistente
  let hash = 0
  for (let i = 0; i < event.id.length; i++) {
    hash = ((hash << 5) - hash) + event.id.charCodeAt(i)
    hash = hash & hash
  }
  const locationIndex = Math.abs(hash) % locations.length
  const baseLocation = locations[locationIndex]
  
  // Aplicar jitter con dispersión en espiral
  return addJitter(baseLocation, event.id)
}

// Hash simple pero efectivo para strings
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
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
    // Limpiar el mapa de posiciones antes de procesar
    eventPositions.clear()
    
    // Procesar todos los eventos
    const features = events
      .map((e) => {
        const coords = getEventCoordinates(e)
        
        // Si no se pudieron obtener coordenadas, saltar este evento
        if (!coords) return null
        
        const [lon, lat] = coords
        
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
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
    
    console.log(`📍 Events rendered: ${features.length} / ${events.length}`)
    
    return {
      type: "FeatureCollection" as const,
      features,
    }
  }, [events]);

  /* ===================== EVENTS ===================== */
  const eventHandlers = useMemo(
    () => ({
      "events-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;

          // Guardar que venimos del mapa
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
              background: #000000;
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