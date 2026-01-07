import { NextResponse } from "next/server"
import { eventStore } from "@/lib/eventStore"

export async function GET() {
  return NextResponse.json(eventStore)
}
