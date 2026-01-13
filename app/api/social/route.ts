import { NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET() {
  const rows = await sql`
    select *
    from social_signals
    order by timestamp desc
    limit 300
  `

  return NextResponse.json(rows)
}