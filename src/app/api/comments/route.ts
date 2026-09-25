import { NextResponse } from "next/server";
import { postComment, describeError } from "@/lib/actions";

export const dynamic = "force-dynamic";

// The UI's one write. POST {task, body, reply_to?} stores a task_updates row
// (author 'you', kind comment or reply, unread_by_agent 1) and returns {ok:true, data:{id}}.
// The task page's money buttons post body "yes" / "not yet" with reply_to set to
// the question's update id; nothing else happens here. The agent reads it through list_new_comments.
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
