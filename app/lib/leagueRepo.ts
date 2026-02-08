import { prisma } from "./prisma";
import { players as mockPlayers, rounds as mockRounds, scores as mockScores, seasons as mockSeasons } from "./mockLeague";

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

function byNameAsc(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function byDateAsc(a: { date: string | Date }, b: { date: string | Date }) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function byStartDateDesc(
  a: { startDate: string | Date | null | undefined },
  b: { startDate: string | Date | null | undefined }
) {
  return (
    new Date(b.startDate ?? "1970-01-01").getTime() -
    new Date(a.startDate ?? "1970-01-01").getTime()
  );
}

export async function getLatestSeason() {
  try {
    return await prisma.season.findFirst({
      orderBy: { startDate: "desc" },
    });
  } catch {
    return mockSeasons.slice().sort(byStartDateDesc)[0] ?? null;
  }
}

export async function getPlayers() {
  try {
    return await prisma.player.findMany({
      orderBy: { name: "asc" },
    });
  } catch {
    return mockPlayers.slice().sort(byNameAsc);
  }
}

export async function getPlayersForSeason(seasonId: string) {
  try {
    const seasonPlayers = await prisma.seasonPlayer.findMany({
      where: { seasonId },
      include: {
        player: true,
      },
      orderBy: {
        player: { name: "asc" },
      },
    });

    return seasonPlayers.map((row) => row.player);
  } catch {
    const hasSeason = mockSeasons.some((season) => season.id === seasonId);
    if (!hasSeason) {
      return [];
    }
    return mockPlayers.slice().sort(byNameAsc);
  }
}

export async function getPlayerById(id: string) {
  try {
    return await prisma.player.findUnique({
      where: { id },
    });
  } catch {
    return mockPlayers.find((player) => player.id === id) ?? null;
  }
}

export async function getRounds() {
  try {
    return await prisma.round.findMany({
      orderBy: { date: "asc" },
    });
  } catch {
    return mockRounds
      .slice()
      .sort(byDateAsc)
      .map((round) => ({ ...round, date: new Date(round.date) }));
  }
}

export async function getRoundsForSeason(seasonId: string) {
  try {
    return await prisma.round.findMany({
      where: { seasonId },
      orderBy: { date: "asc" },
    });
  } catch {
    return mockRounds
      .filter((round) => round.seasonId === seasonId)
      .sort(byDateAsc)
      .map((round) => ({ ...round, date: new Date(round.date) }));
  }
}

export async function getRoundById(id: string) {
  try {
    return await prisma.round.findUnique({
      where: { id },
    });
  } catch {
    const round = mockRounds.find((entry) => entry.id === id);
    return round ? { ...round, date: new Date(round.date) } : null;
  }
}

export async function getScoresForRound(roundId: string) {
  try {
    return await prisma.score.findMany({
      where: { roundId },
      include: {
        player: {
          select: { id: true, name: true },
        },
      },
    });
  } catch {
    return mockScores
      .filter((score) => score.roundId === roundId)
      .map((score) => {
        const player = mockPlayers.find((entry) => entry.id === score.playerId);
        return {
          id: score.id,
          roundId: score.roundId,
          playerId: score.playerId,
          gross: score.gross,
          net: score.net ?? null,
          player: {
            id: player?.id ?? score.playerId,
            name: player?.name ?? "Unknown",
          },
        };
      });
  }
}

export async function getRecentScoresForPlayer(playerId: string, limit: number) {
  try {
    return await prisma.score.findMany({
      where: { playerId },
      include: {
        round: {
          select: { id: true, week: true, date: true },
        },
      },
      orderBy: {
        round: { date: "desc" },
      },
      take: limit,
    });
  } catch {
    return mockScores
      .filter((score) => score.playerId === playerId)
      .map((score) => {
        const round = mockRounds.find((entry) => entry.id === score.roundId);
        return {
          id: score.id,
          roundId: score.roundId,
          playerId: score.playerId,
          gross: score.gross,
          net: score.net ?? null,
          round: {
            id: round?.id ?? score.roundId,
            week: round?.week ?? 0,
            date: new Date(round?.date ?? "1970-01-01"),
          },
        };
      })
      .sort((a, b) => b.round.date.getTime() - a.round.date.getTime())
      .slice(0, limit);
  }
}

export async function getStandingsForSeason(
  seasonId: string
): Promise<StandingRow[]> {
  let seasonPlayers: Array<{ playerId: string; player: { id: string; name: string } }> = [];
  let scores: Array<{ playerId: string; gross: number; net: number | null }> = [];

  try {
    seasonPlayers = await prisma.seasonPlayer.findMany({
      where: { seasonId },
      include: {
        player: {
          select: { id: true, name: true },
        },
      },
    });

    scores = await prisma.score.findMany({
      where: {
        round: { seasonId },
      },
      select: {
        playerId: true,
        gross: true,
        net: true,
      },
    });
  } catch {
    const hasSeason = mockSeasons.some((season) => season.id === seasonId);
    if (!hasSeason) {
      return [];
    }
    seasonPlayers = mockPlayers
      .slice()
      .sort(byNameAsc)
      .map((player) => ({
        playerId: player.id,
        player: { id: player.id, name: player.name },
      }));

    const seasonRoundIds = new Set(
      mockRounds
        .filter((round) => round.seasonId === seasonId)
        .map((round) => round.id)
    );

    scores = mockScores
      .filter((score) => seasonRoundIds.has(score.roundId))
      .map((score) => ({
        playerId: score.playerId,
        gross: score.gross,
        net: score.net ?? null,
      }));
  }

  const totals = new Map<
    string,
    { gross: number; netSum: number; netCount: number; rounds: number }
  >();

  for (const seasonPlayer of seasonPlayers) {
    totals.set(seasonPlayer.playerId, {
      gross: 0,
      netSum: 0,
      netCount: 0,
      rounds: 0,
    });
  }

  for (const score of scores) {
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
    const current = totals.get(seasonPlayer.playerId) ?? {
      gross: 0,
      netSum: 0,
      netCount: 0,
      rounds: 0,
    };
    return {
      playerId: seasonPlayer.playerId,
      playerName: seasonPlayer.player.name,
      roundsPlayed: current.rounds,
      totalGross: current.gross,
      totalNet: current.netCount > 0 ? current.netSum : null,
    };
  });
}

export async function getSeasonScoreRows(
  seasonId: string
): Promise<SeasonScoreRow[]> {
  try {
    const scores = await prisma.score.findMany({
      where: { round: { seasonId } },
      include: {
        round: {
          select: { id: true, week: true, date: true },
        },
        player: {
          select: { id: true, name: true },
        },
      },
    });

    return scores.map((score) => ({
      roundId: score.round.id,
      roundWeek: score.round.week,
      roundDate: score.round.date,
      playerId: score.player.id,
      playerName: score.player.name,
      gross: score.gross,
      net: score.net,
    }));
  } catch {
    const seasonRounds = mockRounds.filter((round) => round.seasonId === seasonId);
    const roundMap = new Map(seasonRounds.map((round) => [round.id, round]));

    return mockScores
      .filter((score) => roundMap.has(score.roundId))
      .map((score) => {
        const round = roundMap.get(score.roundId)!;
        const player = mockPlayers.find((entry) => entry.id === score.playerId);
        return {
          roundId: round.id,
          roundWeek: round.week,
          roundDate: new Date(round.date),
          playerId: score.playerId,
          playerName: player?.name ?? "Unknown",
          gross: score.gross,
          net: score.net ?? null,
        };
      });
  }
}
