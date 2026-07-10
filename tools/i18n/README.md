# Translating the directory + field guide

Everything needed to finish (or redo) the 19-language translation of
`fashion-directory.html` and `field-guide.html`. English is the source of truth and
lives inline in those two HTML files; these JSON files are extracted from them.

## Status (10 Jul 2026)

Infrastructure is **complete and verified**. Translations are **partial** — the session API
limit killed the translator runs twice (resets 12:20pm Asia/Saigon).

**Shipping now** (validated + browser-verified, 81 checks green, 0 page errors):

| Page | Languages |
|---|---|
| Directory (`fd`) | `en` `vi` `zh` `es` `pt` `de` `ko` |
| Field guide (`fg`) | `en` `vi` `es` `pt` |

The field guide's selector offers only its own four; a directory-only language (de/ko/zh)
renders English there **without** overwriting the reader's stored choice, so it comes back
when they return to the directory.

Also done and shipping in every language above:
- `delta.all.json` — 14 screen-reader labels, all 19 languages.
- `delta2.all.json` — 38 route-planner + discover-card strings, all 19 languages.
  These are folded into the bundles at build time (`db.*` into both pages, `fd.rp.*` into
  the directory only). `js/route-panel.js` and `js/discover-brand.js` now resolve through
  the bundle and **rebuild on language change** — they used to bake English in at page load.

Nothing misleading can ship: `manifest.js` is generated from validated bundles only.

## To finish

For each remaining language, produce `out/<lang>/fd.json` and `out/<lang>/fg.json`
with **exactly** the key sets of `fd.en.json` / `fg.en.json`. Still needed:

- directory (`fd`): `ar fr ru ja hi id th it tr tl pl nl fa` — 13 languages
- field guide (`fg`): `zh de ko ar fr ru ja hi id th it tr tl pl nl fa` — 16 languages

Give a translator `TRANSLATION_RULES.md` + `brands.txt` + the English file. For `vi`, pass
`fg.vi.seed.json` as authoritative (25 keys already hand-written) and translate the other 255.

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
