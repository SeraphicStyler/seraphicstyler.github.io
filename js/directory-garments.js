/* Editorial garments are opt-in records, not generated inventory.
   Publish only after reviewing the exact source and image permission.
   Required: id, title, house, sourceUrl, checkedAt (YYYY-MM-DD).
   Optional: observedPriceVnd, material, silhouette, occasion, fit, size, note,
   image (local asset), imagePermission ('owned' or 'licensed').
   checkedAt describes a dated observation, never a stock guarantee.
   No approved garment records or photography have been supplied yet. */
window.SS_DIRECTORY_GARMENTS = [];
