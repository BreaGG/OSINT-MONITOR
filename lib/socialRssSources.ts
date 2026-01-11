export type SocialSource = {
  name: string
  platform: "telegram" | "youtube"
  url: string
  verification: "verified" | "unverified"
}

export const socialRssSources: SocialSource[] = [
  {
    name: "LiveUAMap Telegram",
    platform: "telegram",
    url: "https://t.me/s/Liveuamap",
    verification: "verified",
  },
  {
    name: "OSINTdefender Telegram",
    platform: "telegram",
    url: "https://t.me/s/OSINTdefender",
    verification: "verified",
  },
  {
    name: "War Monitor Telegram",
    platform: "telegram",
    url: "https://t.me/s/war_monitor",
    verification: "unverified",
  },
]
