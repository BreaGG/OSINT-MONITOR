import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")

    if (!url) {
        return new NextResponse("Missing url", { status: 400 })
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; OSINT-Monitor/1.0)",
            },
            cache: "no-store",
        })

        if (!res.ok) {
            return new NextResponse("Camera fetch failed", {
                status: 502,
            })
        }

        const contentType =
            res.headers.get("content-type") ?? "image/jpeg"

        const buffer = await res.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store",
            },
        })
    } catch {
        return new NextResponse("Camera error", {
            status: 500,
        })
    }
}
