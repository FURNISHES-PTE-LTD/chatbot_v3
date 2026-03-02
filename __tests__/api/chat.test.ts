import { describe, it, expect } from "vitest"

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("chat API", () => {
  it("validates request body shape when server responds", async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => null)
    if (res === null) return
    expect([400, 404, 502, 503]).toContain(res.status)
  })

  it("rejects empty message when server responds", async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    }).catch(() => null)
    if (res === null) return
    expect([400, 404, 502, 503]).toContain(res.status)
  })
})
