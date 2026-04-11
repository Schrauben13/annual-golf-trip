import { getAllSeasons, createSeason } from "@/app/lib/leagueRepo";

export async function GET() {
  const seasons = await getAllSeasons();
  return Response.json({ seasons });
}

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
    name?: string;
    startDate?: string;
    endDate?: string;
  } | null;

  if (!body?.name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const season = await createSeason({
    name: body.name.trim(),
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
  });

  return Response.json({ season }, { status: 201 });
}
