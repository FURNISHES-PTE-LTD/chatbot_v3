import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkRateLimit } from "@/lib/core/rate-limit"
import { prisma } from "@/lib/core/db"

vi.mock("@/lib/core/db", () => ({
  prisma: {
    rateLimitEvent: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe("rate-limit", () => {
  beforeEach(() => {
    vi.mocked(prisma.rateLimitEvent.count).mockReset()
    vi.mocked(prisma.rateLimitEvent.create).mockReset()
  })

  it("allows first request", async () => {
    vi.mocked(prisma.rateLimitEvent.count).mockResolvedValue(0)
    vi.mocked(prisma.rateLimitEvent.create).mockResolvedValue({ id: "1", key: "rate-test-first", createdAt: new Date() })
    await expect(checkRateLimit("rate-test-first")).resolves.toBe(true)
    expect(prisma.rateLimitEvent.create).toHaveBeenCalledWith({ data: { key: "rate-test-first" } })
  })

  it("enforces limit within window", async () => {
    const key = "rate-test-limit-" + Date.now()
    const limit = 3
    const windowMs = 60000
    vi.mocked(prisma.rateLimitEvent.create).mockResolvedValue({ id: "1", key, createdAt: new Date() })
    vi.mocked(prisma.rateLimitEvent.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
    await expect(checkRateLimit(key, limit, windowMs)).resolves.toBe(true)
    await expect(checkRateLimit(key, limit, windowMs)).resolves.toBe(true)
    await expect(checkRateLimit(key, limit, windowMs)).resolves.toBe(true)
    await expect(checkRateLimit(key, limit, windowMs)).resolves.toBe(false)
    expect(prisma.rateLimitEvent.create).toHaveBeenCalledTimes(3)
  })

  it("treats different keys independently", async () => {
    const keyA = "rate-test-a-" + Date.now()
    const keyB = "rate-test-b-" + Date.now()
    vi.mocked(prisma.rateLimitEvent.create).mockResolvedValue({ id: "1", key: keyA, createdAt: new Date() })
    vi.mocked(prisma.rateLimitEvent.count)
      .mockResolvedValueOnce(0) // A first
      .mockResolvedValueOnce(0) // B first
      .mockResolvedValueOnce(1) // A second
      .mockResolvedValueOnce(2) // A third -> over limit (count already 2)
      .mockResolvedValueOnce(1) // B second
    await expect(checkRateLimit(keyA, 2, 60000)).resolves.toBe(true)
    await expect(checkRateLimit(keyB, 2, 60000)).resolves.toBe(true)
    await expect(checkRateLimit(keyA, 2, 60000)).resolves.toBe(true)
    await expect(checkRateLimit(keyA, 2, 60000)).resolves.toBe(false)
    await expect(checkRateLimit(keyB, 2, 60000)).resolves.toBe(true)
  })
})
