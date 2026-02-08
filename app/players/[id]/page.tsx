"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  email: string | null;
  handicapIndex: number | null;
};

type RecentScore = {
  id: string;
  gross: number;
  net: number | null;
  round: {
    id: string;
    week: number;
    date: string;
  };
};

type PlayerResponse = {
  player: Player;
  recentScores: RecentScore[];
};

type PlayerResult =
  | { id: string; status: "success"; data: PlayerResponse }
  | { id: string; status: "error"; message: string };

export default function PlayerPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [result, setResult] = useState<PlayerResult | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isActive = true;

    fetch(`/api/players/${id}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Unable to load player");
        }
        return response.json() as Promise<PlayerResponse>;
      })
      .then((payload) => {
        if (isActive) {
          setResult({ id, status: "success", data: payload });
        }
      })
      .catch((err) => {
        if (isActive) {
          setResult({
            id,
            status: "error",
            message: err instanceof Error ? err.message : "Unable to load player",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  const loading = Boolean(id) && (!result || result.id !== id);
  const error =
    result?.id === id && result.status === "error" ? result.message : null;
  const data =
    result?.id === id && result.status === "success" ? result.data : null;

  const recentRounds = useMemo(
    () =>
      data?.recentScores.map((score) => ({
        roundId: score.round.id,
        week: score.round.week,
        date: new Date(score.round.date).toISOString().slice(0, 10),
        gross: score.gross,
        net: score.net,
      })) ?? [],
    [data]
  );

  if (!id) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Missing player id
        </h1>
        <p className="text-base text-zinc-700">
          We did not receive a player id in the URL.
        </p>
        <Link
          href="/players"
          className="text-sm font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Back to Players
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Loading player...
        </h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Player Not Found
        </h1>
        <p className="text-base text-zinc-700">{error}</p>
        <Link
          href="/players"
          className="text-sm font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Back to Players
        </Link>
      </section>
    );
  }

  const player = data?.player;

  if (!player) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Player Not Found
        </h1>
        <p className="text-base text-zinc-700">
          We could not find a player with id:{" "}
          <span className="font-semibold text-zinc-900">{id}</span>
        </p>
        <Link
          href="/players"
          className="text-sm font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Back to Players
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          {player.name}
        </h1>
        <div className="text-sm text-zinc-700">
          Email: {player.email ?? "N/A"}
        </div>
        <div className="text-sm text-zinc-700">
          Handicap Index:{" "}
          {player.handicapIndex !== null && player.handicapIndex !== undefined
            ? player.handicapIndex.toFixed(1)
            : "N/A"}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 text-base font-semibold text-zinc-900">
          Recent Rounds
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="border-b text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Week</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Gross</th>
                <th className="px-2 py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {recentRounds.map((round) => (
                <tr key={round.roundId} className="border-b last:border-0">
                  <td className="px-2 py-2">Week {round.week}</td>
                  <td className="px-2 py-2">{round.date}</td>
                  <td className="px-2 py-2">
                    {round.gross !== null ? round.gross : "—"}
                  </td>
                  <td className="px-2 py-2">
                    {round.net !== null ? round.net : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href="/players"
        className="text-sm font-semibold"
        style={{ color: "var(--augusta-green)" }}
      >
        Back to Players
      </Link>
    </section>
  );
}
