import { getDomainConfig } from "@/lib/domain-config"
import { apiError, ErrorCodes } from "@/lib/api-error"
import { log } from "@/lib/logger"

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
    log({ level: "error", event: "api_config_error", error: String(e) })
    return apiError(ErrorCodes.INTERNAL_ERROR, message, 500)
  }
}
