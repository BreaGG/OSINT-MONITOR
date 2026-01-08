export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    // youtube.com/watch?v=XXXX
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v")
      if (!videoId) return null

      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`
    }

    // youtu.be/XXXX
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.slice(1)
      if (!videoId) return null

      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`
    }

    return null
  } catch {
    return null
  }
}
