import { Event } from "@/lib/types";
import { GlobalState } from "@/lib/gse";

export function whyThisEventMatters(
  event: Event,
  globalState: GlobalState
): string[] {
  const reasons: string[] = [];

  // 1. Evento en AO primario
  if (
    globalState.primaryRegion &&
    event.country === globalState.primaryRegion
  ) {
    reasons.push("Occurs within current primary area of operations");
  }

  // 2. Evento en AO secundario
  if (globalState.secondaryRegions.includes(event.country)) {
    reasons.push("Located in a secondary region of interest");
  }

  // 3. Categoría alineada con drivers globales
  const categoryMatch = globalState.drivers.some((d) =>
    d.toLowerCase().includes(event.category)
  );

  if (categoryMatch) {
    reasons.push(
      "Aligns with dominant signal drivers in the current global state"
    );
  }

  // 4. Severidad implícita por categoría
  if (event.category === "conflict" || event.category === "disaster") {
    reasons.push("High potential for escalation or cascading impact");
  }

  // 5. Estado global no estable
  if (globalState.status !== "stable") {
    reasons.push(
      `Relevant under ${globalState.status.replaceAll("_", " ")} conditions`
    );
  }

  // Fallback
  if (reasons.length === 0) {
    reasons.push("Monitored as part of general situational awareness");
  }

  return reasons;
}
