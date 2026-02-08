# Annual Golf Trip (Kiawah 2026)

A Next.js app for sharing Kiawah Island golf trip info with your group.

Current mode is **no database**:
- Trip data is hardcoded in `app/lib/mockLeague.ts`
- Runtime data access is in-memory via `app/lib/leagueRepo.ts`
- Score edits (if enabled) are process-memory only and reset on deploy/restart

## Local Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel, click **New Project** and import `annual-golf-trip`.
3. Framework preset: **Next.js**.
4. Build command: `npm run build` (default).
5. Output: default.
6. Add environment variable (optional, but recommended for editing):
   - `ADMIN_EDIT_KEY` = a strong secret value
7. Deploy.

If `ADMIN_EDIT_KEY` is not set, score editing endpoints are disabled and the app is read-only.

## Notes for Feedback Phase

- This version is ideal for quick UX feedback.
- For persistent shared scoring, add a real DB later and replace `leagueRepo` internals.
