import { Event } from "@/lib/types";
import { getEventTimestamp, eventWeight } from "@/lib/timestampUtils";

export type HotZoneLevel = "watch" | "active" | "critical";

export type HotZone = {
  lat: number;
  lon: number;
  count: number;
  intensity: number;
  level: HotZoneLevel;
};

/* ===================== CONSTANTS ===================== */

export const MAP_CONFIG = {
  HOTZONE_RADIUS_KM: 150,
  HOTZONE_MIN_WEIGHT: 4,
  HOTZONE_MIN_INTENSITY: 1.2,
  INITIAL_CENTER: [30, 38] as [number, number],
  INITIAL_ZOOM: 2.4,
  MIN_ZOOM: 1.2,
  MAX_ZOOM: 6,
} as const;

export const TIME_WINDOWS = {
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
} as const;

export type TimeWindow = keyof typeof TIME_WINDOWS;

/* ===================== TYPE GUARDS ===================== */

export function hasCoordinates(
  e: Event
): e is Event & { lat: number; lon: number } {
  return (
    typeof e.lat === "number" &&
    typeof e.lon === "number" &&
    !isNaN(e.lat) &&
    !isNaN(e.lon)
  );
}

/* ===================== HOT ZONE CLASSIFICATION ===================== */

export function classifyHotZone(intensity: number): HotZoneLevel {
  if (intensity >= 3) return "critical";
  if (intensity >= 2) return "active";
  return "watch";
}

/* ===================== GEOSPATIAL HELPERS ===================== */

/**
 * Calcula distancia real entre dos puntos usando fórmula de Haversine
 * @returns distancia en kilómetros
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ===================== HOT ZONE COMPUTATION ===================== */

/**
 * Calcula hot zones agregando eventos cercanos con peso temporal
 *
 * Algoritmo:
 * 1. Para cada evento con coordenadas válidas
 * 2. Busca zona existente dentro de RADIUS_KM
 * 3. Si existe, actualiza centroid dinámicamente (promedio ponderado)
 * 4. Si no existe, crea nueva zona
 * 5. Filtra zonas por intensidad mínima
 * 6. Clasifica por nivel (watch/active/critical)
 */
export function computeHotZones(events: Event[]): HotZone[] {
  const zones: HotZone[] = [];

  events.filter(hasCoordinates).forEach((e) => {
    const weight = eventWeight(e);

    // Buscar zona cercana existente
    const existingZone = zones.find(
      (z) =>
        distanceKm(z.lat, z.lon, e.lat, e.lon) <= MAP_CONFIG.HOTZONE_RADIUS_KM
    );

    if (existingZone) {
      // Actualizar centroid dinámico (promedio ponderado)
      const totalWeight = existingZone.intensity + weight;
      existingZone.lat =
        (existingZone.lat * existingZone.intensity + e.lat * weight) /
        totalWeight;
      existingZone.lon =
        (existingZone.lon * existingZone.intensity + e.lon * weight) /
        totalWeight;
      existingZone.intensity = totalWeight;
      existingZone.count++;
    } else {
      // Crear nueva zona
      zones.push({
        lat: e.lat,
        lon: e.lon,
        count: 1,
        intensity: weight,
        level: classifyHotZone(weight),
      });
    }
  });

  // Filtrar por intensidad mínima y clasificar
  return zones
    .filter((z) => z.intensity >= MAP_CONFIG.HOTZONE_MIN_INTENSITY)
    .map((z) => ({
      ...z,
      level: classifyHotZone(z.intensity),
    }))
    .sort((a, b) => b.intensity - a.intensity);
}
