import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.SITE_URL || "https://msgalaxy.vercel.app";
  const title = "🏃 Treino hoje à noite!";
  const message = "Treino do MS Galaxy às 21h. Não faltes! 💛";

  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ["Total Subscriptions"],
        headings: { en: title },
        contents: { en: message },
        url: `${siteUrl}/?page=notificacoes`,
      }),
    });

    const entry = JSON.stringify({ title, message, timestamp: Date.now() });
    await redis.lpush("notifications:history", entry);
    await redis.ltrim("notifications:history", 0, 29);

    return NextResponse.json({ sent: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
