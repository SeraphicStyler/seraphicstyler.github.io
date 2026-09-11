# Directory and field-guide translations

`fd` is the fashion directory; `fg` is the field guide. Both currently have 20 non-English bundles. English fallback text lives in page markup and dynamic rendering code.

## Source files

- `fd.en.json`, `fg.en.json`: the original English key snapshots.
- `out/<language>/fd.json`, `fg.json`: editable translations of those snapshots.
- `delta.all.json`, `delta2.all.json`: translated dynamic widget strings.
- `workspace.all.json`: new directory navigation and result-control copy; Tamazight additions still need review.
- `js/translations.js`: shared appearance labels, also included by the builder.
- `js/i18n/*.js` and `manifest.js`: generated runtime bundles; edit their sources.

```sh
node tools/i18n/validate-build.js
node tools/i18n/validate-build.js --build
node tools/audit-translations.cjs
```

The validator checks historical source-key parity, placeholders, and inline markup. It does **not** establish that today's entire page is translated. The coverage audit reads current HTML and reports missing keys across the site. New directory workspace copy, unmarked prose, and house notes require a separate pass. Reports live in the existing local `docs/` folder.

## Runtime

`js/i18n-page.js` loads one selected language bundle and keeps the latest selection when downloads finish out of order. `js/i18n-dom.js` handles text, placeholders, accessible names, titles, and each element’s English fallback. Unsupported preferences survive navigation to a page that supports them.

Arabic and Persian use right-to-left layout. Standard Moroccan Tamazight (`zgh`) uses left-to-right Tifinagh. Main-site and directory language sets differ; do not silently map Khmer (`km`) to Tamazight.

## Review rules

Keep service names, amounts, links, and placeholders intact. Translate from the current approved English business rules. Do not reuse an old sentence if its price or service scope has changed. Do not insert English values solely to satisfy key coverage. A fluent copy review and actual mobile/VoiceOver testing remain distinct from structural validation.
