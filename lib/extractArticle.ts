import * as cheerio from "cheerio"

export async function extractArticle(
  url: string
): Promise<string[]> {
  try {
    const res = await fetch(url)
    const html = await res.text()
    const $ = cheerio.load(html)

    // Seleccionamos párrafos "reales"
    const paragraphs: string[] = []

    $("p").each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 80) {
        paragraphs.push(text)
      }
    })

    // Nos quedamos con los 3 primeros buenos
    return paragraphs.slice(0, 3)
  } catch {
    return []
  }
}
