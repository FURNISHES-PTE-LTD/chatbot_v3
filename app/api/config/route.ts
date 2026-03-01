import { getDomainConfig } from "@/lib/domain-config"

export async function GET() {
  const config = getDomainConfig()
  return Response.json({
    name: config.name,
    fields: config.fields,
    recommendations: config.recommendations
      ? { enabled: config.recommendations.enabled }
      : undefined,
  })
}
