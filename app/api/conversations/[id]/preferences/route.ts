import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"

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
  if (error) return Response.json({ error }, { status })
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
  if (error) return Response.json({ error }, { status })
  const body = await req.json()
  const parsed = PreferencesPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { field, value } = parsed.data
  const pref = await prisma.preference.upsert({
    where: {
      conversationId_field: { conversationId: id, field },
    },
    create: {
      conversationId: id,
      field,
      value: value ?? "",
      confidence: 1.0,
      status: "confirmed",
    },
    update: { value: value ?? "", confidence: 1.0, status: "confirmed" },
  })
  return Response.json(pref)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return Response.json({ error }, { status })
  let body: { field?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const field = body?.field
  if (!field || typeof field !== "string") {
    return Response.json({ error: "field is required" }, { status: 400 })
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
