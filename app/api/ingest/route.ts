import Parser from "rss-parser"
import { NextResponse } from "next/server"
import { rssSources } from "@/lib/rssSources"
import { resolveCountry } from "@/lib/detectCountry"
import { detectCategory, shouldFilterOut, getRelevanceScore } from "@/lib/detectCategory"
import { extractImage } from "@/lib/extractImage"
import { extractArticle } from "@/lib/extractArticle"
import sql from "@/lib/db"
import { Event } from "@/lib/types"
import { headers } from "next/headers"

const parser = new Parser()

/* ===================== FILTER STATS ===================== */
interface IngestStats {
  processed: number
  filtered: number
  inserted: number
  filterRate: string
  byCategory: Record<string, number>
  bySeverity: {
    critical: number    // score 8-10
    high: number        // score 6-7
    medium: number      // score 4-5
    low: number         // score 1-3
  }
}

/* ===================== CORE INGEST LOGIC ===================== */

async function runIngest() {
  const stats: IngestStats = {
    processed: 0,
    filtered: 0,
    inserted: 0,
    filterRate: '0%',
    byCategory: {},
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
  }

  for (const source of rssSources) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 50)) {
        stats.processed++
        
        const id = `${source.name}-${item.guid || item.link}`

        // 🔍 Evitar duplicados (DB, no memoria)
        const existing = await sql`
          select id from events where id = ${id}
        `
        if (existing.length > 0) continue

        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`
        
        // ❌ FILTRADO 1: Excluir contenido irrelevante (deportes, entretenimiento)
        if (shouldFilterOut(text)) {
          stats.filtered++
          continue
        }

        const detected = resolveCountry(text)
        const category = detectCategory(text)
        
        // 📊 Calcular puntuación de relevancia
        const relevanceScore = getRelevanceScore(text, category)
        
        // ❌ FILTRADO 2: Excluir eventos con relevancia 0
        if (relevanceScore === 0) {
          stats.filtered++
          continue
        }

        // 📊 Actualizar estadísticas por categoría
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
        
        // 📊 Actualizar estadísticas por severidad
        if (relevanceScore >= 8) {
          stats.bySeverity.critical++
        } else if (relevanceScore >= 6) {
          stats.bySeverity.high++
        } else if (relevanceScore >= 4) {
          stats.bySeverity.medium++
        } else {
          stats.bySeverity.low++
        }

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
          lat: detected?.lat ?? null,
          lon: detected?.lon ?? null,
          date: item.pubDate || new Date().toISOString(),
          source: source.name,
          url: item.link || "",
          image,
          content,
          relevanceScore,
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

        stats.inserted++
      }
    } catch (error) {
      console.error(`Error ingesting ${source.name}`, error)
    }
  }

  // Calcular tasa de filtrado
  if (stats.processed > 0) {
    stats.filterRate = ((stats.filtered / stats.processed) * 100).toFixed(1) + '%'
  }

  // Log estadísticas detalladas
  console.log('═══════════════════════════════════════════')
  console.log('📊 OSINT INGEST STATISTICS')
  console.log('═══════════════════════════════════════════')
  console.log(`📥 Processed:  ${stats.processed}`)
  console.log(`❌ Filtered:   ${stats.filtered} (${stats.filterRate})`)
  console.log(`✅ Inserted:   ${stats.inserted}`)
  console.log('───────────────────────────────────────────')
  console.log('📑 BY CATEGORY:')
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(12)} → ${count}`)
    })
  console.log('───────────────────────────────────────────')
  console.log('🎯 BY SEVERITY:')
  console.log(`   🔴 CRITICAL  (8-10) → ${stats.bySeverity.critical}`)
  console.log(`   🟠 HIGH      (6-7)  → ${stats.bySeverity.high}`)
  console.log(`   🟡 MEDIUM    (4-5)  → ${stats.bySeverity.medium}`)
  console.log(`   ⚪ LOW       (1-3)  → ${stats.bySeverity.low}`)
  console.log('═══════════════════════════════════════════')

  return stats
}

/* ===================== GET (EXISTING, ENHANCED) ===================== */
/* Uso: cron / scripts / server-to-server */

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

  const stats = await runIngest()

  return NextResponse.json({
    status: "ok",
    ...stats
  })
}

/* ===================== POST (NEW, ADMIN UI) ===================== */
/* Uso: botón manual con password */

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.INGEST_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const stats = await runIngest()

  return NextResponse.json({
    status: "ok",
    ...stats
  })
}