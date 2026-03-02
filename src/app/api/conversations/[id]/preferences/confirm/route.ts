import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"
import { logCalibration } from "@/lib/extraction/calibration"

const BodySchema = z.object({ changeId: z.string() })

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return apiError(ErrorCodes.VALIDATION_ERROR, "changeId required", 400)
  const { changeId } = parsed.data
  const change = await prisma.preferenceChange.findFirst({
    where: { id: changeId, conversationId: id },
  })
  if (!change) return apiError(ErrorCodes.NOT_FOUND, "Change not found", 404)
  await prisma.preferenceChange.update({
    where: { id: changeId },
    data: { confirmed: true },
  })
  await prisma.preference.upsert({
    where: { conversationId_field: { conversationId: id, field: change.field } },
    create: {
      conversationId: id,
      field: change.field,
      value: change.newValue,
      confidence: change.confidence,
      status: "confirmed",
    },
    update: { status: "confirmed", confidence: change.confidence },
  })
  await logCalibration(id, change.field, change.confidence, true)
  return Response.json({ ok: true })
}
