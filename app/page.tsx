import {
  getClassification,
  getTeamDetails,
  getScorers,
  getAssists,
  getMvps,
  TEAMS,
  TEAM_ID,
  teamImg,
} from "@/lib/api";
import SiteClient from "@/components/SiteClient";

export const revalidate = 300; // revalidate every 5 min

export default async function Home() {
  let classificationData, teamData, scorersData, assistsData, mvpsData;

  try {
    [classificationData, teamData, scorersData, assistsData, mvpsData] =
      await Promise.all([
        getClassification(),
        getTeamDetails(),
        getScorers(),
        getAssists(),
        getMvps(),
      ]);
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar dados</h1>
          <p className="text-gray-400">
            Não foi possível ligar à API. Tenta novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  // Process classification
  const classification = (classificationData.leagueClassification || []).map(
    (t: any, i: number) => ({
      idTeam: t.idTeam,
      gp: t.gamesPlayed,
      w: t.gamesWon,
      d: t.gamesDraw,
      l: t.gamesLost,
      gf: t.points,
      ga: t.pointsAgainst,
      gd: t.pointDiff,
      pts: t.tournamentPoints,
      form: (t.previousResult || "")
        .split("")
        .map((r: string) => (r === "1" ? "W" : r === "2" ? "L" : "D")),
    })
  );

  // Process players - cap games to official matches played
  const officialGames = (teamData.days || []).filter((d: any) =>
    d.matches?.some((m: any) => m.status === 5)
  ).length;

  const players = (teamData.players || []).map((p: any) => ({
    n: p.teamData?.apparelNumber || 0,
    name: (p.name || "").trim(),
    sur: (p.surname || "").trim(),
    pos: p.teamData?.fieldPosition || 0,
    gp: Math.min(p.dayResultSummary?.gamesPlayed || 0, officialGames),
    g: p.dayResultSummary?.points || 0,
    a: p.dayResultSummary?.assistances || 0,
    c: p.dayResultSummary?.cardsType1 || 0,
    dp: p.dayResultSummary?.dreamTeamPoints || 0,
    mvp: p.dayResultSummary?.mvpPoints || 0,
    ph: p.idPhotoImgUrl || "",
  }));

  // Process matches from team details
  const matches = (teamData.days || [])
    .flatMap((day: any) =>
      (day.matches || []).map((m: any) => ({
        day: day.name,
        date: m.startTime,
        h: m.idHomeTeam,
        a: m.idVisitorTeam,
        hs: m.homeScore || 0,
        as: m.visitorScore || 0,
        st: m.status,
        homeName: m.homeTeam?.name || "",
        homeLogo: m.homeTeam?.logoImgUrl || "",
        awayName: m.visitorTeam?.name || "",
        awayLogo: m.visitorTeam?.logoImgUrl || "",
      }))
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  // Process league rankings
  const leagueScorers = (scorersData || []).map((p: any) => ({
    name: (p.playerName || "").trim(),
    sur: (p.playerSurname || "").trim(),
    team: p.idTeam,
    val: p.points || 0,
  }));

  const leagueAssists = (assistsData || []).map((p: any) => ({
    name: (p.playerName || "").trim(),
    sur: (p.playerSurname || "").trim(),
    team: p.idTeam,
    val: p.assistances || 0,
  }));

  const leagueMvps = (mvpsData || []).map((p: any) => ({
    name: (p.playerName || "").trim(),
    sur: (p.playerSurname || "").trim(),
    team: p.idTeam,
    val: p.mvpPoints || 0,
  }));

  // Hero photos
  const heroPhotos = [
    teamData.teamImgUrl,
    teamData.teamImgUrl2,
    teamData.teamImgUrl3,
  ].filter(Boolean);

  // Teams map with logos (update from API data if available)
  const teamsMap = { ...TEAMS };

  return (
    <SiteClient
      classification={classification}
      players={players}
      matches={matches}
      leagueScorers={leagueScorers}
      leagueAssists={leagueAssists}
      leagueMvps={leagueMvps}
      heroPhotos={heroPhotos}
      teams={teamsMap}
      teamName={teamData.name || "MS Galaxy"}
      teamLogo={teamData.logoImgUrl || TEAMS[TEAM_ID].logo}
      competitionName={classificationData.name || "Liga 2 Amora"}
    />
  );
}
