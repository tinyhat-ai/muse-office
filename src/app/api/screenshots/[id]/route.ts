import { get } from "@/lib/db";

export const dynamic = "force-dynamic";

// Shares the Office's private access boundary; never serve these as public assets.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = get<{ mime: string; data: Buffer }>("SELECT mime, data FROM screenshots WHERE id = ?", id);
  if (!file) return new Response("Screenshot not found", { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: {
    "content-type": file.mime, "x-content-type-options": "nosniff",
    "cache-control": "private, no-store", "content-security-policy": "default-src 'none'; sandbox",
  } });
}
