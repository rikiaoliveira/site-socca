import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      included_segments: ["Total Subscriptions"],
      headings: { pt: "🌟 MS Galaxy" },
      contents: { pt: "A partir de agora vais receber notificações da nossa equipa. Força Galaxy! 💛" },
    }),
  });

  const result = await res.json();
  return NextResponse.json({ ok: true, result });
}
