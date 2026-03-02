import { prisma } from "@/lib/core/db"
import { z } from "zod"
import { apiError, ErrorCodes } from "@/lib/api"

const BodySchema = z.object({
  rating: z.enum(["positive", "negative"]),
  comment: z.string().max(500).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: messageId } = await params
  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ErrorCodes.VALIDATION_ERROR, String(parsed.error.flatten()), 400)
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })
  if (!message) {
    return apiError(ErrorCodes.NOT_FOUND, "Message not found", 404)
  }

  const feedback = await prisma.messageFeedback.create({
    data: {
      messageId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? undefined,
    },
  })

  return Response.json(feedback)
}
