import sql from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const events = await sql`
    select *
    from events
    order by date desc
    limit 100
  `
  return NextResponse.json(events)
}
