export type SocialPlatform = "telegram" | "youtube" | "twitter" | "tiktok"

export type VerificationLevel = "verified" | "unverified" | "unknown"

export type SocialSource = {
  id: string
  platform: SocialPlatform
  region: string
  description: string
  embedUrl: string
  timestamp: string
  verification: VerificationLevel
  sourceLabel?: string
}

export const socialSources: SocialSource[] = [
  {
    id: "kyiv-telegram-1",
    platform: "telegram",
    region: "Kyiv · Ukraine",
    description:
      "Local footage reportedly showing explosions heard in central Kyiv.",
    embedUrl: "https://www.youtube.com/embed/e2gC37ILQmk",
    timestamp: "2026-01-10T22:30:00Z",
    verification: "unverified",
    sourceLabel: "Telegram local channel",
  },
]
