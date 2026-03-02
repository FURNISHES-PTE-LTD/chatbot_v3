import { getDomainConfig } from "@/lib/domain-config"

export async function GET() {
  try {
    const config = getDomainConfig()
    return Response.json({
      name: config.name,
      fields: config.fields,
      recommendations: config.recommendations
        ? { enabled: config.recommendations.enabled }
        : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Config failed"
    console.error("[GET /api/config]", e)
    return Response.json({ error: message }, { status: 500 })
  }
}
