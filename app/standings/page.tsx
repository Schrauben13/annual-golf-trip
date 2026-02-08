import {
  getLatestSeason,
  getPlayersForSeason,
  getRoundsForSeason,
  getSeasonScoreRows,
  getStandingsForSeason,
} from "../lib/leagueRepo";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildLeaderboard(
  rows: Array<{
    playerId: string;
    playerName: string;
    totalNet: number | null;
    totalGross: number;
    roundsPlayed: number;
  }>
) {
  return rows.slice().sort((a, b) => {
    const totalNetA = a.totalNet ?? Number.POSITIVE_INFINITY;
    const totalNetB = b.totalNet ?? Number.POSITIVE_INFINITY;
    if (totalNetA !== totalNetB) {
      return totalNetA - totalNetB;
    }
    return a.totalGross - b.totalGross;
  });
}

export default async function StandingsPage() {
  const season = await getLatestSeason();

  const standings = season ? await getStandingsForSeason(season.id) : [];
  const players = season ? await getPlayersForSeason(season.id) : [];
  const rounds = season ? await getRoundsForSeason(season.id) : [];
  const seasonScores = season ? await getSeasonScoreRows(season.id) : [];

  const leaderboard = buildLeaderboard(standings);

  const sortedRounds = rounds
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const previousRoundId =
    sortedRounds.length > 1 ? sortedRounds[sortedRounds.length - 2].id : null;

  const previousRoundOrder = new Map(
    sortedRounds.map((round, index) => [round.id, index])
  );

  const previousScores = previousRoundId
    ? seasonScores.filter((score) => {
        const index = previousRoundOrder.get(score.roundId);
        const previousIndex = previousRoundOrder.get(previousRoundId);
        return (
          index !== undefined &&
          previousIndex !== undefined &&
          index <= previousIndex
        );
      })
    : [];

  const previousTotals = new Map<
    string,
    { gross: number; netSum: number; netCount: number; rounds: number }
  >();

  for (const player of players) {
    previousTotals.set(player.id, { gross: 0, netSum: 0, netCount: 0, rounds: 0 });
  }

  for (const score of previousScores) {
    const current = previousTotals.get(score.playerId) ?? {
      gross: 0,
      netSum: 0,
      netCount: 0,
      rounds: 0,
    };
    current.gross += score.gross;
    current.rounds += 1;
    if (score.net !== null) {
      current.netSum += score.net;
      current.netCount += 1;
    }
    previousTotals.set(score.playerId, current);
  }

  const previousLeaderboard = buildLeaderboard(
    players.map((player) => {
      const total = previousTotals.get(player.id) ?? {
        gross: 0,
        netSum: 0,
        netCount: 0,
        rounds: 0,
      };

      return {
        playerId: player.id,
        playerName: player.name,
        roundsPlayed: total.rounds,
        totalGross: total.gross,
        totalNet: total.netCount > 0 ? total.netSum : null,
      };
    })
  );

  const previousRankByPlayer = new Map(
    previousLeaderboard.map((entry, index) => [entry.playerId, index + 1])
  );

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Trip Standings
        </h1>
        <div className="text-sm text-zinc-700">
          {season?.name ?? "Season"} • Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="trip-card rounded-lg p-4">
        <div className="mb-3 text-base font-semibold text-zinc-900">
          Season Totals
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="border-b text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Rank</th>
                <th className="px-2 py-2">Move</th>
                <th className="px-2 py-2">Player</th>
                <th className="px-2 py-2">Rounds</th>
                <th className="px-2 py-2">Total Net</th>
                <th className="px-2 py-2">Total Gross</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const currentRank = index + 1;
                const previousRank = previousRankByPlayer.get(entry.playerId);
                const movement =
                  previousRank === undefined ? null : previousRank - currentRank;
                const movementText =
                  movement === null
                    ? "NEW"
                    : movement > 0
                      ? `+${movement}`
                      : movement < 0
                        ? `${movement}`
                        : "—";

                return (
                  <tr key={entry.playerId} className="border-b last:border-0">
                    <td className="px-2 py-2">{currentRank}</td>
                    <td
                      className={`px-2 py-2 font-semibold ${
                        movement !== null && movement > 0
                          ? "text-emerald-700"
                          : movement !== null && movement < 0
                            ? "text-rose-700"
                            : "text-zinc-500"
                      }`}
                    >
                      {movementText}
                    </td>
                    <td className="px-2 py-2 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                          {getInitials(entry.playerName)}
                        </div>
                        <span>{entry.playerName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">{entry.roundsPlayed}</td>
                    <td className="px-2 py-2">
                      {entry.totalNet !== null ? entry.totalNet : "—"}
                    </td>
                    <td className="px-2 py-2">{entry.totalGross}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
