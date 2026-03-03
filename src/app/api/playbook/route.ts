import { prisma } from "@/lib/core/db"
import { apiError, ErrorCodes } from "@/lib/api"

export async function GET() {
  const row = await prisma.playbook.findFirst({ orderBy: { updatedAt: "desc" } })
  if (!row) {
    return apiError(ErrorCodes.NOT_FOUND, "No playbook found", 404)
  }
  const nodes = row.nodes as unknown[]
  const edges = row.edges as unknown[]
  return Response.json({ nodes: Array.isArray(nodes) ? nodes : [], edges: Array.isArray(edges) ? edges : [] })
}

export async function PUT(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Invalid JSON body", 400)
  }
  const { nodes, edges } = body as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return apiError(ErrorCodes.VALIDATION_ERROR, "Body must contain nodes and edges arrays", 400)
  }
  const row = await prisma.playbook.findFirst({ orderBy: { updatedAt: "desc" } })
  if (row) {
    await prisma.playbook.update({
      where: { id: row.id },
      data: { nodes, edges },
    })
  } else {
    await prisma.playbook.create({
      data: { nodes, edges },
    })
  }
  return Response.json({ ok: true })
}
