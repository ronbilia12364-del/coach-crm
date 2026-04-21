import { NextRequest, NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push/send";

export async function POST(req: NextRequest) {
  const { title, body, url } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "Missing title or body" }, { status: 400 });

  const result = await sendPushToAll({ title, body, url });
  return NextResponse.json(result);
}
