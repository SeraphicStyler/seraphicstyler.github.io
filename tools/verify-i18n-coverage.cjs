#!/usr/bin/env node
/* Fail when a bilingual page exposes a data-i18n key without Vietnamese copy. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repo = path.resolve(__dirname, '..');
const pages = ['index.html', 'links.html', 'lookbook.html', 'estimate.html', 'redeem.html'];
const bundles = ['js/translations.js', 'js/links-i18n.js', 'js/links-i18n-lp2.js'];
const context = { window: {} };
vm.createContext(context);
for (const file of bundles) {
  vm.runInContext(fs.readFileSync(path.join(repo, file), 'utf8'), context, { filename: file });
}

const vi = (context.window.SS_TRANSLATIONS || {}).vi || {};
let failures = 0;
for (const page of pages) {
  const source = fs.readFileSync(path.join(repo, page), 'utf8');
  const keys = new Set();
  for (const match of source.matchAll(/data-i18n(?:-ph)?=["']([^"']+)["']/g)) keys.add(match[1]);
  for (const match of source.matchAll(/SS_TF?\(\s*["']([^"']+)["']/g)) keys.add(match[1]);
  const missing = [...keys].filter(key => vi[key] == null || vi[key] === '').sort();
  if (missing.length) {
    failures += missing.length;
    console.error(`${page}: ${missing.length} Vietnamese translation(s) missing`);
    for (const key of missing) console.error(`  ${key}`);
  } else {
    console.log(`${page}: complete (${keys.size} keys)`);
  }
}

if (failures) {
  console.error(`\n${failures} missing Vietnamese translation reference(s).`);
  process.exitCode = 1;
} else {
  console.log('\nVietnamese coverage is complete.');
}
