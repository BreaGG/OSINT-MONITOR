export const categoryColors = {
  conflict: {
    label: "Conflict",
    color: "#dc2626", // rojo intenso – prioridad máxima
  },
  disaster: {
    label: "Disaster",
    color: "#ea580c", // naranja – emergencia no militar
  },
  politics: {
    label: "Politics",
    color: "#2563eb", // azul institucional
  },
  health: {
    label: "Health",
    color: "#16a34a", // verde sanitario
  },
  economy: {
    label: "Economy",
    color: "#64748b", // slate/steel – macro, sobrio
  },
  sports: {
    label: "Sports",
    color: "#4b5563", // gris apagado – no prioritario
  },
} as const
