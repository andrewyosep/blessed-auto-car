export const filterArrayKeys = ['brands', 'models', 'transmissions', 'fuels', 'bodyTypes', 'locations'];
export const filterNumberKeys = ['priceMin', 'priceMax', 'yearMin', 'yearMax', 'mileageMax'];
export function blankFilters() { return { q: '', brands: [], models: [], priceMin: '', priceMax: '', yearMin: '', yearMax: '', mileageMax: '', transmissions: [], fuels: [], bodyTypes: [], locations: [], status: '', savedOnly: false }; }
export function filterCars(cars, filters, saved = [], sort = 'newest') {
  const f = { ...blankFilters(), ...filters };
  return cars.filter(c => {
    const q = f.q.trim().toLocaleLowerCase('id-ID');
    return (!q || `${c.brand} ${c.name}`.toLocaleLowerCase('id-ID').includes(q)) &&
      (!f.brands.length || f.brands.includes(c.brand)) && (!f.models.length || f.models.includes(c.name)) &&
      (!f.priceMin || c.price >= Number(f.priceMin) * 1000000) && (!f.priceMax || c.price <= Number(f.priceMax) * 1000000) &&
      (!f.yearMin || c.year >= Number(f.yearMin)) && (!f.yearMax || c.year <= Number(f.yearMax)) &&
      (!f.mileageMax || c.mileage <= Number(f.mileageMax)) &&
      (!f.transmissions.length || f.transmissions.includes(c.transmission)) && (!f.fuels.length || f.fuels.includes(c.fuel)) &&
      (!f.bodyTypes.length || f.bodyTypes.includes(c.bodyType || 'Lainnya')) && (!f.locations.length || f.locations.includes(c.location)) &&
      (!f.status || f.status === c.status) && (!f.savedOnly || saved.includes(c.id));
  }).sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'mileage' ? a.mileage - b.mileage : sort === 'oldest' ? a.year - b.year : b.year - a.year);
}
export function activeFilterChips(f) {
  const chips = [];
  if (f.q) chips.push({ key: 'q', value: f.q, label: `Pencarian: ${f.q}` });
  for (const key of filterArrayKeys) for (const value of f[key]) chips.push({ key, value, label: value });
  const labels = { priceMin: 'Mulai Rp', priceMax: 'Hingga Rp', yearMin: 'Tahun dari', yearMax: 'Tahun sampai', mileageMax: 'Maks.' };
  for (const key of filterNumberKeys) if (f[key]) chips.push({ key, value: f[key], label: `${labels[key]} ${new Intl.NumberFormat('id-ID').format(Number(f[key]))}${key.startsWith('price') ? ' juta' : key === 'mileageMax' ? ' km' : ''}` });
  if (f.status) chips.push({ key: 'status', value: f.status, label: f.status });
  if (f.savedOnly) chips.push({ key: 'savedOnly', value: 'true', label: 'Mobil disimpan' });
  return chips;
}
export function parseFilterSearch(search) {
  const params = new URLSearchParams(search), f = blankFilters();
  f.q = (params.get('q') || '').slice(0, 160);
  for (const key of filterArrayKeys) f[key] = [...new Set(params.getAll(key).filter(Boolean))].slice(0, 30);
  for (const key of filterNumberKeys) { const v = params.get(key); if (v && /^\d{1,9}$/.test(v) && Number(v) > 0) f[key] = v; }
  if (['Tersedia', 'Dipesan', 'Terjual'].includes(params.get('status'))) f.status = params.get('status');
  f.savedOnly = params.get('savedOnly') === '1';
  return f;
}
export function serializeFilters(f) {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  for (const key of filterArrayKeys) for (const v of f[key]) params.append(key, v);
  for (const key of filterNumberKeys) if (f[key]) params.set(key, f[key]);
  if (f.status) params.set('status', f.status);
  if (f.savedOnly) params.set('savedOnly', '1');
  return params.toString();
}
