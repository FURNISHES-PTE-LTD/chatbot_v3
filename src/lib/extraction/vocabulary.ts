/**
 * Vocabulary expansion for slang, abbreviations, and non-standard terms.
 * Full canonical coverage: style, color, furniture. Case-insensitive key lookup.
 */
export const VOCABULARY_MAP: Record<string, string> = {
  // Style synonyms (19 canonical style tokens)
  mcm: "mid-century modern",
  "mcm furniture": "mid-century modern",
  "mid century": "mid-century modern",
  "mid-century": "mid-century modern",
  scandi: "scandinavian",
  japandi: "japanese minimalist",
  boho: "bohemian",
  "boho-chic": "bohemian",
  farmhouse: "farmhouse",
  glam: "hollywood glam",
  "wabi-sabi": "wabi-sabi",
  "art deco": "art deco",
  coastal: "coastal",
  "coastal grandmother": "coastal traditional",
  transitional: "transitional",
  eclectic: "eclectic",
  rustic: "rustic",
  cottagecore: "cottage",
  cluttercore: "maximalist eclectic",
  "dark academia": "traditional scholarly",
  maximal: "maximalist",
  maximalist: "maximalist",
  contemp: "contemporary",
  trad: "traditional",
  minimal: "minimalist",
  hygge: "scandinavian cozy",

  // Color synonyms (22+ tokens)
  navy: "navy blue",
  "navy blue": "navy blue",
  sage: "sage green",
  "sage green": "sage green",
  cream: "cream white",
  "cream white": "cream white",
  charcoal: "charcoal gray",
  "charcoal gray": "charcoal gray",
  blush: "blush pink",
  "blush pink": "blush pink",
  taupe: "taupe",
  burgundy: "burgundy",
  teal: "teal",
  mauve: "mauve",
  ivory: "ivory",
  slate: "slate gray",
  "slate gray": "slate gray",
  terracotta: "terracotta",
  olive: "olive green",
  "olive green": "olive green",
  coral: "coral",
  mustard: "mustard yellow",
  "mustard yellow": "mustard yellow",
  champagne: "champagne",

  // Furniture synonyms (19+ categories)
  settee: "sofa",
  couch: "sofa",
  chesterfield: "sofa",
  divan: "sofa",
  loveseat: "loveseat",
  sectional: "sectional sofa",
  "sectional sofa": "sectional sofa",
  credenza: "credenza",
  sideboard: "sideboard",
  vanity: "vanity",
  wardrobe: "wardrobe",
  armoire: "armoire",
  press: "cabinet",
  closet: "closet",
  futon: "futon",
  daybed: "daybed",
  ottoman: "ottoman",
  chaise: "chaise lounge",
  "chaise lounge": "chaise lounge",
  etagere: "etagere",
  "accent chair": "accent chair",
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
