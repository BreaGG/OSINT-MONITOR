import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await sql`select 1 as connected`;
  return NextResponse.json(result);
}
