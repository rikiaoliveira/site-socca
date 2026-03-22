"use client";

import { useState, useEffect } from "react";
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
  const BG_PHOTOS = Array.from({ length: 27 }, (_, i) => String(i + 1));
  const [bgPhoto, setBgPhoto] = useState(() => BG_PHOTOS[Math.floor(Math.random() * BG_PHOTOS.length)]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showChromeHint, setShowChromeHint] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isIosChrome, setIsIosChrome] = useState(false);
  const [matchSummary, setMatchSummary] = useState<any>(null);
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);
  const [liveMatchId, setLiveMatchId] = useState<number | null>(null);
  const [notifState, setNotifState] = useState<"idle" | "subscribed" | "denied">("idle");
  const [notifSupported, setNotifSupported] = useState(false);

  async function openMatchSummary(matchId: number, isLive = false) {
    if (!matchId) return;
    setLoadingMatchId(matchId);
    try {
      const res = await fetch(`/api/match/${matchId}`);
      const data = await res.json();
      setMatchSummary(data);
      setLiveMatchId(isLive ? matchId : null);
    } catch {
      setMatchSummary(null);
    } finally {
      setLoadingMatchId(null);
    }
  }

  // Auto-refresh do modal quando jogo está ao vivo
  useEffect(() => {
    if (!liveMatchId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/match/${liveMatchId}`);
        const data = await res.json();
        setMatchSummary(data);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [liveMatchId]);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const iosChrome = ios && /CriOS/i.test(ua);
    const chrome = /chrome/i.test(ua) && !/edg/i.test(ua) && !ios;
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    setIsIos(ios);
    setIsIosChrome(iosChrome);
    setIsChrome(chrome);
    setIsMobile(mobile);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // Check OneSignal subscription state after it loads
    const checkNotif = setTimeout(async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "denied") { setNotifState("denied"); setNotifSupported(true); return; }
      setNotifSupported(true);
      const os = (window as any).OneSignal;
      if (os) {
        const opted = await os.User?.PushSubscription?.optedIn;
        if (opted) setNotifState("subscribed");
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(checkNotif);
    };
  }, []);

  function goToPage(p: string) {
    setBgPhoto(BG_PHOTOS[Math.floor(Math.random() * BG_PHOTOS.length)]);
    setPage(p);
  }

  async function handleInstall() {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
    } else if (isIos) {
      setShowIosHint(true);
    } else if (isChrome) {
      setShowChromeHint(true);
    }
  }

  async function handleNotifSubscribe() {
    const os = (window as any).OneSignal;
    if (!os) {
      alert("OneSignal ainda não carregou. Espera uns segundos e tenta de novo.");
      return;
    }
    try {
      await os.User.PushSubscription.optIn();
      const opted = await os.User?.PushSubscription?.optedIn;
      if (opted) {
        setNotifState("subscribed");
      } else {
        alert("Permissão não concedida. Verifica as definições do browser.");
      }
    } catch (e: any) {
      alert("Erro: " + (e?.message || String(e)));
    }
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

          {/* Dica de instalação */}
          <p className="mt-6 max-w-[280px] sm:max-w-xs text-center text-[11px] text-gray-500 leading-relaxed bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/[0.06]">
            💡 Para não perderes nada, adiciona a app ao teu ecrã inicial e ativa as notificações. Podes acompanhar o jogo ao vivo!
          </p>

          {/* Install + Notif buttons */}
          <div className="flex flex-col gap-2 items-center mt-3">
            {(installPrompt || isIos || isChrome) && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold backdrop-blur-sm transition-all hover:bg-gold/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v13M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>
                Adicionar ao ecrã inicial
              </button>
            )}
            {notifSupported && notifState !== "denied" && (
              <button
                onClick={notifState === "subscribed" ? undefined : handleNotifSubscribe}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold backdrop-blur-sm transition-all ${
                  notifState === "subscribed"
                    ? "bg-green-500/10 border-green-500/30 text-green-400 cursor-default"
                    : "bg-white/5 border-white/15 text-white hover:bg-white/10"
                }`}
              >
                {notifState === "subscribed" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    Notificações ativas
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    Ativar notificações
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Chrome hint modal */}
        {showChromeHint && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowChromeHint(false)}>
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-5 w-full max-w-sm mb-4" onClick={e => e.stopPropagation()}>
              <div className="text-white font-bold text-base mb-3">Adicionar ao ecrã inicial</div>
              {isMobile ? (<>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">1️⃣</span>
                  <p className="text-gray-300 text-sm">Toca nos <strong>três pontos</strong> <span className="inline-block border border-gray-500 rounded px-1 text-xs">⋮</span> no canto superior direito do Chrome</p>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">2️⃣</span>
                  <p className="text-gray-300 text-sm">Escolhe <strong>"Adicionar ao ecrã inicial"</strong></p>
                </div>
              </>) : (<>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">1️⃣</span>
                  <p className="text-gray-300 text-sm">Clica no ícone <strong>instalar</strong> <span className="inline-block border border-gray-500 rounded px-1 text-xs">⊕</span> na barra de endereços do Chrome</p>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">2️⃣</span>
                  <p className="text-gray-300 text-sm">Ou vai ao menu <strong>⋮ → Guardar e partilhar → Instalar página como app</strong></p>
                </div>
              </>)}
              <button onClick={() => setShowChromeHint(false)} className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-sm">OK</button>
            </div>
          </div>
        )}

        {/* iOS hint modal */}
        {showIosHint && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowIosHint(false)}>
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-5 w-full max-w-sm mb-4" onClick={e => e.stopPropagation()}>
              <div className="text-white font-bold text-base mb-1">Adicionar ao ecrã inicial</div>
              <div className="text-[11px] text-gray-500 mb-4">{isIosChrome ? "Chrome no iPhone/iPad" : "Safari no iPhone/iPad"}</div>
              {isIosChrome ? (<>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">1️⃣</span>
                  <p className="text-gray-300 text-sm">Toca no botão <strong>Partilhar</strong> <span className="inline-block border border-gray-500 rounded px-1 text-xs">⎋</span> perto da barra de endereços</p>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">2️⃣</span>
                  <p className="text-gray-300 text-sm">Escolhe <strong>"Ver mais"</strong></p>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">3️⃣</span>
                  <p className="text-gray-300 text-sm">Toca em <strong>"Adicionar ao ecrã principal"</strong></p>
                </div>
              </>) : (<>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">1️⃣</span>
                  <p className="text-gray-300 text-sm">Toca no botão <strong>Partilhar</strong> <span className="inline-block border border-gray-500 rounded px-1 text-xs">⎋</span> na barra do Safari</p>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">2️⃣</span>
                  <p className="text-gray-300 text-sm">Escolhe <strong>"Adicionar ao ecrã de início"</strong></p>
                </div>
              </>)}
              <button onClick={() => setShowIosHint(false)} className="w-full py-2.5 rounded-xl bg-gold text-black font-bold text-sm">OK</button>
            </div>
          </div>
        )}

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
            <div className="absolute inset-0 bg-cover bg-no-repeat" style={{ backgroundImage: `url(/backgrounds/${bgPhoto}.jpg)`, backgroundPosition: "center 20%", backgroundSize: "cover" }} />
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

            <div className="flex gap-3 mt-3.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "#0062b1" }} /> Campeão — Promoção à Liga 1
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "#009ce0" }} /> Promoção — Liga 1
              </div>
            </div>

            {/* League Rankings */}
            <div className="mt-8">
              <h3 className="font-display text-2xl tracking-widest text-gold mb-4 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">Ranking da Liga</h3>
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
              const now = Date.now();
              const kickoff = new Date(m.date).getTime();
              const isLive = !played && kickoff <= now && (now - kickoff) < 90 * 60000;
              return (
                <div key={i} className="mb-4 sm:mb-6">
                  <div className="font-display text-lg sm:text-xl tracking-wider text-gray-300 mb-2 flex items-center gap-2 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                    {m.day} <span className="font-body text-[11px] sm:text-xs font-medium text-gray-300 tracking-normal bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">{formatDate(m.date)}</span>
                    {isLive && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Ao vivo
                      </span>
                    )}
                  </div>
                  <div className={`bg-black/60 backdrop-blur-md border rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 transition-colors ${
                    isLive
                      ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                      : `border-white/10 hover:border-gold/20 ${isGalaxy ? "border-l-[3px] border-l-gold" : ""}`
                  }`}>
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                      <div className={`result-badge ${isLive ? "live" : result || "tbd"} shrink-0`}>
                        {isLive ? "▶" : result === "win" ? "V" : result === "loss" ? "D" : result === "draw" ? "E" : "—"}
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <div className={`flex-1 flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm min-w-0 ${m.h === TEAM_ID ? "text-gold" : ""}`}>
                          <img src={teamImg(m.homeLogo)} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover shrink-0 hidden sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span className="truncate">{m.homeName}</span>
                        </div>
                        <div className="flex flex-col items-center shrink-0 gap-1">
                          {played ? (
                            <div className="font-display text-xl sm:text-2xl tracking-widest min-w-[50px] sm:min-w-[70px] text-center">
                              {m.hs}<span className="text-gray-500 text-base sm:text-lg mx-0.5 sm:mx-1">–</span>{m.as}
                            </div>
                          ) : isLive ? (
                            <div className="font-display text-xl sm:text-2xl tracking-widest min-w-[50px] sm:min-w-[70px] text-center text-red-400">
                              {m.hs}<span className="text-red-600 text-base sm:text-lg mx-0.5 sm:mx-1">–</span>{m.as}
                            </div>
                          ) : (
                            <div className="text-[11px] sm:text-[13px] text-gray-300 font-medium min-w-[50px] sm:min-w-[70px] text-center">Por jogar</div>
                          )}
                          {(played || isLive) && m.id && (
                            <button
                              onClick={() => openMatchSummary(m.id, isLive)}
                              disabled={loadingMatchId === m.id}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50 ${
                                isLive
                                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-gold/10 hover:border-gold/30 hover:text-gold"
                              }`}
                            >
                              {loadingMatchId === m.id ? (
                                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                              ) : isLive ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                              )}
                              {isLive ? "Acompanhar" : "Resumo"}
                            </button>
                          )}
                        </div>
                        <div className={`flex-1 flex items-center gap-1.5 sm:gap-2 justify-end font-semibold text-xs sm:text-sm min-w-0 ${m.a === TEAM_ID ? "text-gold" : ""}`}>
                          <span className="truncate">{m.awayName}</span>
                          <img src={teamImg(m.awayLogo)} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover shrink-0 hidden sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
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
            <p className="text-[13px] text-gray-300 -mt-3.5 mb-6 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">{teamName} — Época 2026</p>
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
            <p className="text-[13px] text-gray-300 -mt-3.5 mb-6 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">Performance dos jogadores na {competitionName}</p>
            <div className="glow-line" />

            {/* Top scorers */}
            {(() => {
              const scorers = [...players].filter((p: any) => p.g > 0).sort((a: any, b: any) => b.g - a.g);
              if (!scorers.length) return null;
              return (
                <div className="mb-8">
                  <div className="font-display text-[22px] tracking-wider text-gold mb-3.5 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">🏆 Top Marcadores — {teamName}</div>
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
              { title: "Assistências", emoji: "🎯", key: "a", sub: undefined as string | undefined },
              { title: "Jogos Disputados", emoji: "🏟", key: "gp", sub: undefined as string | undefined },
            ].map(({ title, emoji, key, sub }) => {
              const sorted = [...players].filter((p: any) => p[key] > 0).sort((a: any, b: any) => b[key] - a[key]);
              if (!sorted.length) return null;
              const max = sorted[0][key];
              return (
                <div key={key} className="mb-8">
                  <div className="font-display text-[22px] tracking-wider text-gold mb-3.5 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">{emoji} {title}</div>
                  {sub && <div className="text-xs text-gray-300 -mt-2 mb-3.5 leading-relaxed w-fit bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">{sub}</div>}
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
            <p className="text-[13px] text-gray-300 -mt-3.5 mb-6 w-fit bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">Vídeos dos jogos do {teamName} na {competitionName}</p>
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

      {/* ═══ MATCH SUMMARY MODAL ═══ */}
      {matchSummary && (() => {
        const ms = matchSummary;
        const homeIsGalaxy = ms.idHomeTeam === TEAM_ID;
        const awayIsGalaxy = ms.idVisitorTeam === TEAM_ID;
        const galaxyPlayers: any[] = homeIsGalaxy ? (ms.homePlayers || []) : awayIsGalaxy ? (ms.visitorPlayers || []) : [];
        const oppPlayers: any[] = homeIsGalaxy ? (ms.visitorPlayers || []) : (ms.homePlayers || []);
        const allPlayers = [...(ms.homePlayers || []), ...(ms.visitorPlayers || [])];

        // Player lookup by matchData.idPlayer
        const playerMap: Record<number, { name: string; surname: string; teamId: number }> = {};
        allPlayers.forEach((p: any) => {
          if (p.matchData?.idPlayer) {
            playerMap[p.matchData.idPlayer] = { name: p.name || "", surname: p.surname || "", teamId: p.matchData.idTeam };
          }
        });

        const scorers = galaxyPlayers
          .filter((p: any) => (p.dayResultSummary?.points || 0) > 0)
          .sort((a: any, b: any) => (b.dayResultSummary?.points || 0) - (a.dayResultSummary?.points || 0));

        const assisters = galaxyPlayers
          .filter((p: any) => (p.dayResultSummary?.assistances || 0) > 0)
          .sort((a: any, b: any) => (b.dayResultSummary?.assistances || 0) - (a.dayResultSummary?.assistances || 0));

        const lineup = galaxyPlayers
          .filter((p: any) => p.matchData?.status === 1)
          .sort((a: any, b: any) => (a.teamData?.apparelNumber || 99) - (b.teamData?.apparelNumber || 99));

        const oppScorers = oppPlayers
          .filter((p: any) => (p.dayResultSummary?.points || 0) > 0)
          .sort((a: any, b: any) => (b.dayResultSummary?.points || 0) - (a.dayResultSummary?.points || 0));

        const homeName = ms.homeTeam?.name || "";
        const awayName = ms.visitorTeam?.name || "";
        const homeLogo = ms.homeTeam?.logoImgUrl || "";
        const awayLogo = ms.visitorTeam?.logoImgUrl || "";

        // Build timeline events (chronological order)
        // type 31 = GOAL, type 30 = ASSIST, type 61 = YELLOW CARD, type 70 = MVP
        const relevantTypes = new Set([1, 30, 31, 61, 70, 100]);
        const chronoEvents = [...(ms.events || [])]
          .filter((e: any) => relevantTypes.has(e.type))
          .reverse(); // API returns newest first

        // Inject halftime divider when part changes 1→2
        const timelineItems: any[] = [];
        let lastPart = 1;
        chronoEvents.forEach((e: any) => {
          if (e.part === 2 && lastPart === 1) {
            timelineItems.push({ _divider: "halftime" });
            lastPart = 2;
          }
          timelineItems.push(e);
        });

        function renderEvent(e: any, idx: number) {
          if (e._divider === "halftime") return (
            <div key={idx} className="flex items-center gap-2 py-1.5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Intervalo</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          );

          const isGalaxy = e.idTeam === TEAM_ID;
          const player = e.idPlayer > 0 ? playerMap[e.idPlayer] : null;
          const playerName = player ? `${player.name} ${player.surname}`.trim() : null;
          const min = `${e.matchMinute}'`;

          // GOAL
          if (e.type === 31) {
            return (
              <div key={idx} className={`flex items-center gap-2 py-1 ${isGalaxy ? "" : "opacity-60"}`}>
                {isGalaxy ? (
                  <>
                    <span className="text-[11px] text-gray-500 w-7 text-right font-mono shrink-0">{min}</span>
                    <span className="text-base shrink-0">⚽</span>
                    <span className="text-sm font-semibold text-gold truncate">{playerName || "—"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-300 ml-auto truncate">{playerName || "—"}</span>
                    <span className="text-base shrink-0">⚽</span>
                    <span className="text-[11px] text-gray-500 w-7 font-mono shrink-0">{min}</span>
                  </>
                )}
              </div>
            );
          }

          // ASSIST
          if (e.type === 30) {
            return (
              <div key={idx} className={`flex items-center gap-2 py-0.5 ${isGalaxy ? "" : "opacity-60"}`}>
                {isGalaxy ? (
                  <>
                    <span className="w-7 shrink-0" />
                    <span className="text-sm shrink-0">👟</span>
                    <span className="text-xs text-gray-400 truncate">{playerName || "—"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 ml-auto truncate">{playerName || "—"}</span>
                    <span className="text-sm shrink-0">👟</span>
                    <span className="w-7 shrink-0" />
                  </>
                )}
              </div>
            );
          }

          // YELLOW CARD
          if (e.type === 61) {
            return (
              <div key={idx} className={`flex items-center gap-2 py-1 ${isGalaxy ? "" : "opacity-70"}`}>
                {isGalaxy ? (
                  <>
                    <span className="text-[11px] text-gray-500 w-7 text-right font-mono shrink-0">{min}</span>
                    <span className="text-sm shrink-0">🟨</span>
                    <span className="text-sm font-medium text-gray-200 truncate">{playerName || "—"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-400 ml-auto truncate">{playerName || "—"}</span>
                    <span className="text-sm shrink-0">🟨</span>
                    <span className="text-[11px] text-gray-500 w-7 font-mono shrink-0">{min}</span>
                  </>
                )}
              </div>
            );
          }

          // MVP
          if (e.type === 70) {
            return (
              <div key={idx} className={`flex items-center gap-2 py-1 ${isGalaxy ? "" : "opacity-70"}`}>
                {isGalaxy ? (
                  <>
                    <span className="text-[11px] text-gray-500 w-7 text-right font-mono shrink-0">{min}</span>
                    <span className="text-base shrink-0">👑</span>
                    <span className="text-sm font-semibold text-gold truncate">{playerName || "—"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-300 ml-auto truncate">{playerName || "—"}</span>
                    <span className="text-base shrink-0">👑</span>
                    <span className="text-[11px] text-gray-500 w-7 font-mono shrink-0">{min}</span>
                  </>
                )}
              </div>
            );
          }

          return null;
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { setMatchSummary(null); setLiveMatchId(null); }}
          >
            <div
              className="bg-[#111113] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#111113] border-b border-white/10 px-5 pt-5 pb-4 z-10">
                <div className="flex items-center gap-3 justify-center mb-1">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm font-semibold text-right leading-tight">{homeName}</span>
                    <img src={teamImg(homeLogo)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="font-display text-2xl tracking-widest shrink-0">
                    {ms.homeScore}<span className="text-gray-500 mx-1.5">–</span>{ms.visitorScore}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <img src={teamImg(awayLogo)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-sm font-semibold leading-tight">{awayName}</span>
                  </div>
                </div>
                <div className="text-center text-[10px] text-gray-500 mt-1">{ms.day?.name} · {ms.field?.location}</div>
                <button
                  onClick={() => { setMatchSummary(null); setLiveMatchId(null); }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Timeline */}
                {timelineItems.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Eventos</div>
                    <div className="bg-black/30 rounded-xl border border-white/[0.06] px-3 py-2">
                      {timelineItems.map((e: any, i: number) => renderEvent(e, i))}
                    </div>
                  </div>
                )}

                {/* Scorers */}
                {(scorers.length > 0 || oppScorers.length > 0) && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Marcadores</div>
                    <div className="space-y-1.5">
                      {scorers.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="text-gold text-sm">⚽</span>
                          <span className="font-semibold text-sm text-gold">{p.name} {p.surname}</span>
                          {(p.dayResultSummary?.points || 0) > 1 && (
                            <span className="text-xs text-gray-500 bg-white/5 rounded px-1.5 py-0.5">×{p.dayResultSummary.points}</span>
                          )}
                        </div>
                      ))}
                      {oppScorers.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 opacity-60">
                          <span className="text-gray-400 text-sm">⚽</span>
                          <span className="font-semibold text-sm text-gray-300">{p.name} {p.surname}</span>
                          {(p.dayResultSummary?.points || 0) > 1 && (
                            <span className="text-xs text-gray-500 bg-white/5 rounded px-1.5 py-0.5">×{p.dayResultSummary.points}</span>
                          )}
                          <span className="text-[10px] text-gray-600 ml-auto">{homeIsGalaxy ? awayName : homeName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assists */}
                {assisters.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Assistências</div>
                    <div className="space-y-1.5">
                      {assisters.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <span className="text-sm">👟</span>
                          <span className="font-semibold text-sm text-white">{p.name} {p.surname}</span>
                          {(p.dayResultSummary?.assistances || 0) > 1 && (
                            <span className="text-xs text-gray-500 bg-white/5 rounded px-1.5 py-0.5">×{p.dayResultSummary.assistances}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lineup */}
                {lineup.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Convocados — {homeIsGalaxy ? homeName : awayName}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {lineup.map((p: any, i: number) => {
                        const goals = p.dayResultSummary?.points || 0;
                        const assists = p.dayResultSummary?.assistances || 0;
                        return (
                          <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2">
                            <span className="text-[11px] text-gray-600 font-bold w-5 text-center">{p.teamData?.apparelNumber || "—"}</span>
                            <span className="text-[12px] font-medium truncate flex-1">{p.name} {p.surname}</span>
                            {goals > 0 && <span className="text-[10px] text-gold shrink-0">⚽{goals > 1 ? goals : ""}</span>}
                            {assists > 0 && <span className="text-[10px] text-gray-400 shrink-0">👟{assists > 1 ? assists : ""}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
