export type SocialPlatform = "telegram" | "youtube";

export type VerificationLevel = "verified" | "unverified" | "unknown";

export type SocialSignal = {
  id: string;
  platform: SocialPlatform;
  region: string;
  description: string;
  timestamp: string;
  verification: VerificationLevel;
  url: string;
  sourceLabel: string;
};
