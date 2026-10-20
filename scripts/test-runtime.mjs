// Replace platform services for API tests; application modules run unchanged.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root = new URL('../', import.meta.url);
const fixtures = {
  'cloudflare:workers': 'export const env = globalThis.__showroomTest.env;',
  'next/headers': 'export async function headers() { return globalThis.__showroomTest.headers; }',
  'next/navigation': 'export function redirect(url) { throw new Error("Unexpected redirect: " + url); }',
};
const require = createRequire(import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in fixtures) return { url: `data:text/javascript,${encodeURIComponent(fixtures[specifier])}`, shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: new URL(specifier.slice(2) + '.ts', root).href, shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith(root.href) && !/\.[cm]?[jt]s$/.test(specifier)) {
      return { url: new URL(specifier + '.ts', context.parentURL).href, shortCircuit: true };
    }
    if (specifier === 'zod') return { url: process.env.SHOWROOM_TEST_ZOD ? pathToFileURL(process.env.SHOWROOM_TEST_ZOD).href : pathToFileURL(require.resolve('zod')).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
