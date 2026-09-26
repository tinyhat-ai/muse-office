import { NextResponse } from "next/server";
import { postComment, describeError } from "@/lib/actions";

export const dynamic = "force-dynamic";

// The UI's write: exactly one of task, note, or project plus body.
// Tasks also accept a screenshot and request_changes to reopen completed work.
// User comments are unread until the chief handles them through list_recent_updates.
// A task's money buttons bind "yes" / "not yet" to the question update id.
export async function POST(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'The body must be JSON, e.g. {"task": "acme-proposal", "body": "Looks right, send it."}.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, data: postComment(input) });
  } catch (err) {
    const r = describeError(err);
    return NextResponse.json(r.body, { status: r.status });
  }
}
