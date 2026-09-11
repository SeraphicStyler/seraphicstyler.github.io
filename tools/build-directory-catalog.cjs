/* Deterministic export. A build date is not a verification date. */
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./catalog-api.cjs');
const catalog = load();
const destination = path.resolve(__dirname, '../dataset');
const snapshot = {
  schema_version: 1,
  source: 'js/directory-data.js',
  source_review_date: null,
  brands: catalog.brands,
};
for (const [name, data] of [['brands', snapshot], ['quality', catalog.quality()]]) {
  fs.writeFileSync(path.join(destination, 'catalog-' + name + '.json'), JSON.stringify(data, null, 2) + '\n');
}
console.log(JSON.stringify({ ...catalog.quality(), review_queue: undefined }, null, 2));
