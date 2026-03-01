import { getDomainConfig } from "@/lib/domain-config"

export async function GET() {
  const config = getDomainConfig()
  return Response.json(config)
}
