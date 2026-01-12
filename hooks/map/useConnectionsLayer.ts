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

      // Crear layers si no existen
      if (!map.getLayer("connections-glow")) {
        // Capa de glow (más ancha, más transparente)
        map.addLayer({
          id: "connections-glow",
          type: "line",
          source: "connections-source",
          paint: {
            "line-color": "#00ffff",
            "line-width": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              4,
              5,
              8,
              10,
              12,
            ],
            "line-opacity": visible ? 0.2 : 0,
            "line-blur": 4,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-glow",
          "line-opacity",
          visible ? 0.2 : 0
        );
      }

      if (!map.getLayer("connections-line")) {
        // Capa principal (línea definida)
        map.addLayer({
          id: "connections-line",
          type: "line",
          source: "connections-source",
          paint: {
            "line-color": [
              "interpolate",
              ["linear"],
              ["get", "strength"],
              1,
              "#00d4ff", // Cyan claro
              3,
              "#00ffff", // Cyan medio
              5,
              "#00ff88", // Cyan-verde
              10,
              "#88ffff", // Cyan brillante
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
            "line-opacity": visible ? 0.8 : 0,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-line",
          "line-opacity",
          visible ? 0.8 : 0
        );
      }

      // Capa de puntos pulsantes en los nodos
      if (!map.getLayer("connections-nodes")) {
        const nodesData = {
          type: "FeatureCollection" as const,
          features: connections.flatMap((conn) => [
            {
              type: "Feature" as const,
              properties: { country: conn.from.country },
              geometry: {
                type: "Point" as const,
                coordinates: [conn.from.lon, conn.from.lat],
              },
            },
            {
              type: "Feature" as const,
              properties: { country: conn.to.country },
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

        map.addLayer({
          id: "connections-nodes",
          type: "circle",
          source: "connections-nodes-source",
          paint: {
            "circle-radius": 4,
            "circle-color": "#00ffff",
            "circle-opacity": visible ? 0.6 : 0,
            "circle-blur": 0.3,
          },
        });
      } else {
        map.setPaintProperty(
          "connections-nodes",
          "circle-opacity",
          visible ? 0.6 : 0
        );
      }
    } catch (error) {
      console.error("Error updating connections:", error);
    }
  }, [map, events, visible]);
}
