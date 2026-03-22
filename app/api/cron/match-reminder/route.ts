import { NextRequest, NextResponse } from "next/server";
import { TEAM_ID } from "@/lib/api";

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
    const todayMatch = (teamData.days || [])
      .flatMap((day: any) => day.matches || [])
      .find((m: any) => {
        const matchDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/Lisbon",
        }).format(new Date(m.startTime));
        return matchDate === todayStr;
      });

    if (!todayMatch) {
      return NextResponse.json({ sent: false, reason: "Sem jogo hoje" });
    }

    const isHome = todayMatch.idHomeTeam === TEAM_ID;
    const opponent = isHome
      ? todayMatch.visitorTeam?.name || "Adversário"
      : todayMatch.homeTeam?.name || "Adversário";

    const matchTime = new Intl.DateTimeFormat("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Lisbon",
    }).format(new Date(todayMatch.startTime));

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
        headings: { en: "⚽ Hoje é dia de jogo!" },
        contents: { en: `MS Galaxy vs ${opponent} às ${matchTime}. Vai lá!` },
      }),
    });

    const result = await notifRes.json();
    return NextResponse.json({ sent: true, match: `MS Galaxy vs ${opponent} ${matchTime}`, result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
