"use client";

import { useEffect, useState } from "react";

type Season = { id: string; name: string };
type ToastState = { message: string; tone: "success" | "error" };
type Tab = "season" | "player" | "round";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [tab, setTab] = useState<Tab>("season");
  const [seasons, setSeasons] = useState<Season[]>([]);
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
      .then((data: { seasons?: Season[] }) => {
        const list = data.seasons ?? [];
        setSeasons(list);
        if (list.length > 0 && !roundSeasonId) setRoundSeasonId(list[0].id);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadSeasons();
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
      showToast("Season created!", "success");
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
        {(["season", "player", "round"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {t === "season" ? "Create Season" : t === "player" ? "Add Player" : "Add Round"}
          </button>
        ))}
      </div>

      {tab === "season" && (
        <form onSubmit={handleCreateSeason} className="trip-card space-y-4 rounded-lg p-5">
          <div className="text-base font-semibold text-zinc-900">Create Season</div>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Season Name *
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
            {submitting ? "Creating..." : "Create Season"}
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
            Season *
            <select
              required
              value={roundSeasonId}
              onChange={(e) => setRoundSeasonId(e.target.value)}
              className={inputClass}
            >
              {seasons.length === 0 && (
                <option value="">No seasons yet — create one first</option>
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
    </section>
  );
}
