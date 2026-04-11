import { createRound } from "@/app/lib/leagueRepo";

export async function POST(request: Request) {
  const adminEditKey = process.env.ADMIN_EDIT_KEY?.trim();
  if (!adminEditKey) {
    return Response.json({ error: "Admin editing is disabled." }, { status: 503 });
  }
  const providedKey = request.headers.get("x-admin-key")?.trim();
  if (!providedKey || providedKey !== adminEditKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    seasonId?: string;
    week?: number;
    date?: string;
    course?: string;
    teeTime?: string;
    playerCount?: number;
    confirmationNumber?: string;
  } | null;

  if (!body?.seasonId || !body?.week || !body?.date) {
    return Response.json({ error: "seasonId, week, and date are required" }, { status: 400 });
  }

  const round = await createRound({
    seasonId: body.seasonId,
    week: Number(body.week),
    date: new Date(body.date),
    course: body.course?.trim() || null,
    teeTime: body.teeTime?.trim() || null,
    playerCount: body.playerCount != null ? Number(body.playerCount) : null,
    confirmationNumber: body.confirmationNumber?.trim() || null,
  });

  return Response.json({ round }, { status: 201 });
}
