import { NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET() {
    const data = await sql`
    select * from market_snapshot
    order by id
  `
    return NextResponse.json(data)
}
