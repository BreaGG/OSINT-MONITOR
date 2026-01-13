import { useMemo, useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import { useMapLayer } from "./useMapLayer"

type SignalFromDB = {
  id: string
  platform: string
  region: string
  description: string
  timestamp: string
  verification: "verified" | "unverified"
  url?: string
  source?: string
}

type Signal = SignalFromDB & {
  lat: number
  lon: number
  type: "conflict" | "disaster" | "social"
}

type UseSignalsLayerProps = {
  map: mapboxgl.Map | null
  visible: boolean
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>
}

// Mapa de regiones a coordenadas (basado en countries.ts)
// Añadimos pequeña variación aleatoria para evitar superposiciones exactas
const REGION_COORDS: Record<string, [number, number]> = {
  // North America - USA por estados
  "United States": [-95.7129, 37.0902],
  "USA": [-95.7129, 37.0902],
  "U.S.": [-95.7129, 37.0902],
  
  // USA - Estados individuales
  "Alabama": [-86.9023, 32.3182],
  "Alaska": [-152.4044, 61.3707],
  "Arizona": [-111.0937, 33.4484],
  "Arkansas": [-92.3731, 34.9697],
  "California": [-119.4179, 36.7783],
  "Colorado": [-105.7821, 39.5501],
  "Connecticut": [-72.7554, 41.5978],
  "Delaware": [-75.5071, 39.3185],
  "Florida": [-81.5158, 27.6648],
  "Georgia": [-83.5007, 33.0406],
  "Hawaii": [-157.4983, 21.0943],
  "Idaho": [-114.4788, 44.2405],
  "Illinois": [-88.9937, 40.3495],
  "Indiana": [-86.2604, 39.8494],
  "Iowa": [-93.0977, 42.0115],
  "Kansas": [-96.7265, 38.5266],
  "Kentucky": [-84.6701, 37.6681],
  "Louisiana": [-91.8749, 31.1695],
  "Maine": [-69.3819, 44.6939],
  "Maryland": [-76.6413, 39.0639],
  "Massachusetts": [-71.5301, 42.2302],
  "Michigan": [-84.5555, 43.3266],
  "Minnesota": [-93.9196, 45.6945],
  "Mississippi": [-89.6785, 32.7416],
  "Missouri": [-92.3341, 38.4561],
  "Montana": [-110.4544, 46.9219],
  "Nebraska": [-98.2680, 41.1254],
  "Nevada": [-117.0554, 38.3135],
  "New Hampshire": [-71.5639, 43.4525],
  "New Jersey": [-74.5210, 40.2989],
  "New Mexico": [-106.2485, 34.8405],
  "New York": [-74.0060, 40.7128],
  "North Carolina": [-79.8064, 35.6301],
  "North Dakota": [-99.7840, 47.5289],
  "Ohio": [-82.7649, 40.3888],
  "Oklahoma": [-96.9289, 35.5653],
  "Oregon": [-122.0709, 44.5720],
  "Pennsylvania": [-77.1945, 40.5908],
  "Rhode Island": [-71.5118, 41.6809],
  "South Carolina": [-80.9066, 33.8569],
  "South Dakota": [-99.4388, 44.2998],
  "Tennessee": [-86.6923, 35.7478],
  "Texas": [-99.9018, 31.9686],
  "Utah": [-111.8910, 40.1500],
  "Vermont": [-72.7107, 44.0459],
  "Virginia": [-78.1690, 37.7693],
  "Washington": [-121.4906, 47.7511],
  "West Virginia": [-80.9545, 38.4912],
  "Wisconsin": [-89.6165, 44.2685],
  "Wyoming": [-107.3025, 42.7559],
  
  // USA - Ciudades principales (Top 45)
  "Washington DC": [-77.0369, 38.9072],
  "New York City": [-74.0060, 40.7128],
  "Los Angeles": [-118.2437, 34.0522],
  "Chicago": [-87.6298, 41.8781],
  "Houston": [-95.3698, 29.7604],
  "Phoenix": [-112.0740, 33.4484],
  "Philadelphia": [-75.1652, 39.9526],
  "San Antonio": [-98.4936, 29.4241],
  "San Diego": [-117.1611, 32.7157],
  "Dallas": [-96.7970, 32.7767],
  "San Jose": [-121.8863, 37.3382],
  "Austin": [-97.7431, 30.2672],
  "Jacksonville": [-81.6557, 30.3322],
  "Fort Worth": [-97.3308, 32.7555],
  "Columbus": [-82.9988, 39.9612],
  "Charlotte": [-80.8431, 35.2271],
  "San Francisco": [-122.4194, 37.7749],
  "Indianapolis": [-86.1581, 39.7684],
  "Seattle": [-122.3321, 47.6062],
  "Denver": [-104.9903, 39.7392],
  "Boston": [-71.0589, 42.3601],
  "Nashville": [-86.7816, 36.1627],
  "Detroit": [-83.0458, 42.3314],
  "Portland": [-122.6765, 45.5152],
  "Las Vegas": [-115.1398, 36.1699],
  "Memphis": [-90.0490, 35.1495],
  "Louisville": [-85.7585, 38.2527],
  "Baltimore": [-76.6122, 39.2904],
  "Milwaukee": [-87.9065, 43.0389],
  "Albuquerque": [-106.6504, 35.0844],
  "Tucson": [-110.9747, 32.2226],
  "Fresno": [-119.7871, 36.7378],
  "Mesa": [-111.8315, 33.4152],
  "Sacramento": [-121.4944, 38.5816],
  "Atlanta": [-84.3880, 33.7490],
  "Kansas City": [-94.5786, 39.0997],
  "Miami": [-80.1918, 25.7617],
  "Raleigh": [-78.6382, 35.7796],
  "Omaha": [-95.9345, 41.2565],
  "Cleveland": [-81.6944, 41.4993],
  "Minneapolis": [-93.2650, 44.9778],
  "Tampa": [-82.4572, 27.9506],
  "New Orleans": [-90.0715, 29.9511],
  "Honolulu": [-157.8583, 21.3099],
  "Anchorage": [-149.9003, 61.2181],
  
  // Europe
  "United Kingdom": [-3.436, 55.3781],
  "UK": [-3.436, 55.3781],
  "Britain": [-3.436, 55.3781],
  "England": [-1.1743, 52.3555],
  "Scotland": [-4.2026, 56.4907],
  "Wales": [-3.7837, 52.1307],
  "London": [-0.1276, 51.5074],
  "Manchester": [-2.2426, 53.4808],
  
  "France": [2.2137, 46.2276],
  "Paris": [2.3522, 48.8566],
  "Marseille": [5.3698, 43.2965],
  "Lyon": [4.8357, 45.7640],
  "Nice": [7.2619, 43.7102],
  
  "Germany": [10.4515, 51.1657],
  "Berlin": [13.4050, 52.5200],
  "Munich": [11.5820, 48.1351],
  "Hamburg": [9.9937, 53.5511],
  "Frankfurt": [8.6821, 50.1109],
  
  "Spain": [-3.7492, 40.4637],
  "Madrid": [-3.7038, 40.4168],
  "Barcelona": [2.1734, 41.3851],
  "Valencia": [-0.3763, 39.4699],
  "Seville": [-5.9845, 37.3891],
  
  "Italy": [12.5674, 41.8719],
  "Rome": [12.4964, 41.9028],
  "Milan": [9.1900, 45.4642],
  "Naples": [14.2681, 40.8518],
  "Sicily": [14.0153, 37.5999],
  
  "European Union": [4.3517, 50.8503],
  "EU": [4.3517, 50.8503],
  "Brussels": [4.3517, 50.8467],
  
  // Eastern Europe
  "Ukraine": [31.1656, 48.3794],
  "Kyiv": [30.5234, 50.4501],
  "Kiev": [30.5234, 50.4501],
  "Kharkiv": [36.2304, 49.9935],
  "Donetsk": [37.8028, 48.0159],
  "Luhansk": [39.3078, 48.5671],
  "Dnipro": [35.0462, 48.4647],
  "Mariupol": [37.5495, 47.0970],
  "Zaporizhzhia": [35.1396, 47.8388],
  "Odesa": [30.7233, 46.4825],
  "Lviv": [24.0232, 49.8397],
  
  "Russia": [105.3188, 61.524],
  "Moscow": [37.6173, 55.7558],
  "Saint Petersburg": [30.3351, 59.9311],
  
  // Rusia - Ciudades principales (25 ciudades)
  "Novosibirsk": [82.9346, 55.0084],
  "Yekaterinburg": [60.6122, 56.8389],
  "Kazan": [49.1221, 55.7887],
  "Nizhny Novgorod": [44.0020, 56.2965],
  "Chelyabinsk": [61.4291, 55.1644],
  "Samara": [50.1155, 53.1952],
  "Omsk": [73.3686, 54.9885],
  "Rostov-on-Don": [39.7233, 47.2357],
  "Ufa": [55.9578, 54.7388],
  "Krasnoyarsk": [92.8672, 56.0153],
  "Voronezh": [39.1843, 51.6720],
  "Perm": [56.2502, 58.0105],
  "Volgograd": [44.5018, 48.7080],
  "Krasnodar": [38.9769, 45.0355],
  "Saratov": [46.0086, 51.5924],
  "Tyumen": [65.5343, 57.1522],
  "Tolyatti": [49.4208, 53.5303],
  "Izhevsk": [53.2038, 56.8519],
  "Barnaul": [83.7636, 53.3559],
  "Vladivostok": [131.8735, 43.1056],
  "Irkutsk": [104.2964, 52.2869],
  "Khabarovsk": [135.0721, 48.4827],
  "Yaroslavl": [39.8844, 57.6261],
  "Makhachkala": [47.5022, 42.9849],
  "Tomsk": [84.9747, 56.4977],
  "Orenburg": [55.0978, 51.7727],
  
  // Rusia - Regiones fronterizas
  "Chechnya": [45.6986, 43.3978],
  "Belgorod": [36.5877, 50.5979],
  "Kursk": [36.1873, 51.7373],
  "Rostov": [39.7233, 47.2357],
  "Bryansk": [34.3636, 53.2521],
  "Smolensk": [32.0401, 54.7818],
  "Crimea": [34.1019, 45.3570],
  "Kaliningrad": [20.5083, 54.7104],
  "Murmansk": [33.0750, 68.9585],
  "Arkhangelsk": [40.5433, 64.5401],
  
  // Middle East
  "Syria": [38.9968, 34.8021],
  "Damascus": [36.2765, 33.5138],
  "Aleppo": [37.1343, 36.2021],
  "Homs": [36.7167, 34.7333],
  "Idlib": [36.6333, 35.9333],
  "Latakia": [35.7833, 35.5167],
  "Raqqa": [39.0080, 35.9500],
  "Deir ez-Zor": [40.1417, 35.3363],
  
  "Israel": [34.8516, 31.0461],
  "Jerusalem": [35.2137, 31.7683],
  "Tel Aviv": [34.7818, 32.0853],
  "Haifa": [34.9896, 32.7940],
  
  "Palestine": [35.2332, 31.9522],
  "Gaza": [34.4668, 31.5],
  "West Bank": [35.2033, 31.9466],
  "Ramallah": [35.2063, 31.9038],
  "Rafah": [34.2467, 31.2944],
  "Khan Younis": [34.3030, 31.3460],
  
  "Iran": [53.688, 32.4279],
  "Tehran": [51.3890, 35.6892],
  "Isfahan": [51.6746, 32.6546],
  
  "Turkey": [35.2433, 38.9637],
  "Ankara": [32.8597, 39.9334],
  "Istanbul": [28.9784, 41.0082],
  
  "Saudi Arabia": [45.0792, 23.8859],
  "Riyadh": [46.6753, 24.7136],
  "Jeddah": [39.1925, 21.5433],
  
  // Asia - China
  "China": [104.1954, 35.8617],
  "Beijing": [116.4074, 39.9042],
  "Shanghai": [121.4737, 31.2304],
  
  // China - Top 40 ciudades
  "Guangzhou": [113.2644, 23.1291],
  "Shenzhen": [114.0579, 22.5431],
  "Chengdu": [104.0668, 30.5728],
  "Tianjin": [117.3616, 39.3434],
  "Chongqing": [106.5516, 29.5630],
  "Wuhan": [114.3055, 30.5928],
  "Dongguan": [113.7518, 23.0209],
  "Hangzhou": [120.1551, 30.2741],
  "Foshan": [113.1220, 23.0218],
  "Nanjing": [118.7969, 32.0603],
  "Shenyang": [123.4328, 41.8057],
  "Xi'an": [108.9398, 34.3416],
  "Harbin": [126.5349, 45.8038],
  "Qingdao": [120.3826, 36.0671],
  "Changchun": [125.3245, 43.8171],
  "Dalian": [121.6147, 38.9140],
  "Jinan": [117.1205, 36.6519],
  "Kunming": [102.8329, 24.8801],
  "Changsha": [112.9388, 28.2282],
  "Taiyuan": [112.5489, 37.8706],
  "Zhengzhou": [113.6254, 34.7466],
  "Shijiazhuang": [114.5149, 38.0428],
  "Urumqi": [87.6168, 43.8256],
  "Lanzhou": [103.8343, 36.0611],
  "Hefei": [117.2272, 31.8206],
  "Fuzhou": [119.2965, 26.0745],
  "Nanning": [108.3661, 22.8172],
  "Guiyang": [106.7135, 26.5783],
  "Hohhot": [111.6708, 40.8151],
  "Nanchang": [115.8581, 28.6832],
  "Ningbo": [121.5440, 29.8683],
  "Xiamen": [118.0894, 24.4798],
  "Suzhou": [120.5954, 31.2989],
  "Wenzhou": [120.6994, 27.9938],
  "Wuxi": [120.3114, 31.5689],
  "Changzhou": [119.9738, 31.8122],
  "Yantai": [121.4478, 37.4638],
  "Qiqihar": [123.9180, 47.3400],
  "Baotou": [109.8409, 40.6522],
  "Zibo": [118.0633, 36.8141],
  
  // China - Regiones autónomas y provincias
  "Xinjiang": [87.6278, 43.7928],
  "Tibet": [91.1175, 29.6470],
  "Inner Mongolia": [111.6708, 40.8151],
  "Hong Kong": [114.1694, 22.3193],
  "Macau": [113.5439, 22.1987],
  "Guangdong": [113.2644, 23.1291],
  "Sichuan": [104.0668, 30.5728],
  "Yunnan": [102.8329, 24.8801],
  "Gansu": [103.8343, 36.0611],
  
  "Taiwan": [120.9605, 23.6978],
  "Taipei": [121.5654, 25.0330],
  
  "Japan": [138.2529, 36.2048],
  "Tokyo": [139.6503, 35.6762],
  "Osaka": [135.5022, 34.6937],
  
  "South Korea": [127.7669, 35.9078],
  "Seoul": [126.9780, 37.5665],
  
  "North Korea": [127.5101, 40.3399],
  "Pyongyang": [125.7625, 39.0392],
  
  // Latin America
  "Venezuela": [-66.9, 10.48],
  "Caracas": [-66.9036, 10.4806],
  
  // Additional regions
  "Lebanon": [35.8623, 33.8547],
  "Beirut": [35.4953, 33.8886],
  "Iraq": [44.3661, 33.3152],
  "Baghdad": [44.3661, 33.3152],
  "Mosul": [43.1189, 36.3400],
  "Yemen": [44.2075, 15.5527],
  "Sanaa": [44.2075, 15.3694],
  "Afghanistan": [69.2075, 34.5553],
  "Kabul": [69.2075, 34.5553],
  "Pakistan": [69.3451, 30.3753],
  "Islamabad": [73.0479, 33.6844],
  "India": [77.1025, 28.7041],
  "New Delhi": [77.1025, 28.7041],
  "Egypt": [31.2357, 30.0444],
  "Cairo": [31.2357, 30.0444],
  "Libya": [13.1913, 32.8872],
  "Tripoli": [13.1913, 32.8872],
  "Sudan": [32.5599, 15.5007],
  "Khartoum": [32.5599, 15.5007],
  "Ethiopia": [38.7469, 9.0320],
  "Addis Ababa": [38.7469, 9.0320],
  "Somalia": [45.3182, 2.0469],
  "Mogadishu": [45.3182, 2.0469],
  "South Africa": [28.0473, -26.2041],
  "Pretoria": [28.1881, -25.7479],
  "Mexico": [-99.1332, 19.4326],
  "Mexico City": [-99.1332, 19.4326],
  "Colombia": [-74.0721, 4.7110],
  "Bogota": [-74.0721, 4.7110],
  "Brazil": [-47.8825, -15.7942],
  "Brasilia": [-47.8825, -15.7942],
  "Argentina": [-58.3816, -34.6037],
  "Buenos Aires": [-58.3816, -34.6037],
}

// Añadir variación aleatoria GRANDE para evitar superposiciones entre signals
// Sistema de dispersión en círculo para múltiples signals en la misma región
const signalPositions = new Map<string, number>() // Track signals por región

function addJitter(coords: [number, number], signalId: string, region: string): [number, number] {
  // Obtener cuántas signals ya hay en esta región
  const key = `${coords[0]}_${coords[1]}`
  const existingCount = signalPositions.get(key) || 0
  signalPositions.set(key, existingCount + 1)
  
  // Dispersión en círculo para múltiples signals
  const baseJitter = 0.8 // ~88km de radio base
  const angle = (existingCount * 137.5) * (Math.PI / 180) // Golden angle para distribución uniforme
  const distance = baseJitter * Math.sqrt(existingCount + 1) // Espiral hacia afuera
  
  return [
    coords[0] + distance * Math.cos(angle),
    coords[1] + distance * Math.sin(angle),
  ]
}

// Clasificar tipo de señal según palabras clave
function classifySignalType(description: string): "conflict" | "disaster" | "social" {
  const desc = description.toLowerCase()
  
  // Palabras clave de conflicto
  const conflictKeywords = [
    "military", "troops", "fighters", "attack", "strike", "bombing", 
    "rocket", "missile", "casualties", "killed", "wounded", "combat",
    "offensive", "defense", "army", "soldiers", "war", "battle"
  ]
  
  // Palabras clave de desastre
  const disasterKeywords = [
    "earthquake", "flood", "hurricane", "tornado", "fire", "explosion",
    "disaster", "emergency", "evacuation", "rescue", "victims", "collapsed"
  ]
  
  // Comprobar conflicto
  if (conflictKeywords.some(keyword => desc.includes(keyword))) {
    return "conflict"
  }
  
  // Comprobar desastre
  if (disasterKeywords.some(keyword => desc.includes(keyword))) {
    return "disaster"
  }
  
  // Por defecto: social
  return "social"
}

export function useSignalsLayer({
  map,
  visible,
  popupRef,
}: UseSignalsLayerProps) {
  
  const [signals, setSignals] = useState<Signal[]>([])

  /* ===================== FETCH SIGNALS ===================== */
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('/api/social')
        
        // Manejar error 401
        if (response.status === 401) {
          console.warn('⚠️ Signals API requires authentication')
          return
        }
        
        if (!response.ok) {
          console.error('❌ Signals API error:', response.status, response.statusText)
          return
        }
        
        const data: SignalFromDB[] = await response.json()
        
        console.log('📡 Fetched signals:', data.length)
        
        // Mapear y añadir coordenadas + tipo
        const processedSignals: Signal[] = data
          .map(signal => {
            // Buscar coordenadas (case insensitive y parcial)
            const regionKey = Object.keys(REGION_COORDS).find(key => 
              key.toLowerCase() === signal.region.toLowerCase() ||
              signal.region.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(signal.region.toLowerCase())
            )
            
            const coords = regionKey ? REGION_COORDS[regionKey] : null
            
            if (!coords) {
              console.warn('⚠️ No coords for region:', signal.region)
              return null
            }
            
            // Añadir jitter inteligente para evitar superposiciones entre signals
            const [lon, lat] = addJitter(coords, signal.id, signal.region)
            
            const type = classifySignalType(signal.description)
            
            console.log('✅ Signal processed:', {
              region: signal.region,
              coords: [lon, lat],
              type,
              source: signal.source
            })
            
            return {
              ...signal,
              lon,
              lat,
              type,
            }
          })
          .filter((s): s is Signal => s !== null)
        
        // Limpiar el mapa de posiciones para la próxima actualización
        signalPositions.clear()
        
        console.log('📍 Total signals with coords:', processedSignals.length)
        setSignals(processedSignals)
      } catch (error) {
        console.error('❌ Error fetching signals:', error)
      }
    }

    fetchSignals()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchSignals, 30000)
    return () => clearInterval(interval)
  }, [])

  /* ===================== GEOJSON ===================== */
  const signalsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: signals.map((s) => ({
        type: "Feature" as const,
        properties: {
          ...s,
          color: getSignalColor(s.type),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [s.lon, s.lat],
        },
      })),
    }),
    [signals]
  )

  /* ===================== TRIANGLE SVG ===================== */
  useEffect(() => {
    if (!map) return

    // Crear triángulo SVG para cada tipo (MÁS PEQUEÑOS y SIN BORDE)
    const createTriangle = (color: string, id: string) => {
      const size = 16 // Reducido de 24 a 16
      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <polygon 
            points="${size/2},2 ${size-2},${size-2} 2,${size-2}"
            fill="${color}"
            stroke="none"
          />
        </svg>
      `
      
      const img = new Image(size, size)
      img.onload = () => {
        if (!map.hasImage(id)) {
          map.addImage(id, img)
        }
      }
      img.src = "data:image/svg+xml;base64," + btoa(svg)
    }

    // Crear triángulos para cada tipo
    createTriangle("#ef4444", "signal-conflict")    // Rojo
    createTriangle("#f97316", "signal-disaster")    // Naranja
    createTriangle("#3b82f6", "signal-social")      // Azul
  }, [map])

  /* ===================== EVENTS ===================== */
  const eventHandlers = useMemo(
    () => ({
      "signals-layer": {
        onMouseEnter: (e: mapboxgl.MapLayerMouseEvent) => {
          if (!map) return
          map.getCanvas().style.cursor = "pointer"

          const s = e.features?.[0]?.properties
          if (!s || !popupRef.current) return

          const signalColor = s.color || "#9ca3af"
          
          // Truncar descripción si es muy larga
          const truncatedDescription = s.description.length > 200 
            ? s.description.substring(0, 197) + "..." 
            : s.description

          const content = `
            <div style="
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
              min-width: 280px;
              max-width: 340px;
              background: #000;
              border: 1px solid #334155;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                background: ${signalColor};
                padding: 10px 12px;
              ">
                <div style="
                  font-size: 11px;
                  font-weight: 600;
                  color: rgba(255,255,255,0.9);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">Civil Signal</div>
                <div style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #ffffff;
                  letter-spacing: -0.3px;
                  line-height: 1.3;
                ">${s.region}</div>
              </div>
              
              <div style="padding: 12px;">
                <div style="
                  display: inline-block;
                  background: ${s.verification === 'verified' ? '#065f46' : '#713f12'};
                  color: ${s.verification === 'verified' ? '#10b981' : '#fbbf24'};
                  padding: 4px 8px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  margin-bottom: 10px;
                  margin-right: 6px;
                ">${s.verification}</div>
                
                <div style="
                  display: inline-block;
                  background: rgba(${parseInt(signalColor.slice(1,3), 16)}, ${parseInt(signalColor.slice(3,5), 16)}, ${parseInt(signalColor.slice(5,7), 16)}, 0.2);
                  color: ${signalColor};
                  padding: 4px 8px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  margin-bottom: 10px;
                ">${s.type}</div>
                
                <div style="
                  font-size: 12px;
                  color: #cbd5e1;
                  line-height: 1.5;
                  margin-bottom: 10px;
                ">${truncatedDescription}</div>
                
                <div style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                  padding-top: 10px;
                  border-top: 1px solid #1e293b;
                ">
                  <div>
                    <div style="
                      font-size: 9px;
                      color: #64748b;
                      text-transform: uppercase;
                      letter-spacing: 0.3px;
                      margin-bottom: 2px;
                    ">Source</div>
                    <div style="
                      font-size: 11px;
                      font-weight: 600;
                      color: #94a3b8;
                    ">${s.platform}</div>
                  </div>
                  
                  <div>
                    <div style="
                      font-size: 9px;
                      color: #64748b;
                      text-transform: uppercase;
                      letter-spacing: 0.3px;
                      margin-bottom: 2px;
                    ">Time</div>
                    <div style="
                      font-size: 11px;
                      font-weight: 600;
                      color: #94a3b8;
                    ">${new Date(s.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
                
                ${s.url ? `
                  <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="
                    display: block;
                    margin-top: 12px;
                    padding: 8px 12px;
                    background: #1e293b;
                    color: ${signalColor};
                    text-align: center;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 600;
                    text-decoration: none;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: background 0.2s;
                    border: none;
                    outline: none;
                    box-shadow: none;
                  " onmouseover="this.style.background='#334155';this.style.outline='none'" onmouseout="this.style.background='#1e293b'">
                    View Source →
                  </a>
                ` : ''}
              </div>
            </div>
          `

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map)
            
          // Evitar que el popup se cierre cuando el mouse está sobre él
          const popupElement = popupRef.current.getElement()
          if (popupElement) {
            popupElement.addEventListener('mouseenter', () => {
              map.getCanvas().style.cursor = "pointer"
            })
            popupElement.addEventListener('mouseleave', () => {
              popupRef.current?.remove()
            })
          }
        },
        onMouseLeave: () => {
          if (!map) return
          
          setTimeout(() => {
            const popupElement = popupRef.current?.getElement()
            if (popupElement && !popupElement.matches(':hover')) {
              map.getCanvas().style.cursor = ""
              popupRef.current?.remove()
            }
          }, 100)
        },
      },
    }),
    [map, popupRef]
  )

  /* ===================== MAP LAYER ===================== */
  return useMapLayer({
    map,
    sourceId: "signals",
    sourceConfig: {
      type: "geojson",
      data: signalsGeoJSON,
    },
    layers: [
      {
        id: "signals-layer",
        type: "symbol",
        source: "signals",
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "type"], "conflict"], "signal-conflict",
            ["==", ["get", "type"], "disaster"], "signal-disaster",
            ["==", ["get", "type"], "social"], "signal-social",
            "signal-conflict" // fallback
          ],
          "icon-size": 1,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-opacity": 1,
        },
      },
    ],
    eventHandlers,
    visible,
  })
}

/* ===================== HELPER FUNCTIONS ===================== */
function getSignalColor(type: string): string {
  const colors = {
    conflict: "#ef4444",   // Rojo
    disaster: "#f97316",   // Naranja
    social: "#3b82f6",     // Azul
  }
  return colors[type as keyof typeof colors] || "#3b82f6"
}