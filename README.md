# Seraphic Styler

Static HTML, CSS, and JavaScript. No frontend framework or build step is required.

```sh
node tools/serve.mjs 8731
```

Open <http://127.0.0.1:8731>. The local server supports the same extensionless page links as the site.

## Structure

- Root HTML files: public pages and compatibility redirects.
- `css/`: shared brand styles, page styles, and focused component styles.
- `js/`: page behavior, shared components, directory data, and translations.
- `assets/`, `icons/`, `previews/`: images and media used by the site. Preview filenames are resolved dynamically.
- `houses/`, `areas/`, `categories/`: generated public directory pages; preserve their existing URLs.
- `dataset/`: public exports, catalog schema, API contract, and evidence review.
- `tools/`: local preview, data generators, and verification scripts.
- `worker/`: optional server-side metadata and concierge services; secrets stay outside source control.
- `docs/`, `social/`: existing ignored local notes and design work; not deployed.

`worker/node_modules` and `.wrangler` are ignored development dependencies/state. They are not website assets. Do not delete source media or public pages based only on whether a filename appears literally in HTML.

## Editing

Keep page markup separate from substantial styles and behavior. Load page styles before component refinements, and load directory data before `js/directory.js`. Small pre-paint preference scripts stay in HTML to avoid a theme flash.

`js/theme.js` owns Auto/Light/Dark/Mono state and transitions across the primary pages. `css/theme.css` defines the short crossfade and reduced-motion behavior. Pages bind controls to that shared state rather than adding another theme switcher.

`js/directory-data.js` is the maintained house source. Catalog exports are deterministic observations, not live inventory or verification events. See [the catalog contract](dataset/catalog.md).

## Checks

```sh
node tools/verify-repository.cjs
node tools/audit-translations.cjs
node tools/verify-search.mjs
node tools/verify-catalog.cjs
node worker/test/extract.test.js
node worker/test/concierge.test.js
```

With the preview running and Puppeteer installed, set `SS_PUPPETEER` to its package path if it is not available through normal Node resolution:

```sh
node tools/verify-theme.cjs
node tools/verify-language-runtime.cjs
node tools/verify-directory-workspace.cjs
node tools/verify-links-mobile.cjs
```

Run the relevant service, guide, and routing checks under `tools/` when changing those features. Tests must not send real inquiries, payments, or messages.

## Generated content

```sh
node tools/build-directory-catalog.cjs
node tools/build-seo-pages.cjs --index-only
```

The first command refreshes catalog snapshots in `dataset/`. The second refreshes the static directory index without regenerating house pages. These commands do not constitute a new verification of a shop or its inventory.

Nothing in these commands deploys the website or applies the optional PostgreSQL schema.

Translation coverage is tracked separately from functional tests. `docs/translation-audit.md` records incomplete copy; `docs/iphone-app-plan.md` contains the proposed Apple application plan. These are local, ignored working documents.
