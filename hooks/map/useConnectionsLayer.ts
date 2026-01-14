import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";

type UseConnectionsLayerProps = {
  map: mapboxgl.Map | null;
  events: Event[];
  visible: boolean;
};

export function useConnectionsLayer({
  map,
  events,
  visible,
}: UseConnectionsLayerProps) {
  useEffect(() => {
    if (!map) return;

    try {
      // Agrupar eventos por país
      const eventsByCountry: Record<string, Event[]> = {};
      events.forEach((event) => {
        if (
          event.country &&
          event.country !== "Global" &&
          event.lat &&
          event.lon
        ) {
          if (!eventsByCountry[event.country]) {
            eventsByCountry[event.country] = [];
          }
          eventsByCountry[event.country].push(event);
        }
      });

      // Crear conexiones entre países que comparten categorías o eventos relacionados
      const connections: Array<{
        from: { lat: number; lon: number; country: string };
        to: { lat: number; lon: number; country: string };
        strength: number;
      }> = [];

      const countries = Object.keys(eventsByCountry);

      for (let i = 0; i < countries.length; i++) {
        for (let j = i + 1; j < countries.length; j++) {
          const country1 = countries[i];
          const country2 = countries[j];

          const events1 = eventsByCountry[country1];
          const events2 = eventsByCountry[country2];

          // Calcular "fuerza" de conexión basada en categorías compartidas
          const sharedCategories = events1.filter((e1) =>
            events2.some((e2) => e2.category === e1.category)
          ).length;

          // Buscar menciones mutuas en títulos/resúmenes
          const mutualMentions = events1.filter(
            (e1) =>
              (e1.title + " " + e1.summary)
                .toLowerCase()
                .includes(country2.toLowerCase()) ||
              events2.some((e2) =>
                (e2.title + " " + e2.summary)
                  .toLowerCase()
                  .includes(country1.toLowerCase())
              )
          ).length;

          const strength = sharedCategories + mutualMentions * 2;

          if (strength > 0) {
            // Usar coordenadas del primer evento de cada país
            const from = events1[0];
            const to = events2[0];

            connections.push({
              from: { lat: from.lat!, lon: from.lon!, country: country1 },
              to: { lat: to.lat!, lon: to.lon!, country: country2 },
              strength,
            });
          }
        }
      }

      // Crear datos GeoJSON para las líneas
      const lineData = {
        type: "FeatureCollection" as const,
        features: connections.map((conn, idx) => ({
          type: "Feature" as const,
          properties: {
            strength: conn.strength,
            from: conn.from.country,
            to: conn.to.country,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [conn.from.lon, conn.from.lat],
              [conn.to.lon, conn.to.lat],
            ],
          },
        })),
      };

      // Crear o actualizar source
      if (!map.getSource("connections-source")) {
        map.addSource("connections-source", {
          type: "geojson",
          data: lineData,
        });
      } else {
        const source = map.getSource(
          "connections-source"
        ) as mapboxgl.GeoJSONSource;
        source.setData(lineData);
      }

      // === LAYER 1: OUTER GLOW (más ancho, muy transparente) ===
      if (!map.getLayer("connections-outer-glow")) {
        map.addLayer({
          id: "connections-outer-glow",
          type: "line",
          source: "connections-source",
          paint: {
            "line-color": "#06b6d4", // Cyan NATO
            "line-width": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              8,
              5,
              14,
              10,
              20,
            ],
            "line-opacity": visible ? 0.1 : 0,
            "line-blur": 6,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-outer-glow",
          "line-opacity",
          visible ? 0.1 : 0
        );
      }

      // === LAYER 2: MIDDLE GLOW (glow definido) ===
      if (!map.getLayer("connections-middle-glow")) {
        map.addLayer({
          id: "connections-middle-glow",
          type: "line",
          source: "connections-source",
          paint: {
            "line-color": "#22d3ee", // Cyan más claro
            "line-width": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              5,
              5,
              9,
              10,
              13,
            ],
            "line-opacity": visible ? 0.25 : 0,
            "line-blur": 3,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-middle-glow",
          "line-opacity",
          visible ? 0.25 : 0
        );
      }

      // === LAYER 3: MAIN LINE (línea principal definida) ===
      if (!map.getLayer("connections-main-line")) {
        map.addLayer({
          id: "connections-main-line",
          type: "line",
          source: "connections-source",
          paint: {
            "line-color": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              "#06b6d4", // Cyan base
              3,
              "#22d3ee", // Cyan claro
              5,
              "#67e8f9", // Cyan brillante
              8,
              "#a5f3fc", // Cyan muy brillante
              10,
              "#cffafe", // Casi blanco
            ],
            "line-width": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              1.5,
              5,
              2.5,
              10,
              3.5,
            ],
            "line-opacity": visible ? 0.9 : 0,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-main-line",
          "line-opacity",
          visible ? 0.9 : 0
        );
      }

      // === LAYER 4: DASHED OVERLAY (estilo NATO) ===
      if (!map.getLayer("connections-dashed")) {
        map.addLayer({
          id: "connections-dashed",
          type: "line",
          source: "connections-source",
          filter: [">=", ["get", "strength"], 3], // Solo para conexiones fuertes
          paint: {
            "line-color": "#ffffff",
            "line-width": 1,
            "line-opacity": visible ? 0.4 : 0,
            "line-dasharray": [3, 3],
          },
        });
      } else {
        map.setPaintProperty(
          "connections-dashed",
          "line-opacity",
          visible ? 0.4 : 0
        );
      }

      // === NODES (puntos en los extremos) ===
      const nodesData = {
        type: "FeatureCollection" as const,
        features: connections.flatMap((conn) => [
          {
            type: "Feature" as const,
            properties: {
              country: conn.from.country,
              strength: conn.strength,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [conn.from.lon, conn.from.lat],
            },
          },
          {
            type: "Feature" as const,
            properties: {
              country: conn.to.country,
              strength: conn.strength,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [conn.to.lon, conn.to.lat],
            },
          },
        ]),
      };

      if (!map.getSource("connections-nodes-source")) {
        map.addSource("connections-nodes-source", {
          type: "geojson",
          data: nodesData,
        });
      } else {
        const source = map.getSource(
          "connections-nodes-source"
        ) as mapboxgl.GeoJSONSource;
        source.setData(nodesData);
      }

      // Node Outer Glow
      if (!map.getLayer("connections-nodes-glow")) {
        map.addLayer({
          id: "connections-nodes-glow",
          type: "circle",
          source: "connections-nodes-source",
          paint: {
            "circle-radius": 8,
            "circle-color": "#06b6d4",
            "circle-opacity": visible ? 0.3 : 0,
            "circle-blur": 1,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-nodes-glow",
          "circle-opacity",
          visible ? 0.3 : 0
        );
      }

      // Node Core
      if (!map.getLayer("connections-nodes-core")) {
        map.addLayer({
          id: "connections-nodes-core",
          type: "circle",
          source: "connections-nodes-source",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              3,
              5,
              4.5,
              10,
              6,
            ],
            "circle-color": "#67e8f9",
            "circle-opacity": visible ? 0.8 : 0,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#cffafe",
            "circle-stroke-opacity": visible ? 0.6 : 0,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-nodes-core",
          "circle-opacity",
          visible ? 0.8 : 0
        );
        map.setPaintProperty(
          "connections-nodes-core",
          "circle-stroke-opacity",
          visible ? 0.6 : 0
        );
      }
    } catch (error) {
      console.error("Error updating connections:", error);
    }
  }, [map, events, visible]);
}