export type VisualSource = {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  type: "city" | "border" | "conflict"
  embedUrl: string
  source: string
  description: string
}

export const visualSources: VisualSource[] = [
  {
    id: "philippines-davao",
    name: "Davao – City Live Camera",
    country: "Philippines",
    lat: 7.1907,
    lon: 125.4553,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/uvNosrM4muQ?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "24/7 live camera feed from Davao City providing real-time urban activity context.",
  },

  {
    id: "ireland-dublin",
    name: "Dublin – City Center Live Camera",
    country: "Ireland",
    lat: 53.3498,
    lon: -6.2603,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/u4UZ4UvZXrg?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "Live view from central Dublin, useful as a signal of civilian and traffic activity.",
  },
  {
    id: "iran-tehran",
    name: "Tehran – City Live Camera",
    country: "Iran",
    lat: 35.6892,
    lon: 51.389,
    type: "city",
    embedUrl:
      "https://www.youtube.com/embed/-zGuR1qVKrU?autoplay=1&mute=1&controls=1&rel=0&playsinline=1",
    source: "YouTube Live",
    description:
      "Live camera feed from Tehran providing real-time visual context of the city.",
  },
]
