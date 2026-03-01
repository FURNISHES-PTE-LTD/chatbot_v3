/**
 * Vocabulary expansion for slang, abbreviations, and non-standard terms.
 * Ported from V1 vocabulary_expansion.py.
 */
export const VOCABULARY_MAP: Record<string, string> = {
  // Abbreviations
  mcm: "mid-century modern",
  "mcm furniture": "mid-century modern",
  scandi: "scandinavian",

  // Trend terms
  japandi: "japanese minimalist",
  hygge: "scandinavian cozy",
  "coastal grandmother": "coastal traditional",
  cluttercore: "maximalist eclectic",
  "dark academia": "traditional scholarly",
  cottagecore: "rustic cozy",

  // Regional variants
  settee: "sofa",
  chesterfield: "sofa",
  divan: "sofa",
  wardrobe: "closet",
  press: "cabinet",

  // Style variants
  contemp: "contemporary",
  trad: "traditional",
  minimal: "minimalist",
  maximal: "maximalist",
  boho: "bohemian",
  "boho-chic": "bohemian",

  // Color variants
  "navy blue": "navy",
  "sage green": "sage",
  "charcoal gray": "charcoal",
  "cream white": "cream",
}

/**
 * Expand slang/abbreviation to standard term.
 */
export function expandVocabulary(term: string): string {
  const termLower = (term ?? "").toLowerCase().trim()
  return VOCABULARY_MAP[termLower] ?? term
}

/**
 * Return normalized form for matching/deduplication (lowercase, trimmed).
 * Use with value_raw for display; value_normalized for matching.
 */
export function normalizeForMatching(term: string): string {
  if (!term || typeof term !== "string") return ""
  return expandVocabulary(term).toLowerCase().trim()
}

/**
 * Return [valueRaw, valueNormalized].
 * valueRaw: display form (expanded slang).
 * valueNormalized: for matching (lowercase, expanded).
 */
export function valueRawAndNormalized(term: string): [string, string] {
  if (!term || typeof term !== "string") return ["", ""]
  const raw = expandVocabulary(term.trim())
  return [raw, raw.toLowerCase().trim()]
}
