import { Event as UIEvent } from "@/lib/types"
import {
  Event as GSEEvent,
  EventCategory,
} from "@/lib/gse"

/* ===================== ADAPTER ===================== */

export function adaptEventsToGSE(events: UIEvent[]): GSEEvent[] {
  return events
    // ❗ El GSE solo trabaja con eventos geolocalizados
    .filter(
      (e): e is UIEvent & { lat: number; lon: number } =>
        typeof e.lat === "number" && typeof e.lon === "number"
    )
    .map(e => ({
      id: e.id,
      category: e.category as EventCategory,
      region: e.country || "Unknown",
      lat: e.lat,
      lon: e.lon,
      severity: inferSeverity(e),
      timestamp: resolveTimestamp(e),
    }))
}

/* ===================== HELPERS ===================== */

function resolveTimestamp(e: UIEvent): number {
  if (typeof e.timestamp === "number") return e.timestamp

  const parsed = Date.parse(e.date)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

function inferSeverity(e: UIEvent): 1 | 2 | 3 {
  switch (e.category) {
    case "conflict":
    case "disaster":
      return 3
    case "politics":
    case "health":
      return 2
    default:
      return 1
  }
}
