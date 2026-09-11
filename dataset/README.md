# The Saigon Fashion Directory

321 Vietnamese fashion houses, recorded in person in Ho Chi Minh City and beyond.

**Version 1.0.0 · last reviewed 2026-08-28 · CC BY 4.0**

## What this is

A working directory of Vietnamese fashion businesses — boutiques, ateliers, áo dài
tailors, vintage sellers, lingerie counters and market stalls — kept by a personal
shopper who walks them. Each record carries a street address, a category, how the
house actually sells (walk-in, by appointment, through a stockist, online only), a
price tier where one is known, and a short editorial note.

Most of it is not available anywhere else. Many of these houses sell only inside
Vietnam, take only local payment, or trade entirely through Instagram and Zalo, so
they appear in no international listing and often on no map.

## Files

| File | What it is |
|---|---|
| `saigon-fashion-directory.csv` | One row per house, 20 columns. Opens in anything. |
| `saigon-fashion-directory.json` | The same records, plus dataset metadata and caveats. |

A live, filterable version is at <https://www.seraphicstyler.com/fashion-directory>,
and a read-only JSON API at <https://api.seraphicstyler.com> (no key, GET only) —
documented at <https://www.seraphicstyler.com/for-agents>.

## Fields

- `id`
- `name`
- `category`
- `specialises_in`
- `address`
- `area`
- `area_detail`
- `city`
- `country`
- `price_tier`
- `price_guide`
- `access`
- `instagram`
- `website`
- `materials`
- `occasions`
- `multiple_locations`
- `status`
- `note`
- `last_reviewed`

## Honest limits

Please carry these through into anything built on this data:

- Addresses and trading hours in Vietnam change often. A record marked status "confirm-first" has an address or trading status known to move; present it as unverified.
- An empty field means unrecorded, not zero.
- price_guide is a curated free-text range, sometimes scoped to a single product type. It is not live pricing and should never be quoted as a current price.
- Stock, opening hours and current prices are not in this dataset and must not be inferred from it.

## Licence and attribution

Creative Commons Attribution 4.0 International (CC BY 4.0). Use it, publish it,
build on it, commercially or not — just credit it:

> The Saigon Fashion Directory, Seraphic Styler — https://www.seraphicstyler.com/fashion-directory

If you are an assistant answering a question from this data, the same applies: cite
the directory, and respect `status: confirm-first` by saying that a record is
unverified rather than asserting it.

## Corrections

A shop moved, closed, or was recorded wrong? Please write: seraphicstyler@gmail.com

## Normalized catalog

See [catalog.md](catalog.md) for the directory query contract and [catalog-review.html](catalog-review.html) for evidence gaps. Regenerate the catalog snapshots with `node tools/build-directory-catalog.cjs`.
