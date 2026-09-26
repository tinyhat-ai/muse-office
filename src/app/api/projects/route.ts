import { NextResponse } from "next/server";
import { describeError, followUpMessage, runAction } from "@/lib/actions";

export async function POST(req: Request) {
  try {
    const { action, ...input } = await req.json();
    if (!["upsert_project", "archive_project"].includes(action)) return NextResponse.json({ ok: false, error: "Choose a project action." }, { status: 400 });
    // The UI owns attribution. A request cannot masquerade as an agent visit.
    const data = runAction(action, input, "you");
    return NextResponse.json({ ok: true, data, follow_up: followUpMessage() });
  } catch (err) {
    if (err instanceof SyntaxError) return NextResponse.json({ok:false, error:"The request must be JSON."}, {status:400});
    const result = describeError(err);
    return NextResponse.json(result.body, { status: result.status });
  }
}
