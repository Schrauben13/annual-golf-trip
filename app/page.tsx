import Link from "next/link";
import Image from "next/image";
import {
  getLatestSeason,
  getPlayersForSeason,
  getRoundsForSeason,
  getSeasonScoreRows,
  getStandingsForSeason,
} from "./lib/leagueRepo";

export default async function Home() {
  const season = await getLatestSeason();
  const players = season ? await getPlayersForSeason(season.id) : [];
  const rounds = season ? await getRoundsForSeason(season.id) : [];
  const seasonScores = season ? await getSeasonScoreRows(season.id) : [];
  const standings = season ? await getStandingsForSeason(season.id) : [];
  const leader = standings
    .slice()
    .sort((a, b) => {
      const netA = a.totalNet ?? Number.POSITIVE_INFINITY;
      const netB = b.totalNet ?? Number.POSITIVE_INFINITY;
      if (netA !== netB) {
        return netA - netB;
      }
      return a.totalGross - b.totalGross;
    })[0];

  const roundEntries = new Map<string, number>();
  for (const score of seasonScores) {
    roundEntries.set(score.roundId, (roundEntries.get(score.roundId) ?? 0) + 1);
  }

  const roundsRemaining = rounds.filter(
    (round) => (roundEntries.get(round.id) ?? 0) < players.length
  ).length;

  const lowestRound = seasonScores
    .slice()
    .sort((a, b) => {
      const scoreA = a.net ?? a.gross;
      const scoreB = b.net ?? b.gross;
      return scoreA - scoreB;
    })[0];

  return (
    <section className="space-y-6">
      <div className="flex justify-center sm:justify-start">
        <Image
          src="/kiawah-logo.png"
          alt="Kiawah Island 2026 logo"
          width={220}
          height={220}
          className="h-auto w-40 sm:w-52"
          priority
        />
      </div>
      <h1
        className="text-3xl font-semibold"
        style={{ color: "var(--augusta-green)" }}
      >
        Kiawah Island Golf Trip
      </h1>

      <div className="trip-card rounded-lg p-5 text-sm text-zinc-700">
        <div className="text-base font-semibold text-zinc-900">
          {season?.name ?? "Trip Season"}
        </div>
        <div>Dates: May 11, 2026 to May 13, 2026</div>
        <div className="mt-2">
          Players: {players.map((player) => player.name).join(", ")}
        </div>
        <div>Rounds Scheduled: {rounds.length}</div>
        <div>
          Current Leader: {leader ? leader.playerName : "No scores entered yet"}
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Tee Times
          </div>
          {rounds.map((round) => (
            <div key={round.id} className="rounded-md border border-zinc-200 bg-white p-3">
              <div className="font-semibold text-zinc-900">{round.course ?? `Round ${round.week}`}</div>
              <div>Date: {round.date.toISOString().slice(0, 10)}</div>
              <div>Time: {round.teeTime ?? "TBD"}</div>
              <div>Players: {round.players ?? players.length}</div>
              <div>Confirmation: {round.confirmationNumber ?? "N/A"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="trip-card grid gap-3 rounded-lg p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Leader</div>
          <div className="text-base font-semibold text-zinc-900">
            {leader?.playerName ?? "TBD"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Lowest Round
          </div>
          <div className="text-base font-semibold text-zinc-900">
            {lowestRound
              ? `${lowestRound.playerName} (${lowestRound.net ?? lowestRound.gross})`
              : "No rounds yet"}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Rounds Remaining
          </div>
          <div className="text-base font-semibold text-zinc-900">
            {roundsRemaining}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/players"
          className="trip-card rounded-lg p-4 font-semibold text-zinc-900"
        >
          View Players
        </Link>
        <Link
          href="/rounds"
          className="trip-card rounded-lg p-4 font-semibold text-zinc-900"
        >
          Enter/View Scores
        </Link>
        <Link
          href="/standings"
          className="trip-card rounded-lg p-4 font-semibold text-zinc-900"
        >
          Trip Standings
        </Link>
      </div>
    </section>
  );
}
