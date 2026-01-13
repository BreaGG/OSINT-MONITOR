export type SocialSource = {
  name: string
  platform: "telegram" | "twitter" | "youtube" | "reddit" | "tiktok"
  url: string
  verification: "verified" | "unverified"
  focus?: string // Región o tema principal
}

export const socialRssSources: SocialSource[] = [
  /* ===================== TELEGRAM - OSINT & NEWS ===================== */
  {
    name: "LiveUAMap",
    platform: "telegram",
    url: "https://t.me/s/Liveuamap",
    verification: "verified",
    focus: "Global conflicts",
  },
  {
    name: "OSINTdefender",
    platform: "telegram",
    url: "https://t.me/s/OSINTdefender",
    verification: "verified",
    focus: "Ukraine, Russia, Global defense",
  },
  {
    name: "War Monitor",
    platform: "telegram",
    url: "https://t.me/s/war_monitor",
    verification: "unverified",
    focus: "Active conflicts",
  },
  {
    name: "Intel Crab",
    platform: "telegram",
    url: "https://t.me/s/intelcrab",
    verification: "verified",
    focus: "OSINT aggregation",
  },
  {
    name: "Middle East Observer",
    platform: "telegram",
    url: "https://t.me/s/MidEastObserver",
    verification: "verified",
    focus: "Middle East",
  },
  {
    name: "Syria Live",
    platform: "telegram",
    url: "https://t.me/s/syrialiveua",
    verification: "verified",
    focus: "Syria",
  },
  {
    name: "Intel Slava Z",
    platform: "telegram",
    url: "https://t.me/s/intelslava",
    verification: "unverified",
    focus: "Ukraine conflict (pro-Russian)",
  },
  {
    name: "Ukraine NOW",
    platform: "telegram",
    url: "https://t.me/s/UkraineNow",
    verification: "verified",
    focus: "Ukraine",
  },
  {
    name: "Status Coup News",
    platform: "telegram",
    url: "https://t.me/s/StatusCoup",
    verification: "verified",
    focus: "Alternative news",
  },
  {
    name: "Conflicts News",
    platform: "telegram",
    url: "https://t.me/s/ConflictsW",
    verification: "verified",
    focus: "Global conflicts",
  },

  /* ===================== TELEGRAM - REGIONAL ===================== */
  {
    name: "Gaza Now",
    platform: "telegram",
    url: "https://t.me/s/gazanow",
    verification: "unverified",
    focus: "Gaza, Palestine",
  },
  {
    name: "Middle East Spectator",
    platform: "telegram",
    url: "https://t.me/s/Middle_East_Spectator",
    verification: "verified",
    focus: "Middle East",
  },
  {
    name: "Africa Intelligence",
    platform: "telegram",
    url: "https://t.me/s/AfricaIntel",
    verification: "unverified",
    focus: "Africa",
  },
  {
    name: "Asia Pacific News",
    platform: "telegram",
    url: "https://t.me/s/AsiaPacNews",
    verification: "unverified",
    focus: "Asia Pacific",
  },

  /* ===================== TWITTER/X - OSINT ACCOUNTS ===================== */
  {
    name: "OSINTtechnical",
    platform: "twitter",
    url: "https://twitter.com/Osinttechnical",
    verification: "verified",
    focus: "Global OSINT",
  },
  {
    name: "Conflict News",
    platform: "twitter",
    url: "https://twitter.com/Conflicts",
    verification: "verified",
    focus: "Global conflicts",
  },
  {
    name: "WarMonitor",
    platform: "twitter",
    url: "https://twitter.com/WarMonitors",
    verification: "verified",
    focus: "Active conflicts",
  },
  {
    name: "Intel Crab (Twitter)",
    platform: "twitter",
    url: "https://twitter.com/IntelCrab",
    verification: "verified",
    focus: "OSINT",
  },

  /* ===================== REDDIT - CONFLICT MONITORING ===================== */
  {
    name: "r/UkrainianConflict",
    platform: "reddit",
    url: "https://www.reddit.com/r/UkrainianConflict",
    verification: "verified",
    focus: "Ukraine",
  },
  {
    name: "r/CombatFootage",
    platform: "reddit",
    url: "https://www.reddit.com/r/CombatFootage",
    verification: "verified",
    focus: "Global conflicts",
  },
  {
    name: "r/syriancivilwar",
    platform: "reddit",
    url: "https://www.reddit.com/r/syriancivilwar",
    verification: "verified",
    focus: "Syria",
  },

  /* ===================== YOUTUBE - CITIZEN JOURNALISM ===================== */
  {
    name: "Ukraine War Live",
    platform: "youtube",
    url: "https://www.youtube.com/@UkraineWarLive",
    verification: "verified",
    focus: "Ukraine",
  },
  {
    name: "Denys Davydov",
    platform: "youtube",
    url: "https://www.youtube.com/@DenysDavydov",
    verification: "verified",
    focus: "Ukraine, Military analysis",
  },

  /* ===================== TIKTOK - GROUND REPORTS ===================== */
  {
    name: "Ukraine Updates TikTok",
    platform: "tiktok",
    url: "https://www.tiktok.com/@ukraineupdates",
    verification: "unverified",
    focus: "Ukraine",
  },
  {
    name: "Middle East Reports",
    platform: "tiktok",
    url: "https://www.tiktok.com/@mideastreports",
    verification: "unverified",
    focus: "Middle East",
  },
]

// Categorizar por plataforma
export const sourcesByPlatform = {
  telegram: socialRssSources.filter(s => s.platform === "telegram"),
  twitter: socialRssSources.filter(s => s.platform === "twitter"),
  youtube: socialRssSources.filter(s => s.platform === "youtube"),
  reddit: socialRssSources.filter(s => s.platform === "reddit"),
  tiktok: socialRssSources.filter(s => s.platform === "tiktok"),
}

// Categorizar por región
export const sourcesByRegion = {
  ukraine: socialRssSources.filter(s => 
    s.focus?.toLowerCase().includes("ukraine")
  ),
  middleEast: socialRssSources.filter(s => 
    s.focus?.toLowerCase().includes("middle east") ||
    s.focus?.toLowerCase().includes("syria") ||
    s.focus?.toLowerCase().includes("gaza") ||
    s.focus?.toLowerCase().includes("palestine")
  ),
  global: socialRssSources.filter(s => 
    s.focus?.toLowerCase().includes("global") ||
    s.focus?.toLowerCase().includes("osint")
  ),
}