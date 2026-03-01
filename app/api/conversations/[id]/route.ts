import { prisma } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(conversation)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  })
  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.conversation.delete({
    where: { id },
  })
  return Response.json({ ok: true })
}
