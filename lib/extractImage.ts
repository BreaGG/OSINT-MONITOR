import * as cheerio from "cheerio";

export async function extractImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");

    return ogImage;
  } catch (error) {
    console.error("Error extracting image:", error);
    return undefined;
  }
}
