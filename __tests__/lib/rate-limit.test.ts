import { describe, it, expect } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

describe("rate-limit", () => {
  it("allows first request", () => {
    expect(checkRateLimit("rate-test-first")).toBe(true)
  })

  it("enforces limit within window", () => {
    const limit = 3
    const windowMs = 60000
    const key = "rate-test-limit-" + Date.now()
    expect(checkRateLimit(key, limit, windowMs)).toBe(true)
    expect(checkRateLimit(key, limit, windowMs)).toBe(true)
    expect(checkRateLimit(key, limit, windowMs)).toBe(true)
    expect(checkRateLimit(key, limit, windowMs)).toBe(false)
  })

  it("treats different keys independently", () => {
    const keyA = "rate-test-a-" + Date.now()
    const keyB = "rate-test-b-" + Date.now()
    expect(checkRateLimit(keyA, 2, 60000)).toBe(true)
    expect(checkRateLimit(keyB, 2, 60000)).toBe(true)
    expect(checkRateLimit(keyA, 2, 60000)).toBe(true)
    expect(checkRateLimit(keyA, 2, 60000)).toBe(false)
    expect(checkRateLimit(keyB, 2, 60000)).toBe(true)
  })
})
