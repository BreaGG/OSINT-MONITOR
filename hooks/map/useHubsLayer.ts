import { useEffect, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { useMapLayer } from "./useMapLayer";

type Hub = {
  id: string;
  name: string;
  type: "internet";
  lat: number;
  lon: number;
  importance: "critical" | "major";
  description: string;
};

type UseHubsLayerProps = {
  map: mapboxgl.Map | null;
  visible: boolean;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onSelectSatelliteFocus?: (focus: any) => void;
};

// Hubs de internet estratégicos del mundo
const GLOBAL_HUBS: Hub[] = [
  // Internet/Fiber Hubs principales
  { 
    id: "hub-cornwall", 
    name: "Cornwall UK", 
    type: "internet",
    lat: 50.26, 
    lon: -5.05,
    importance: "critical",
    description: "Europe-Americas gateway"
  },
  { 
    id: "hub-singapore", 
    name: "Singapore", 
    type: "internet",
    lat: 1.29, 
    lon: 103.85,
    importance: "critical",
    description: "Asia-Pacific hub"
  },
  { 
    id: "hub-mumbai", 
    name: "Mumbai", 
    type: "internet",
    lat: 19.08, 
    lon: 72.88,
    importance: "critical",
    description: "South Asia gateway"
  },
  { 
    id: "hub-tokyo", 
    name: "Tokyo", 
    type: "internet",
    lat: 35.68, 
    lon: 139.65,
    importance: "critical",
    description: "East Asia hub"
  },
  { 
    id: "hub-frankfurt", 
    name: "Frankfurt", 
    type: "internet",
    lat: 50.11, 
    lon: 8.68,
    importance: "critical",
    description: "DE-CIX - European data center hub"
  },
  { 
    id: "hub-ashburn", 
    name: "Ashburn VA", 
    type: "internet",
    lat: 39.04, 
    lon: -77.49,
    importance: "critical",
    description: "US East Coast data hub"
  },
  { 
    id: "hub-amsterdam", 
    name: "Amsterdam", 
    type: "internet",
    lat: 52.37, 
    lon: 4.89,
    importance: "critical",
    description: "AMS-IX internet exchange"
  },
  { 
    id: "hub-london", 
    name: "London", 
    type: "internet",
    lat: 51.51, 
    lon: -0.12,
    importance: "critical",
    description: "LINX - London Internet Exchange"
  },
  { 
    id: "hub-saopaulo", 
    name: "São Paulo", 
    type: "internet",
    lat: -23.55, 
    lon: -46.63,
    importance: "major",
    description: "PTTMetro - South America hub"
  },
  { 
    id: "hub-sydney", 
    name: "Sydney", 
    type: "internet",
    lat: -33.87, 
    lon: 151.21,
    importance: "major",
    description: "Oceania hub"
  },
  { 
    id: "hub-johannesburg", 
    name: "Johannesburg", 
    type: "internet",
    lat: -26.20, 
    lon: 28.05,
    importance: "major",
    description: "NAPAfrica - Africa hub"
  },
  { 
    id: "hub-hongkong", 
    name: "Hong Kong", 
    type: "internet",
    lat: 22.32, 
    lon: 114.17,
    importance: "critical",
    description: "HKIX - Asia hub"
  },
  { 
    id: "hub-losangeles", 
    name: "Los Angeles", 
    type: "internet",
    lat: 34.05, 
    lon: -118.24,
    importance: "major",
    description: "US West Coast hub"
  },
  { 
    id: "hub-miami", 
    name: "Miami", 
    type: "internet",
    lat: 25.76, 
    lon: -80.19,
    importance: "major",
    description: "NAP of the Americas - Latin gateway"
  },
  { 
    id: "hub-seattle", 
    name: "Seattle", 
    type: "internet",
    lat: 47.61, 
    lon: -122.33,
    importance: "major",
    description: "SIX - Seattle Internet Exchange"
  },
  { 
    id: "hub-paris", 
    name: "Paris", 
    type: "internet",
    lat: 48.85, 
    lon: 2.35,
    importance: "major",
    description: "France-IX hub"
  },
  { 
    id: "hub-stockholm", 
    name: "Stockholm", 
    type: "internet",
    lat: 59.33, 
    lon: 18.06,
    importance: "major",
    description: "STHIX - Nordic hub"
  },
  { 
    id: "hub-dubai", 
    name: "Dubai", 
    type: "internet",
    lat: 25.25, 
    lon: 55.36,
    importance: "major",
    description: "Middle East hub"
  },
];

export function useHubsLayer({
  map,
  visible,
  popupRef,
  onSelectSatelliteFocus,
}: UseHubsLayerProps) {
  const hubsGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: GLOBAL_HUBS.map(hub => ({
        type: "Feature" as const,
        properties: {
          id: hub.id,
          name: hub.name,
          type: hub.type,
          importance: hub.importance,
          description: hub.description,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [hub.lon, hub.lat],
        },
      })),
    };
  }, []);

  // Event handlers
  const eventHandlers = useMemo(() => ({
    "hubs-outer": {
      onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
        if (!map) return;
        map.getCanvas().style.cursor = "pointer";

        const p = e.features?.[0]?.properties;
        if (!p || !popupRef.current) return;

        const content = `
          <div style="
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            min-width: 240px;
            background: #000000;
            border: 1px solid #334155;
            border-radius: 4px;
            overflow: hidden;
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              padding: 10px 12px;
              border-bottom: 1px solid #4c1d95;
            ">
              <div style="
                font-size: 11px;
                font-weight: 600;
                color: rgba(255,255,255,0.9);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
              ">Internet Hub</div>
              <div style="
                font-size: 15px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: -0.3px;
              ">${p.name}</div>
            </div>
            
            <!-- Body -->
            <div style="padding: 12px;">
              <!-- Description -->
              <div style="
                font-size: 12px;
                color: #cbd5e1;
                line-height: 1.5;
                margin-bottom: 10px;
              ">${p.description}</div>
              
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
                  ">Importance</div>
                  <div style="
                    font-size: 11px;
                    font-weight: 600;
                    color: ${p.importance === 'critical' ? '#ef4444' : '#f59e0b'};
                    text-transform: uppercase;
                  ">${p.importance}</div>
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
                  ">Type</div>
                  <div style="
                    font-size: 11px;
                    font-weight: 600;
                    color: #a855f7;
                    text-transform: uppercase;
                  ">Network</div>
                </div>
              </div>
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
      onClick: (e: mapboxgl.MapLayerMouseEvent) => {
        const p = e.features?.[0]?.properties;
        if (p && onSelectSatelliteFocus) {
          onSelectSatelliteFocus({
            type: "hub",
            name: p.name,
            coordinates: e.lngLat,
          });
        }
      },
    },
  }), [map, popupRef, onSelectSatelliteFocus]);

  return useMapLayer({
    map,
    sourceId: "hubs",
    sourceConfig: {
      type: "geojson",
      data: hubsGeoJSON,
    },
    layers: [
      // Círculo exterior (morado)
      {
        id: "hubs-outer",
        type: "circle",
        source: "hubs",
        paint: {
          "circle-radius": [
            "match",
            ["get", "importance"],
            "critical", 12,
            "major", 10,
            "regional", 8,
            10
          ],
          "circle-color": "#a855f7", // Morado
          "circle-opacity": 0.8,
        },
      },
      // Círculo interior (hueco - más oscuro)
      {
        id: "hubs-inner",
        type: "circle",
        source: "hubs",
        paint: {
          "circle-radius": [
            "match",
            ["get", "importance"],
            "critical", 7,
            "major", 5.5,
            "regional", 4.5,
            5.5
          ],
          "circle-color": "#1f2937", // Gris oscuro (simula hueco)
          "circle-opacity": 1,
        },
      },
    ],
    eventHandlers: {
      ...eventHandlers,
      "hubs-inner": eventHandlers["hubs-outer"],
    },
    visible,
  });
}