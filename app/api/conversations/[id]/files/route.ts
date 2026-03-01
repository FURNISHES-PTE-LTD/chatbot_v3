import { prisma } from "@/lib/db"
import { requireConversationAccess } from "@/lib/auth-helpers"

/**
 * Return list of files (uploads) for a conversation.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return Response.json({ error }, { status })
  const rows = await prisma.file.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  })
  const files = rows.map((f) => ({
    id: f.id,
    title: f.filename,
    type: f.type?.startsWith("image/") ? "image" : "image",
    thumb: "mood" as const,
    desc: "",
    tags: [] as string[],
    time: f.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    createdAt: f.createdAt.toISOString(),
  }))
  return Response.json(files)
}
