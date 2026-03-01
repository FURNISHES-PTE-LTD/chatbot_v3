import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return Response.json({ error }, { status })
  const changes = await prisma.preferenceChange.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  })
  const events = changes.map((c) => ({
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
