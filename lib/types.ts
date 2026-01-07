export type Event = {
  id: string
  title: string
  summary: string
  category: "conflict" | "disaster" | "politics" | "health"
  country: string
  lat?: number
  lon?: number
  date: string
  source: string
  url: string
  image?: string
  content?: string[]
}