import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { TEAM_ID, TOURNAMENT_ID } from "@/lib/api";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const BASE = "https://soccaportugal.mygol.es/api";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.SITE_URL || "https://msgalaxy.vercel.app";

  try {
    const teamRes = await fetch(`${BASE}/teams/${TEAM_ID}/details/${TOURNAMENT_ID}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const teamData = await teamRes.json();

    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());

    const todayMatch = (teamData.days || [])
      .flatMap((day: any) => day.matches || [])
      .filter((m: any) => m.status !== 5)
      .find((m: any) =>
        new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date(m.startTime)) === todayStr
      );

    let title: string, message: string, url: string;

    if (todayMatch) {
      const isHome = todayMatch.idHomeTeam === TEAM_ID;
      const opponent = isHome ? todayMatch.visitorTeam?.name : todayMatch.homeTeam?.name || "Adversário";
      const matchTime = (todayMatch.startTime || "").slice(11, 16);
      title = "💛 Domingo de jogo!";
      message = `Hoje é dia de MS Galaxy! MS Galaxy vs ${opponent} às ${matchTime}. Força Galaxy! 💛`;
      url = `${siteUrl}/?page=calendario`;
    } else {
      title = "😴 Domingo de descanso!";
      message = "Sem jogo hoje — aproveita para descansar. O próximo está a chegar! 💛";
      url = `${siteUrl}/?page=calendario`;
    }

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
        url,
      }),
    });

    const entry = JSON.stringify({ title, message, timestamp: Date.now() });
    await redis.lpush("notifications:history", entry);
    await redis.ltrim("notifications:history", 0, 29);

    return NextResponse.json({ sent: true, title, message });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
