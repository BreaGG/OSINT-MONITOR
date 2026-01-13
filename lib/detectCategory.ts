type Category =
  | "conflict"
  | "disaster"
  | "health"
  | "economy"
  | "politics"
  | "cyber"
  | "terrorism"
  | "nuclear"
  | "climate";

/* ===================== CONTENT FILTERING ===================== */

/**
 * Detecta si el contenido debe ser filtrado (excluido) del monitor OSINT
 * Retorna true si el contenido NO es relevante para inteligencia
 */
export function shouldFilterOut(text: string): boolean {
  const t = text.toLowerCase();

  // 🚫 DEPORTES - Completamente irrelevante para OSINT
  const SPORTS_KEYWORDS = [
    "football", "soccer", "nba", "nfl", "nhl", "mlb",
    "fifa", "uefa", "champions league",
    "world cup", "olympics", "olympic",
    "tournament", "championship", "league",
    "coach", "player", "team", "match", "game",
    "goal", "score", "win", "defeat", "trophy",
    "real madrid", "barcelona", "manchester", "bayern",
    "messi", "ronaldo", "mbappe", "neymar",
    "premier league", "la liga", "serie a",
    "formula 1", "f1", "racing", "grand prix",
    "tennis", "golf", "boxing", "ufc", "mma",
    "cricket", "rugby", "basketball", "baseball",
  ];

  // 🚫 ENTRETENIMIENTO - No relevante para inteligencia
  const ENTERTAINMENT_KEYWORDS = [
    "movie", "film", "cinema", "actor", "actress",
    "hollywood", "oscar", "emmy", "grammy",
    "netflix", "disney+", "streaming",
    "tv show", "series", "episode",
    "celebrity", "kardashian", "influencer",
    "music video", "album", "concert", "tour",
    "fashion week", "red carpet",
    "box office", "premiere",
  ];

  // 🚫 CULTURA POP - Mínima relevancia
  const POP_CULTURE_KEYWORDS = [
    "kardashian", "jenner", "celebrity gossip",
    "royal wedding", "royal baby",
    "instagram", "tiktok", "viral video",
    "meme", "trending",
  ];

  // ⚠️ KEYWORDS AMBIGUOS - Requieren contexto adicional
  // Si aparecen SOLOS sin keywords de seguridad, probablemente no son relevantes
  const AMBIGUOUS_LOW_PRIORITY = [
    "announces", "launches", "unveils",
    "celebrates", "honors", "remembers",
    "interview", "statement", "says",
  ];

  // ✅ KEYWORDS DE SEGURIDAD - Si están presentes, NO filtrar
  // Estos indican que incluso contenido aparentemente trivial podría ser relevante
  const SECURITY_OVERRIDE = [
    "attack", "threat", "security", "intelligence",
    "military", "defense", "weapon", "missile",
    "spy", "espionage", "classified", "leak",
    "sanction", "embargo", "crisis", "conflict",
    "investigation", "raid", "arrest", "suspect",
  ];

  // Si tiene keywords de seguridad, NO filtrar (puede ser relevante)
  if (SECURITY_OVERRIDE.some(k => t.includes(k))) {
    return false;
  }

  // Filtrar deportes
  if (SPORTS_KEYWORDS.some(k => t.includes(k))) {
    return true;
  }

  // Filtrar entretenimiento puro
  if (ENTERTAINMENT_KEYWORDS.some(k => t.includes(k))) {
    return true;
  }

  // Filtrar cultura pop
  if (POP_CULTURE_KEYWORDS.some(k => t.includes(k))) {
    return true;
  }

  // No filtrar por defecto (permitir contenido ambiguo)
  return false;
}

/* ===================== CATEGORY DETECTION ===================== */

export function detectCategory(text: string): Category {
  const t = text.toLowerCase();

  /* ===================== KEYWORDS ===================== */

  // 🔴 CONFLICT (Highest Priority)
  const CONFLICT = [
    // Warfare
    "war", "armed conflict", "military operation", "combat", "battlefield",
    "attack", "strike", "airstrike", "drone strike", "artillery strike",
    "missile", "rocket", "bomb", "bombing", "bombardment", "explosion",
    "shelling", "mortar", "grenade",
    
    // Casualties & Impact
    "killed", "dead", "death toll", "casualties", "wounded", "injured",
    "civilian casualties", "war crimes",
    
    // Military Actions
    "invasion", "occupation", "offensive", "counteroffensive", "defensive",
    "assault", "siege", "raid", "ambush",
    "frontline", "front line", "trenches",
    
    // Military Forces
    "army", "military", "troops", "soldiers", "forces", "battalion",
    "security forces", "paramilitary", "mercenaries",
    
    // Non-State Actors
    "rebels", "insurgents", "militants", "militia", "guerrilla",
    "fighters", "combatants",
    
    // Weapons & Equipment
    "tank", "tanks", "armored vehicle", "artillery",
    "fighter jet", "warplane", "helicopter",
    "warship", "submarine",
    
    // Ceasefire & Peace
    "ceasefire", "truce", "peace talks", "armistice",
    "prisoner exchange",
    
    // Humanitarian Impact
    "displaced", "refugees", "evacuation", "humanitarian corridor",
    "besieged", "blockade",
    
    // Specific Conflicts & Actors
    "ukraine", "russia", "russian", "ukrainian", "donbas", "crimea",
    "gaza", "israel", "hamas", "hezbollah", "idf", "palestinian",
    "syria", "syrian", "isis", "isil",
    "yemen", "houthi",
    "afghanistan", "taliban",
    "myanmar", "rohingya", "junta",
    "sudan", "rsf", "darfur",
    "wagner", "prigozhin",
    "nato",
  ];

  // 💣 TERRORISM & EXTREMISM
  const TERRORISM = [
    "terror", "terrorist", "terrorism", "extremist", "extremism",
    "jihadist", "jihad", "radical",
    "suicide bomb", "car bomb", "ied",
    "hostage", "kidnapping", "abduction",
    "al-qaeda", "boko haram",
    "insurgency", "lone wolf",
    "counter-terrorism",
  ];

  // 💻 CYBERSECURITY
  const CYBER = [
    "cyber", "cyberattack", "cyber attack", "cyber warfare",
    "hack", "hacker", "hacking", "hacked", "breach", "data breach",
    "ransomware", "malware", "phishing", "ddos",
    "vulnerability", "exploit", "zero-day",
    "apt", "threat actor",
    "cyber espionage",
    "data leak", "stolen data",
    "scam", "fraud",
  ];

  // ☢️ NUCLEAR & WMD
  const NUCLEAR = [
    "nuclear", "atomic", "thermonuclear",
    "plutonium", "uranium", "enrichment",
    "reactor", "nuclear plant",
    "warhead", "icbm", "ballistic missile",
    "proliferation", "iaea",
    "radiation", "radioactive", "fallout",
    "north korea", "iran nuclear",
    "chemical weapon", "biological weapon", "wmd",
    "nerve agent", "poisoning", "toxin",
  ];

  // 🌪️ DISASTER
  const DISASTER = [
    "earthquake", "quake", "tsunami",
    "flood", "flooding",
    "hurricane", "cyclone", "typhoon", "storm",
    "tornado",
    "wildfire", "forest fire",
    "landslide", "avalanche",
    "volcano", "volcanic", "eruption",
    "drought", "famine",
    "accident", "explosion",
    "collapsed", "collapse",
    "derailment", "crash",
    "oil spill", "chemical spill",
    "disaster", "catastrophe",
    "emergency", "evacuation", "rescue",
  ];

  // 🏥 HEALTH & PANDEMICS
  const HEALTH = [
    "health", "disease", "illness",
    "virus", "viral", "bacterial", "infection",
    "outbreak", "epidemic", "pandemic",
    "covid", "coronavirus", "sars", "flu", "influenza",
    "ebola", "zika", "malaria", "cholera",
    "hospital", "patients", "medical",
    "vaccine", "vaccination",
    "quarantine", "isolation", "lockdown",
    "who", "cdc",
  ];

  // 💰 ECONOMY & MARKETS
  const ECONOMY = [
    "economy", "economic", "recession", "inflation",
    "gdp", "growth", "unemployment",
    "central bank", "federal reserve", "fed", "ecb",
    "interest rate", "rates",
    "market", "markets", "stock", "stocks",
    "bonds", "debt", "crash",
    "currency", "dollar", "euro",
    "forex", "crypto", "bitcoin",
    "trade", "exports", "imports",
    "tariffs", "sanctions", "embargo",
    "supply chain",
    "oil", "crude", "opec", "gas", "energy",
    "bank", "banking", "financial",
    "bankruptcy", "bailout", "default",
  ];

  // 🌡️ CLIMATE & ENVIRONMENT
  const CLIMATE = [
    "climate change", "global warming", "greenhouse",
    "carbon", "emissions", "co2",
    "paris agreement", "cop27", "cop28",
    "pollution", "deforestation",
    "extinction", "endangered",
    "renewable", "solar", "wind",
    "heatwave", "extreme heat",
    "glacier", "arctic", "sea level",
  ];

  // 🏛️ POLITICS & DIPLOMACY
  const POLITICS = [
    "election", "vote", "voting", "referendum",
    "government", "president", "minister",
    "parliament", "congress", "senate",
    "policy", "law", "legislation",
    "diplomacy", "diplomatic", "embassy",
    "summit", "treaty", "agreement",
    "united nations", "sanctions",
    "protest", "demonstration", "riot", "unrest",
    "opposition", "dissident",
    "corruption", "scandal",
    "impeachment", "resignation",
  ];

  /* ===================== DETECTION (PRIORITY ORDER) ===================== */
  
  // High priority threats first
  if (CONFLICT.some((k) => t.includes(k))) return "conflict";
  if (TERRORISM.some((k) => t.includes(k))) return "terrorism";
  if (NUCLEAR.some((k) => t.includes(k))) return "nuclear";
  if (CYBER.some((k) => t.includes(k))) return "cyber";
  
  // Environmental & humanitarian
  if (DISASTER.some((k) => t.includes(k))) return "disaster";
  if (HEALTH.some((k) => t.includes(k))) return "health";
  if (CLIMATE.some((k) => t.includes(k))) return "climate";
  
  // Economic impact
  if (ECONOMY.some((k) => t.includes(k))) return "economy";
  
  // Politics as comprehensive fallback
  return "politics";
}

/* ===================== RELEVANCE SCORING ===================== */

/**
 * Asigna una puntuación de relevancia para priorización
 * 0 = No relevante (filtrar)
 * 1-3 = Baja relevancia
 * 4-7 = Media relevancia
 * 8-10 = Alta relevancia (crítico para inteligencia)
 */
export function getRelevanceScore(text: string, category: Category): number {
  // Si debe filtrarse, relevancia 0
  if (shouldFilterOut(text)) {
    return 0;
  }

  // Puntuación base por categoría
  const categoryScores: Record<Category, number> = {
    conflict: 10,      // Máxima prioridad
    terrorism: 10,     // Máxima prioridad
    nuclear: 9,        // Crítico
    cyber: 8,          // Alto impacto
    disaster: 7,       // Importante
    health: 6,         // Moderado
    climate: 5,        // Contexto largo plazo
    economy: 6,        // Importante
    politics: 4,       // Contexto general
  };

  let score = categoryScores[category];

  // Bonificación por keywords críticos
  const t = text.toLowerCase();
  
  const CRITICAL_KEYWORDS = [
    "breaking", "urgent", "alert", "confirmed",
    "casualties", "killed", "dead", "injured",
    "nuclear", "missile", "attack", "strike",
    "breach", "hack", "leak",
  ];

  if (CRITICAL_KEYWORDS.some(k => t.includes(k))) {
    score = Math.min(10, score + 1);
  }

  return score;
}