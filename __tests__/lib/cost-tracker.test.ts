import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkCostLimit } from "@/lib/core/cost-tracker"
import { getSessionCost, recordCost } from "@/lib/core/cost-logger"

vi.mock("@/lib/domain/config", () => ({
  getDomainConfig: () => ({
    rate_limits: { session_cost_limit_usd: 2.0 },
  }),
}))

vi.mock("@/lib/core/cost-logger", () => ({
  getSessionCost: vi.fn(),
  recordCost: vi.fn(),
}))

describe("cost-tracker", () => {
  beforeEach(() => {
    vi.mocked(getSessionCost).mockReset()
  })

  it("allows when current cost below limit", async () => {
    vi.mocked(getSessionCost).mockResolvedValue(0.5)
    const r = await checkCostLimit("convo-1")
    expect(r.allowed).toBe(true)
    expect(r.currentCost).toBe(0.5)
    expect(r.limit).toBe(2)
  })

  it("blocks when current cost at or above limit", async () => {
    vi.mocked(getSessionCost).mockResolvedValue(2.0)
    const r = await checkCostLimit("convo-2")
    expect(r.allowed).toBe(false)
    expect(r.currentCost).toBe(2)
    expect(r.limit).toBe(2)
  })

  it("blocks when cost over limit", async () => {
    vi.mocked(getSessionCost).mockResolvedValue(3.5)
    const r = await checkCostLimit("convo-3")
    expect(r.allowed).toBe(false)
    expect(r.currentCost).toBe(3.5)
  })
})
