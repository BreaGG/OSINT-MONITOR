export type Event = {
  id: string
  title: string
  summary: string
  category: 
    | "conflict" 
    | "disaster" 
    | "health" 
    | "economy" 
    | "politics" 
    | "cyber" 
    | "terrorism" 
    | "nuclear" 
    | "climate"
  country: string
  lat: number | null
  lon: number | null
  date: string
  timestamp?: number 
  source: string
  url: string
  image: any
  content: string[]
  relevanceScore?: number 
}