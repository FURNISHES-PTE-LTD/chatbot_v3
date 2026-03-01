import { describe, it, expect } from "vitest"
import { expandVocabulary, normalizeForMatching } from "@/lib/extraction/vocabulary"

describe("vocabulary", () => {
  describe("expandVocabulary", () => {
    it("expands mcm to mid-century modern", () => {
      expect(expandVocabulary("mcm")).toBe("mid-century modern")
    })
    it("expands scandi to scandinavian", () => {
      expect(expandVocabulary("scandi")).toBe("scandinavian")
    })
    it("expands japandi to japanese minimalist", () => {
      expect(expandVocabulary("japandi")).toBe("japanese minimalist")
    })
    it("returns original term when not in map", () => {
      expect(expandVocabulary("modern")).toBe("modern")
    })
    it("is case-insensitive for lookup", () => {
      expect(expandVocabulary("MCM")).toBe("mid-century modern")
    })
  })

  describe("normalizeForMatching", () => {
    it("expands then lowercases and trims", () => {
      expect(normalizeForMatching("  MCM  ")).toBe("mid-century modern")
    })
    it("returns empty string for empty input", () => {
      expect(normalizeForMatching("")).toBe("")
    })
  })
})
