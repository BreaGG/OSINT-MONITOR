import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicPoints } from "@/lib/strategicPoints"
import { useMapLayer } from "./useMapLayer"
import type { SatelliteFocus } from "@/components/SatelliteView"

type UseCapitalsLayerProps = {
  map: mapboxgl.Map | null
  visible: boolean
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>
  onSelectSatelliteFocus?: (focus: SatelliteFocus) => void
}

export function useCapitalsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseCapitalsLayerProps) {

  /* ===================== GEOJSON ===================== */
  const capitalsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: strategicPoints.map((p) => ({
        type: "Feature" as const,
        properties: {
          ...p,
          entities: Array.isArray(p.entities)
            ? p.entities.join(", ")
            : p.entities,
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
      "capitals-layer": {
        onClick: (e: mapboxgl.MapLayerMouseEvent) => {
          const p = e.features?.[0]?.properties
          if (!p) return

          onSelectSatelliteFocus?.({
            lat: e.lngLat.lat,
            lon: e.lngLat.lng,
            region: p.country ?? p.name,
            label: p.name,
          })
        },
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return
          map.getCanvas().style.cursor = "pointer"

          const p = e.features?.[0]?.properties
          if (!p || !popupRef.current) return

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
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 10px 12px;
                border-bottom: 1px solid #065f46;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Strategic Capital</div>
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
                ${p.status ? `
                  <div style="
                    display: inline-block;
                    background: ${
                      p.status === 'active' ? '#065f46' : 
                      p.status === 'alert' ? '#7c2d12' : 
                      '#1e293b'
                    };
                    color: ${
                      p.status === 'active' ? '#10b981' : 
                      p.status === 'alert' ? '#f97316' : 
                      '#94a3b8'
                    };
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    margin-bottom: 10px;
                  ">${p.status}</div>
                ` : ''}
                
                <!-- Summary -->
                ${p.summary ? `
                  <div style="
                    font-size: 12px;
                    color: #cbd5e1;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  ">${p.summary}</div>
                ` : ''}
                
                <!-- Entities -->
                ${p.entities ? `
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
                    ">Key Entities</div>
                    <div style="
                      font-size: 11px;
                      color: #94a3b8;
                      line-height: 1.4;
                    ">${p.entities}</div>
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
    [map, onSelectSatelliteFocus, popupRef]
  )

  /* ===================== MAP LAYER ===================== */
  return useMapLayer({
    map,
    sourceId: "capitals",
    sourceConfig: {
      type: "geojson",
      data: capitalsGeoJSON,
    },
    layers: [
      /* === PUNTO CAPITAL ESTILO OTAN === */
      {
        id: "capitals-layer",
        type: "circle",
        source: "capitals",
        paint: {
          // ⚙️ TAMAÑO DEL PUNTO (ajusta entre 6-12)
          "circle-radius": 8,
          
          // 🎨 COLOR VERDE COMANDO OTAN
          "circle-color": "#22c55e",
          
          // 💎 NÍTIDO (sin blur)
          "circle-blur": 0,
          
          // 🔆 OPACIDAD
          "circle-opacity": 1,
          
          // ❌ SIN BORDE (estilo limpio OTAN)
          "circle-stroke-width": 0,
        },
      },

      /* === LABEL ESTILO OTAN === */
      {
        id: "capitals-labels",
        type: "symbol",
        source: "capitals",
        layout: {
          // 📝 TEXTO
          "text-field": ["get", "name"],
          
          // ⚙️ TAMAÑO (ajusta entre 10-14)
          "text-size": 12,
          
          // 📍 POSICIÓN (debajo del punto)
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          
          // 🔠 FUENTE EN NEGRITA
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          
          // 👁️ SIEMPRE VISIBLE
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          // 🎨 MISMO COLOR QUE EL PUNTO (verde comando)
          "text-color": "#22c55e",
          
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