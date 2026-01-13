import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicMilitaryBases } from "@/lib/strategicMilitaryBases"
import { useMapLayer } from "./useMapLayer"

type UseMilitaryBasesLayerProps = {
  map: mapboxgl.Map | null
  visible: boolean
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>
}

export function useMilitaryBasesLayer({
  map,
  visible,
  popupRef,
}: UseMilitaryBasesLayerProps) {

  /* ===================== GEOJSON ===================== */
  const militaryBasesGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: strategicMilitaryBases.map((b) => ({
        type: "Feature" as const,
        properties: b,
        geometry: {
          type: "Point" as const,
          coordinates: [b.lon, b.lat],
        },
      })),
    }),
    []
  )

  /* ===================== EVENTS ===================== */
  const eventHandlers = useMemo(
    () => ({
      "military-bases-layer": {
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return
          map.getCanvas().style.cursor = "pointer"

          const b = e.features?.[0]?.properties
          if (!b || !popupRef.current) return

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
                background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
                padding: 10px 12px;
                border-bottom: 1px solid #7e22ce;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Military Installation</div>
                <div style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.3px;
                ">${b.name}</div>
              </div>
              
              <!-- Body -->
              <div style="padding: 12px;">
                <!-- Country Badge -->
                ${b.country ? `
                  <div style="
                    display: inline-block;
                    background: #581c87;
                    color: #e9d5ff;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    margin-bottom: 10px;
                  ">${b.country}</div>
                ` : ''}
                
                <!-- Description -->
                ${b.description ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${b.description}</div>
                ` : ''}
                
                <!-- Significance -->
                ${b.significance ? `
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
                    ">Strategic Significance</div>
                    <div style="
                      font-size: 11px;
                      color: #94a3b8;
                      line-height: 1.4;
                    ">${b.significance}</div>
                  </div>
                ` : ''}
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
    [map, popupRef]
  )

  /* ===================== MAP LAYER ===================== */
  return useMapLayer({
    map,
    sourceId: "military-bases",
    sourceConfig: {
      type: "geojson",
      data: militaryBasesGeoJSON,
    },
    layers: [
      /* === ESTRELLA MILITAR ESTILO OTAN === */
      {
        id: "military-bases-layer",
        type: "symbol",
        source: "military-bases",
        layout: {
          // ⭐ SÍMBOLO ESTRELLA
          "text-field": "★",

          // ⚙️ TAMAÑO (ajustable entre 24-36)
          "text-size": 28,

          // 📍 CENTRADO
          "text-anchor": "center",
          
          // 👁️ SIEMPRE VISIBLE
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          // 🟣 COLOR MILITAR MORADO/PÚRPURA (ajustable)
          "text-color": "#a855f7",  // Púrpura comando
          
          // 🖤 HALO NEGRO PARA CONTRASTE NÍTIDO
          "text-halo-color": "#000000",
          "text-halo-width": 0,
          "text-halo-blur": 0,  // Sin blur = nítido
          
          // 🔆 OPACIDAD
          "text-opacity": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  })
}