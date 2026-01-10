export type Event = {
  id: string
  title: string
  summary: string
  category: "conflict" | "disaster" | "health" | "politics" | "sports" | "economy" 
  country: string
  lat: number | null
  lon: number | null
  date: string
  timestamp?: number  // ✅ OPCIONAL
  source: string
  url: string
  image: any
  content: string[]
}
