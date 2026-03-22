import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { TEAM_ID, TOURNAMENT_ID } from "@/lib/api";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const BASE = "https://soccaportugal.mygol.es/api";

async function sendNotif(title: string, message: string) {
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      included_segments: ["Total Subscriptions"],
      headings: { pt: title },
      contents: { pt: message },
    }),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find today's match
    const teamRes = await fetch(`${BASE}/teams/${TEAM_ID}/details/${TOURNAMENT_ID}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const teamData = await teamRes.json();

    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());

    const todayMatch = (teamData.days || [])
      .flatMap((day: any) => day.matches || [])
      .find((m: any) => {
        const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date(m.startTime));
        return d === todayStr;
      });

    if (!todayMatch) return NextResponse.json({ skip: true, reason: "Sem jogo hoje" });

    // Only run within match window: 15min before kickoff to 90min after
    const now = Date.now();
    const kickoff = new Date(todayMatch.startTime).getTime();
    if (now < kickoff - 15 * 60000 || now > kickoff + 90 * 60000) {
      return NextResponse.json({ skip: true, reason: "Fora da janela do jogo" });
    }

    // Fetch live match details
    const matchRes = await fetch(`${BASE}/matches/${todayMatch.id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const match = await matchRes.json();

    const isHome = todayMatch.idHomeTeam === TEAM_ID;
    const opponent = isHome
      ? todayMatch.visitorTeam?.name || "Adversário"
      : todayMatch.homeTeam?.name || "Adversário";

    const galaxyScore = isHome ? (match.homeScore || 0) : (match.visitorScore || 0);
    const oppScore = isHome ? (match.visitorScore || 0) : (match.homeScore || 0);

    // Build player map
    const playerMap: Record<number, string> = {};
    [...(match.homePlayers || []), ...(match.visitorPlayers || [])].forEach((p: any) => {
      const id = p.matchData?.idPlayer;
      if (id) playerMap[id] = `${(p.name || "").trim()} ${(p.surname || "").trim()}`.trim();
    });

    // Get already-notified event IDs
    const redisKey = `match:${todayMatch.id}:notified`;
    const notified: number[] = (await redis.get(redisKey)) || [];
    const notifiedSet = new Set(notified);

    // Find new events (API returns newest first, so reverse for chronological order)
    const events: any[] = match.events || [];
    const newEvents = [...events].reverse().filter((e: any) => !notifiedSet.has(e.id));

    if (newEvents.length === 0) return NextResponse.json({ skip: true, reason: "Sem eventos novos" });

    let sent = 0;
    for (const e of newEvents) {
      let title = "🏟️ MS Galaxy";
      let message = "";

      const playerName = e.idPlayer > 0 ? playerMap[e.idPlayer] || null : null;
      const teamLabel = e.idTeam === TEAM_ID ? "MS Galaxy" : opponent;
      const score = `${galaxyScore} - ${oppScore}`;

      switch (e.type) {
        case 1:
          title = "🏁 Jogo iniciado!";
          message = `MS Galaxy vs ${opponent} — Força Galaxy! 💛`;
          break;
        case 10:
          title = "⏸ Intervalo";
          message = `MS Galaxy ${score} ${opponent}`;
          break;
        case 11:
          title = "▶️ Segunda parte";
          message = `Segunda parte iniciada! ${score}`;
          break;
        case 13:
          title = "🏆 Fim do jogo!";
          const result = galaxyScore > oppScore ? "Vitória" : galaxyScore < oppScore ? "Derrota" : "Empate";
          message = `${result}! MS Galaxy ${score} ${opponent}`;
          break;
        case 31: {
          const isGalaxy = e.idTeam === TEAM_ID;
          title = isGalaxy ? "⚽ GOLO! MS Galaxy!" : "😤 Golo sofrido...";
          message = isGalaxy
            ? (playerName ? `${playerName} marca! ${score}` : `MS Galaxy ${score}`)
            : `MS Galaxy ${score} ${opponent}`;
          break;
        }
        case 61:
          title = "🟨 Cartão amarelo";
          message = playerName ? `${teamLabel} — ${playerName}` : teamLabel;
          break;
        case 62:
          title = "🟥 Cartão vermelho!";
          message = playerName ? `${teamLabel} — ${playerName}` : teamLabel;
          break;
        case 100:
          // Resultado final já confirmado pelo type 13, ignorar
          notifiedSet.add(e.id);
          continue;
        default:
          notifiedSet.add(e.id);
          continue;
      }

      if (message) {
        await sendNotif(title, message);
        notifiedSet.add(e.id);
        sent++;
      }
    }

    // Save updated notified IDs (expire after 12h)
    await redis.set(redisKey, Array.from(notifiedSet), { ex: 43200 });

    return NextResponse.json({ sent, match: `MS Galaxy vs ${opponent}`, score: `${galaxyScore}-${oppScore}` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
