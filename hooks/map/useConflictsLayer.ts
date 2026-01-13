import { useMemo, useEffect } from "react";
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
    const fillColor = "rgb(220, 38, 38, 0.25)";  // Relleno granate translúcido 75%
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

          // Determinar colores según nivel de conflicto
          const level = (c.level || "low") as "high" | "medium" | "low";
          const levelConfigs = {
            high: {
              bg: '#7f1d1d',
              text: '#ef4444',
              headerBg: '#dc2626',
              label: 'HIGH'
            },
            medium: {
              bg: '#78350f',
              text: '#f97316',
              headerBg: '#f97316',
              label: 'MEDIUM'
            },
            low: {
              bg: '#713f12',
              text: '#fbbf24',
              headerBg: '#fbbf24',
              label: 'LOW'
            }
          };
          
          const levelConfig = levelConfigs[level] || levelConfigs.low;

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
                ">Active Conflict</div>
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
                
                ${c.description ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${c.description}</div>
                ` : ''}
                
                <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                  margin-bottom: 10px;
                ">
                  ${c.startDate ? `
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
                  ` : ''}
                  
                  ${c.casualties ? `
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
                  ` : ''}
                  
                  ${c.displaced ? `
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
                  ` : ''}
                </div>
                
                ${c.belligerents ? `
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
                ` : ''}
              </div>
            </div>
          `;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(content)
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