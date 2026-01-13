import { useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { activeConflicts } from "@/lib/activeConflicts";
import { useMapLayer } from "./useMapLayer";
import type { SatelliteFocus } from "@/components/SatelliteView";

type UseConflictsLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void;
};

/* ===================== CONFLICT AREA DEFINITIONS ===================== */
// Define áreas rectangulares para cada conflicto (bounds: [minLon, minLat, maxLon, maxLat])
const CONFLICT_AREAS: Record<string, [number, number, number, number]> = {
  // Sudan Civil War
  "Sudan Civil War": [21.8, 8.7, 38.6, 22.0], // Todo Sudán
  
  // Ukraine War
  "Ukraine War": [22.0, 44.0, 40.5, 52.5], // Toda Ucrania + frontera Rusia
  
  // Gaza Conflict
  "Gaza Conflict": [34.2, 29.5, 35.9, 33.3], // Israel + Gaza + West Bank
  
  // Myanmar Civil War
  "Myanmar Civil War": [92.0, 10.0, 101.2, 28.5], // Myanmar completo
  
  // Taiwan Strait Tensions
  "Taiwan Strait Tensions": [119.5, 21.5, 122.5, 26.0], // Estrecho de Taiwan
  
  // Iran Regional Conflict
  "Iran Regional Conflict": [44.0, 25.0, 63.0, 40.0], // Irán + zona de influencia regional
};

// Función para crear polígono rectangular desde bounds
function createRectanglePolygon(bounds: [number, number, number, number]) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return [
    [
      [minLon, minLat], // Bottom-left
      [maxLon, minLat], // Bottom-right
      [maxLon, maxLat], // Top-right
      [minLon, maxLat], // Top-left
      [minLon, minLat], // Close polygon
    ],
  ];
}

export function useConflictsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseConflictsLayerProps) {
  const conflictsGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: activeConflicts
        .filter((c) => CONFLICT_AREAS[c.name]) // Solo conflictos con área definida
        .map((c) => ({
          type: "Feature" as const,
          properties: {
            ...c,
            belligerents: Array.isArray(c.belligerents)
              ? c.belligerents.join(", ")
              : c.belligerents,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: createRectanglePolygon(CONFLICT_AREAS[c.name]),
          },
        })),
    };
  }, []);

  const eventHandlers = useMemo(
    () => ({
      "conflicts-fill": {
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

          // Determinar colores según nivel de conflicto
          const level = (c.level || "LOW") as "HIGH" | "MEDIUM" | "LOW";
          const levelConfigs = {
            HIGH: {
              bg: "#7f1d1d",
              text: "#ef4444",
              headerBg: "#dc2626",
              label: "HIGH",
            },
            MEDIUM: {
              bg: "#78350f",
              text: "#f97316",
              headerBg: "#f97316",
              label: "MEDIUM",
            },
            LOW: {
              bg: "#713f12",
              text: "#fbbf24",
              headerBg: "#fbbf24",
              label: "LOW",
            },
          };

          const levelConfig = levelConfigs[level] || levelConfigs.LOW;

          const content = `
            <div style="
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
              min-width: 320px;
              max-width: 360px;
              background: #000000;
              border: 1px solid #334155;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                background: ${levelConfig.headerBg};
                padding: 10px 12px;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Active Conflict Zone</div>
                <div style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.3px;
                ">${c.name}</div>
              </div>
              
              <div style="padding: 12px;">
                <div style="
                  display: inline-block;
                  background: ${levelConfig.bg};
                  color: ${levelConfig.text};
                  padding: 4px 8px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  margin-bottom: 10px;
                ">${levelConfig.label} INTENSITY</div>
                
                ${
                  c.description
                    ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${c.description}</div>
                `
                    : ""
                }
                
                <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                  margin-bottom: 10px;
                ">
                  ${
                    c.startDate
                      ? `
                    <div style="
                      background: #1e293b;
                      padding: 6px 8px;
                      border-radius: 3px;
                    ">
                      <div style="
                        font-size: 9px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin-bottom: 2px;
                      ">Start Date</div>
                      <div style="
                        font-size: 11px;
                        font-weight: 600;
                        color: #cbd5e1;
                      ">${c.startDate}</div>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    c.casualties
                      ? `
                    <div style="
                      background: #1e293b;
                      padding: 6px 8px;
                      border-radius: 3px;
                    ">
                      <div style="
                        font-size: 9px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin-bottom: 2px;
                      ">Casualties</div>
                      <div style="
                        font-size: 11px;
                        font-weight: 600;
                        color: #ef4444;
                      ">${c.casualties}</div>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    c.displaced
                      ? `
                    <div style="
                      background: #1e293b;
                      padding: 6px 8px;
                      border-radius: 3px;
                      grid-column: span 2;
                    ">
                      <div style="
                        font-size: 9px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin-bottom: 2px;
                      ">Displaced</div>
                      <div style="
                        font-size: 11px;
                        font-weight: 600;
                        color: #f59e0b;
                      ">${c.displaced}</div>
                    </div>
                  `
                      : ""
                  }
                </div>
                
                ${
                  c.belligerents
                    ? `
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
                    ">Belligerents</div>
                    <div style="
                      font-size: 11px;
                      color: #94a3b8;
                      line-height: 1.4;
                    ">${c.belligerents}</div>
                  </div>
                `
                    : ""
                }
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
      /* === RELLENO DEL POLÍGONO === */
      {
        id: "conflicts-fill",
        type: "fill",
        source: "conflicts",
        paint: {
          // 🎨 Color de relleno semi-transparente
          "fill-color": [
            "match",
            ["get", "level"],
            "HIGH",
            "#dc2626", // Rojo intenso
            "MEDIUM",
            "#f97316", // Naranja
            "#fbbf24", // Amarillo (LOW por defecto)
          ],
          // 🔆 Opacidad del relleno
          "fill-opacity": 0.15,
        },
      },
      /* === BORDE DEL POLÍGONO === */
      {
        id: "conflicts-outline",
        type: "line",
        source: "conflicts",
        paint: {
          // 🎨 Color del borde
          "line-color": [
            "match",
            ["get", "level"],
            "HIGH",
            "#dc2626", // Rojo intenso
            "MEDIUM",
            "#f97316", // Naranja
            "#b45309", // Amarillo oscuro (LOW por defecto)
          ],
          // 📏 Grosor del borde
          "line-width": 2,
          // 🔆 Opacidad del borde
          "line-opacity": 0.8,
          // ✨ Patrón de línea (opcional: hacer línea punteada)
          "line-dasharray": [3, 2], // [longitud guión, longitud espacio]
        },
      },
    ],
    eventHandlers,
    visible,
  });
}