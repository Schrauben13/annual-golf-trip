import Link from "next/link";
import {
  getLatestSeason,
  getPlayersForSeason,
  getRoundsForSeason,
  getSeasonScoreRows,
} from "../lib/leagueRepo";

export default async function RoundsPage() {
  const season = await getLatestSeason();
  const rounds = season ? await getRoundsForSeason(season.id) : [];
  const players = season ? await getPlayersForSeason(season.id) : [];
  const seasonScores = season ? await getSeasonScoreRows(season.id) : [];

  const entriesByRound = new Map<string, number>();
  for (const score of seasonScores) {
    entriesByRound.set(score.roundId, (entriesByRound.get(score.roundId) ?? 0) + 1);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Rounds
        </h1>
        <p className="text-base text-zinc-700">
          Select a round to view leaderboard and enter scores.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rounds.map((round) => {
          const entered = entriesByRound.get(round.id) ?? 0;
          const total = players.length || 0;
          const isComplete = total > 0 && entered >= total;

          return (
            <Link
              key={round.id}
              href={`/rounds/${round.id}`}
              className="trip-card rounded-lg p-4 transition hover:shadow-sm"
              style={{ borderColor: "var(--augusta-gold)" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-base font-semibold text-zinc-900">
                  Round {round.week}
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    isComplete
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isComplete ? "Complete" : "In Progress"}
                </span>
              </div>
              <div className="text-sm text-zinc-700">
                Date: {round.date.toISOString().slice(0, 10)}
              </div>
              <div className="text-sm text-zinc-700">Course: {round.course ?? "TBD"}</div>
              <div className="text-sm text-zinc-700">Tee Time: {round.teeTime ?? "TBD"}</div>
              <div className="text-xs text-zinc-600">
                Confirmation: {round.confirmationNumber ?? "N/A"}
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                {entered}/{total} scores entered
              </div>
              <div className="mt-1 h-2 rounded-full bg-zinc-200">
                <div
                  className="h-2 rounded-full bg-emerald-600"
                  style={{
                    width: `${total > 0 ? Math.min((entered / total) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
