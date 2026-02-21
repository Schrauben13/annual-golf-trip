import {
  players as mockPlayers,
  rounds as mockRounds,
  scores as mockScores,
  seasons as mockSeasons,
} from "./mockLeague";

export type StandingRow = {
  playerId: string;
  playerName: string;
  roundsPlayed: number;
  totalGross: number;
  totalNet: number | null;
};

export type SeasonScoreRow = {
  roundId: string;
  roundWeek: number;
  roundDate: Date;
  playerId: string;
  playerName: string;
  gross: number;
  net: number | null;
};

type Season = {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
};

type Player = {
  id: string;
  name: string;
  email: string | null;
  handicapIndex: number | null;
};

type Round = {
  id: string;
  seasonId: string;
  week: number;
  date: Date;
  course: string | null;
  teeTime: string | null;
  players: number | null;
  confirmationNumber: string | null;
};

type Score = {
  id: string;
  roundId: string;
  playerId: string;
  gross: number;
  net: number | null;
};

const seasons: Season[] = mockSeasons.map((season) => ({
  id: season.id,
  name: season.name,
  startDate: season.startDate ? new Date(season.startDate) : null,
  endDate: season.endDate ? new Date(season.endDate) : null,
}));

const players: Player[] = mockPlayers.map((player) => ({
  id: player.id,
  name: player.name,
  email: player.email ?? null,
  handicapIndex: player.handicapIndex ?? null,
}));

const rounds: Round[] = mockRounds.map((round) => ({
  id: round.id,
  seasonId: round.seasonId,
  week: round.week,
  date: new Date(round.date),
  course: round.course ?? null,
  teeTime: round.teeTime ?? null,
  players: round.players ?? null,
  confirmationNumber: round.confirmationNumber ?? null,
}));

const scoreStore: Score[] = mockScores.map((score) => ({
  id: score.id,
  roundId: score.roundId,
  playerId: score.playerId,
  gross: score.gross,
  net: score.net ?? null,
}));

function byNameAsc(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function byDateAsc(a: { date: Date }, b: { date: Date }) {
  return a.date.getTime() - b.date.getTime();
}

function byStartDateDesc(a: Season, b: Season) {
  return (
    new Date(b.startDate ?? "1970-01-01").getTime() -
    new Date(a.startDate ?? "1970-01-01").getTime()
  );
}

export async function getLatestSeason() {
  return seasons.slice().sort(byStartDateDesc)[0] ?? null;
}

export async function getPlayers() {
  return players.slice().sort(byNameAsc);
}

export async function getPlayersForSeason(seasonId: string) {
  const hasSeason = seasons.some((season) => season.id === seasonId);
  if (!hasSeason) {
    return [];
  }

  return players.slice().sort(byNameAsc);
}

export async function getPlayerById(id: string) {
  return players.find((player) => player.id === id) ?? null;
}

export async function getRounds() {
  return rounds.slice().sort(byDateAsc);
}

export async function getRoundsForSeason(seasonId: string) {
  return rounds.filter((round) => round.seasonId === seasonId).sort(byDateAsc);
}

export async function getRoundById(id: string) {
  return rounds.find((round) => round.id === id) ?? null;
}

export async function getScoresForRound(roundId: string) {
  return scoreStore
    .filter((score) => score.roundId === roundId)
    .map((score) => {
      const player = players.find((entry) => entry.id === score.playerId);
      return {
        id: score.id,
        roundId: score.roundId,
        playerId: score.playerId,
        gross: score.gross,
        net: score.net,
        player: {
          id: player?.id ?? score.playerId,
          name: player?.name ?? "Unknown",
        },
      };
    });
}

export async function getRecentScoresForPlayer(playerId: string, limit: number) {
  return scoreStore
    .filter((score) => score.playerId === playerId)
    .map((score) => {
      const round = rounds.find((entry) => entry.id === score.roundId);
      return {
        id: score.id,
        roundId: score.roundId,
        playerId: score.playerId,
        gross: score.gross,
        net: score.net,
        round: {
          id: round?.id ?? score.roundId,
          week: round?.week ?? 0,
          date: round?.date ?? new Date("1970-01-01"),
        },
      };
    })
    .sort((a, b) => b.round.date.getTime() - a.round.date.getTime())
    .slice(0, limit);
}

export async function getStandingsForSeason(
  seasonId: string
): Promise<StandingRow[]> {
  const seasonPlayers = await getPlayersForSeason(seasonId);
  const seasonRounds = await getRoundsForSeason(seasonId);
  const seasonRoundIds = new Set(seasonRounds.map((round) => round.id));

  const totals = new Map<
    string,
    { gross: number; netSum: number; netCount: number; rounds: number }
  >();

  for (const seasonPlayer of seasonPlayers) {
    totals.set(seasonPlayer.id, {
      gross: 0,
      netSum: 0,
      netCount: 0,
      rounds: 0,
    });
  }

  for (const score of scoreStore.filter((entry) => seasonRoundIds.has(entry.roundId))) {
    const current = totals.get(score.playerId) ?? {
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

    totals.set(score.playerId, current);
  }

  return seasonPlayers.map((seasonPlayer) => {
    const current = totals.get(seasonPlayer.id) ?? {
      gross: 0,
      netSum: 0,
      netCount: 0,
      rounds: 0,
    };

    return {
      playerId: seasonPlayer.id,
      playerName: seasonPlayer.name,
      roundsPlayed: current.rounds,
      totalGross: current.gross,
      totalNet: current.netCount > 0 ? current.netSum : null,
    };
  });
}

export async function getSeasonScoreRows(
  seasonId: string
): Promise<SeasonScoreRow[]> {
  const seasonRounds = await getRoundsForSeason(seasonId);
  const roundMap = new Map(seasonRounds.map((round) => [round.id, round]));

  return scoreStore
    .filter((score) => roundMap.has(score.roundId))
    .map((score) => {
      const round = roundMap.get(score.roundId)!;
      const player = players.find((entry) => entry.id === score.playerId);

      return {
        roundId: round.id,
        roundWeek: round.week,
        roundDate: round.date,
        playerId: score.playerId,
        playerName: player?.name ?? "Unknown",
        gross: score.gross,
        net: score.net,
      };
    });
}

export async function upsertScoresForRound(
  roundId: string,
  updates: Array<{ playerId: string; gross: number; net: number | null }>
) {
  for (const update of updates) {
    const existingIndex = scoreStore.findIndex(
      (entry) => entry.roundId === roundId && entry.playerId === update.playerId
    );

    if (existingIndex >= 0) {
      scoreStore[existingIndex] = {
        ...scoreStore[existingIndex],
        gross: update.gross,
        net: update.net,
      };
      continue;
    }

    scoreStore.push({
      id: `score-${roundId}-${update.playerId}`,
      roundId,
      playerId: update.playerId,
      gross: update.gross,
      net: update.net,
    });
  }
}
