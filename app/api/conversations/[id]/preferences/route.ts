import { z } from "zod"
import { prisma } from "@/lib/db"

const PreferencesPatchSchema = z.object({
  field: z.string(),
  value: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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
