import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"
import { apiError, ErrorCodes } from "@/lib/api-error"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const changes = await prisma.preferenceChange.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  })
  const events = changes.map((c: { id: string; createdAt: Date; field: string; oldValue: string | null; newValue: string | null; confidence: number | null; changeType: string; confirmed: boolean | null }) => ({
    id: c.id,
    time: c.createdAt.toISOString(),
    field: c.field,
    oldValue: c.oldValue,
    newValue: c.newValue,
    confidence: c.confidence,
    action: c.changeType,
    confirmed: c.confirmed,
  }))
  return Response.json(events)
}
