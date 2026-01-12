import { useEffect, useMemo, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useMapLayer } from "./useMapLayer";

type TrafficType = "aircraft" | "vessels";

type Aircraft = {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
};

type Vessel = {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  ship_type: string;
};

type UseTrafficLayerProps = {
  map: mapboxgl.Map | null;
  type: TrafficType;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
};

/**
 * Hook para mostrar tráfico aéreo o marítimo en tiempo real
 *
 * Fuentes de datos:
 * - Aircraft: OpenSky Network API (gratuita, sin auth)
 * - Vessels: MarineTraffic / AIS (simulado para demo)
 */
export function useTrafficLayer({
  map,
  type,
  visible,
  popupRef,
}: UseTrafficLayerProps) {
  const [data, setData] = useState<Aircraft[] | Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulatedPositions, setSimulatedPositions] = useState<
    Map<string, { lat: number; lon: number; course: number }>
  >(new Map());

  // Fetch data periódicamente
  useEffect(() => {
    if (!visible || !map) return;

    console.log(`[${type}] Fetching traffic data...`, {
      visible,
      mapReady: !!map,
    });

    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === "aircraft") {
          // OpenSky Network API - tráfico aéreo real
          const response = await fetch(
            "https://opensky-network.org/api/states/all"
          );
          const json = await response.json();

          const aircraft: Aircraft[] =
            json.states
              ?.slice(0, 200) // Limitar a 200 aviones
              .filter((s: any) => s[5] !== null && s[6] !== null) // Solo con coordenadas
              .map((s: any) => ({
                icao24: s[0],
                callsign: s[1]?.trim() || null,
                origin_country: s[2],
                longitude: s[5],
                latitude: s[6],
                altitude: s[7],
                velocity: s[9],
                heading: s[10],
              })) || [];

          setData(aircraft);
          console.log(`[aircraft] Loaded ${aircraft.length} aircraft`);
        } else {
          // Vessels - datos simulados (la API real requiere auth)
          const vessels: Vessel[] = generateSimulatedVessels();
          setData(vessels);
          console.log(`[vessels] Generated ${vessels.length} vessels`);
        }
      } catch (error) {
        console.error(`Error fetching ${type} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(
      fetchData,
      type === "aircraft" ? 10000 : 30000
    );

    return () => clearInterval(interval);
  }, [type, visible, map]);

  // Simulación de movimiento en tiempo real
  useEffect(() => {
    if (!visible || data.length === 0) return;

    const animate = () => {
      setSimulatedPositions((prev) => {
        const next = new Map(prev);

        if (type === "vessels") {
          const vessels = data as Vessel[];
          vessels.forEach((v) => {
            const current = next.get(v.mmsi) || {
              lat: v.lat,
              lon: v.lon,
              course: v.course,
            };

            // Mover el barco: ~0.0001° por segundo = aprox 11 metros
            // Un barco a 15 nudos = 27.78 km/h = 0.00463 km/s = 0.0000417°/s
            const speed = v.speed / 3600; // nudos a km/s
            const moveDistance = speed * 0.009; // grados por segundo (aproximado)

            const newLat =
              current.lat +
              Math.cos((current.course * Math.PI) / 180) * moveDistance;
            const newLon =
              current.lon +
              Math.sin((current.course * Math.PI) / 180) * moveDistance;

            next.set(v.mmsi, {
              lat: newLat,
              lon: newLon,
              course: current.course,
            });
          });
        } else if (type === "aircraft") {
          const aircraft = data as Aircraft[];
          aircraft.forEach((a) => {
            if (!a.heading || !a.velocity) return;

            const current = next.get(a.icao24) || {
              lat: a.latitude!,
              lon: a.longitude!,
              course: a.heading,
            };

            // Aviones mucho más rápidos: ~0.001° por segundo
            const speed = (a.velocity || 250) / 3600; // m/s a km/s
            const moveDistance = speed * 0.009;

            const newLat =
              current.lat +
              Math.cos((current.course * Math.PI) / 180) * moveDistance;
            const newLon =
              current.lon +
              Math.sin((current.course * Math.PI) / 180) * moveDistance;

            next.set(a.icao24, {
              lat: newLat,
              lon: newLon,
              course: current.course,
            });
          });
        }

        return next;
      });
    };

    // Actualizar posiciones cada segundo
    const animationInterval = setInterval(animate, 1000);

    return () => clearInterval(animationInterval);
  }, [data, type, visible]);

  // Convertir a GeoJSON con posiciones simuladas
  const trafficGeoJSON = useMemo(() => {
    if (type === "aircraft") {
      const aircraft = data as Aircraft[];
      return {
        type: "FeatureCollection" as const,
        features: aircraft.map((a) => {
          const simulated = simulatedPositions.get(a.icao24);
          const lat = simulated?.lat ?? a.latitude!;
          const lon = simulated?.lon ?? a.longitude!;

          return {
            type: "Feature" as const,
            properties: {
              id: a.icao24,
              callsign: a.callsign || "Unknown",
              country: a.origin_country,
              altitude: a.altitude ? Math.round(a.altitude) : 0,
              velocity: a.velocity ? Math.round(a.velocity * 3.6) : 0,
              heading: simulated?.course ?? a.heading ?? 0,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [lon, lat],
            },
          };
        }),
      };
    } else {
      const vessels = data as Vessel[];
      return {
        type: "FeatureCollection" as const,
        features: vessels.map((v) => {
          const simulated = simulatedPositions.get(v.mmsi);
          const lat = simulated?.lat ?? v.lat;
          const lon = simulated?.lon ?? v.lon;

          return {
            type: "Feature" as const,
            properties: {
              id: v.mmsi,
              name: v.name,
              type: v.ship_type,
              speed: Math.round(v.speed),
              course: simulated?.course ?? v.course,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [lon, lat],
            },
          };
        }),
      };
    }
  }, [data, type, simulatedPositions]);

  // Event handlers
  const eventHandlers = useMemo(() => {
    const layerId = type === "aircraft" ? "aircraft-layer" : "vessels-layer";

    return {
      [layerId]: {
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const p = e.features?.[0]?.properties;
          if (!p || !popupRef.current) return;

          const content =
            type === "aircraft"
              ? `
              <div style="padding:8px;font-size:12px;line-height:1.4">
                <div style="font-weight:600;color:#fbbf24">✈ ${p.callsign}</div>
                <div style="font-size:11px;color:#9ca3af;margin-top:2px">${p.country}</div>
                <div style="margin-top:4px;font-size:11px">
                  <div>Alt: ${p.altitude}m</div>
                  <div>Speed: ${p.velocity} km/h</div>
                </div>
              </div>
            `
              : `
              <div style="padding:8px;font-size:12px;line-height:1.4">
                <div style="font-weight:600;color:#3b82f6">🚢 ${p.name}</div>
                <div style="font-size:11px;color:#9ca3af;margin-top:2px">${p.type}</div>
                <div style="margin-top:4px;font-size:11px">
                  <div>Speed: ${p.speed} knots</div>
                </div>
              </div>
            `;

          popupRef.current.setLngLat(e.lngLat).setHTML(content).addTo(map);
        },
        onMouseLeave: () => {
          if (!map) return;
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
        },
      },
    };
  }, [map, type, popupRef]);

  const layerId = type === "aircraft" ? "aircraft-layer" : "vessels-layer";
  const sourceId = type === "aircraft" ? "aircraft" : "vessels";

  const result = useMapLayer({
    map,
    sourceId,
    sourceConfig: {
      type: "geojson",
      data: trafficGeoJSON,
    },
    layers:
      type === "aircraft"
        ? [
            // Solo símbolo para aviones
            {
              id: layerId,
              type: "symbol",
              source: sourceId,
              layout: {
                "text-field": "✈",
                "text-size": 20,
                "text-allow-overlap": true,
                "text-rotate": ["get", "heading"],
                "text-rotation-alignment": "map",
              },
              paint: {
                "text-color": "#fbbf24",
                "text-halo-color": "#020617",
                "text-halo-width": 2,
              },
            },
          ]
        : [
            // Casco del barco (rectángulo horizontal)
            {
              id: `${layerId}-hull`,
              type: "circle",
              source: sourceId,
              paint: {
                "circle-radius": [
                  "match",
                  ["get", "type"],
                  "Container",
                  10,
                  "Tanker",
                  9,
                  "Cargo",
                  8,
                  "Bulk Carrier",
                  9,
                  "Military",
                  8,
                  "Cruise",
                  11,
                  8,
                ],
                "circle-color": [
                  "match",
                  ["get", "type"],
                  "Military",
                  "#dc2626", // Rojo para militares
                  "Cruise",
                  "#8b5cf6", // Morado para cruceros
                  "#3b82f6", // Azul para cargueros
                ],
                "circle-opacity": 0.8,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#ffffff",
              },
            },
            // Proa puntiaguda
            {
              id: `${layerId}-bow`,
              type: "symbol",
              source: sourceId,
              layout: {
                "text-field": "▶",
                "text-size": [
                  "match",
                  ["get", "type"],
                  "Container",
                  18,
                  "Tanker",
                  16,
                  "Cargo",
                  14,
                  "Bulk Carrier",
                  16,
                  "Military",
                  16,
                  "Cruise",
                  20,
                  14,
                ],
                "text-allow-overlap": true,
                "text-rotate": ["get", "course"],
                "text-rotation-alignment": "map",
                "text-offset": [0.8, 0], // Desplazar hacia adelante
              },
              paint: {
                "text-color": [
                  "match",
                  ["get", "type"],
                  "Military",
                  "#dc2626",
                  "Cruise",
                  "#8b5cf6",
                  "#3b82f6",
                ],
                "text-halo-color": "#020617",
                "text-halo-width": 1.5,
              },
            },
            // Superestructura (distintivo por tipo)
            {
              id: `${layerId}-superstructure`,
              type: "symbol",
              source: sourceId,
              layout: {
                "text-field": [
                  "match",
                  ["get", "type"],
                  "Container",
                  "▪▪", // Contenedores apilados
                  "Tanker",
                  "●", // Tanque redondo
                  "Cargo",
                  "▪", // Carga general
                  "Bulk Carrier",
                  "▬", // A granel
                  "Military",
                  "⬢", // Hexágono militar
                  "Cruise",
                  "▮▮▮", // Múltiples cubiertas
                  "▪",
                ],
                "text-size": 8,
                "text-allow-overlap": true,
                "text-rotate": ["get", "course"],
                "text-rotation-alignment": "map",
                "text-offset": [-0.2, 0], // Centro del barco
              },
              paint: {
                "text-color": "#ffffff",
                "text-opacity": 0.9,
              },
            },
          ],
    eventHandlers:
      type === "aircraft"
        ? eventHandlers
        : {
            ...eventHandlers,
            [`${layerId}-hull`]: eventHandlers[layerId],
            [`${layerId}-bow`]: eventHandlers[layerId],
            [`${layerId}-superstructure`]: eventHandlers[layerId],
          },
    visible,
  });

  return {
    ...result,
    loading,
    count: data.length,
  };
}

/* ===================== HELPERS ===================== */

function generateSimulatedVessels(): Vessel[] {
  // Rutas marítimas principales con múltiples puntos
  const routes = [
    // Ruta Europa-Asia (Suez)
    [
      { lat: 31.2, lon: 32.3, name: "Suez North" },
      { lat: 29.9, lon: 32.5, name: "Suez" },
      { lat: 27.9, lon: 34.2, name: "Red Sea" },
      { lat: 12.6, lon: 43.3, name: "Bab el Mandeb" },
    ],
    // Estrecho de Malaca
    [
      { lat: 5.4, lon: 100.3, name: "Andaman Sea" },
      { lat: 4.2, lon: 100.8, name: "Malacca North" },
      { lat: 2.5, lon: 101.8, name: "Malacca Central" },
      { lat: 1.3, lon: 103.8, name: "Singapore Strait" },
    ],
    // Ruta Transpacífico (Asia-América)
    [
      { lat: 35.6, lon: 139.7, name: "Tokyo" },
      { lat: 35.0, lon: 160.0, name: "Pacific Mid-East" },
      { lat: 34.5, lon: -140.0, name: "Pacific Mid-West" },
      { lat: 37.8, lon: -122.4, name: "San Francisco" },
    ],
    // Canal de Panamá
    [
      { lat: 9.6, lon: -84.0, name: "Caribbean" },
      { lat: 9.0, lon: -79.5, name: "Panama Canal" },
      { lat: 8.4, lon: -78.5, name: "Pacific Panama" },
    ],
    // Estrecho de Gibraltar
    [
      { lat: 36.1, lon: -5.4, name: "Gibraltar" },
      { lat: 35.9, lon: -5.7, name: "Strait" },
    ],
    // Ruta del Cabo (África)
    [
      { lat: -33.9, lon: 18.4, name: "Cape Town" },
      { lat: -35.5, lon: 22.5, name: "Cape Agulhas" },
      { lat: -34.8, lon: 25.6, name: "East Cape" },
    ],
    // Golfo Pérsico (Ormuz)
    [
      { lat: 26.5, lon: 56.3, name: "Strait of Hormuz" },
      { lat: 27.2, lon: 56.5, name: "Persian Gulf" },
      { lat: 29.3, lon: 48.1, name: "Kuwait" },
    ],
    // Mar Mediterráneo
    [
      { lat: 43.3, lon: 5.4, name: "Marseille" },
      { lat: 37.9, lon: 23.7, name: "Piraeus" },
      { lat: 31.2, lon: 29.9, name: "Alexandria" },
    ],
    // Mar del Norte
    [
      { lat: 51.9, lon: 4.5, name: "Rotterdam" },
      { lat: 53.5, lon: 9.9, name: "Hamburg" },
      { lat: 55.7, lon: 12.6, name: "Copenhagen" },
    ],
    // Ruta Atlántico Norte
    [
      { lat: 40.7, lon: -74.0, name: "New York" },
      { lat: 42.0, lon: -50.0, name: "Mid Atlantic" },
      { lat: 51.5, lon: -0.1, name: "London" },
    ],
  ];

  const vessels: Vessel[] = [];
  const shipTypes = ["Container", "Tanker", "Cargo", "Bulk Carrier"];
  const militaryZones = [
    { lat: 36.8, lon: -76.3, name: "Norfolk" }, // Norfolk Naval Base
    { lat: 21.3, lon: -157.9, name: "Pearl Harbor" },
    { lat: 26.5, lon: 56.3, name: "Hormuz Patrol" },
  ];
  const cruiseRoutes = [
    { lat: 25.8, lon: -80.1, name: "Miami" }, // Cruceros del Caribe
    { lat: 43.7, lon: 7.4, name: "Monaco" }, // Mediterráneo
  ];

  // Rutas comerciales
  routes.forEach((route, routeIdx) => {
    const vesselsPerRoute = route.length > 3 ? 8 : 5;

    for (let i = 0; i < vesselsPerRoute; i++) {
      // Distribuir barcos a lo largo de la ruta
      const progress = i / vesselsPerRoute;
      const segmentIndex = Math.floor(progress * (route.length - 1));
      const segmentProgress = (progress * (route.length - 1)) % 1;

      const start = route[segmentIndex];
      const end = route[Math.min(segmentIndex + 1, route.length - 1)];

      // Interpolación lineal entre dos puntos
      const lat = start.lat + (end.lat - start.lat) * segmentProgress;
      const lon = start.lon + (end.lon - start.lon) * segmentProgress;

      // Calcular rumbo (heading) hacia el próximo punto
      const latDiff = end.lat - start.lat;
      const lonDiff = end.lon - start.lon;
      let course = (Math.atan2(lonDiff, latDiff) * 180) / Math.PI;
      if (course < 0) course += 360;

      // Añadir algo de variación aleatoria a posición (dispersión)
      const variation = 0.3;
      const finalLat = lat + (Math.random() - 0.5) * variation;
      const finalLon = lon + (Math.random() - 0.5) * variation;

      vessels.push({
        mmsi: `${routeIdx}${i}${Date.now()}`.slice(0, 9),
        name: `${start.name.split(" ")[0]}-${String(i + 1).padStart(2, "0")}`,
        lat: finalLat,
        lon: finalLon,
        speed: 12 + Math.random() * 8,
        course: course + (Math.random() - 0.5) * 15,
        ship_type: shipTypes[Math.floor(Math.random() * shipTypes.length)],
      });
    }
  });

  // Agregar barcos militares en zonas estratégicas
  militaryZones.forEach((zone, idx) => {
    for (let i = 0; i < 3; i++) {
      vessels.push({
        mmsi: `MIL${idx}${i}${Date.now()}`.slice(0, 9),
        name: `${zone.name}-${i + 1}`,
        lat: zone.lat + (Math.random() - 0.5) * 0.5,
        lon: zone.lon + (Math.random() - 0.5) * 0.5,
        speed: 15 + Math.random() * 10, // Más rápidos
        course: Math.random() * 360,
        ship_type: "Military",
      });
    }
  });

  // Agregar cruceros
  cruiseRoutes.forEach((zone, idx) => {
    for (let i = 0; i < 2; i++) {
      vessels.push({
        mmsi: `CRU${idx}${i}${Date.now()}`.slice(0, 9),
        name: `Cruise-${zone.name}-${i + 1}`,
        lat: zone.lat + (Math.random() - 0.5) * 1,
        lon: zone.lon + (Math.random() - 0.5) * 1,
        speed: 18 + Math.random() * 5, // Cruceros rápidos
        course: Math.random() * 360,
        ship_type: "Cruise",
      });
    }
  });

  return vessels;
}
