import { getPlayerById, getRecentScoresForPlayer } from "@/app/lib/leagueRepo";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  const recentScores = await getRecentScoresForPlayer(player.id, 3);

  return Response.json({
    player: {
      id: player.id,
      name: player.name,
      email: player.email,
      handicapIndex: player.handicapIndex,
    },
    recentScores: recentScores.map((score) => ({
      id: score.id,
      gross: score.gross,
      net: score.net,
      round: {
        id: score.round.id,
        week: score.round.week,
        date: score.round.date.toISOString(),
      },
    })),
  });
}
