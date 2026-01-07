export function detectCategory(text: string) {
  const t = text.toLowerCase();

  // 🔴 Conflictos
  if (
    t.includes("war") ||
    t.includes("attack") ||
    t.includes("strike") ||
    t.includes("missile") ||
    t.includes("bomb") ||
    t.includes("explosion") ||
    t.includes("military") ||
    t.includes("troops") ||
    t.includes("killed") ||
    t.includes("ceasefire")
  ) {
    return "conflict";
  }

  // 🟠 Desastres
  if (
    t.includes("earthquake") ||
    t.includes("flood") ||
    t.includes("hurricane") ||
    t.includes("storm") ||
    t.includes("wildfire") ||
    t.includes("fire") ||
    t.includes("tsunami") ||
    t.includes("disaster")
  ) {
    return "disaster";
  }

  // 🟢 Salud
  if (
    t.includes("health") ||
    t.includes("disease") ||
    t.includes("virus") ||
    t.includes("outbreak") ||
    t.includes("covid") ||
    t.includes("hospital") ||
    t.includes("vaccine")
  ) {
    return "health";
  }

  // 🔵 Política (fallback)
  return "politics";
}
