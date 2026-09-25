import { NextResponse } from "next/server";
import { ACTIONS, callAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ name: string }> };

// POST /api/actions/<name> with a JSON body: {ok:true, data} or {ok:false, error}
// with 400 for a bad argument, 404 for a missing row or an unknown action.
export async function POST(req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const text = await req.text();
  let input: unknown = {};
  if (text.trim() !== "") {
    try {
      input = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: `The body of POST /api/actions/${name} must be JSON, e.g. {"id": "acme-proposal"}.` }, { status: 400 });
    }
  }
  const r = callAction(name, input);
  return NextResponse.json(r.body, { status: r.status });
}

// Read-only actions also answer GET, with the query string as the input, so a
// browser can poke them: /api/actions/list_tasks?column=waiting_on_you
export async function GET(req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const def = ACTIONS[name];
  if (def && !def.read) {
    return NextResponse.json({ ok: false, error: `${name} changes the office; call it with POST and a JSON body.` }, { status: 405, headers: { Allow: "POST" } });
  }
  const r = callAction(name, Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(r.body, { status: r.status });
}
