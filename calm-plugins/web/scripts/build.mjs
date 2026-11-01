/*!
Copyright 2026 Rohith Ashok

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import './generate-validator.mjs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await build({
    entryPoints: [fileURLToPath(new URL('src/calm-viewer.js', root))],
    outfile: fileURLToPath(new URL('calm-viewer.js', dist)),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    sourcemap: true,
    legalComments: 'linked',
});
for (const name of ['index.html', 'themes.css'])
    await cp(new URL(`demo/${name}`, root), new URL(name, dist));
await cp(new URL('examples/', root), new URL('examples/', dist), {
    recursive: true,
});
await cp(new URL('src/index.d.ts', root), new URL('index.d.ts', dist));
await cp(new URL('../../LICENSE', root), new URL('LICENSE', dist));
await cp(new URL('THIRD_PARTY.md', root), new URL('THIRD_PARTY.md', dist));
console.log('Built calm-plugins/web/dist');

const require = createRequire(import.meta.url);
await mkdir(new URL('licenses/', dist), { recursive: true });
for (const [name, label] of [
    ['ajv', 'AJV'],
    ['calm-schema-1.2', 'CALM-SCHEMA'],
]) {
    const source = join(
        dirname(require.resolve(`${name}/package.json`)),
        'LICENSE'
    );
    await cp(source, new URL(`licenses/${label}-LICENSE`, dist));
}
await cp(new URL('../../NOTICE', root), new URL('NOTICE', dist));
