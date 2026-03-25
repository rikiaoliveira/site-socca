import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const SPORT_VIDEO_COMPETITION = "904102655";
const SPORT_VIDEO_TEAM_ID = "904951014";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.SITE_URL || "https://msgalaxy.vercel.app";

  try {
    const res = await fetch(
      `https://sport.video/viewing-api/games/?count=10&competitions=${SPORT_VIDEO_COMPETITION}&recordingState=ended&sort=-date&offset=0`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    const data = await res.json();

    const galaxyGames = (data.results || []).filter(
      (g: any) =>
        g.homeTeam?.id === SPORT_VIDEO_TEAM_ID ||
        g.guestTeam?.id === SPORT_VIDEO_TEAM_ID
    );

    if (!galaxyGames.length) return NextResponse.json({ skip: true, reason: "Sem highlights" });

    const seenSlugs: string[] = (await redis.smembers("highlights:seen")) || [];
    const seenSet = new Set(seenSlugs);

    const newGames = galaxyGames.filter((g: any) => !seenSet.has(g.slug));

    if (!newGames.length) return NextResponse.json({ skip: true, reason: "Sem highlights novos" });

    let sent = 0;
    for (const g of newGames) {
      const isHome = g.homeTeam?.id === SPORT_VIDEO_TEAM_ID;
      const opponent = isHome ? g.guestTeam?.name : g.homeTeam?.name || "Adversário";
      const title = "🎬 Novo highlight disponível!";
      const message = `O resumo de MS Galaxy vs ${opponent} já está no ar. Vai ver! 👀`;

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
          url: `${siteUrl}/?page=highlights`,
        }),
      });

      const entry = JSON.stringify({ title, message, timestamp: Date.now() });
      await redis.lpush("notifications:history", entry);
      await redis.ltrim("notifications:history", 0, 29);

      await redis.sadd("highlights:seen", g.slug);
      sent++;
    }

    return NextResponse.json({ sent });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
