import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type * as GeoJSON from "geojson";

type LayerConfig = {
  id: string;
  type: "circle" | "symbol" | "line" | "fill";
  source: string;
  paint?: any;
  layout?: any;
  filter?: any;
};

type SourceConfig = {
  type: "geojson";
  data: GeoJSON.FeatureCollection | GeoJSON.Feature;
};

type LayerEventHandlers = {
  onClick?: (e: mapboxgl.MapLayerMouseEvent) => void;
  onMouseEnter?: (e: mapboxgl.MapLayerMouseEvent) => void;
  onMouseLeave?: (e: mapboxgl.MapLayerMouseEvent) => void;
};

type UseMapLayerProps = {
  map: mapboxgl.Map | null;
  sourceId: string;
  sourceConfig: SourceConfig;
  layers: LayerConfig[];
  eventHandlers?: Record<string, LayerEventHandlers>;
  visible?: boolean;
};

/**
 * Custom hook para gestionar capas de Mapbox de forma declarativa
 *
 * Encapsula:
 * - Inicialización de source + layers
 * - Event handlers
 * - Cleanup automático
 * - Control de visibilidad
 *
 * @example
 * useMapLayer({
 *   map: mapRef.current,
 *   sourceId: "events",
 *   sourceConfig: { type: "geojson", data: eventsGeoJSON },
 *   layers: [{ id: "events-layer", type: "circle", source: "events", paint: {...} }],
 *   eventHandlers: {
 *     "events-layer": {
 *       onClick: (e) => console.log(e),
 *       onMouseEnter: (e) => map.getCanvas().style.cursor = "pointer"
 *     }
 *   },
 *   visible: true
 * })
 */
export function useMapLayer({
  map,
  sourceId,
  sourceConfig,
  layers,
  eventHandlers = {},
  visible = true,
}: UseMapLayerProps) {
  const initialized = useRef(false);

  // Inicialización
  useEffect(() => {
    if (!map || initialized.current) return;

    try {
      // Add source
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, sourceConfig);
      }

      // Add layers
      layers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer);
        }
      });

      // Attach event handlers
      Object.entries(eventHandlers).forEach(([layerId, handlers]) => {
        if (handlers.onClick) {
          map.on("click", layerId, handlers.onClick);
        }
        if (handlers.onMouseEnter) {
          map.on("mouseenter", layerId, handlers.onMouseEnter);
        }
        if (handlers.onMouseLeave) {
          map.on("mouseleave", layerId, handlers.onMouseLeave);
        }
      });

      initialized.current = true;
    } catch (error) {
      console.error(`Error initializing layer ${sourceId}:`, error);
    }

    // Cleanup
    return () => {
      if (!map) return;

      try {
        // Remove event handlers
        Object.entries(eventHandlers).forEach(([layerId, handlers]) => {
          if (handlers.onClick) {
            map.off("click", layerId, handlers.onClick);
          }
          if (handlers.onMouseEnter) {
            map.off("mouseenter", layerId, handlers.onMouseEnter);
          }
          if (handlers.onMouseLeave) {
            map.off("mouseleave", layerId, handlers.onMouseLeave);
          }
        });

        // Remove layers
        layers.forEach((layer) => {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });

        // Remove source
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.error(`Error cleaning up layer ${sourceId}:`, error);
      }

      initialized.current = false;
    };
  }, [map]);

  // Actualizar data del source
  useEffect(() => {
    if (!map || !initialized.current) return;

    try {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(sourceConfig.data as GeoJSON.FeatureCollection);
      }
    } catch (error) {
      console.error(`Error updating source ${sourceId}:`, error);
    }
  }, [map, sourceId, sourceConfig.data]);

  // Control de visibilidad
  useEffect(() => {
    if (!map || !initialized.current) return;

    try {
      layers.forEach((layer) => {
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            visible ? "visible" : "none"
          );
        }
      });
    } catch (error) {
      console.error(`Error toggling visibility for ${sourceId}:`, error);
    }
  }, [map, visible, layers, sourceId]);

  return {
    initialized: initialized.current,
  };
}
