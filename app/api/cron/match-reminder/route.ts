import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { TEAM_ID } from "@/lib/api";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const BASE = "https://soccaportugal.mygol.es/api";

async function fetchTeamDetails() {
  const res = await fetch(`${BASE}/teams/${TEAM_ID}/details/250`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teamData = await fetchTeamDetails();

    // Today's date in Portugal timezone (YYYY-MM-DD)
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
    }).format(new Date());

    // Find a match today
    // A API devolve startTime em hora local de Lisboa — comparamos diretamente o prefixo YYYY-MM-DD
    const todayMatch = (teamData.days || [])
      .flatMap((day: any) => day.matches || [])
      .find((m: any) => (m.startTime || "").slice(0, 10) === todayStr);

    if (!todayMatch) {
      return NextResponse.json({ sent: false, reason: "Sem jogo hoje" });
    }

    const isHome = todayMatch.idHomeTeam === TEAM_ID;
    const opponent = isHome
      ? todayMatch.visitorTeam?.name || "Adversário"
      : todayMatch.homeTeam?.name || "Adversário";

    // A API devolve o startTime em hora local de Lisboa (sem timezone).
    // Extraímos diretamente o HH:MM para evitar conversões incorretas após DST.
    const matchTime = (todayMatch.startTime || "").slice(11, 16);

    const siteUrl = process.env.SITE_URL || "https://msgalaxy.vercel.app";
    const title = "⚽ Hoje é dia de jogo!";
    const message = `MS Galaxy vs ${opponent} às ${matchTime}. Vai lá!`;

    // Send OneSignal notification to all subscribers
    const notifRes = await fetch("https://onesignal.com/api/v1/notifications", {
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

    // Guardar no histórico (máx 30)
    const entry = JSON.stringify({ title, message, timestamp: Date.now() });
    await redis.lpush("notifications:history", entry);
    await redis.ltrim("notifications:history", 0, 29);

    const result = await notifRes.json();
    return NextResponse.json({ sent: true, match: `MS Galaxy vs ${opponent} ${matchTime}`, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
