import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import sql from "@/lib/db"
import { socialRssSources } from "@/lib/socialRssSources"
import { resolveCountry } from "@/lib/detectCountry"

/* ===================== CORE INGEST ===================== */

async function runSocialIngest() {
  let inserted = 0

  for (const source of socialRssSources) {
    try {
      const res = await fetch(source.url)
      const html = await res.text()

      // Telegram message bodies
      const matches = [
        ...html.matchAll(
          /<div class="tgme_widget_message_text[^>]*>(.*?)<\/div>/g
        ),
      ]

      for (const m of matches.slice(0, 15)) {
        const raw = m[1].replace(/<[^>]+>/g, "").trim()
        if (!raw) continue

        const id = crypto
          .createHash("sha1")
          .update(source.name + raw)
          .digest("hex")

        // Deduplicación real (DB)
        const existing = await sql`
          select id from social_signals where id = ${id}
        `
        if (existing.length > 0) continue

        const resolved = resolveCountry(raw)

        await sql`
          insert into social_signals (
            id,
            platform,
            region,
            description,
            timestamp,
            verification,
            url,
            source
          ) values (
            ${id},
            ${source.platform},
            ${resolved.name},
            ${raw.slice(0, 280)},
            ${new Date().toISOString()},
            ${source.verification},
            ${source.url},
            ${source.name}
          )
        `

        inserted++
      }
    } catch (err) {
      console.error("Social ingest error:", source.name, err)
    }
  }

  return inserted
}

/* ===================== GET (CRON / SERVER) ===================== */

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

  const inserted = await runSocialIngest()

  return NextResponse.json({
    status: "ok",
    inserted,
  })
}

/* ===================== POST (ADMIN UI) ===================== */

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.INGEST_PASSWORD) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const inserted = await runSocialIngest()

  return NextResponse.json({
    status: "ok",
    inserted,
  })
}
