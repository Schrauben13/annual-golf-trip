import {
  getPlayersForSeason,
  getRoundById,
  getScoresForRound,
  upsertScoresForRound,
} from "@/app/lib/leagueRepo";

const ADMIN_EDIT_KEY = process.env.ADMIN_EDIT_KEY;

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const round = await getRoundById(id);

  if (!round) {
    return Response.json({ error: "Round not found" }, { status: 404 });
  }

  const scores = await getScoresForRound(round.id);

  return Response.json({
    round: {
      id: round.id,
      week: round.week,
      date: round.date.toISOString(),
      seasonId: round.seasonId,
      course: round.course,
      teeTime: round.teeTime,
      players: round.players,
      confirmationNumber: round.confirmationNumber,
    },
    scores: scores.map((score) => ({
      id: score.id,
      gross: score.gross,
      net: score.net,
      player: {
        id: score.player.id,
        name: score.player.name,
      },
    })),
  });
}

type PatchPayload = {
  scores: Array<{
    playerId: string;
    gross: number;
    net: number | null;
  }>;
};

function isValidStrokeCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 40 && value <= 200;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  if (!ADMIN_EDIT_KEY) {
    return Response.json(
      { error: "Admin editing is disabled. Configure ADMIN_EDIT_KEY to enable it." },
      { status: 503 }
    );
  }

  const providedKey = request.headers.get("x-admin-key");
  if (!providedKey || providedKey !== ADMIN_EDIT_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const round = await getRoundById(id);
  if (!round) {
    return Response.json({ error: "Round not found" }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as PatchPayload | null;
  if (!payload || !Array.isArray(payload.scores) || payload.scores.length === 0) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const seasonPlayers = await getPlayersForSeason(round.seasonId);
  const validPlayerIds = new Set(seasonPlayers.map((entry) => entry.id));

  for (const score of payload.scores) {
    if (!validPlayerIds.has(score.playerId)) {
      return Response.json(
        { error: `Invalid player id: ${score.playerId}` },
        { status: 400 }
      );
    }
    if (!isValidStrokeCount(score.gross)) {
      return Response.json(
        { error: `Invalid gross score for player ${score.playerId}` },
        { status: 400 }
      );
    }
    if (score.net !== null && !isValidStrokeCount(score.net)) {
      return Response.json(
        { error: `Invalid net score for player ${score.playerId}` },
        { status: 400 }
      );
    }
  }

  await upsertScoresForRound(round.id, payload.scores);

  const updatedScores = await getScoresForRound(round.id);
  return Response.json({
    ok: true,
    scores: updatedScores.map((score) => ({
      id: score.id,
      gross: score.gross,
      net: score.net,
      player: {
        id: score.player.id,
        name: score.player.name,
      },
    })),
  });
}
