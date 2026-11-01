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
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function startServer(port = 0) {
    const root = fileURLToPath(new URL('../dist/', import.meta.url));
    const types = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
    };
    const server = createServer(async (req, res) => {
        try {
            const pathname = decodeURIComponent(
                new URL(req.url, 'http://localhost').pathname
            );
            const file = resolve(
                root,
                pathname === '/' ? 'index.html' : `.${pathname}`
            );
            if (!file.startsWith(resolve(root) + sep))
                throw Error('Outside static root');
            const content = await readFile(file);
            res.writeHead(200, {
                'Content-Type':
                    types[extname(file)] || 'application/octet-stream',
                'Cache-Control': 'no-store',
            });
            res.end(content);
        } catch {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
    });
    return { server, url: `http://127.0.0.1:${server.address().port}` };
}
