import Parser from "rss-parser"
import { NextResponse } from "next/server"
import { rssSources } from "@/lib/rssSources"
import { Event } from "@/lib/types"
import { eventStore } from "@/lib/eventStore"
import { detectCountry } from "@/lib/detectCountry"
import { extractImage } from "@/lib/extractImage"
import { extractArticle } from "@/lib/extractArticle"
import { detectCategory } from "@/lib/detectCategory"

const parser = new Parser()

export async function GET() {
  for (const source of rssSources) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 20)) {
        const id = `${source.name}-${item.guid || item.link}`

        // Evitar duplicados
        if (eventStore.some(e => e.id === id)) continue

        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`
        const category = detectCategory(text)
        const detected = detectCountry(text)

        // 1️⃣ Intentar imagen desde RSS
        let image: string | undefined =
          (item.enclosure && item.enclosure.url) ||
          (item as any)["media:content"]?.url ||
          (item as any)["media:thumbnail"]?.url

        if (!image && item.link) {
          image = await extractImage(item.link)
        }

        const content = item.link
        ? await extractArticle(item.link)
        : []

        const event: Event = {
          id,
          title: item.title || "Sin título",
          summary: item.contentSnippet || "",
          category,
          country: detected?.name || "Global",
          lat: detected?.lat ?? 20,
          lon: detected?.lon ?? 0,
          date: item.pubDate || new Date().toISOString(),
          source: source.name,
          url: item.link || "",
          image,
          content,
        }

        eventStore.push(event)
      }
    } catch (error) {
      console.error(`Error ingesting ${source.name}`, error)
    }
  }

  return NextResponse.json({
    status: "ok",
    count: eventStore.length,
  })
}
