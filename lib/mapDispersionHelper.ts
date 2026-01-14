import { Event } from "@/lib/types"

/* ===================== COUNTRY BOUNDING BOXES ===================== */

// Bounding boxes aproximados para países grandes (en grados decimales)
const COUNTRY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number; radius: number }> = {
    "United States": { minLat: 24.5, maxLat: 49, minLon: -125, maxLon: -66, radius: 8 },
    "Russia": { minLat: 45, maxLat: 77, minLon: 30, maxLon: 169, radius: 12 }, // Ajustado: evita Alaska/Canada
    "Russian Federation": { minLat: 45, maxLat: 77, minLon: 30, maxLon: 169, radius: 12 },
    "China": { minLat: 20, maxLat: 50, minLon: 75, maxLon: 132, radius: 7 }, // Ajustado: evita Mongolia
    "Canada": { minLat: 41, maxLat: 83, minLon: -141, maxLon: -52, radius: 10 },
    "Brazil": { minLat: -34, maxLat: 5, minLon: -74, maxLon: -34, radius: 7 },
    "Australia": { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154, radius: 8 },
    "India": { minLat: 8, maxLat: 35, minLon: 68, maxLon: 97, radius: 5 },
    "Argentina": { minLat: -55, maxLat: -22, minLon: -73, maxLon: -53, radius: 6 },
    "Kazakhstan": { minLat: 40, maxLat: 55, minLon: 47, maxLon: 87, radius: 6 },
    "Algeria": { minLat: 19, maxLat: 37, minLon: -8, maxLon: 12, radius: 5 },
    "Saudi Arabia": { minLat: 16, maxLat: 32, minLon: 35, maxLon: 56, radius: 4 },
    "Mexico": { minLat: 14, maxLat: 33, minLon: -118, maxLon: -86, radius: 5 },
    "Indonesia": { minLat: -11, maxLat: 6, minLon: 95, maxLon: 141, radius: 6 },
    "Libya": { minLat: 20, maxLat: 33, minLon: 10, maxLon: 25, radius: 4 },
    "Iran": { minLat: 25, maxLat: 40, minLon: 44, maxLon: 63, radius: 4 },
    "Mongolia": { minLat: 42, maxLat: 52, minLon: 88, maxLon: 120, radius: 5 },
    "Peru": { minLat: -18, maxLat: 0, minLon: -81, maxLon: -68, radius: 4 },
    "Chad": { minLat: 7, maxLat: 23, minLon: 14, maxLon: 24, radius: 4 },
    "Niger": { minLat: 11, maxLat: 24, minLon: 0, maxLon: 16, radius: 4 },
}

/* ===================== DISPERSIÓN MEJORADA ===================== */

/**
 * Aplica dispersión geográfica inteligente basada en el tamaño del país
 */
export function applySmartDispersion(events: Event[]): Event[] {
    // Agrupar eventos por país
    const eventsByCountry: Record<string, Event[]> = {}
    
    events.forEach(event => {
        const country = event.country || "Unknown"
        if (!eventsByCountry[country]) {
            eventsByCountry[country] = []
        }
        eventsByCountry[country].push(event)
    })

    const dispersedEvents: Event[] = []

    // Procesar cada grupo de país
    Object.entries(eventsByCountry).forEach(([country, countryEvents]) => {
        const bounds = COUNTRY_BOUNDS[country]

        if (bounds && countryEvents.length > 1) {
            // País grande: dispersar eventos por toda el área
            countryEvents.forEach((event, index) => {
                const dispersed = disperseInLargeCountry(event, bounds, index, countryEvents.length)
                dispersedEvents.push(dispersed)
            })
        } else {
            // País pequeño o sin bounds definidos: dispersión normal (pequeña)
            countryEvents.forEach((event, index) => {
                const dispersed = disperseInSmallCountry(event, index, countryEvents.length)
                dispersedEvents.push(dispersed)
            })
        }
    })

    return dispersedEvents
}

/**
 * Dispersión para países grandes - distribuye eventos por toda el área del país
 */
function disperseInLargeCountry(
    event: Event,
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number; radius: number },
    index: number,
    total: number
): Event {
    // Usar patrón de golden angle spiral para distribución uniforme
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~137.5 grados
    const angle = index * goldenAngle
    const radius = Math.sqrt(index / total) // Radio proporcional para distribución uniforme

    // Calcular rango de latitud y longitud
    const latRange = bounds.maxLat - bounds.minLat
    const lonRange = bounds.maxLon - bounds.minLon

    // Aplicar dispersión dentro de los bounds del país (reducido a 30% para mayor precisión)
    const latOffset = radius * Math.cos(angle) * latRange * 0.30
    const lonOffset = radius * Math.sin(angle) * lonRange * 0.30

    // Centrar en el país
    const centerLat = (bounds.minLat + bounds.maxLat) / 2
    const centerLon = (bounds.minLon + bounds.maxLon) / 2

    return {
        ...event,
        lat: centerLat + latOffset,
        lon: centerLon + lonOffset,
    }
}

/**
 * Dispersión para países pequeños - dispersión mínima alrededor del punto
 */
function disperseInSmallCountry(event: Event, index: number, total: number): Event {
    if (!event.lat || !event.lon) return event

    // Dispersión aumentada para evitar solapamiento (2.0 grados máximo)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    const angle = index * goldenAngle
    const radius = Math.sqrt(index / total) * 2.0 // Radio máximo de 2.0 grados

    const latOffset = radius * Math.cos(angle)
    const lonOffset = radius * Math.sin(angle)

    return {
        ...event,
        lat: event.lat + latOffset,
        lon: event.lon + lonOffset,
    }
}

/* ===================== TOP COUNTRIES ===================== */

/**
 * Obtiene los países con más eventos para los botones de preset
 */
export function getTopCountries(events: Event[], limit: number = 5): Array<{
    country: string
    count: number
    center: [number, number]
    zoom: number
}> {
    // Contar eventos por país
    const countsByCountry: Record<string, number> = {}
    
    events.forEach(event => {
        const country = event.country
        if (!country || country === "Unknown" || country === "Global") return
        countsByCountry[country] = (countsByCountry[country] || 0) + 1
    })

    // Ordenar por número de eventos
    const sorted = Object.entries(countsByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)

    // Mapear a formato con coordenadas y zoom
    return sorted.map(([country, count]) => {
        const bounds = COUNTRY_BOUNDS[country]
        
        if (bounds) {
            // País grande con bounds definidos
            return {
                country,
                count,
                center: [
                    (bounds.minLon + bounds.maxLon) / 2,
                    (bounds.minLat + bounds.maxLat) / 2,
                ] as [number, number],
                zoom: getZoomForCountry(country),
            }
        } else {
            // País pequeño - usar coordenadas del primer evento
            const firstEvent = events.find(e => e.country === country)
            return {
                country,
                count,
                center: firstEvent 
                    ? [firstEvent.lon || 0, firstEvent.lat || 0] as [number, number]
                    : [0, 0] as [number, number],
                zoom: 5,
            }
        }
    })
}

/**
 * Determina el nivel de zoom apropiado para un país
 */
function getZoomForCountry(country: string): number {
    const zoomLevels: Record<string, number> = {
        "Russia": 2.5,
        "Russian Federation": 2.5,
        "Canada": 3,
        "United States": 4,
        "China": 4,
        "Brazil": 4,
        "Australia": 4,
        "India": 4.5,
        "Argentina": 4,
        "Kazakhstan": 4.5,
        "Algeria": 5,
        "Saudi Arabia": 5,
        "Mexico": 5,
        "Indonesia": 4.5,
        "Libya": 5,
        "Iran": 5,
        "Mongolia": 4.5,
        "Peru": 5,
    }

    return zoomLevels[country] || 5
}

/* ===================== COUNTRY ACRONYMS ===================== */

export const COUNTRY_ACRONYMS: Record<string, string> = {
    "United States": "USA",
    "United Kingdom": "UK",
    "Russian Federation": "RUS",
    "South Korea": "ROK",
    "North Korea": "DPRK",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "KSA",
}

export function getCountryAcronym(country: string): string {
    return COUNTRY_ACRONYMS[country] || country
}