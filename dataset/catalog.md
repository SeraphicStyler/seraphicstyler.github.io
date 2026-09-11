# Directory workspace and catalog contract

The integrated directory is a static, offline-capable application. It does not require PostgreSQL or an API deployment. Existing checkout and intake destinations are unchanged.

## Views

- `/fashion-directory` — compact search; 24 results per page, exact identity ranking, live facet counts, removable filters, rich-card alternative.
- `/fashion-directory?view=explore` — category collections, fabric entry points, signature houses, retail-cluster notes.
- `/fashion-directory?view=record&brand=daniv-dear` — operational facts, location observations, channels, attributes, editorial notes, evidence limits, and separate sourcing/styling actions.
- `/fashion-directory?view=compare` — existing shortlist comparison.
- `/fashion-directory?view=visit` — district filters and existing route planner.
- `/fashion-directory?view=buy` — saved garment references and reviewed service-request brief.
- `/dataset/catalog-review.html` — read-only quality review, not an authenticated admin editor.

Existing `#q=`, `#zone=`, category filters, and section links still work. View changes preserve filters. Browser Back/Forward restores views; compact/rich presentation and current result page are transient. The small contextual question disclosure sends to the same directory assistant as the quiet Ask launcher. No questions are sent to the local API, persisted, or transmitted by the new guide input.

New workspace labels and record explanations are English. Existing translated filters remain; the workspace visibly labels this scope. With JavaScript disabled or workspace initialization unavailable, the existing directory/static A–Z reference remains usable.

## Data migration

`js/directory-catalog.js` is the shared normalizer and query contract. It preserves all 321 legacy entries and stable name/subtitle-derived IDs. Shared handles are flagged for review, not automatically merged: a handle may serve multiple legitimate locations or product lines.

The adapter separates channel references, explicit address observations, house attributes, editorial notes, and import events. It splits only explicit ` + ` address delimiters; ambiguous fragments and extra branches remain unresolved notes. No street normalization, missing ward, exact geocode, verified history, availability, legal name, international shipping permission, or price band is guessed. Geocoded street points are explicitly different from verified entrances. Multi-location coordinate associations are held back rather than assigned arbitrarily.

Legacy notes may mention hours; without a weekday schedule, source date, and current exceptions those do **not** establish “open now.” Every imported record starts unverified with a null review timestamp. This means “evidence not encoded,” not “the business is unreliable.” The historical page-level review date remains on the reference page and is not copied to individual records.

Generate deterministic, reviewable snapshots:

```sh
node tools/build-directory-catalog.cjs
```

Outputs: `dataset/catalog-brands.json`, `dataset/catalog-quality.json`. A rebuild does not create a new verification date. `catalog-schema.sql` is a PostgreSQL migration artifact for a future deployment; it has not been applied to a database. Sources and verification events have actual entity foreign keys; dated verification needs evidence, and event history is append-only. Saved trays remain local. `catalog-openapi.json` documents the implemented local endpoints.

## Optional local API

```sh
node tools/catalog-api.cjs
```

Binds only to `127.0.0.1:8732`. It reads the same checked-in data, performs no external requests, and writes no inquiries, saved sets, or records. The website continues to query the shared adapter directly; this server is a working local API contract, not an endpoint deployed to GitHub Pages.

- `GET /api/v1/brands` — `q`, `category`, `district`, `tier`, `material`, `occasion`, `visit_mode`, `verification`, `sort=az`, `page`, `page_size` (1–100).
- `GET /api/v1/brands/:slug` — one canonical imported record.
- `GET /api/v1/brands/:slug/compare-fields` — comparable attributes.
- `GET /api/v1/facets` — disjunctive counts; the current dimension is excluded when counting its alternatives.
- `GET /api/v1/districts/summary?city=SGN` — district associations, not distinct-door totals; a house may belong to more than one district.
- `GET /api/v1/quality` — evidence and normalization gaps.
- `POST /api/v1/compare` — `{ "brand_ids": ["daniv-dear", "resel-studio"] }`; maximum three, no persistence.
- `POST /api/v1/routes/plan` — `{ "brand_ids": ["daniv-dear", "whose-studio"], "mode": "walk" }`. Maximum eight, first eligible house is the starting stop. Returns route estimates and explicit exclusions. No live road/traffic or opening-status promises.

Unsupported `open_now=true` queries return 422. A future backend must evaluate reviewed weekday hours in each location’s IANA timezone, including overnight hours and exceptions. A text match to an old time range must never become a live availability badge.

Ranking guarantees exact name/handle/channel matches ahead of note matches. Other matching uses the existing accent-insensitive AND/OR vocabulary, with conservative one-edit or transposition name matches labeled as similar names. Recognized fabric/category vocabulary never falls back to fuzzy brand guesses. Confirmation flags modestly affect non-exact ranking; no arbitrary freshness bonus is applied without dated evidence. Search is deterministic; it is not a general language model. Unrecognized/ambiguous requests remain handled by the existing guide.

## Validation

Run `node tools/verify-catalog.cjs` for real catalog invariants, rankings, facet behavior, API statuses, and route exclusion behavior. Run `tools/verify-directory-workspace.cjs` with `SS_PUPPETEER` pointing at the installed Puppeteer package for integrated browser checks.

A physical mobile keyboard, screen-reader speech output, and a deployed PostgreSQL migration require separate environment-specific testing. No deployment is included.

### Verified in the local preview

- Catalog/API contract suite passed: identity ranking, cautious typo matching, facets, record lookup, comparison, invalid input, and route exclusions.
- Workspace suite passed at 320, 390, 768, 1024, and 1440px, including view history, filters, record navigation, rich/compact modes, assistant entry, dark mode, and no-JavaScript rendering.
- Existing assistant suite passed, including 200% zoom, keyboard/voice focus, safe text handling, and no question transmission/storage.
- Decision suite passed: district counts and selection, comparisons, shared tray, garment notes, review/copy, and separate sourcing/Trace/styling destinations.
- Launcher/reference suite passed: deep links, reset/rapid toggles, reduced motion, focus restoration, and all 321 static entries.
- Search regression suite passed all 54 checks. Desktop/mobile screenshots were inspected. Blocking the workspace script still leaves the prior directory and static reference usable.

### Main implementation files

- `fashion-directory.html` / `js/directory.js`: markup, shared render hooks, truthful hours handling, and component loading.
- `js/directory-workspace.js` / `css/directory-workspace.css`: views, compact results, canonical records, contextual guide entry, responsive layout.
- `js/directory-catalog.js`: normalized records and shared query logic.
- `js/directory-discovery.js`: comparison matrix and view-aware saved-board actions.
- `js/directory-guide.js`: guide-to-workspace handoff.
- `js/fd-basket.js`: tray opens on request by default; an explicitly saved dock preference still applies.
- `tools/build-directory-catalog.cjs`, `tools/catalog-api.cjs`: deterministic exports and optional local API.
- `dataset/catalog-review.html`, `catalog-brands.json`, `catalog-quality.json`, `catalog-openapi.json`, `catalog-schema.sql`: review surface and implementation artifacts.

Shared appearance is owned by `js/theme.js`; language DOM updates use `js/i18n-dom.js`. The directory header exposes language and appearance settings. Newly added workspace controls have translations, while detailed guidance and source notes still include English; see the local translation audit before claiming full-page coverage.
