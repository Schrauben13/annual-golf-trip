import Link from "next/link";
import { getLatestSeason, getPlayersForSeason } from "../lib/leagueRepo";
import { PlayerAvatar } from "../components/PlayerAvatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayersPage() {
  const season = await getLatestSeason();
  const players = season ? await getPlayersForSeason(season.id) : [];

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Players
        </h1>
        <p className="text-base text-zinc-700">
          {season?.name ?? "Trip"} roster.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="trip-card rounded-lg p-4 transition hover:shadow-sm"
            style={{ borderColor: "var(--augusta-gold)" }}
          >
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} size={40} />
              <div className="text-base font-semibold text-zinc-900">
                {player.name}
              </div>
            </div>
            <div className="text-sm text-zinc-700">
              Handicap Index:{" "}
              {player.handicapIndex !== null && player.handicapIndex !== undefined
                ? player.handicapIndex.toFixed(1)
                : "N/A"}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
