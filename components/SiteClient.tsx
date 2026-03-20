"use client";

import { useState } from "react";
import { TEAM_ID, teamImg } from "@/lib/api";

const POS_NAMES: Record<number, string> = {
  1: "GR",
  2: "DEF",
  3: "MED",
  4: "AV",
  12: "AV",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SiteClient({
  classification, players, matches, leagueScorers, leagueAssists,
  leagueMvps, highlights, heroPhotos, teams, teamName, teamLogo, competitionName,
}: any) {
  const [page, setPage] = useState<string | null>(null);
  const [rankTab, setRankTab] = useState("scorers");
  const [heroSlide, setHeroSlide] = useState(0);
  const [bgPhoto, setBgPhoto] = useState(() => Math.floor(Math.random() * 79) + 1);

  const TOTAL_BG = 79;

  function goToPage(p: string) {
    setBgPhoto(Math.floor(Math.random() * TOTAL_BG) + 1);
    setPage(p);
  }

  // Hero slideshow
  useState(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % Math.max(heroPhotos.length, 1));
    }, 4000);
    return () => clearInterval(interval);
  });

  const rankData: Record<string, any[]> = {
    scorers: leagueScorers,
    assists: leagueAssists,
    mvps: leagueMvps,
  };

  function getMatchResult(m: any) {
    if (m.st !== 5) return null;
    const isHome = m.h === TEAM_ID;
    const my = isHome ? m.hs : m.as;
    const their = isHome ? m.as : m.hs;
    return my > their ? "win" : my < their ? "loss" : "draw";
  }

  const nextMatch = matches.find((m: any) => m.st !== 5);

  // ═══ HERO PAGE ═══
  if (!page) {
    return (
      <section className="relative w-full h-screen min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
        {/* Slideshow */}
        <div className="absolute inset-0 z-0">
          {heroPhotos.map((ph: string, i: number) => (
            <div
              key={i}
              className="hero-slide"
              style={{
                backgroundImage: `url(${teamImg(ph)})`,
                opacity: i === heroSlide ? 1 : 0,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-[1]" style={{
          background: "linear-gradient(180deg, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.55) 40%, rgba(10,10,12,0.92) 80%, rgba(10,10,12,1) 100%)",
        }} />

        {/* Content */}
        <div className="relative z-[2] flex flex-col items-center text-center gap-2 px-5">
          <img
            src={teamImg(teamLogo)}
            alt={teamName}
            className="w-[80px] h-[80px] md:w-[110px] md:h-[110px] rounded-3xl object-cover mb-3 border-[3px] border-gold/25"
            style={{ boxShadow: "0 0 60px rgba(252,220,0,0.12)" }}
          />
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-[4px] sm:tracking-[8px] text-gold leading-none"
            style={{ textShadow: "0 2px 40px rgba(252,220,0,0.2)" }}>
            {teamName.toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 tracking-[2px] sm:tracking-[3px] uppercase mb-6 sm:mb-8">
            {competitionName} · Época 2026
          </p>

          <nav className="flex gap-2 sm:gap-3 flex-wrap justify-center max-w-[400px] sm:max-w-none">
            {["classificacao", "calendario", "plantel", "estatisticas", "highlights"].map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className="px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider backdrop-blur-sm transition-all hover:bg-gold hover:text-black hover:border-gold hover:-translate-y-0.5"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {p === "classificacao" ? "Classificação" : p === "calendario" ? "Calendário" : p === "plantel" ? "Plantel" : p === "estatisticas" ? "Estatísticas" : "Highlights"}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-7 z-[2] flex flex-col items-center gap-1.5 opacity-40" style={{ animation: "floatDown 2s ease-in-out infinite" }}>
          <span className="text-[11px] tracking-[2px] uppercase text-gray-400">Explorar</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="text-gray-400">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>
    );
  }

  // ═══ INNER PAGES ═══
  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark/85 backdrop-blur-xl border-b border-border relative">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <img src={teamImg(teamLogo)} alt="MSG" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl tracking-widest text-gold leading-none truncate">
              {teamName.toUpperCase()}
            </h1>
            <span className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:inline">{competitionName} — Época 2026</span>
          </div>
          <button
            onClick={() => setPage(null)}
            className="ml-auto text-xs text-gray-400 border border-border rounded-lg px-2.5 sm:px-3.5 py-1.5 hover:border-gold hover:text-gold transition-all whitespace-nowrap shrink-0"
          >
            ← Início
          </button>
        </div>
        <div className="relative max-w-[1100px] mx-auto">
          <nav className="px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {[
              { id: "classificacao", label: "Classificação" },
              { id: "calendario", label: "Calendário" },
              { id: "plantel", label: "Plantel" },
              { id: "estatisticas", label: "Estatísticas" },
              { id: "highlights", label: "Highlights" },
            ].map((tab) => (
              <div
                key={tab.id}
                onClick={() => goToPage(tab.id)}
                className={`px-5 py-3 text-[13px] font-semibold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${
                  page === tab.id
                    ? "text-gold border-gold"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </div>
            ))}
          </nav>
          <div className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-end pr-1 pointer-events-none sm:hidden" style={{ background: "linear-gradient(to right, transparent, rgba(10,10,12,0.95) 60%)" }}>
            <div className="text-gold/60 animate-pulse">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex-1 min-h-[calc(100vh-104px)]">
        <div className="sticky top-0 h-0 w-full pointer-events-none z-0">
          <div className="absolute top-0 inset-x-0 h-[calc(100vh-104px)] overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-no-repeat" style={{ backgroundPosition: "center 20%" }} style={{ backgroundImage: `url(/backgrounds/${bgPhoto}.jpg)` }} />
            <div className="absolute inset-0 bg-black/72" />
          </div>
        </div>
      <main className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-16" style={{ animation: "fadeUp 0.35s ease both" }}>

        {/* ═══ CLASSIFICAÇÃO ═══ */}
        {page === "classificacao" && (
          <>
            <h2 className="font-display text-3xl tracking-widest mb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>Classificação</h2>
            <div className="glow-line" />

            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 overflow-x-auto">
              <table className="w-full text-[13px] min-w-[700px]">
                <thead>
                  <tr className="bg-white/5 text-[11px] uppercase tracking-wider text-gray-300">
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3 text-left">Equipa</th>
                    <th className="p-3 text-center">Forma</th>
                    <th className="p-3 text-center">J</th>
                    <th className="p-3 text-center">V</th>
                    <th className="p-3 text-center">E</th>
                    <th className="p-3 text-center">D</th>
                    <th className="p-3 text-center">GM</th>
                    <th className="p-3 text-center">GS</th>
                    <th className="p-3 text-center">DG</th>
                    <th className="p-3 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {classification.map((t: any, i: number) => {
                    const tm = teams[t.idTeam] || { name: `#${t.idTeam}`, logo: "" };
                    const isGalaxy = t.idTeam === TEAM_ID;
                    const pos = i + 1;
                    return (
                      <tr key={t.idTeam} className={isGalaxy ? "bg-gold/[0.04]" : ""} style={isGalaxy ? { boxShadow: "inset 3px 0 0 var(--gold)" } : {}}>
                        <td className="p-2.5 text-center">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs mx-auto"
                            style={{ background: pos === 1 ? "rgba(0,98,177,0.15)" : pos === 2 ? "rgba(0,156,224,0.12)" : "transparent" }}>
                            {pos}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2.5 font-semibold">
                            <img src={teamImg(tm.logo)} alt="" className="w-[22px] h-[22px] rounded-md object-cover bg-surface2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            {tm.name}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex gap-1 justify-center">
                            {(t.form || []).map((f: string, fi: number) => (
                              <div key={fi} className={`form-b ${f === "W" ? "w" : f === "L" ? "l" : "d"}`}>
                                {f === "W" ? "V" : f === "L" ? "D" : "E"}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">{t.gp}</td>
                        <td className="p-2.5 text-center">{t.w}</td>
                        <td className="p-2.5 text-center">{t.d}</td>
                        <td className="p-2.5 text-center">{t.l}</td>
                        <td className="p-2.5 text-center">{t.gf}</td>
                        <td className="p-2.5 text-center">{t.ga}</td>
                        <td className={`p-2.5 text-center font-semibold ${t.gd > 0 ? "text-green-400" : t.gd < 0 ? "text-red-400" : "text-gray-500"}`}>
                          {t.gd > 0 ? "+" : ""}{t.gd}
                        </td>
                        <td className="p-2.5 text-center font-display text-[15px] tracking-wider">{t.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-5 mt-3.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0062b1" }} /> Campeão — Promoção à Liga 1
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#009ce0" }} /> Promoção — Liga 1
              </div>
            </div>

            {/* League Rankings */}
            <div className="mt-8">
              <h3 className="font-display text-2xl tracking-widest text-gold mb-4">Ranking da Liga</h3>
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {[
                  { id: "scorers", label: "⚽ Marcadores" },
                  { id: "assists", label: "🎯 Assistências" },
                  { id: "mvps", label: "⭐ MVPs" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRankTab(tab.id)}
                    className={`ranking-tab ${rankTab === tab.id ? "active" : ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 py-2">
                {(rankData[rankTab] || []).map((p: any, i: number) => {
                  const tm = teams[p.team] || { name: "?", logo: "" };
                  const isGalaxy = p.team === TEAM_ID;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 border-b border-white/[0.04] last:border-b-0 ${isGalaxy ? "bg-gold/[0.04]" : ""}`}>
                      <div className={`font-display text-lg w-7 text-center ${i < 3 ? "text-gold" : "text-gray-500"}`}>{i + 1}</div>
                      <img src={teamImg(tm.logo)} alt="" className="w-5 h-5 rounded-md object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className={`flex-1 font-semibold text-[13px] ${isGalaxy ? "text-gold" : ""}`}>{p.name} {p.sur}</div>
                      <div className="font-display text-xl text-gold tracking-wider">{p.val}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ═══ CALENDÁRIO ═══ */}
        {page === "calendario" && (
          <>
            <h2 className="font-display text-3xl tracking-widest mb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>Calendário & Resultados</h2>
            <div className="glow-line" />

            {nextMatch && (
              <div className="bg-black/50 backdrop-blur-md border border-gold/20 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div>
                  <div className="text-[11px] uppercase tracking-[1.5px] text-gold-dim font-semibold mb-1.5">Próximo Jogo</div>
                  <div className="font-display text-xl sm:text-2xl md:text-[28px] tracking-widest flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <img src={teamImg(nextMatch.homeLogo)} alt="" className="w-6 h-6 sm:w-[30px] sm:h-[30px] rounded-lg object-cover" />
                    {nextMatch.homeName}
                    <span className="text-gray-500 text-lg sm:text-xl mx-1">vs</span>
                    {nextMatch.awayName}
                    <img src={teamImg(nextMatch.awayLogo)} alt="" className="w-6 h-6 sm:w-[30px] sm:h-[30px] rounded-lg object-cover" />
                  </div>
                </div>
                <div className="sm:ml-auto sm:text-right text-[12px] sm:text-[13px] text-gray-400">
                  <div className="font-semibold text-white">{formatDate(nextMatch.date)}</div>
                  <div>{nextMatch.day}</div>
                </div>
              </div>
            )}

            {matches.map((m: any, i: number) => {
              const played = m.st === 5;
              const result = getMatchResult(m);
              const isGalaxy = m.h === TEAM_ID || m.a === TEAM_ID;
              return (
                <div key={i} className="mb-4 sm:mb-6">
                  <div className="font-display text-lg sm:text-xl tracking-wider text-gray-300 mb-2 flex items-center gap-2" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                    {m.day} <span className="font-body text-[11px] sm:text-xs font-medium text-gray-400 opacity-90 tracking-normal">{formatDate(m.date)}</span>
                  </div>
                  <div className={`bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3.5 transition-colors hover:border-gold/20 ${isGalaxy ? "border-l-[3px] border-l-gold" : ""}`}>
                    <div className={`result-badge ${result || "tbd"} shrink-0`}>
                      {result === "win" ? "V" : result === "loss" ? "D" : result === "draw" ? "E" : "—"}
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                      <div className={`flex-1 flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm min-w-0 ${m.h === TEAM_ID ? "text-gold" : ""}`}>
                        <img src={teamImg(m.homeLogo)} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover shrink-0 hidden sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span className="truncate">{m.homeName}</span>
                      </div>
                      {played ? (
                        <div className="font-display text-xl sm:text-2xl tracking-widest min-w-[50px] sm:min-w-[70px] text-center shrink-0">
                          {m.hs}<span className="text-gray-500 text-base sm:text-lg mx-0.5 sm:mx-1">–</span>{m.as}
                        </div>
                      ) : (
                        <div className="text-[11px] sm:text-[13px] text-gray-300 font-medium min-w-[50px] sm:min-w-[70px] text-center shrink-0">Por jogar</div>
                      )}
                      <div className={`flex-1 flex items-center gap-1.5 sm:gap-2 justify-end font-semibold text-xs sm:text-sm min-w-0 ${m.a === TEAM_ID ? "text-gold" : ""}`}>
                        <span className="truncate">{m.awayName}</span>
                        <img src={teamImg(m.awayLogo)} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover shrink-0 hidden sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ═══ PLANTEL ═══ */}
        {page === "plantel" && (
          <>
            <h2 className="font-display text-3xl tracking-widest mb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>Plantel</h2>
            <p className="text-[13px] text-gray-400 -mt-3.5 mb-6">{teamName} — Época 2026</p>
            <div className="glow-line" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[...players]
                .sort((a: any, b: any) => b.gp - a.gp || b.dp - a.dp)
                .map((p: any, i: number) => (
                  <div key={i} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3.5 transition-all hover:border-gold/25 hover:-translate-y-px">
                    <img
                      src={teamImg(p.ph)}
                      alt={`${p.name} ${p.sur}`}
                      className="w-[50px] h-[50px] rounded-xl object-cover bg-surface2 border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).outerHTML = `<div class="w-[50px] h-[50px] rounded-xl bg-surface2 border border-border flex items-center justify-center font-display text-xl text-gold">${p.n}</div>`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{p.name} {p.sur}</div>
                      <div className="text-[11px] text-gray-500 uppercase tracking-wider">{POS_NAMES[p.pos] || "—"} · #{p.n}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="bg-surface2 rounded-md px-2 py-0.5 text-[11px] text-gray-500"><span className="font-bold text-white">{p.gp}</span> J</span>
                        {p.g > 0 && <span className="bg-surface2 rounded-md px-2 py-0.5 text-[11px] text-gray-500"><span className="font-bold text-gold">{p.g}</span> Golos</span>}
                        {p.a > 0 && <span className="bg-surface2 rounded-md px-2 py-0.5 text-[11px] text-gray-500"><span className="font-bold text-white">{p.a}</span> Ass</span>}
                        {p.mvp > 0 && <span className="bg-surface2 rounded-md px-2 py-0.5 text-[11px] text-gray-500"><span className="font-bold text-gold">★</span> MVP</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ═══ ESTATÍSTICAS ═══ */}
        {page === "estatisticas" && (
          <>
            <h2 className="font-display text-3xl tracking-widest mb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>Estatísticas Individuais</h2>
            <p className="text-[13px] text-gray-400 -mt-3.5 mb-6">Performance dos jogadores na {competitionName}</p>
            <div className="glow-line" />

            {/* Top scorers */}
            {(() => {
              const scorers = [...players].filter((p: any) => p.g > 0).sort((a: any, b: any) => b.g - a.g);
              if (!scorers.length) return null;
              return (
                <div className="mb-8">
                  <div className="font-display text-[22px] tracking-wider text-gold mb-3.5">🏆 Top Marcadores — {teamName}</div>
                  <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 py-2">
                    {scorers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 border-b border-white/[0.04] last:border-b-0">
                        <div className={`font-display text-lg w-7 text-center ${i < 3 ? "text-gold" : "text-gray-500"}`}>{i + 1}</div>
                        <img src={teamImg(teams[TEAM_ID]?.logo || "")} alt="" className="w-5 h-5 rounded-md object-cover" />
                        <div className="flex-1 font-semibold text-[13px]">{p.name} {p.sur}</div>
                        <div className="font-display text-xl text-gold tracking-wider">{p.g}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Stat bar sections */}
            {[
              { title: "Assistências", emoji: "🎯", key: "a" },
              { title: "Jogos Disputados", emoji: "🏟", key: "gp" },
              { title: "Dream Team Points", emoji: "⭐", key: "dp", sub: "A nota de cada jogador jornada a jornada — quanto mais alta, mais perto do onze ideal. Quem brilha, aparece aqui em cima." },
            ].map(({ title, emoji, key, sub }) => {
              const sorted = [...players].filter((p: any) => p[key] > 0).sort((a: any, b: any) => b[key] - a[key]);
              if (!sorted.length) return null;
              const max = sorted[0][key];
              return (
                <div key={key} className="mb-8">
                  <div className="font-display text-[22px] tracking-wider text-gold mb-3.5">{emoji} {title}</div>
                  {sub && <div className="text-xs text-gray-500 -mt-2 mb-3.5 leading-relaxed">{sub}</div>}
                  <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-4">
                    {sorted.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="w-40 font-semibold text-[13px] truncate shrink-0">{p.name} {p.sur}</div>
                        <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${(p[key] / max) * 100}%` }} />
                        </div>
                        <div className="w-9 text-right font-display text-sm tracking-wider">{p[key]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ═══ HIGHLIGHTS ═══ */}
        {page === "highlights" && (
          <>
            <h2 className="font-display text-3xl tracking-widest mb-5" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>Highlights</h2>
            <p className="text-[13px] text-gray-400 -mt-3.5 mb-6">Vídeos dos jogos do {teamName} na {competitionName}</p>
            <div className="glow-line" />

            {highlights.length === 0 ? (
              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-12 text-center">
                <div className="text-2xl mb-2">🎬</div>
                <div className="text-gray-400">Ainda não há highlights disponíveis.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {highlights.map((h: any) => (
                  <a
                    key={h.id}
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all hover:border-gold/30 hover:-translate-y-0.5"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={h.thumbnail}
                        alt={h.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      {/* Views badge */}
                      <div className="absolute bottom-2 right-2 bg-black/70 rounded-md px-2 py-1 text-[11px] text-gray-300 backdrop-blur-sm">
                        👁 {h.views}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <img src={h.homeLogo} alt="" className="w-5 h-5 rounded-md object-cover" onError={(e: any) => { e.target.style.display = "none"; }} />
                          <span className="font-semibold text-sm">{h.homeTeam}</span>
                        </div>
                        <div className="font-display text-xl tracking-wider">
                          {h.homeScore}<span className="text-gray-500 mx-1">–</span>{h.guestScore}
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-semibold text-sm">{h.guestTeam}</span>
                          <img src={h.guestLogo} alt="" className="w-5 h-5 rounded-md object-cover" onError={(e: any) => { e.target.style.display = "none"; }} />
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {formatDate(h.date)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}
