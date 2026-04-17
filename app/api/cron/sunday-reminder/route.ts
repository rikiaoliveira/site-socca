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

    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(now);
    const nextWeekStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    const upcoming = (teamData.days || [])
      .flatMap((day: any) => day.matches || [])
      .filter((m: any) => m.status !== 5)
      .map((m: any) => ({
        ...m,
        dateStr: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date(m.startTime)),
      }))
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const todayMatch = upcoming.find((m: any) => m.dateStr === todayStr);
    const weekMatch = !todayMatch && upcoming.find((m: any) => m.dateStr > todayStr && m.dateStr <= nextWeekStr);

    let title: string, message: string, url: string;

    if (todayMatch) {
      const isHome = todayMatch.idHomeTeam === TEAM_ID;
      const opponent = isHome ? todayMatch.visitorTeam?.name : todayMatch.homeTeam?.name || "Adversário";
      const matchTime = (todayMatch.startTime || "").slice(11, 16);
      title = "💛 Domingo de jogo!";
      message = `Hoje é dia de MS Galaxy! MS Galaxy vs ${opponent} às ${matchTime}. Força Galaxy! 💛`;
      url = `${siteUrl}/?page=calendario`;
    } else if (weekMatch) {
      const isHome = weekMatch.idHomeTeam === TEAM_ID;
      const opponent = isHome ? weekMatch.visitorTeam?.name : weekMatch.homeTeam?.name || "Adversário";
      const matchDateTime = new Intl.DateTimeFormat("pt-PT", {
        day: "numeric", month: "long", weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon",
      }).format(new Date(weekMatch.startTime));
      title = "💛 Bom domingo, Galaxy!";
      message = `Esta semana há jogo — MS Galaxy vs ${opponent} ${matchDateTime}. Força! 💛`;
      url = `${siteUrl}/?page=calendario`;
    } else {
      title = "😴 Domingo de descanso!";
      message = "Sem jogo esta semana — aproveita para descansar. O próximo está a chegar! 💛";
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
