import { z } from "zod"
import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"
import { normalizeValue } from "@/lib/extraction/normalize"
const PreferencesPatchSchema = z.object({
  field: z.string(),
  value: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const prefs = await prisma.preference.findMany({
    where: { conversationId: id },
  })
  return Response.json(prefs)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const body = await req.json()
  const parsed = PreferencesPatchSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request", 400, parsed.error.flatten())
  }
  const { field, value } = parsed.data
  const raw = value ?? ""
  const [normalized] = normalizeValue(raw)
  const finalValue = Array.isArray(normalized) ? normalized.join(", ") : (normalized ?? raw)
  const existing = await prisma.preference.findUnique({
    where: { conversationId_field: { conversationId: id, field } },
  })
  await prisma.preferenceChange.create({
    data: {
      conversationId: id,
      field,
      oldValue: existing?.value ?? null,
      newValue: finalValue,
      confidence: 1.0,
      changeType: "manual_edit",
    },
  })
  const pref = await prisma.preference.upsert({
    where: {
      conversationId_field: { conversationId: id, field },
    },
    create: {
      conversationId: id,
      field,
      value: finalValue,
      confidence: 1.0,
      status: "confirmed",
    },
    update: { value: finalValue, confidence: 1.0, status: "confirmed" },
  })
  return Response.json(pref)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  let body: { field?: string }
  try {
    body = await req.json()
  } catch {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid JSON", 400)
  }
  const field = body?.field
  if (!field || typeof field !== "string") {
    return apiError(ErrorCodes.VALIDATION_ERROR, "field is required", 400)
  }
  const existing = await prisma.preference.findUnique({
    where: { conversationId_field: { conversationId: id, field } },
  })
  if (existing) {
    await prisma.preferenceChange.create({
      data: {
        conversationId: id,
        field,
        oldValue: existing.value,
        newValue: "",
        changeType: "reject",
        confidence: 1.0,
      },
    })
    await prisma.preference.delete({
      where: { conversationId_field: { conversationId: id, field } },
    })
  }
  return Response.json({ ok: true })
}
