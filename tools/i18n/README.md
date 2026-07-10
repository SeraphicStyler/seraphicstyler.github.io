# Translating the directory + field guide

Everything needed to finish (or redo) the 19-language translation of
`fashion-directory.html` and `field-guide.html`. English is the source of truth and
lives inline in those two HTML files; these JSON files are extracted from them.

## Status (10 Jul 2026, later session)

Infrastructure is **complete and verified**. The directory is done in all 20 languages.
The field guide has 14 of 20; six remain.

**Shipping now** (validated + browser-verified — 44 checks green in the latest pass, 0 page
errors, on top of the 305 checks green from the previous pass):

| Page | Languages |
|---|---|
| Directory (`fd`) | `en` `vi` `zh` `es` `ar` `fr` `pt` `ru` `ja` `de` `ko` `hi` `id` `th` `it` `tr` `tl` `pl` `nl` `fa` `zgh` — all 20 |
| Field guide (`fg`) | `en` `vi` `zh` `es` `ar` `fr` `pt` `ru` `ja` `de` `ko` `id` `it` `tr` `zgh` — 14 of 20 |

Still needed on the field guide only (their directory half already ships): `hi` `th` `tl`
`pl` `nl` `fa`.

**Amazigh (zgh)** — Standard Moroccan Tamazight in Tifinagh script — added as a 20th
language, both pages, plus the widget/a11y deltas. Tifinagh is left-to-right; don't add it
to the `RTL` map in `js/i18n-page.js`. It needs `Noto Sans Tifinagh` (loaded in both pages'
`<head>`) — the brand fonts have no Tifinagh glyphs. **Bug found while shipping it:** the
font rule was originally `[lang="zgh"]{font-family:...}`, which does nothing, because
`body`/`h1`/etc. each declare their own `font-family` from `var(--font-body)` /
`var(--font-display)`, and an own-declaration always wins over an inherited value from an
ancestor. Fixed by overriding those custom properties on `html[lang="zgh"]` instead — every
rule that reads the variable then inherits the new value. Same pattern would apply to any
future script the brand fonts don't cover.

**Arabic (ar) — refined**, not re-translated: an editing pass for strict Modern Standard
Arabic register (no dialectal vocabulary), grammatical agreement (a singular-tamyīz count
form was fixed to the correct plural for "9 districts"), consistent terminology across
`fd.json`/`fg.json`/`delta.all.json`/`delta2.all.json` (e.g. one word for "district", one
for "house/listing" — previously drifted between files), and orthographic consistency
(tanwīn-on-alif vs tanwīn-on-consonant, normalized to one convention throughout).

The field guide's selector offers only its own languages; a directory-only language (hi,
th, tl, pl, nl, fa) renders English there **without** overwriting the reader's stored
choice, so it comes back when they return to the directory.

Also done and shipping in every language including zgh:
- `delta.all.json` — 14 screen-reader labels.
- `delta2.all.json` — 38 route-planner + discover-card strings.
  These are folded into the bundles at build time (`db.*` into both pages, `fd.rp.*` into
  the directory only). `js/route-panel.js` and `js/discover-brand.js` resolve through
  the bundle and **rebuild on language change** — they used to bake English in at page load.

Nothing misleading can ship: `manifest.js` is generated from validated bundles only.

## To finish

The directory is done. Only the field guide has gaps — produce `out/<lang>/fg.json` with
**exactly** the key set of `fg.en.json` (280 keys) for each of:

- `hi` `th` `tl` `pl` `nl` `fa` — 6 languages, `out/<lang>/fd.json` already exists for all six

Give a translator `TRANSLATION_RULES.md` + `brands.txt` + `fg.en.json`, and have them skim
an already-shipped `fg.json` (e.g. `out/fr/fg.json`) for house terminology and how the SVG
copy-link blocks / HTML were handled. Have them build the object incrementally (several
`Object.assign` passes with a key-count check) rather than one giant write — several earlier
attempts were lost to mid-response truncation on this exact file.

Run these in small batches — 19 concurrent agents exhausted the session API limit. Four or
five at a time, `fd` before `fg` (it is 5× smaller and unblocks a language sooner).

Then:

    cd tools/i18n
    node validate-build.js          # report only
    node validate-build.js --build  # validate, compile js/i18n/, rewrite manifest

The build refuses to ship a language unless **both** pages validate — otherwise a reader
could choose it on the directory and lose it on the field guide. It also prunes stale
bundles and folds `delta.all.json` into each one. Bump `CACHE` in `service-worker.js`
afterwards, then run the browser check:

    node <scratch>/verify-i18n.js   # or re-create: switches every language on both pages

## What the validator enforces

Key parity with English · `{placeholder}` parity · inline-HTML tag/attribute parity ·
no empty values · no markdown fences · flags prose returned byte-identical to English.

## Never translate

Brand names, house notes, addresses, phone numbers, prices, times, URLs, and Vietnamese
place names (Phú Nhuận, Thảo Điền, Đồng Khởi). Those are the words a reader shows a driver
or a shop assistant. "District 1" *is* translated. `áo dài`, `áo chống nắng`, `xe ôm` stay
Vietnamese, glossed once where a language needs it.
