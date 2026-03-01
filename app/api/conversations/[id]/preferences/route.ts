import { prisma } from "@/lib/db"

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
  const { field, value } = body as { field?: string; value?: string }
  if (!field) {
    return Response.json({ error: "field required" }, { status: 400 })
  }
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
