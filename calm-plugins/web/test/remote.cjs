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
const { chromium } = require('@playwright/test');
const http = require('node:http'),
    fs = require('node:fs'),
    path = require('node:path'),
    assert = require('node:assert/strict');
const base = process.env.VIEWER_URL || 'http://127.0.0.1:8772';
const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../examples/commerce.calm.json'))
);
fixture.nodes[0].name = 'Remote customer';
const payload = JSON.stringify(fixture),
    received = [];
const server = http.createServer((req, res) => {
    received.push({
        path: req.url,
        cookie: req.headers.cookie,
        authorization: req.headers.authorization,
        referer: req.headers.referer,
    });
    if (req.url != '/no-cors')
        res.setHeader('Access-Control-Allow-Origin', new URL(base).origin);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/redirect') {
        res.writeHead(302, { Location: '/model' });
        res.end();
    } else if (req.url === '/missing') {
        res.writeHead(404);
        res.end('{}');
    } else if (req.url === '/html') res.end('<html>Not JSON</html>');
    else if (req.url === '/oversize-length') {
        res.writeHead(200, { 'Content-Length': 6 * 1024 * 1024 });
        res.end(Buffer.alloc(6 * 1024 * 1024, 32));
    } else if (req.url === '/oversize-stream') {
        res.writeHead(200);
        res.write(Buffer.alloc(3 * 1024 * 1024, 32));
        res.end(Buffer.alloc(3 * 1024 * 1024, 32));
    } else if (req.url === '/stall') {
        res.writeHead(200);
        res.write('{');
    } else if (req.url === '/slow') {
        res.writeHead(200);
        res.write(payload.slice(0, 100));
        setTimeout(() => res.end(payload.slice(100)), 800);
    } else {
        res.writeHead(200);
        res.write(payload.slice(0, 100));
        setTimeout(() => res.end(payload.slice(100)), 80);
    }
});
(async () => {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const remote = 'http://127.0.0.1:' + server.address().port;
    const browser = await chromium.launch({
        headless: true,
        ...(process.env.CHROME_PATH
            ? { executablePath: process.env.CHROME_PATH }
            : {}),
    });
    try {
        const page = await browser.newPage({
                viewport: { width: 1450, height: 1100 },
            }),
            errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(base);
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer')?.model?.nodes.length === 7
        );
        const v = page.locator('calm-viewer'),
            status = v.locator('.status');
        await page
            .context()
            .addCookies([
                { name: 'private', value: 'must-not-send', url: remote },
            ]);
        await v.getByRole('button', { name: 'Open URL', exact: true }).click();
        assert.ok(await v.locator('.url-dialog').isVisible());
        await v
            .getByLabel('JSON URL')
            .fill('https://user:password@example.com/model.json');
        await v.getByRole('button', { name: 'Load architecture' }).click();
        assert.match(
            await v.locator('.url-error').innerText(),
            /usernames or passwords/
        );
        await v.getByLabel('JSON URL').fill(remote + '/model');
        await v.getByRole('button', { name: 'Load architecture' }).click();
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer').model?.nodes[0].name ===
                'Remote customer'
        );
        assert.ok(!(await v.locator('.url-dialog').isVisible()));
        assert.equal(await v.getAttribute('aria-busy'), 'false');
        const request = received.find((r) => r.path === '/model');
        assert.ok(request);
        assert.equal(request.cookie, undefined);
        assert.equal(request.authorization, undefined);
        assert.equal(request.referer, undefined);
        // src retains the same-origin policy; explicit loadURL is the remote path.
        const requestsBefore = received.length;
        assert.equal(
            await v.evaluate((e, url) => e.loadSource(url), remote + '/model'),
            false
        );
        assert.equal(received.length, requestsBefore);
        for (const [endpoint, pattern] of [
            ['/no-cors', /CORS/],
            ['/redirect', /redirect/],
            ['/missing', /404/],
            ['/html', /JSON|Unexpected/],
            ['/oversize-length', /5 MiB/],
            ['/oversize-stream', /5 MiB/],
        ]) {
            assert.equal(
                await v.evaluate((e, url) => e.loadURL(url), remote + endpoint),
                false,
                endpoint
            );
            assert.match(await status.innerText(), pattern, endpoint);
            assert.equal(await v.getAttribute('aria-busy'), 'false');
        }
        for (const url of [
            'file:///tmp/calm.json',
            'data:application/json,{}',
            'https://user:password@example.com/calm.json',
        ])
            assert.equal(
                await v.evaluate((e, url) => e.loadURL(url), url),
                false
            );
        await v.evaluate((e) => e.loadSource('./examples/commerce.calm.json'));
        await v.evaluate((e, url) => {
            e.loadURL(url);
        }, remote + '/slow');
        await page.waitForFunction(
            () =>
                document
                    .querySelector('calm-viewer')
                    .getAttribute('aria-busy') === 'true'
        );
        assert.match(await status.innerText(), /Downloading/);
        await v.getByRole('button', { name: 'Cancel loading' }).click();
        assert.match(await status.innerText(), /canceled/);
        assert.equal(
            await v.evaluate((e) => e.model.nodes[0].name),
            'Customer'
        );
        await v.evaluate(async (e, url) => {
            const pending = e.loadURL(url);
            const m = e.model;
            m.nodes[0].name = 'Newer model';
            e.load(m);
            await pending;
        }, remote + '/slow');
        assert.equal(
            await v.evaluate((e) => e.model.nodes[0].name),
            'Newer model'
        );
        await page.clock.install();
        await v.evaluate((e, url) => {
            e.loadURL(url);
        }, remote + '/stall');
        await page.waitForFunction(
            () =>
                document
                    .querySelector('calm-viewer')
                    .getAttribute('aria-busy') === 'true'
        );
        await page.clock.runFor(30001);
        await page.waitForFunction(() =>
            document
                .querySelector('calm-viewer')
                .shadowRoot.querySelector('.status')
                .textContent.includes('timed out')
        );
        await v.evaluate((e) => e.loadSource('./examples/commerce.calm.json'));
        await v.getByRole('button', { name: 'Open URL', exact: true }).click();
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-open-url.png'
            ),
            fullPage: true,
        });
        await page.keyboard.press('Escape');
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log(
            'PASS remote: Open URL dialog, real cross-origin CORS streaming, no cookies/auth/referrer, src isolation, CORS/redirect/404/JSON errors, declared and streamed size bounds, URL schemes/credentials, progress, cancel, stale-load isolation, timeout, Escape.'
        );
    } finally {
        await browser.close();
    }
})()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => {
        server.closeAllConnections();
        server.close();
    });
