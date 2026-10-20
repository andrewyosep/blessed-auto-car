import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import './test-runtime.mjs';

const env = {};
globalThis.__showroomTest = { env, headers: new Headers() };
const catalog = await import('../app/api/catalog/route.ts');
const upload = await import('../app/api/upload/route.ts');
const photos = await import('../app/api/photos/[key]/route.ts');
const { defaultSettings } = await import('../lib/catalog.ts');
let sql, bucket;
function identity(email = 'owner@example.com') {
  globalThis.__showroomTest.headers = new Headers(email ? { 'oai-authenticated-user-id': 'test-owner', 'oai-authenticated-user-email': email } : {});
}
function request(body, origin = 'https://showroom.test') {
  return new Request('https://showroom.test/api/catalog', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
function vehicle(overrides = {}) {
  return { id: 'unit-1', brand: 'Toyota', name: 'Avanza 1.5 G', year: 2022, price: 185000000, mileage: 32000, transmission: 'Otomatis', fuel: 'Bensin', color: 'Putih', status: 'Tersedia', location: 'Tangerang', description: 'Unit uji', photos: ['https://example.com/car.jpg'], highlights: ['Pajak panjang'], ...overrides };
}
beforeEach(() => {
  sql?.close(); sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../db/bootstrap.sql', import.meta.url), 'utf8'));
  env.DB = { prepare(query) {
    let args = []; const statement = {
      bind(...values) { args = values; return statement; },
      async all() { return { results: sql.prepare(query).all(...args) }; },
      async first() { return sql.prepare(query).get(...args) ?? null; },
      async run() { return sql.prepare(query).run(...args); },
    }; return statement;
  } };
  bucket = new Map();
  env.BUCKET = {
    async put(key, bytes, options) { bucket.set(key, { body: bytes.slice(), httpMetadata: options.httpMetadata }); },
    async get(key) { return bucket.get(key) ?? null; },
  };
  env.ADMIN_EMAILS = 'owner@example.com'; identity();
});
after(() => sql?.close());

test('Catalog permits anonymous reads and rejects unauthorized writes and foreign origins', async () => {
  identity(null);
  assert.equal((await catalog.GET()).status, 200);
  assert.equal((await catalog.POST(request({ action: 'save-car', car: vehicle() }))).status, 401);
  identity('visitor@example.com');
  assert.equal((await catalog.POST(request({ action: 'save-car', car: vehicle() }))).status, 403);
  identity();
  assert.equal((await catalog.POST(request({ action: 'save-car', car: vehicle() }, 'https://other.test'))).status, 403);
  delete env.ADMIN_EMAILS;
  assert.equal((await catalog.POST(request({ action: 'save-car', car: vehicle() }))).status, 503);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM vehicles').get().n, 0);
});

test('Save, edit price/status, retrieve, and delete a vehicle through the real API and SQL', async () => {
  assert.equal((await catalog.POST(request({ action: 'save-car', car: vehicle() }))).status, 200);
  const edited = vehicle({ price: 179000000, status: 'Dipesan' });
  assert.equal((await catalog.POST(request({ action: 'save-car', car: edited }))).status, 200);
  const response = await catalog.GET();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await response.json()).cars, [edited]);
  assert.equal((await catalog.POST(request({ action: 'delete-car', id: edited.id }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).cars, []);
});

test('Rebranding, contacts, and hero settings survive subsequent API reads', async () => {
  const settings = { ...defaultSettings, name: 'Nama Showroom Baru', whatsapp: '081234567890', address: 'Tangerang', slides: [{ title: 'Mobil keluarga', description: 'Pilihan terbaru', image: 'https://example.com/hero.jpg' }] };
  assert.equal((await catalog.POST(request({ action: 'save-settings', settings }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).settings, settings);
});

test('Malformed JSON payloads return 400; invalid vehicles never reach the database', async () => {
  for (const body of [null, [], 'text', 123, {}, { action: 'save-car', car: vehicle({ price: -1 }) }, { action: 'save-car', car: vehicle({ photos: [] }) }]) {
    assert.equal((await catalog.POST(request(body))).status, 400, JSON.stringify(body));
  }
  const invalid = new Request('https://showroom.test/api/catalog', { method: 'POST', headers: { origin: 'https://showroom.test' }, body: '{' });
  assert.equal((await catalog.POST(invalid)).status, 400);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM vehicles').get().n, 0);
});

test('Photo upload round trip preserves bytes, content type, and the vehicle thumbnail', async () => {
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=', 'base64'));
  const response = await upload.POST(new Request('https://showroom.test/api/upload', { method: 'POST', headers: { origin: 'https://showroom.test', 'content-type': 'image/png' }, body: png }));
  assert.equal(response.status, 200);
  const { url } = await response.json();
  assert.match(url, /^\/api\/photos\/[a-f0-9-]+\.png$/);
  const photo = await photos.GET(new Request('https://showroom.test' + url), { params: Promise.resolve({ key: url.split('/').at(-1) }) });
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get('content-type'), 'image/png');
  assert.equal(photo.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(new Uint8Array(await photo.arrayBuffer()), png);
  const car = vehicle({ photos: [url] });
  assert.equal((await catalog.POST(request({ action: 'save-car', car }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).cars[0].photos, [url]);
});

test('Unauthorized, oversized, and non-image uploads store nothing; missing photos return 404', async () => {
  const make = (body, headers = {}) => new Request('https://showroom.test/api/upload', { method: 'POST', headers: { origin: 'https://showroom.test', ...headers }, body });
  identity(null);
  assert.equal((await upload.POST(make('test'))).status, 401);
  identity();
  assert.equal((await upload.POST(make('<svg></svg>', { 'content-type': 'image/png' }))).status, 400);
  assert.equal((await upload.POST(make('x', { 'content-length': '11000001' }))).status, 413);
  assert.equal(bucket.size, 0);
  for (const key of ['../secrets', 'abcdef.png']) assert.equal((await photos.GET(new Request('https://showroom.test/api/photos/' + key), { params: Promise.resolve({ key }) })).status, 404);
});

test('Draft without photos stays private until published and can be hidden again', async () => {
  const { readCatalog } = await import('../lib/server.ts');
  const draft = vehicle({ published: false, photos: [] });
  assert.equal((await catalog.POST(request({ action: 'save-car', car: draft }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).cars, []);
  assert.deepEqual((await readCatalog(true)).cars, [draft]);
  identity(null);
  await assert.rejects(() => readCatalog(true), { status: 403 });
  assert.deepEqual((await readCatalog()).cars, []);
  identity('visitor@example.com');
  await assert.rejects(() => readCatalog(true), { status: 403 });
  identity();
  assert.equal((await catalog.POST(request({ action: 'save-car', car: { ...draft, published: true } }))).status, 400);
  const published = vehicle({ published: true });
  assert.equal((await catalog.POST(request({ action: 'save-car', car: published }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).cars, [published]);
  assert.equal((await catalog.POST(request({ action: 'save-car', car: { ...published, published: false } }))).status, 200);
  assert.deepEqual((await (await catalog.GET()).json()).cars, []);
});
