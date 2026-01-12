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
              : "#38bdf8",  // verde
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
      /* === ROMBO TÁCTICO === */
      {
        id: "chokepoints-layer",
        type: "symbol",
        source: "chokepoints",
        layout: {
          "text-field": "◆",
          "text-size": 42,                 // ← AQUÍ AJUSTAS EL TAMAÑO DEL ROMBO
          "text-allow-overlap": true,
          "text-anchor": "center",
        },
        paint: {
          "text-color": ["get", "color"],
          "text-halo-color": "#020617",    // halo oscuro HUD
          "text-halo-width": 1,
          "text-opacity": 0.95,
        },
      },

      /* === LABEL === */
      {
        id: "chokepoints-labels",
        type: "symbol",
        source: "chokepoints",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#cbd5f5",
          "text-halo-color": "#020617",
          "text-halo-width": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  })
}
