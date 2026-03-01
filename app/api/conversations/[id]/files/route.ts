/**
 * Return list of files (uploads/generated) for a conversation.
 * Currently no File model in schema; returns empty array. Can be extended when uploads are linked to conversations.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  // TODO: when uploads are stored per conversation, query and return them
  const files: Array<{ id: string; title: string; type: string; thumb?: string; createdAt?: string }> = []
  return Response.json(files)
}
