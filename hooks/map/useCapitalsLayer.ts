import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicPoints } from "@/lib/strategicPoints"
import { renderCapitalPopup } from "@/components/map/popups"
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

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderCapitalPopup({
                name: p.name,
                status: p.status,
                summary: p.summary,
                entities: p.entities,
              })
            )
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