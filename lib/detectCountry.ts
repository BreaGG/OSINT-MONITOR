import { countries } from "./countries"

export function detectCountry(text: string) {
  const lower = text.toLowerCase()

  for (const country of countries) {
    for (const alias of country.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return country
      }
    }
  }

  return null
}
