import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { Event } from "@/lib/types";
import { hasCoordinates } from "@/lib/map/helpers";

type UseHeatmapLayerProps = {
  map: mapboxgl.Map | null;
  events: Event[];
  visible: boolean;
};

export function useHeatmapLayer({
  map,
  events,
  visible,
}: UseHeatmapLayerProps) {
  useEffect(() => {
    if (!map) return;

    try {
      // Preparar datos para el heatmap
      const heatmapData = {
        type: "FeatureCollection" as const,
        features: events.filter(hasCoordinates).map((event) => ({
          type: "Feature" as const,
          properties: {
            weight: 1,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [event.lon, event.lat],
          },
        })),
      };

      // Crear o actualizar source
      if (!map.getSource("heatmap-source")) {
        map.addSource("heatmap-source", {
          type: "geojson",
          data: heatmapData,
        });
      } else {
        const source = map.getSource(
          "heatmap-source"
        ) as mapboxgl.GeoJSONSource;
        source.setData(heatmapData);
      }

      // Crear layer si no existe
      if (!map.getLayer("heatmap-layer")) {
        map.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "heatmap-source",
          maxzoom: 15,
          paint: {
            // Peso uniforme para todos los puntos
            "heatmap-weight": 1,

            // Intensidad mucho mayor para que se vea más lleno
            "heatmap-intensity": [
              "interpolate",
              ["exponential", 2],
              ["zoom"],
              0,
              2, // Mayor intensidad base
              5,
              3,
              10,
              4,
              15,
              5,
            ],

            // Gradiente de colores profesional con mejor distribución
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 0, 0)", // Transparente
              0.02,
              "rgba(26, 35, 126, 0.3)", // Azul muy oscuro - más visible
              0.1,
              "rgba(13, 71, 161, 0.45)", // Azul oscuro
              0.2,
              "rgba(25, 118, 210, 0.6)", // Azul medio
              0.3,
              "rgba(33, 150, 243, 0.7)", // Azul claro
              0.4,
              "rgba(3, 169, 244, 0.75)", // Cyan
              0.5,
              "rgba(0, 188, 212, 0.8)", // Cyan claro
              0.6,
              "rgba(255, 235, 59, 0.85)", // Amarillo
              0.7,
              "rgba(255, 193, 7, 0.88)", // Ámbar
              0.8,
              "rgba(255, 152, 0, 0.9)", // Naranja
              0.9,
              "rgba(244, 67, 54, 0.93)", // Rojo
              1.0,
              "rgba(183, 28, 28, 0.96)", // Rojo oscuro intenso
            ],

            // Radio MUCHO más grande para mejor propagación
            "heatmap-radius": [
              "interpolate",
              ["exponential", 1.75],
              ["zoom"],
              0,
              40, // Vista mundial - radio grande
              2,
              60,
              4,
              90,
              6,
              120,
              8,
              150,
              10,
              180,
              12,
              210,
              15,
              250, // Vista cercana - radio muy grande
            ],

            // Opacidad global alta para que se vea fuerte
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              visible ? 0.85 : 0,
              5,
              visible ? 0.9 : 0,
              10,
              visible ? 0.92 : 0,
              15,
              visible ? 0.88 : 0,
            ],
          },
        });
      } else {
        // Actualizar todas las propiedades cuando cambia el modo
        map.setPaintProperty("heatmap-layer", "heatmap-opacity", [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          visible ? 0.85 : 0,
          5,
          visible ? 0.9 : 0,
          10,
          visible ? 0.92 : 0,
          15,
          visible ? 0.88 : 0,
        ]);
      }
    } catch (error) {
      console.error("Error updating heatmap:", error);
    }
  }, [map, events, visible]);
}
