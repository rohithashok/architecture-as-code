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
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';

const artifacts = fileURLToPath(
    new URL('../../../sandbox/web-integration/browser/', import.meta.url)
);
await mkdir(artifacts, { recursive: true });
const { server, url } = await startServer();
try {
    for (const name of [
        'browser',
        'inspector',
        'metadata',
        'photo-sample',
        'remote',
        'theme',
    ]) {
        const code = await new Promise((resolve, reject) => {
            const child = spawn(
                process.execPath,
                [
                    fileURLToPath(
                        new URL(`../test/${name}.cjs`, import.meta.url)
                    ),
                ],
                {
                    stdio: 'inherit',
                    env: {
                        ...process.env,
                        VIEWER_URL: url,
                        ARTIFACT_DIR: artifacts,
                    },
                }
            );
            child.once('error', reject);
            child.once('exit', resolve);
        });
        if (code !== 0) throw Error(`${name} browser suite failed (${code})`);
    }
} finally {
    server.closeAllConnections();
    server.close();
}
