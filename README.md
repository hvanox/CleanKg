# CleanKg prototype — web demo

**Статус: прототип / демо.** Web part of the final-round prototype ([ADR-0007](../../Docs/06-decisions/0007-prototype-for-final-round.md)). Task FE-P01 in [Docs/04-tasks/prototype.md](../../Docs/04-tasks/prototype.md). Design: [Docs/07-design/prototipe.md](../../Docs/07-design/prototipe.md). It is not the production web app.

## Screens in this stage

| Route | Screen |
|---|---|
| `/` | Landing (redesign 20.10.2026): the mechanism, lifecycle, categories and volunteer rules, sourced facts (Docs/05-pitch/facts.md), SDG 11.6, the prototype screens; main action «Открыть карту» |
| `/map` | S1 public map: markers from the API, filters by status and category, popup, empty state |
| `/new` | S2 report creation: placeholder photo «ФОТО · ДЕМО», category, point, description, anonymous option |
| `/r/{id}` | S3 report card: category, status timeline, comment and confirmation counts |
| `/org` | S4 organisation queue (demo operator account): reports of the fixed demo area in priority order, claim and resolve, only the changes the lifecycle allows |
| `/mod` | S5 moderation queue (demo moderator account): approve, reject with a reason from the fixed list of four |

## Requirements

- Node.js 20.9 or newer (developed on 22), npm
- The mock API from [../api/README.md](../api/README.md) running on port 8000 (seeded with `python -m app.seed`)

## Install and run

```bash
cd prototipe/web
npm install
npm run dev          # http://localhost:3000
```

The API base URL comes from the environment variable `NEXT_PUBLIC_API_BASE_URL`. Without it, the browser calls port 8000 on the host the page was opened from (`localhost`, `127.0.0.1`, or the LAN address a phone uses). The dev server accepts `localhost`, `127.0.0.1` and this machine's LAN addresses (`allowedDevOrigins` in `next.config.ts`; Next 16 otherwise refuses its dev resources to other hosts and the page never hydrates, which left every queue on «Загружаем очередь…»). For a phone, also start the API with `--host 0.0.0.0` (see `api/README.md`).

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010 npm run dev
```

The variable is read at build time, so restart `npm run dev` (or rebuild) after changing it.

The map tiles come from `tile.openstreetmap.org`, so the map background needs an internet connection; markers and every other screen work without it.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test             # vitest: string table, formats, S2 and S3 rules, S4 and S5 rules
```

## How it is built

- Next.js (App Router), TypeScript, TanStack Query for the API calls, Leaflet with `leaflet.markercluster` for the maps (the API returns points; clustering happens in the browser, as in the API README).
- **Tokens:** one CSS variable block, `src/styles/tokens.css`, from design brief section 2. Component styles (`src/app/globals.css`) and components use `var(--kg-…)` only.
- **Strings:** one table, `src/i18n/ru.ts` and `src/i18n/ky.ts`. Kyrgyz strings are placeholders («Кыргызча · демо-текст» is shown under the banner). Fixed terms stay Russian: «Житель», «не подключена», «демо», «Прототип».
- **Fonts:** Onest and JetBrains Mono (SIL OFL, texts in `public/fonts/OFL-*.txt`, origin in [THIRD_PARTY.md](THIRD_PARTY.md)), variable font files with the deck's subsets. JetBrains Mono has no Ңң; the browser falls back to Onest for those glyphs.
- **Demo accounts:** S2 sends `X-Actor-Id` for the chosen demo persona. S4 acts as «Оператор · демо» (`X-Actor-Id` 2, `actor_kind` operator) and S5 as «Модератор · демо» (`X-Actor-Id` 4, `actor_kind` moderator); the ids sit in `src/lib/personas.ts` and are never shown.
- **Queues (S4, S5):** built on the client from `GET /api/v1/reports` with the fixed demo area `DEMO_SERVICE_AREA` (`src/lib/config.ts`) and the API status filter, sorted by priority then age in `src/lib/queue.ts`. What an operator or moderator may do is derived from the transition table of the API README, in the same file.

## Known gaps (deliberate, not worked around)

- S3 shows no priority score: the API returns one number and no four factors (see Notes in the task file).
- S3 has no subscribe button (no API), no comment field, and no volunteer action.
- S2 has no duplicate hint and no AI category suggestion (no API); the photo is a placeholder tile, nothing is taken or uploaded, and there is no gallery or file picker.
- The organisation line reads «не подключена · демо»: the API links no organisation to a report.
- The popup and card show no district: the API has none.

### Gaps of S4 and S5 (deliberate, not worked around)

- No queue endpoint: queues are built from the list endpoint on the client.
- No service area in the API: one fixed demo area, labelled «демо»; no area filter.
- No priority score and no four factors: rows are ordered by the API's priority number, the screen shows the position only («№ в очереди»).
- No merge endpoint: S5 shows the read-only note «Объединение дубликатов: не в прототипе».
- No «approve» for a moderator in the API: `submitted → under_review` is a `system` step. S5 sends it with `actor_kind` system from the moderator account and says so on the screen (`APPROVE_ACTOR_KIND` in `src/lib/queue.ts`, one line to change).
- No plan date, no named assignee, no CSV export in S4; «Исполнитель» shows «Волонтёр · демо» or «Оператор · демо» from the claim.
- The reason `other` is not offered (it needs free text).
