import Parser from "rss-parser"
import { NextResponse } from "next/server"
import { rssSources } from "@/lib/rssSources"
import { detectCountry } from "@/lib/detectCountry"
import { detectCategory } from "@/lib/detectCategory"
import { extractImage } from "@/lib/extractImage"
import { extractArticle } from "@/lib/extractArticle"
import sql from "@/lib/db"
import { Event } from "@/lib/types"
import { headers } from "next/headers"
import { fetchMarketData } from "@/lib/fetchMarket"



const parser = new Parser()

export async function GET(request: Request) {
  const headersList = await headers()
  const authHeader = headersList.get("authorization")

  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (
    authHeader !== `Bearer ${process.env.INGEST_SECRET}` &&
    token !== process.env.INGEST_SECRET
  ) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  let inserted = 0

  for (const source of rssSources) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 50)) {
        const id = `${source.name}-${item.guid || item.link}`

        // 🔍 Evitar duplicados (DB, no memoria)
        const existing = await sql`
          select id from events where id = ${id}
        `
        if (existing.length > 0) continue

        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`
        const detected = detectCountry(text)
        const category = detectCategory(text)

        let image =
          (item.enclosure && item.enclosure.url) ||
          (item as any)["media:content"]?.url ||
          undefined

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

        await sql`
          insert into events (
            id, title, summary, category, country,
            lat, lon, date, source, url, image, content
          ) values (
            ${event.id},
            ${event.title},
            ${event.summary},
            ${event.category},
            ${event.country},
            ${event.lat ?? null},
            ${event.lon ?? null},
            ${event.date},
            ${event.source},
            ${event.url},
            ${event.image ?? null},
            ${event.content ? JSON.stringify(event.content) : null}
          )
        `

        inserted++
      }
    } catch (error) {
      console.error(`Error ingesting ${source.name}`, error)
    }
  }

  return NextResponse.json({
    status: "ok",
    inserted,
  })
}
