import { useMemo } from "react"
import mapboxgl from "mapbox-gl"
import { strategicChokepoints } from "@/lib/strategicChokepoints"
import { renderChokepointPopup } from "@/components/map/popups"
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

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(
              renderChokepointPopup({
                name: p.name,
                status: p.status,
                summary: p.summary,
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