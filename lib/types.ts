export type Event = {
  id: string
  title: string
  summary: string
  category: "conflict" | "disaster" | "health" | "politics"
  country: string
  lat: number
  lon: number
  date: string
  timestamp?: number  // ✅ OPCIONAL
  source: string
  url: string
  image: any
  content: string[]
}
