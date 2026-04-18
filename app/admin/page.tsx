"use client";

import { useEffect, useState } from "react";

type Trip = { id: string; name: string };
type ToastState = { message: string; tone: "success" | "error" };
type Tab = "trip" | "player" | "round" | "historical";
type Player = { id: string; name: string };

type HistoricalScore = { gross: string; net: string };

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [tab, setTab] = useState<Tab>("trip");
  const [seasons, setSeasons] = useState<Trip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Season form
  const [seasonName, setSeasonName] = useState("");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");

  // Player form
  const [playerName, setPlayerName] = useState("");
  const [playerHandicap, setPlayerHandicap] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");

  // Round form
  const [roundSeasonId, setRoundSeasonId] = useState("");
  const [roundWeek, setRoundWeek] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [roundCourse, setRoundCourse] = useState("");
  const [roundTeeTime, setRoundTeeTime] = useState("");
  const [roundPlayerCount, setRoundPlayerCount] = useState("");
  const [roundConfirmation, setRoundConfirmation] = useState("");

  // Historical round form
  const [histSeasonId, setHistSeasonId] = useState("");
  const [histDate, setHistDate] = useState("");
  const [histCourse, setHistCourse] = useState("");
  const [histWeek, setHistWeek] = useState("");
  const [histScores, setHistScores] = useState<Record<string, HistoricalScore>>({});

  useEffect(() => {
    const stored = localStorage.getItem("adminKey");
    if (stored) setAdminKey(stored);
  }, []);

  useEffect(() => {
    if (adminKey) localStorage.setItem("adminKey", adminKey);
  }, [adminKey]);

  function loadSeasons() {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: { seasons?: Trip[] }) => {
        const list = data.seasons ?? [];
        setSeasons(list);
        if (list.length > 0 && !roundSeasonId) setRoundSeasonId(list[0].id);
        if (list.length > 0 && !histSeasonId) setHistSeasonId(list[0].id);
      })
      .catch(() => {});
  }

  function loadPlayers() {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: { players?: Player[] }) => {
        const list = data.players ?? [];
        setPlayers(list);
        const initial: Record<string, HistoricalScore> = {};
        for (const p of list) initial[p.id] = { gross: "", net: "" };
        setHistScores(initial);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadSeasons();
    loadPlayers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(message: string, tone: "success" | "error") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  }

  async function postWithKey(url: string, body: object) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey.trim(),
      },
      body: JSON.stringify(body),
    });
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  }

  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postWithKey("/api/seasons", {
        name: seasonName.trim(),
        startDate: seasonStart || null,
        endDate: seasonEnd || null,
      });
      showToast("Trip created!", "success");
      setSeasonName("");
      setSeasonStart("");
      setSeasonEnd("");
      loadSeasons();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postWithKey("/api/players", {
        name: playerName.trim(),
        email: playerEmail.trim() || null,
        handicapIndex: playerHandicap ? Number(playerHandicap) : null,
      });
      showToast("Player added!", "success");
      setPlayerName("");
      setPlayerHandicap("");
      setPlayerEmail("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddRound(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postWithKey("/api/rounds", {
        seasonId: roundSeasonId,
        week: Number(roundWeek),
        date: roundDate,
        course: roundCourse.trim() || null,
        teeTime: roundTeeTime.trim() || null,
        playerCount: roundPlayerCount ? Number(roundPlayerCount) : null,
        confirmationNumber: roundConfirmation.trim() || null,
      });
      showToast("Round added!", "success");
      setRoundWeek("");
      setRoundDate("");
      setRoundCourse("");
      setRoundTeeTime("");
      setRoundPlayerCount("");
      setRoundConfirmation("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddHistoricalRound(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scores = players
        .map((p) => {
          const s = histScores[p.id];
          const grossText = (s?.gross ?? "").trim();
          if (!grossText) return null;
          const gross = Number.parseInt(grossText, 10);
          const netText = (s?.net ?? "").trim();
          const net = netText ? Number.parseInt(netText, 10) : null;
          if (!Number.isInteger(gross)) throw new Error(`Invalid gross score for ${p.name}`);
          if (netText && !Number.isInteger(net)) throw new Error(`Invalid net score for ${p.name}`);
          return { playerId: p.id, gross, net };
        })
        .filter(Boolean);

      if (scores.length === 0) throw new Error("Enter at least one gross score.");

      const roundRes = await postWithKey("/api/rounds", {
        seasonId: histSeasonId,
        week: histWeek ? Number(histWeek) : 1,
        date: histDate,
        course: histCourse.trim() || null,
        teeTime: null,
        playerCount: null,
        confirmationNumber: null,
      });

      const roundId = (roundRes as { round?: { id: string } })?.round?.id;
      if (!roundId) throw new Error("Failed to create round");

      await fetch(`/api/rounds/${roundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey.trim() },
        body: JSON.stringify({ scores }),
      }).then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error ?? "Failed to save scores");
        }
      });

      showToast("Historical round saved!", "success");
      setHistDate("");
      setHistCourse("");
      setHistWeek("");
      const reset: Record<string, HistoricalScore> = {};
      for (const p of players) reset[p.id] = { gross: "", net: "" };
      setHistScores(reset);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

  return (
    <section className="space-y-6">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <h1 className="text-3xl font-semibold" style={{ color: "var(--augusta-green)" }}>
        Admin Setup
      </h1>

      <div className="trip-card rounded-lg p-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-zinc-700">
          Admin Key
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin key"
            className={inputClass}
          />
        </label>
        <p className="mt-1 text-xs text-zinc-500">Saved locally in your browser.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["trip", "player", "round", "historical"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {t === "trip" ? "Create Trip" : t === "player" ? "Add Player" : t === "round" ? "Add Round" : "Historical Round"}
          </button>
        ))}
      </div>

      {tab === "trip" && (
        <form onSubmit={handleCreateSeason} className="trip-card space-y-4 rounded-lg p-5">
          <div className="text-base font-semibold text-zinc-900">Create Trip</div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Trip Name *
            <input
              required
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Kiawah Island 2026"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Start Date
              <input
                type="date"
                value={seasonStart}
                onChange={(e) => setSeasonStart(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              End Date
              <input
                type="date"
                value={seasonEnd}
                onChange={(e) => setSeasonEnd(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Trip"}
          </button>
        </form>
      )}

      {tab === "player" && (
        <form onSubmit={handleAddPlayer} className="trip-card space-y-4 rounded-lg p-5">
          <div className="text-base font-semibold text-zinc-900">Add Player</div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Full Name *
            <input
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Nathan Schrauben"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Handicap Index
            <input
              type="number"
              step="0.1"
              value={playerHandicap}
              onChange={(e) => setPlayerHandicap(e.target.value)}
              className={inputClass}
              placeholder="e.g. 12.4"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Email (optional)
            <input
              type="email"
              value={playerEmail}
              onChange={(e) => setPlayerEmail(e.target.value)}
              className={inputClass}
              placeholder="email@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Player"}
          </button>
        </form>
      )}

      {tab === "round" && (
        <form onSubmit={handleAddRound} className="trip-card space-y-4 rounded-lg p-5">
          <div className="text-base font-semibold text-zinc-900">Add Round</div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Trip *
            <select
              required
              value={roundSeasonId}
              onChange={(e) => setRoundSeasonId(e.target.value)}
              className={inputClass}
            >
              {seasons.length === 0 && (
                <option value="">No trips yet — create one first</option>
              )}
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Week # *
              <input
                required
                type="number"
                min="1"
                value={roundWeek}
                onChange={(e) => setRoundWeek(e.target.value)}
                className={inputClass}
                placeholder="1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Date *
              <input
                required
                type="date"
                value={roundDate}
                onChange={(e) => setRoundDate(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Course Name
            <input
              value={roundCourse}
              onChange={(e) => setRoundCourse(e.target.value)}
              className={inputClass}
              placeholder="e.g. Ocean Course"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Tee Time
              <input
                value={roundTeeTime}
                onChange={(e) => setRoundTeeTime(e.target.value)}
                className={inputClass}
                placeholder="e.g. 8:30 AM"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Player Count
              <input
                type="number"
                min="1"
                value={roundPlayerCount}
                onChange={(e) => setRoundPlayerCount(e.target.value)}
                className={inputClass}
                placeholder="e.g. 4"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Confirmation #
            <input
              value={roundConfirmation}
              onChange={(e) => setRoundConfirmation(e.target.value)}
              className={inputClass}
              placeholder="optional"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || !roundSeasonId}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Round"}
          </button>
        </form>
      )}
      {tab === "historical" && (
        <form onSubmit={handleAddHistoricalRound} className="trip-card space-y-4 rounded-lg p-5">
          <div className="text-base font-semibold text-zinc-900">Add Historical Round</div>
          <p className="text-xs text-zinc-500">Enter a past round and scores in one step.</p>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Trip *
            <select
              required
              value={histSeasonId}
              onChange={(e) => setHistSeasonId(e.target.value)}
              className={inputClass}
            >
              {seasons.length === 0 && (
                <option value="">No trips yet — create one first</option>
              )}
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Date *
              <input
                required
                type="date"
                value={histDate}
                onChange={(e) => setHistDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Course Name
              <input
                value={histCourse}
                onChange={(e) => setHistCourse(e.target.value)}
                className={inputClass}
                placeholder="e.g. Ocean Course"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              Round #
              <input
                type="number"
                min="1"
                value={histWeek}
                onChange={(e) => setHistWeek(e.target.value)}
                className={inputClass}
                placeholder="1"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-700">Scores</div>
            {players.length === 0 && (
              <p className="text-xs text-zinc-500">No players found — add players first.</p>
            )}
            {players.map((p) => (
              <div key={p.id} className="grid grid-cols-3 items-center gap-3">
                <div className="text-sm font-medium text-zinc-900">{p.name}</div>
                <label className="flex flex-col gap-0.5 text-xs text-zinc-500">
                  Gross
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={histScores[p.id]?.gross ?? ""}
                    onChange={(e) =>
                      setHistScores((prev) => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] ?? { gross: "", net: "" }), gross: e.target.value },
                      }))
                    }
                    className={inputClass}
                    placeholder="—"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-xs text-zinc-500">
                  Net
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={histScores[p.id]?.net ?? ""}
                    onChange={(e) =>
                      setHistScores((prev) => ({
                        ...prev,
                        [p.id]: { ...(prev[p.id] ?? { gross: "", net: "" }), net: e.target.value },
                      }))
                    }
                    className={inputClass}
                    placeholder="optional"
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !histSeasonId || !histDate}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Historical Round"}
          </button>
        </form>
      )}
    </section>
  );
}
