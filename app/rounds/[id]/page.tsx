"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Round = {
  id: string;
  week: number;
  date: string;
  seasonId: string;
  course: string | null;
  teeTime: string | null;
  players: number | null;
  confirmationNumber: string | null;
};

type RoundScore = {
  id: string;
  gross: number;
  net: number | null;
  player: {
    id: string;
    name: string;
  };
};

type RoundResponse = {
  round: Round;
  scores: RoundScore[];
};

type RoundResult =
  | { id: string; status: "success"; data: RoundResponse }
  | { id: string; status: "error"; message: string };

type EditableScore = {
  playerId: string;
  gross: string;
  net: string;
};

type EditableScoresMap = Record<string, EditableScore>;

type ToastState = {
  message: string;
  tone: "success" | "error";
};

function scoreSort(a: RoundScore, b: RoundScore, useNet: boolean) {
  if (useNet) {
    return (a.net ?? 0) - (b.net ?? 0);
  }
  return a.gross - b.gross;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RoundDetailPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [result, setResult] = useState<RoundResult | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editableScores, setEditableScores] = useState<EditableScoresMap>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let isActive = true;

    fetch(`/api/rounds/${id}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Unable to load round");
        }
        return response.json() as Promise<RoundResponse>;
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
            message: err instanceof Error ? err.message : "Unable to load round",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  const loading = Boolean(id) && (!result || result.id !== id);
  const error =
    result?.id === id && result.status === "error" ? result.message : null;
  const data =
    result?.id === id && result.status === "success" ? result.data : null;

  const round = data?.round;
  const roundScores = useMemo(() => data?.scores ?? [], [data]);

  useEffect(() => {
    const next: EditableScoresMap = {};
    for (const score of roundScores) {
      next[score.player.id] = {
        playerId: score.player.id,
        gross: String(score.gross),
        net: score.net !== null ? String(score.net) : "",
      };
    }
    setEditableScores(next);
  }, [roundScores]);

  const allNetPresent = roundScores.every(
    (score) => score.net !== null && score.net !== undefined
  );

  const leaderboard = useMemo(() => {
    return roundScores.slice().sort((a, b) => scoreSort(a, b, allNetPresent));
  }, [roundScores, allNetPresent]);

  function updateScoreField(
    playerId: string,
    field: "gross" | "net",
    value: string
  ) {
    setSaveMessage(null);
    setEditableScores((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? { playerId, gross: "", net: "" }),
        [field]: value,
      },
    }));
  }

  async function saveScores() {
    if (!round || !adminKey.trim()) {
      const message = "Enter the admin key to save scores.";
      setSaveMessage(message);
      setToast({ message, tone: "error" });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payloadScores = leaderboard.map((score) => {
        const form = editableScores[score.player.id];
        const gross = Number.parseInt(form?.gross ?? "", 10);
        const netText = (form?.net ?? "").trim();
        const net = netText.length ? Number.parseInt(netText, 10) : null;

        if (!Number.isInteger(gross)) {
          throw new Error(`Gross score missing/invalid for ${score.player.name}`);
        }

        if (netText.length && !Number.isInteger(net)) {
          throw new Error(`Net score invalid for ${score.player.name}`);
        }

        return {
          playerId: score.player.id,
          gross,
          net,
        };
      });

      const response = await fetch(`/api/rounds/${round.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({ scores: payloadScores }),
      });

      const json = (await response.json().catch(() => null)) as
        | { error?: string; scores?: RoundScore[] }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Unable to save scores");
      }

      setResult((current) => {
        if (!current || current.id !== id || current.status !== "success") {
          return current;
        }
        return {
          ...current,
          data: {
            ...current.data,
            scores: json?.scores ?? current.data.scores,
          },
        };
      });
      setSaveMessage("Scores saved.");
      setToast({ message: "Scores saved.", tone: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save scores";
      setSaveMessage(message);
      setToast({ message, tone: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Loading round...
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
          Round Not Found
        </h1>
        <p className="text-base text-zinc-700">{error}</p>
        <Link
          href="/rounds"
          className="text-sm font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Back to Rounds
        </Link>
      </section>
    );
  }

  if (!round) {
    return (
      <section className="space-y-4">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Round Not Found
        </h1>
        <p className="text-base text-zinc-700">
          We could not find a round with id: <span className="font-semibold text-zinc-900">{id}</span>
        </p>
        <Link
          href="/rounds"
          className="text-sm font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Back to Rounds
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-3 py-2 text-sm font-medium text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--augusta-green)" }}
        >
          Round {round.week}
        </h1>
        <div className="text-sm text-zinc-700">
          {new Date(round.date).toISOString().slice(0, 10)} • {leaderboard.length} Players Scored
        </div>
        <div className="text-sm text-zinc-700">Course: {round.course ?? "TBD"}</div>
        <div className="text-sm text-zinc-700">Tee Time: {round.teeTime ?? "TBD"}</div>
        <div className="text-xs text-zinc-600">
          Confirmation: {round.confirmationNumber ?? "N/A"}
        </div>
      </div>

      <div className="trip-card rounded-lg p-4">
        <div className="mb-3 text-base font-semibold text-zinc-900">Score Entry (Admin)</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex w-full max-w-sm flex-col gap-1 text-sm text-zinc-700">
            Admin key
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              type="password"
              className="rounded border px-2 py-2"
              placeholder="Enter admin key"
            />
          </label>
          <button
            type="button"
            onClick={saveScores}
            disabled={isSaving}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Scores"}
          </button>
        </div>
        <div className="mt-2 text-xs text-zinc-600">
          Set `ADMIN_EDIT_KEY` in your deploy environment to enable score edits.
        </div>
        {saveMessage ? <div className="mt-2 text-sm text-zinc-700">{saveMessage}</div> : null}
      </div>

      <div className="trip-card rounded-lg p-4">
        <div className="mb-3 text-base font-semibold text-zinc-900">Leaderboard + Entry</div>

        <div className="space-y-3 sm:hidden">
          {leaderboard.map((entry) => {
            const editable = editableScores[entry.player.id] ?? {
              playerId: entry.player.id,
              gross: String(entry.gross),
              net: entry.net !== null ? String(entry.net) : "",
            };

            return (
              <div key={entry.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                    {getInitials(entry.player.name)}
                  </div>
                  <div className="font-semibold text-zinc-900">{entry.player.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Gross
                    <input
                      value={editable.gross}
                      onChange={(event) =>
                        updateScoreField(entry.player.id, "gross", event.target.value)
                      }
                      inputMode="numeric"
                      className="mt-1 w-full rounded border px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Net
                    <input
                      value={editable.net}
                      onChange={(event) =>
                        updateScoreField(entry.player.id, "net", event.target.value)
                      }
                      inputMode="numeric"
                      placeholder="optional"
                      className="mt-1 w-full rounded border px-2 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="border-b text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Player</th>
                <th className="px-2 py-2">Gross</th>
                <th className="px-2 py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const editable = editableScores[entry.player.id] ?? {
                  playerId: entry.player.id,
                  gross: String(entry.gross),
                  net: entry.net !== null ? String(entry.net) : "",
                };

                return (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="px-2 py-2 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                          {getInitials(entry.player.name)}
                        </div>
                        <span>{entry.player.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editable.gross}
                        onChange={(event) =>
                          updateScoreField(entry.player.id, "gross", event.target.value)
                        }
                        inputMode="numeric"
                        className="w-24 rounded border px-2 py-2"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={editable.net}
                        onChange={(event) =>
                          updateScoreField(entry.player.id, "net", event.target.value)
                        }
                        inputMode="numeric"
                        placeholder="optional"
                        className="w-24 rounded border px-2 py-2"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href="/rounds"
        className="text-sm font-semibold"
        style={{ color: "var(--augusta-green)" }}
      >
        Back to Rounds
      </Link>
    </section>
  );
}
