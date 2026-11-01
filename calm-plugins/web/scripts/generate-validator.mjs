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
import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const schemaRoot = join(
    dirname(require.resolve('calm-schema-1.2/package.json')),
    'schema'
);
const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    validateFormats: false,
    code: { source: true },
});
for (const name of ['core', 'interface', 'control', 'flow']) {
    ajv.addSchema(
        JSON.parse(await readFile(join(schemaRoot, `${name}.json`), 'utf8'))
    );
}
// CALM's meta-schema validates schemas; architecture instances use the core vocabulary.
const validate = ajv.getSchema(
    'https://calm.finos.org/release/1.2/meta/core.json'
);
const generated = new URL('../src/generated/', import.meta.url);
await mkdir(generated, { recursive: true });
await writeFile(
    new URL('validate.cjs', generated),
    standaloneCode(ajv, validate)
);
