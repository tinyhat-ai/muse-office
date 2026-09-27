import { attachmentResponse } from "@/lib/attachment-response";
import { get } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const file = get<{ name: string; media_type: string; data: Buffer }>("SELECT name, media_type, data FROM comment_attachments WHERE id = ?", id);
  if (!file) return new Response(null, { status: 404 });
  return attachmentResponse(_req, file);
}
