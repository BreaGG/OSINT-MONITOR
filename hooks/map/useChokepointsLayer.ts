import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicChokepoints } from "@/lib/strategicChokepoints"
import { useMapLayer } from "./useMapLayer"
import type { SatelliteFocus } from "@/components/SatelliteView"

type UseChokepointsLayerProps = {
  map: mapboxgl.Map | null
  visible: boolean
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void
}

export function useChokepointsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseChokepointsLayerProps) {

  /* ===================== GEOJSON ===================== */
  const chokepointsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: strategicChokepoints.map((p) => ({
        type: "Feature" as const,
        properties: {
          ...p,
          color:
            p.status === "critical"
              ? "#ef4444"   // rojo táctico
              : p.status === "elevated"
              ? "#facc15"   // ámbar
              : "#38bdf8",  // azul
        },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lon, p.lat],
        },
      })),
    }),
    []
  )

  /* ===================== EVENTS ===================== */
  const eventHandlers = useMemo(
    () => ({
      "chokepoints-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties
          if (!p) return

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: p.name,
            label: `Chokepoint · ${p.name}`,
          })
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return
          map.getCanvas().style.cursor = "pointer"

          const p = e.features?.[0]?.properties
          if (!p || !popupRef.current) return

          // Determinar colores según status
          const statusConfig = {
            critical: {
              bg: '#7f1d1d',
              text: '#ef4444',
              gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: '#991b1b'
            },
            elevated: {
              bg: '#78350f',
              text: '#facc15',
              gradient: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              border: '#92400e'
            },
            normal: {
              bg: '#164e63',
              text: '#38bdf8',
              gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              border: '#155e75'
            }
            }[p.status as "critical" | "elevated" | "normal"] || {
            bg: '#164e63',
            text: '#38bdf8',
            gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            border: '#155e75'
          };

          const content = `
            <div style="
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
              min-width: 260px;
              background: #000000;
              border: 1px solid #334155;
              border-radius: 4px;
              overflow: hidden;
            ">
              <!-- Header -->
              <div style="
                background: ${statusConfig.gradient};
                padding: 10px 12px;
                border-bottom: 1px solid ${statusConfig.border};
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Strategic Chokepoint</div>
                <div style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.3px;
                ">${p.name}</div>
              </div>
              
              <!-- Body -->
              <div style="padding: 12px;">
                <!-- Status Badge -->
                <div style="
                  display: inline-block;
                  background: ${statusConfig.bg};
                  color: ${statusConfig.text};
                  padding: 4px 8px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  margin-bottom: 10px;
                ">${p.status} threat</div>
                
                <!-- Summary -->
                ${p.summary ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${p.summary}</div>
                ` : ''}
                
                <!-- Metadata -->
                <div style="
                  display: flex;
                  gap: 8px;
                  padding-top: 10px;
                  border-top: 1px solid #1e293b;
                ">
                  <div style="
                    flex: 1;
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
                    ">Type</div>
                    <div style="
                      font-size: 11px;
                      font-weight: 600;
                      color: ${statusConfig.text};
                      text-transform: uppercase;
                    ">Chokepoint</div>
                  </div>
                  
                  <div style="
                    flex: 1;
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
                    ">Status</div>
                    <div style="
                      font-size: 11px;
                      font-weight: 600;
                      color: ${statusConfig.text};
                      text-transform: uppercase;
                    ">${p.status}</div>
                  </div>
                </div>
              </div>
            </div>
          `;

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map)
        },
        onMouseLeave: () => {
          if (!map) return
          map.getCanvas().style.cursor = ""
          popupRef.current?.remove()
        },
      },
    }),
    [map, onSelectSatelliteFocus, popupRef]
  )

  /* ===================== MAP LAYER ===================== */
  return useMapLayer({
    map,
    sourceId: "chokepoints",
    sourceConfig: {
      type: "geojson",
      data: chokepointsGeoJSON,
    },
    layers: [
      /* === ROMBO TÁCTICO ESTILO OTAN === */
      {
        id: "chokepoints-layer",
        type: "symbol",
        source: "chokepoints",
        layout: {
          // 💎 SÍMBOLO ROMBO
          "text-field": "◆",
          
          // ⚙️ TAMAÑO DEL ROMBO (ajusta entre 30-50)
          "text-size": 36,
          
          // 👁️ SIEMPRE VISIBLE
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          
          // 📍 CENTRADO
          "text-anchor": "center",
          
          // 🔠 SIN FUENTE ESPECIAL (usa default)
        },
        paint: {
          // 🎨 COLOR SEGÚN STATUS (rojo/ámbar/azul)
          "text-color": ["get", "color"],
          
          // 🖤 HALO NEGRO PARA CONTRASTE
          "text-halo-color": "#000000",
          "text-halo-width": 0,
          "text-halo-blur": 0,
          
          // 🔆 OPACIDAD
          "text-opacity": 1,
        },
      },

      /* === LABEL ESTILO OTAN === */
      {
        id: "chokepoints-labels",
        type: "symbol",
        source: "chokepoints",
        layout: {
          // 📝 TEXTO
          "text-field": ["get", "name"],
          
          // ⚙️ TAMAÑO (ajusta entre 10-14)
          "text-size": 12,
          
          // 📍 POSICIÓN (debajo del rombo)
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          
          // 🔠 FUENTE EN NEGRITA
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          
          // 👁️ EVITAR SOLAPAMIENTO
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          // 🎨 MISMO COLOR QUE EL ROMBO (según status)
          "text-color": ["get", "color"],
          
          // 🖤 HALO NEGRO PARA CONTRASTE
          "text-halo-color": "#000000",
          "text-halo-width": 0,
          "text-halo-blur": 0,
          
          // 🔆 OPACIDAD
          "text-opacity": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  })
}