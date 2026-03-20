const BASE = "https://soccaportugal.mygol.es/api";
const IMG_BASE = "https://soccaportugal.mygol.es/upload/";

// IDs
export const TOURNAMENT_ID = 250;
export const STAGE_ID = 303;
export const TEAM_ID = 2794;

// Team metadata (logos come from the API but we cache them here for the classification)
export const TEAMS: Record<number, { name: string; logo: string }> = {
  2794: { name: "MS Galaxy", logo: "76/D7/xkp1lesf.png" },
  2892: { name: "Legendários", logo: "52/DE/0wmfoyhh.png" },
  2733: { name: "Galácticos do Bairro", logo: "43/45/hcbt43k1.png" },
  2751: { name: "Wolves FC", logo: "8E/CB/vgesjtnl.png" },
  2735: { name: "Raripicanha FC", logo: "95/78/3lprfbjd.png" },
  2698: { name: "DarceLight", logo: "51/AF/oxu2zkf5.png" },
};

export function teamImg(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("imagesv2/")) return "https://soccaportugal.mygol.es/upload/" + path;
  return IMG_BASE + path;
}

async function apiFetch(endpoint: string) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Classification
export async function getClassification() {
  return apiFetch(`/tournaments/stageclassification/${STAGE_ID}`);
}

// Team details (players, calendar, etc)
export async function getTeamDetails() {
  return apiFetch(`/teams/${TEAM_ID}/details/${TOURNAMENT_ID}`);
}

// League rankings
export async function getScorers() {
  return apiFetch(`/tournaments/${TOURNAMENT_ID}/ranking/players/scorers/1/999`);
}

export async function getAssists() {
  return apiFetch(`/tournaments/${TOURNAMENT_ID}/ranking/players/assistances/1/999`);
}

export async function getMvps() {
  return apiFetch(`/tournaments/${TOURNAMENT_ID}/ranking/players/mvps/1/999`);
}

// Sport.video highlights
const SPORT_VIDEO_COMPETITION = "904102655";
const SPORT_VIDEO_TEAM_ID = "904951014"; // MS Galaxy on sport.video

export async function getHighlights() {
  const res = await fetch(
    `https://sport.video/viewing-api/games/?count=50&competitions=${SPORT_VIDEO_COMPETITION}&recordingState=ended&sort=-date&offset=0`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`Sport.video API error: ${res.status}`);
  const data = await res.json();

  // Filter only MS Galaxy games
  return (data.results || []).filter(
    (game: any) =>
      game.homeTeam?.id === SPORT_VIDEO_TEAM_ID ||
      game.guestTeam?.id === SPORT_VIDEO_TEAM_ID
  );
}
