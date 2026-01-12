import { Event } from "./types";

/**
 * Parsea timestamp de base de datos en formato "YYYY-MM-DD HH:MM:SS"
 */
function parseDBTimestamp(ts: string): number | null {
  try {
    const [date, time] = ts.split(" ");
    if (!date || !time) return null;

    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm, ss] = time.split(":").map(Number);

    if ([y, m, d, hh, mm, ss].some(isNaN)) return null;

    return new Date(y, m - 1, d, hh, mm, ss).getTime();
  } catch {
    return null;
  }
}

/**
 * Intenta parsear un timestamp en múltiples formatos:
 * - ISO 8601 (2026-01-10T19:49:01Z)
 * - DB format (2026-01-10 19:49:01)
 * - Unix timestamp (número)
 *
 * @returns timestamp en ms o null si falla
 */
export function parseTimestamp(ts: unknown): number | null {
  if (!ts) return null;

  // Unix timestamp (número)
  if (typeof ts === "number") {
    return isNaN(ts) ? null : ts;
  }

  // String timestamp
  if (typeof ts === "string") {
    // Formato DB: "2026-01-10 19:49:01"
    if (ts.includes(" ") && !ts.includes("T")) {
      return parseDBTimestamp(ts);
    }

    // ISO 8601 o parseable por Date
    const parsed = new Date(ts);
    return isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  return null;
}

/**
 * Extrae timestamp de un evento considerando múltiples campos posibles
 */
export function getEventTimestamp(e: Event): number | null {
  const candidates = [
    (e as any).publishedAt,
    (e as any).published_at,
    (e as any).createdAt,
    (e as any).created_at,
    e.timestamp,
  ];

  for (const candidate of candidates) {
    const parsed = parseTimestamp(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
}

/**
 * Calcula peso de un evento basado en su antigüedad
 *
 * - < 6h: peso 2.0
 * - < 24h: peso 1.5
 * - >= 24h: peso 1.0
 * - sin timestamp: peso 0.5
 */
export function eventWeight(e: Event): number {
  const ts = getEventTimestamp(e);
  if (!ts) return 0.5;

  const hoursAgo = (Date.now() - ts) / (60 * 60 * 1000);

  if (hoursAgo < 6) return 2.0;
  if (hoursAgo < 24) return 1.5;
  return 1.0;
}

/**
 * Verifica si un evento está dentro de una ventana temporal
 */
export function isWithinTimeWindow(e: Event, windowMs: number): boolean {
  const ts = getEventTimestamp(e);

  // Si no tiene timestamp, incluirlo en ventanas >= 24h
  if (!ts) return windowMs >= 24 * 60 * 60 * 1000;

  return Date.now() - ts <= windowMs;
}

/**
 * Formatea timestamp para display
 */
export function formatTimestamp(ts: number | null): string {
  if (!ts) return "Unknown";

  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;

  // < 1 hora
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins}m ago`;
  }

  // < 24 horas
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // >= 24 horas
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days}d ago`;
}
