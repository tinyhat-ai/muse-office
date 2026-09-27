import { NextResponse } from "next/server";
import { describeError } from "@/lib/actions";
import { readCommentRequest, saveComment } from "@/lib/comment-attachments";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const { input, uploads } = await readCommentRequest(req);
    return NextResponse.json({ ok: true, data: saveComment(input, uploads) });
  } catch (err) {
    const result = describeError(err);
    return NextResponse.json(result.body, { status: result.status });
  }
}
