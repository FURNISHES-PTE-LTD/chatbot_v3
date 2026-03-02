import { prisma } from "@/lib/core/db"
import { requireConversationAccess } from "@/lib/auth"
import { apiError, ErrorCodes } from "@/lib/api"

/**
 * Return list of files (uploads) for a conversation.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { error, status } = await requireConversationAccess(id)
  if (error) return apiError(status === 404 ? ErrorCodes.NOT_FOUND : ErrorCodes.FORBIDDEN, error, status)
  const rows = await prisma.file.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  })
  const files = rows.map((f: { id: string; filename: string; type: string | null; createdAt: Date }) => ({
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
