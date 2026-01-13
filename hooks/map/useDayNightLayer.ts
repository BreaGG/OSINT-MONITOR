import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

type UseDayNightLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
};

// Calcular la línea del terminador solar (día/noche)
function calculateTerminator(): [number, number][] {
  const now = new Date();
  const day = now.getUTCDate();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();

  // Día del año
  const N1 = Math.floor((275 * month) / 9);
  const N2 = Math.floor((month + 9) / 12);
  const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const N = N1 - N2 * N3 + day - 30;

  // Hora decimal
  const hourDecimal = hours + minutes / 60 + seconds / 3600;

  // Declinación solar
  const declination =
    -23.44 * Math.cos(((360 / 365) * (N + 10) * Math.PI) / 180);

  // Ecuación del tiempo (simplificada)
  const B = ((360 / 365) * (N - 81) * Math.PI) / 180;
  const E = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Longitud solar
  const solarLongitude = -15 * (hourDecimal - 12 + E / 60);

  // Generar puntos de la curva del terminador
  const points: [number, number][] = [];

  for (let lon = -180; lon <= 180; lon += 2) {
    // Calcular la latitud donde el sol está en el horizonte
    const lat =
      (Math.atan(
        -Math.cos(((lon - solarLongitude) * Math.PI) / 180) /
          Math.tan((declination * Math.PI) / 180)
      ) *
        180) /
      Math.PI;

    if (!isNaN(lat) && isFinite(lat)) {
      points.push([lon, Math.max(-85, Math.min(85, lat))]);
    }
  }

  return points;
}

export function useDayNightLayer({ map, visible }: UseDayNightLayerProps) {
  // Effect 1: Inicializar capas (solo depende del mapa)
  useEffect(() => {
    if (!map) {
      console.log("❌ Day/Night: No map available");
      return;
    }

    console.log("✅ Day/Night: Initializing layers...");

    const updateTerminator = () => {
      if (!map) {
        console.log("⏳ Day/Night: Map not available");
        return;
      }

      console.log("🌍 Day/Night: Updating terminator...");

      try {
        const points = calculateTerminator();
        console.log("📍 Day/Night: Calculated", points.length, "points");

        // Crear polígono que cubre la zona de noche
        // El polígono debe cubrir desde el terminador hacia el ESTE (donde NO hay sol)
        const nightPolygon = {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              properties: {},
              geometry: {
                type: "Polygon" as const,
                coordinates: [
                  [
                    ...points,
                    [180, 90], // Esquina noreste
                    [-180, 90], // Esquina noroeste
                    [-180, points[0][1]], // Conectar de vuelta
                  ],
                ],
              },
            },
          ],
        };

        console.log(
          "🌙 Night polygon covers the NORTH/EAST side of terminator"
        );

        // Añadir o actualizar source
        if (!map.getSource("day-night")) {
          console.log("➕ Day/Night: Adding source 'day-night'");
          map.addSource("day-night", {
            type: "geojson",
            data: nightPolygon,
          });
        } else {
          console.log("🔄 Day/Night: Updating source 'day-night'");
          const source = map.getSource("day-night") as mapboxgl.GeoJSONSource;
          source.setData(nightPolygon);
        }

        // Buscar la primera capa de marcadores para insertar antes
        let beforeId: string | undefined;
        const layers = map.getStyle().layers;
        for (const layer of layers) {
          if (
            layer.id.includes("hotzone") ||
            layer.id.includes("events") ||
            layer.id.includes("capitals") ||
            layer.id.includes("chokepoints") ||
            layer.id.includes("conflicts") ||
            layer.id.includes("military")
          ) {
            beforeId = layer.id;
            console.log("🎯 Day/Night: Will insert before layer:", beforeId);
            break;
          }
        }

        // Añadir layer de sombra nocturna
        if (!map.getLayer("night-overlay")) {
          console.log(
            "➕ Day/Night: Adding layer 'night-overlay' (initially hidden)"
          );
          map.addLayer({
            id: "night-overlay",
            type: "fill",
            source: "day-night",
            paint: {
              "fill-color": "#000000", // Negro puro
              "fill-opacity": 0, // Siempre empezar oculto
            },
          });

          // Mover debajo de la primera capa de marcadores si existe
          if (beforeId) {
            try {
              map.moveLayer("night-overlay", beforeId);
              console.log(
                "🔄 Day/Night: Moved 'night-overlay' before",
                beforeId
              );
            } catch (e) {
              console.warn("⚠️ Could not move night-overlay:", e);
            }
          }

          console.log("✅ Night overlay layer added");
        } else {
          console.log("🔄 Day/Night: Updating source 'night-overlay'");
        }

        // Añadir source para la línea
        if (!map.getSource("terminator-line-source")) {
          console.log("➕ Day/Night: Adding source 'terminator-line-source'");
          map.addSource("terminator-line-source", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: points,
                  },
                },
              ],
            },
          });
        } else {
          console.log("🔄 Day/Night: Updating source 'terminator-line-source'");
          const source = map.getSource(
            "terminator-line-source"
          ) as mapboxgl.GeoJSONSource;
          source.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: points,
                },
              },
            ],
          });
        }

        // Añadir layer de la línea del terminador
        if (!map.getLayer("terminator-line")) {
          console.log(
            "➕ Day/Night: Adding layer 'terminator-line' (initially hidden)"
          );
          map.addLayer({
            id: "terminator-line",
            type: "line",
            source: "terminator-line-source",
            paint: {
              "line-color": "#4b5563", // Gris sutil (gray-600)
              "line-width": 1.5, // Línea fina
              "line-opacity": 0, // Siempre empezar oculto
              "line-dasharray": [3, 3], // Línea punteada sutil
            },
          });

          // Mover debajo de la primera capa de marcadores si existe
          if (beforeId) {
            try {
              map.moveLayer("terminator-line", beforeId);
              console.log(
                "🔄 Day/Night: Moved 'terminator-line' before",
                beforeId
              );
            } catch (e) {
              console.warn("⚠️ Could not move terminator-line:", e);
            }
          }

          console.log("✅ Terminator line layer added");
        } else {
          console.log("🔄 Day/Night: Updating line source");
        }

        console.log("🎉 Day/Night: Update complete!");
      } catch (error) {
        console.error("❌ Day/Night: Error in updateTerminator:", error);
        throw error; // Re-throw para que el inicializador lo capture
      }
    };

    // Esperar a que el mapa esté completamente listo
    console.log("⏰ Day/Night: Waiting for map to be ready...");

    const initializeLayers = () => {
      console.log("🔄 Day/Night: Attempting to initialize layers...");
      try {
        updateTerminator();
      } catch (error) {
        console.error("❌ Day/Night: Error initializing, will retry:", error);
        setTimeout(initializeLayers, 500);
      }
    };

    const initTimeout = setTimeout(initializeLayers, 1000);

    // Actualizar cada 5 minutos
    console.log("⏰ Day/Night: Setting interval (5 min)...");
    const interval = setInterval(() => {
      console.log("⏰ Day/Night: Interval triggered, calling updateTerminator");
      updateTerminator();
    }, 5 * 60 * 1000);

    return () => {
      console.log("🧹 Day/Night: Cleaning up layers...");
      clearTimeout(initTimeout);
      clearInterval(interval);

      try {
        if (map.getLayer("terminator-line")) {
          map.removeLayer("terminator-line");
        }
        if (map.getLayer("night-overlay")) {
          map.removeLayer("night-overlay");
        }
        if (map.getSource("terminator-line-source")) {
          map.removeSource("terminator-line-source");
        }
        if (map.getSource("day-night")) {
          map.removeSource("day-night");
        }
      } catch (error) {
        console.error("Error cleaning up:", error);
      }
    };
  }, [map]); // Solo depende del mapa, NO de visible

  // Effect 2: Controlar visibilidad (depende de visible)
  useEffect(() => {
    if (!map) return;

    console.log("👁️ Day/Night: Updating visibility to:", visible);

    // Actualizar inmediatamente si las capas existen
    if (map.getLayer("night-overlay")) {
      map.setPaintProperty("night-overlay", "fill-opacity", visible ? 0.25 : 0); // 25% muy sutil
      console.log("✅ Night overlay opacity:", visible ? 0.25 : 0);
    } else {
      console.log("⏳ Night overlay layer doesn't exist yet");
    }

    if (map.getLayer("terminator-line")) {
      map.setPaintProperty(
        "terminator-line",
        "line-opacity",
        visible ? 0.4 : 0
      ); // 40% discreta
      console.log("✅ Terminator line opacity:", visible ? 0.4 : 0);
    } else {
      console.log("⏳ Terminator line layer doesn't exist yet");
    }
  }, [map, visible]);
}
