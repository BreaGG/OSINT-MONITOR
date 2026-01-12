import { useMemo, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { activeConflicts } from "@/lib/activeConflicts";
import { renderConflictPopup } from "@/components/map/popups";
import { useMapLayer } from "./useMapLayer";
import type { SatelliteFocus } from "@/components/SatelliteView";

type UseConflictsLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void;
};

export function useConflictsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseConflictsLayerProps) {
  const conflictsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: activeConflicts.map((c) => ({
        type: "Feature" as const,
        properties: {
          ...c,
          belligerents: Array.isArray(c.belligerents)
            ? c.belligerents.join(", ")
            : c.belligerents,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [c.lon, c.lat],
        },
      })),
    }),
    []
  );

  // Crear imagen SVG del rectángulo
  useEffect(() => {
    if (!map) return;

    // ⚙️ TAMAÑO DEL RECTÁNGULO (ajustable)
    const width = 150;   // Ancho en píxeles
    const height = 30;   // Alto en píxeles

    // 🎨 COLORES (ajustables)
    const fillColor = "	rgb(220, 38, 38, 0.25)";  // Relleno granate translúcido 75%
    const strokeColor = "rgba(127, 29, 29)";                // Borde rojo sólido
    const strokeWidth = 2.5;                      // Grosor del borde

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect 
          x="${strokeWidth/2}" 
          y="${strokeWidth/2}" 
          width="${width - strokeWidth}" 
          height="${height - strokeWidth}" 
          fill="${fillColor}" 
          stroke="${strokeColor}" 
          stroke-width="${strokeWidth}"
          rx="2"
        />
      </svg>
    `;

    const img = new Image(width, height);
    img.onload = () => {
      if (!map.hasImage("conflict-box")) {
        map.addImage("conflict-box", img);
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svg);
  }, [map]);

  const eventHandlers = useMemo(
    () => ({
      "conflicts-labels": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const c = e.features?.[0]?.properties;
          if (!c) return;

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: c.name,
            label: `Conflict · ${c.name}`,
          });
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return;
          map.getCanvas().style.cursor = "pointer";

          const c = e.features?.[0]?.properties;
          if (!c || !popupRef.current) return;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderConflictPopup({
                name: c.name,
                startDate: c.startDate,
                level: c.level,
                casualties: c.casualties,
                displaced: c.displaced,
                description: c.description,
                belligerents: c.belligerents,
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

  return useMapLayer({
    map,
    sourceId: "conflicts",
    sourceConfig: {
      type: "geojson",
      data: conflictsGeoJSON,
    },
    layers: [
      /* === RECTÁNGULO DE FONDO (ICONO SVG) === */
      {
        id: "conflicts-background",
        type: "symbol",
        source: "conflicts",
        layout: {
          // 📦 ICONO DEL RECTÁNGULO
          "icon-image": "conflict-box",
          
          // ⚙️ TAMAÑO DEL ICONO (1 = tamaño original, ajustable)
          "icon-size": 1,
          
          // 📍 CENTRADO
          "icon-anchor": "center",
          
          // 👁️ SIEMPRE VISIBLE
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          // 🔆 OPACIDAD
          "icon-opacity": 1,
        },
      },

      /* === TEXTO ENCIMA DEL RECTÁNGULO === */
      {
        id: "conflicts-labels",
        type: "symbol",
        source: "conflicts",
        layout: {
          // 📝 TEXTO DEL CONFLICTO
          "text-field": ["get", "name"],
          
          // ⚙️ TAMAÑO DEL TEXTO (ajusta entre 10-13)
          "text-size": 12,
          
          // 📍 CENTRADO
          "text-anchor": "center",
          
          // 🔠 FUENTE EN NEGRITA
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          
          // 👁️ SIEMPRE VISIBLE (encima del rectángulo)
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          
          // 📏 JUSTIFICACIÓN
          "text-justify": "center",
          
          // 📝 UPPERCASE AUTOMÁTICO
          "text-transform": "uppercase",
          
          // 📏 ESPACIADO ENTRE LETRAS
          "text-letter-spacing": 0.05,
        },
        paint: {
          // ⚪ TEXTO BLANCO (contrasta perfecto con rojo)
          "text-color": "#ffffff",  // ⚙️ Blanco puro (ajustable)
          
          // 🖤 HALO NEGRO FINO (para más contraste)
          "text-halo-color": "#000000",
          "text-halo-width": 1,
          "text-halo-blur": 0,
          
          // 🔆 OPACIDAD
          "text-opacity": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  });
}