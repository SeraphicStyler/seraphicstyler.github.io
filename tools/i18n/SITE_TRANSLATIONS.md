# Public-page text translations

`js/i18n-site.js` supplements the existing keyed dictionaries with text-node
translations. It preserves DOM elements, event listeners, links, form values,
English originals, and each visitor's language preference. It watches newly
rendered content and accessibility attributes. The selected language's JSON is
loaded from this website; visitor text is never sent to a translation service.

For plain-text keyed elements and dynamic calls with an English default, a
translation of the current English source supersedes an older key's wording.
This prevents changed payment/refund copy from silently retaining obsolete
terms. Markup-bearing keyed elements continue to use the existing DOM engine.
Directory comparison buttons use the same lookup, avoiding an English/translated
label feedback loop between their rendering and translation observers.

The language menu consistently offers English, Vietnamese, Simplified Chinese,
Spanish, Arabic, French, Portuguese, Russian, Japanese, German, Korean, Hindi,
Indonesian, Thai, Italian, Turkish, Filipino, Polish, Dutch, Persian, and Khmer.
Directory pages also retain their existing Tamazight option and bundles.

`site-source.json` inventories text from public HTML and common dynamic journeys.
It excludes admin, catalog-review, and hidden preview pages. Image paths,
code fragments, CSS classes,
and Vietnamese-only voice aliases are excluded by `site-non-ui.json` and the
collector's path rules. `--clean-source` applies these rules to a saved inventory
without loading pages or using the network. Existing keyed
translations seed the dictionaries. `site.vi.reviewed.json` and
`site.vi.services.json`, when present, hold Vietnamese corrections and additions
and take precedence over generated copy.
`site.<lang>.ai.json` holds the missing translations supplied by parallel AI
translation workers. `site.<lang>.dynamic.json` holds reviewed interactive
messages. Merge these local correction files with `--seed`; this does not call
Google or send any text over the network. The coverage checker must report zero
missing entries before a language is described as complete.
`site-polish.all.json` supplies contextual translations for common controls and
service terms across all 20 non-English languages (for example, clothing credit
is an allocated clothing budget, and “Edit answers” is an action, not a tier name).
`site-discovery.all.json` and `site-discovery-labels.all.json` explicitly cover
directory messages with names, dates, and prices, plus short labels missed by
the prose collector. Their keys are added to the inventory during the local
build. Comparison attributes are separate label/value nodes so each recorded
attribute can translate; visitor-entered comparison notes are preserved.
Currency codes, contact identifiers, service-tier names, and Vietnamese address
wording remain literal. Missing currency names can be supplied locally by
`Intl.DisplayNames`; this makes no translation-service request. Validation accepts
Turkish leading-percent notation while checking that the numeric value is kept.

Run the local inventory with Puppeteer installed:

```sh
node tools/i18n/build-site.cjs --collect
```

The following build sends the inventoried English website text to Google's
translation endpoint. Obtain the site owner's approval for that transfer before
running it. It requires network access, saves progress after each batch, and can
be resumed. Use `--lang=vi` to build a single language or `--seed` to copy existing
translations locally without making any network requests.

```sh
node tools/i18n/build-site.cjs
node tools/verify-site-i18n.cjs
node tools/verify-site-vietnamese.cjs
node tools/verify-site-vietnamese.cjs --all --out=/tmp/site-vietnamese-audit.json
node tools/verify-site-language-runtime.cjs
node tools/verify-site-language-layout.cjs
node tools/verify-site-current-copy.cjs
node tools/verify-site-discovery-i18n.cjs
node tools/verify-repository.cjs
```

The rendered-copy audit defaults to Vietnamese; set `SS_TEST_LANG=nl` (or
another menu code) to inspect a different language. `--all` traverses every
public page. Names and addresses can appear among its unchanged-text candidates;
review those rather than treating every unchanged Latin string as an error.
The layout and current-policy checks accept `SS_TEST_LANGS=vi,es,fr,...`.

Machine-generated translations require linguistic review. Source coverage does
not establish wording quality. Third-party forms/iframes, user-entered text,
text embedded in images, and future server-generated responses are outside the
local DOM translation layer. New copy needs a refreshed inventory and build.

The network build uses one request queue, a minimum 1.5-second interval, and
exponential backoff for HTTP 429 (including the server's Retry-After value).
Protected names and addresses are retained exactly. A rate-limited or failed
language is reported as incomplete, and completed batches remain on disk.
