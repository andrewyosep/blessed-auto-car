import test from 'node:test';
import assert from 'node:assert/strict';
import { demoCars, defaultSettings } from '../lib/catalog.ts';
import { blankFilters, filterCars, parseFilterSearch, serializeFilters, activeFilterChips } from '../lib/catalog-filters.mjs';
import { renderShowroom, detailMarkup } from '../lib/showroom-view.mjs';

test('Multiple brands use OR; category, price, year, fuel, and status combine with AND', () => {
  const f = { ...blankFilters(), brands: ['Toyota', 'Honda'], bodyTypes: ['SUV'], status: 'Tersedia', priceMin: '200', priceMax: '300', yearMin: '2022', yearMax: '2023', fuels: ['Bensin'] };
  assert.deepEqual(filterCars(demoCars, f).map(c => c.id), ['demo-2']);
  assert.equal(filterCars(demoCars, { ...blankFilters(), brands: ['Toyota', 'Honda'] }).length, 6);
});
test('Models, kilometer, manual transmission, and location narrow the results', () => {
  const f = { ...blankFilters(), brands: ['Honda'], models: ['Brio Satya E'], transmissions: ['Manual'], mileageMax: '30000', locations: ['Bekasi'] };
  assert.deepEqual(filterCars(demoCars, f).map(c => c.id), ['demo-8']);
  assert.equal(filterCars(demoCars, { ...f, locations: ['Jakarta'] }).length, 0);
});
test('Price and year boundaries are inclusive; incompatible ranges return an empty result', () => {
  assert.equal(filterCars(demoCars, { ...blankFilters(), priceMin: '298', priceMax: '298', yearMin: '2022', yearMax: '2022' })[0].id, 'demo-2');
  assert.equal(filterCars(demoCars, { ...blankFilters(), priceMin: '500', priceMax: '200' }).length, 0);
  assert.equal(filterCars(demoCars, { ...blankFilters(), yearMin: '2023', yearMax: '2020' }).length, 0);
});
test('Sorting and saved-only filtering preserve the original inventory order', () => {
  const before = demoCars.map(c => c.id);
  const found = filterCars(demoCars, { ...blankFilters(), savedOnly: true }, ['demo-1', 'demo-8'], 'price-low');
  assert.deepEqual(found.map(c => c.id), ['demo-8', 'demo-1']);
  assert.deepEqual(demoCars.map(c => c.id), before);
  assert.equal(filterCars(demoCars, blankFilters(), [], 'mileage')[0].id, 'demo-8');
});
test('URL round trip retains combined filters and rejects invalid numeric/status input', () => {
  const f = { ...blankFilters(), q: 'HR-V & SE', brands: ['Toyota', 'Honda'], priceMin: '100', priceMax: '300', yearMin: '2020', fuels: ['Bensin'], status: 'Tersedia', savedOnly: true };
  assert.deepEqual(parseFilterSearch(serializeFilters(f)), f);
  const invalid = parseFilterSearch('?priceMax=NaN&yearMin=-100&status=unknown&brands=Honda&brands=Honda');
  assert.equal(invalid.priceMax, ''); assert.equal(invalid.yearMin, ''); assert.equal(invalid.status, ''); assert.deepEqual(invalid.brands, ['Honda']);
  assert.equal(activeFilterChips(f).length, 9);
});
test('Customer-entered text is escaped in catalog, filter values, and detail HTML', () => {
  const dangerous = '<img src=x onerror=alert(1)>';
  const car = { ...demoCars[0], name: dangerous, location: dangerous, description: dangerous };
  const markup = renderShowroom({ cars: [car], settings: { ...defaultSettings, name: dangerous }, preview: true });
  assert.ok(!markup.includes(dangerous)); assert.ok(markup.includes('&lt;img'));
  assert.ok(!detailMarkup(car).includes(dangerous));
  assert.ok(markup.includes('loading="lazy"')); assert.ok(markup.includes('fetchpriority="high"'));
});
