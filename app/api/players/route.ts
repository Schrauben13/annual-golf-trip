import { createPlayer } from "@/app/lib/leagueRepo";

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
    email?: string;
    handicapIndex?: number | null;
  } | null;

  if (!body?.name?.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const player = await createPlayer({
    name: body.name.trim(),
    email: body.email?.trim() || null,
    handicapIndex: body.handicapIndex != null ? Number(body.handicapIndex) : null,
  });

  return Response.json({ player }, { status: 201 });
}
