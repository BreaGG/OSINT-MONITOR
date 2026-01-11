/* ===================== TYPES ===================== */

export type EventCategory =
  | "conflict"
  | "politics"
  | "disaster"
  | "health"
  | "economy";

export type Event = {
  id: string;
  category: EventCategory;
  region: string;
  lat: number;
  lon: number;
  severity: 1 | 2 | 3;
  timestamp: number;
};

/* ===================== CONFIG ===================== */

const CATEGORY_WEIGHT: Record<EventCategory, number> = {
  conflict: 5,
  politics: 3,
  disaster: 4,
  health: 3,
  economy: 2,
};

/* ===================== ENGINE ===================== */

type RegionSignal = {
  region: string;
  totalScore: number;
  eventCount: number;
  categories: Set<EventCategory>;
};

export type GlobalStatus =
  | "stable"
  | "regional_escalation"
  | "multi_region_escalation"
  | "critical";

export type GlobalState = {
  status: GlobalStatus;
  primaryRegion?: string;
  secondaryRegions: string[];
  confidence: "low" | "medium" | "high";
  drivers: string[];
  updatedAt: number;
};

/* ===================== HELPERS ===================== */

function scoreEvent(e: Event) {
  return CATEGORY_WEIGHT[e.category] * e.severity;
}

function classifyRegion(r: RegionSignal) {
  if (r.totalScore >= 40 && r.categories.size >= 2) return "critical";
  if (r.totalScore >= 25) return "escalating";
  if (r.totalScore >= 10) return "monitoring";
  return "stable";
}

/* ===================== MAIN ===================== */

export function buildGlobalState(events: Event[]): GlobalState {
  const map = new Map<string, RegionSignal>();

  for (const e of events) {
    const entry = map.get(e.region) ?? {
      region: e.region,
      totalScore: 0,
      eventCount: 0,
      categories: new Set<EventCategory>(),
    };

    entry.totalScore += scoreEvent(e);
    entry.eventCount++;
    entry.categories.add(e.category);

    map.set(e.region, entry);
  }

  const regions = [...map.values()];
  const classified = regions.map((r) => ({
    ...r,
    status: classifyRegion(r),
  }));

  const critical = classified.filter((r) => r.status === "critical");
  const escalating = classified.filter((r) => r.status === "escalating");

  let status: GlobalStatus = "stable";
  if (critical.length >= 2) status = "critical";
  else if (critical.length === 1 && escalating.length >= 1)
    status = "multi_region_escalation";
  else if (critical.length === 1 || escalating.length >= 1)
    status = "regional_escalation";

  const sorted = classified.sort((a, b) => b.totalScore - a.totalScore);

  return {
    status,
    primaryRegion: sorted[0]?.region,
    secondaryRegions: sorted.slice(1, 3).map((r) => r.region),
    confidence:
      events.length > 20 ? "high" : events.length > 10 ? "medium" : "low",
    drivers: sorted[0]
      ? [
          `${sorted[0].eventCount} events in window`,
          `Categories: ${[...sorted[0].categories].join(", ")}`,
        ]
      : [],
    updatedAt: Date.now(),
  };
}

export function isPrimaryAO(
  state: GlobalState,
  region?: string
): boolean {
  if (!region) return false
  return state.primaryRegion?.toLowerCase() === region.toLowerCase()
}

