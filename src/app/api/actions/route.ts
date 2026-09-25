import { NextResponse } from "next/server";
import { catalog } from "@/lib/actions";

export const dynamic = "force-dynamic";

// The contract, discoverable from the running app: every action with its
// section, description, and arguments, in the order of spec/ACTIONS.md.
export function GET() {
  return NextResponse.json({ ok: true, data: { actions: catalog() } });
}
