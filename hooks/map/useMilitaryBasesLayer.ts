import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicMilitaryBases } from "@/lib/strategicMilitaryBases"
import { renderMilitaryBasePopup } from "@/components/map/popups"
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

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderMilitaryBasePopup({
                name: b.name,
                country: b.country,
                description: b.description,
                significance: b.significance,
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