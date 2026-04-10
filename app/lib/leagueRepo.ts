import { prisma } from "@/app/lib/prisma";

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

function byDateAsc(a: { date: Date }, b: { date: Date }) {
  return a.date.getTime() - b.date.getTime();
}

export async function getLatestSeason() {
  const season = await prisma.season.findFirst({
    orderBy: { startDate: "desc" },
  });

  if (!season) {
    return null;
  }

  return {
    id: season.id,
    name: season.name,
    startDate: season.startDate,
    endDate: season.endDate,
  };
}

export async function getPlayers() {
  return prisma.player.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getPlayersForSeason(seasonId: string) {
  const hasSeason = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true },
  });

  if (!hasSeason) {
    return [];
  }

  return prisma.player.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getPlayerById(id: string) {
  const player = await prisma.player.findUnique({
    where: { id },
  });

  if (!player) {
    return null;
  }

  return {
    id: player.id,
    name: player.name,
    email: player.email,
    handicapIndex: player.handicapIndex,
  };
}

export async function getRounds() {
  const rounds = await prisma.round.findMany({
    orderBy: { date: "asc" },
  });

  return rounds.map((round) => ({
    id: round.id,
    seasonId: round.seasonId,
    week: round.week,
    date: round.date,
    course: round.course,
    teeTime: round.teeTime,
    players: round.playerCount,
    confirmationNumber: round.confirmationNumber,
  }));
}

export async function getRoundsForSeason(seasonId: string) {
  const rounds = await prisma.round.findMany({
    where: { seasonId },
    orderBy: { date: "asc" },
  });

  return rounds.map((round) => ({
    id: round.id,
    seasonId: round.seasonId,
    week: round.week,
    date: round.date,
    course: round.course,
    teeTime: round.teeTime,
    players: round.playerCount,
    confirmationNumber: round.confirmationNumber,
  }));
}

export async function getRoundById(id: string) {
  const round = await prisma.round.findUnique({ where: { id } });

  if (!round) {
    return null;
  }

  return {
    id: round.id,
    seasonId: round.seasonId,
    week: round.week,
    date: round.date,
    course: round.course,
    teeTime: round.teeTime,
    players: round.playerCount,
    confirmationNumber: round.confirmationNumber,
  };
}

export async function getScoresForRound(roundId: string) {
  const scores = await prisma.score.findMany({
    where: { roundId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return scores
    .map((score) => ({
      id: score.id,
      roundId: score.roundId,
      playerId: score.playerId,
      gross: score.gross,
      net: score.net,
      player: {
        id: score.player.id,
        name: score.player.name,
      },
    }))
    .sort((a, b) => byNameAsc(a.player, b.player));
}

export async function getRecentScoresForPlayer(playerId: string, limit: number) {
  const rows = await prisma.score.findMany({
    where: { playerId },
    include: {
      round: {
        select: {
          id: true,
          week: true,
          date: true,
        },
      },
    },
    orderBy: {
      round: {
        date: "desc",
      },
    },
    take: limit,
  });

  return rows.map((score) => ({
    id: score.id,
    roundId: score.roundId,
    playerId: score.playerId,
    gross: score.gross,
    net: score.net,
    round: {
      id: score.round.id,
      week: score.round.week,
      date: score.round.date,
    },
  }));
}

export async function getStandingsForSeason(
  seasonId: string
): Promise<StandingRow[]> {
  const seasonPlayers = await getPlayersForSeason(seasonId);
  const seasonScores = await getSeasonScoreRows(seasonId);

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

  for (const score of seasonScores) {
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
  const rows = await prisma.score.findMany({
    where: {
      round: {
        seasonId,
      },
    },
    include: {
      round: {
        select: {
          id: true,
          week: true,
          date: true,
        },
      },
      player: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return rows
    .map((score) => ({
      roundId: score.round.id,
      roundWeek: score.round.week,
      roundDate: score.round.date,
      playerId: score.player.id,
      playerName: score.player.name,
      gross: score.gross,
      net: score.net,
    }))
    .sort((a, b) => byDateAsc({ date: a.roundDate }, { date: b.roundDate }));
}

export async function upsertScoresForRound(
  roundId: string,
  updates: Array<{ playerId: string; gross: number; net: number | null }>
) {
  await prisma.$transaction(
    updates.map((update) =>
      prisma.score.upsert({
        where: {
          roundId_playerId: {
            roundId,
            playerId: update.playerId,
          },
        },
        update: {
          gross: update.gross,
          net: update.net,
        },
        create: {
          id: `score-${roundId}-${update.playerId}`,
          roundId,
          playerId: update.playerId,
          gross: update.gross,
          net: update.net,
        },
      })
    )
  );
}
