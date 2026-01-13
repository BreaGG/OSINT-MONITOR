export const categoryColors = {
  conflict: {
    label: "CONFLICT",
    color: "#ef4444", // Red
    description: "Armed conflicts, military operations, warfare"
  },
  terrorism: {
    label: "TERRORISM",
    color: "#dc2626", // Dark Red
    description: "Terrorist activities, extremism, insurgency"
  },
  nuclear: {
    label: "NUCLEAR",
    color: "#f97316", // Orange
    description: "Nuclear threats, WMD, proliferation"
  },
  cyber: {
    label: "CYBER",
    color: "#8b5cf6", // Purple
    description: "Cyberattacks, hacking, data breaches"
  },
  disaster: {
    label: "DISASTER",
    color: "#f59e0b", // Amber
    description: "Natural disasters, emergencies, accidents"
  },
  health: {
    label: "HEALTH",
    color: "#10b981", // Green
    description: "Pandemics, outbreaks, public health"
  },
  climate: {
    label: "CLIMATE",
    color: "#06b6d4", // Cyan
    description: "Climate change, environmental issues"
  },
  economy: {
    label: "ECONOMY",
    color: "#3b82f6", // Blue
    description: "Markets, finance, economic indicators"
  },
  politics: {
    label: "POLITICS",
    color: "#6366f1", // Indigo
    description: "Government, elections, diplomacy"
  },
} as const;

export type CategoryType = keyof typeof categoryColors;