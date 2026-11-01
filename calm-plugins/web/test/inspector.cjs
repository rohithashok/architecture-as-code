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
const assert = require('node:assert/strict');
(async () => {
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
            errors = [],
            requests = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('request', (r) => requests.push(r.url()));
        await page.goto(process.env.VIEWER_URL || 'http://127.0.0.1:8769');
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer')?.model?.nodes.length === 7
        );
        const v = page.locator('calm-viewer'),
            side = v.locator('.details');
        const original = await v.evaluate((e) => JSON.stringify(e.model));
        await v.locator('.node[data-id="api"]').click();
        assert.match(await side.innerText(), /Controls \(2\)/);
        assert.match(await side.innerText(), /access-control/);
        assert.match(await side.innerText(), /audit-logging/);
        assert.match(await side.innerText(), /Only authenticated customers/);
        assert.match(await side.innerText(), /Requirement 2/);
        assert.match(await side.innerText(), /Configuration reference/);
        assert.match(await side.innerText(), /authentication/);
        assert.match(await side.innerText(), /orders-authorization/);
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-node-controls.png'
            ),
            fullPage: true,
        });
        await v.evaluate((e) => {
            window.selectionCount = 0;
            window.previewCount = 0;
            e.addEventListener('calm-select', () => window.selectionCount++);
            e.addEventListener('calm-preview', () => window.previewCount++);
        });
        // Neither pointer hover nor Tab focus may replace the selected node's panel.
        const point = await v
            .locator('.edge')
            .first()
            .locator('.hit')
            .evaluate((path) => {
                const p = path.getPointAtLength(path.getTotalLength() * 0.7);
                const s = new DOMPoint(p.x, p.y).matrixTransform(
                    path.getScreenCTM()
                );
                return { x: s.x, y: s.y };
            });
        await page.mouse.move(point.x, point.y);
        assert.match(await side.innerText(), /audit-logging/);
        await v.locator('.edge').nth(1).focus();
        assert.match(await side.innerText(), /audit-logging/);
        assert.equal(await page.evaluate(() => selectionCount), 0);
        assert.equal(await page.evaluate(() => previewCount), 0);
        await page.keyboard.press('Enter');
        assert.match(await side.innerText(), /web-api/);
        assert.match(await side.innerText(), /HTTPS/);
        assert.match(await side.innerText(), /Storefront \(web\)/);
        assert.match(await side.innerText(), /Orders API \(api\)/);
        assert.match(await side.innerText(), /encrypted-transport/);
        await page.mouse.click(point.x, point.y);
        assert.match(await side.innerText(), /customer-storefront/);
        assert.match(await side.innerText(), /No controls attached/);
        await v.locator('.edge').nth(1).focus();
        await page.keyboard.press('Space');
        assert.match(await side.innerText(), /encrypted-transport/);
        assert.equal(await page.evaluate(() => selectionCount), 3);
        assert.equal(await page.evaluate(() => previewCount), 0);
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-relationship-details.png'
            ),
            fullPage: true,
        });
        await v.locator('.node[data-id="visitor"]').click();
        assert.match(await side.innerText(), /No controls attached/);
        assert.equal(
            await v.evaluate((e) => JSON.stringify(e.model)),
            original
        );
        const safe = await v.evaluate((e) => {
            const m = e.model;
            m.nodes[0].controls = {
                'unsafe-text': {
                    description: '<img src=x onerror=alert(1)>',
                    requirements: [
                        {
                            'requirement-url': 'javascript:alert(1)',
                            config: { value: '<script>bad()</script>' },
                        },
                    ],
                },
            };
            e.load(m);
            e.inspect(e.data.nodes[0], 'actor');
            return (
                !e.$('.details').querySelector('img,script,a') &&
                e.$('.details').textContent.includes('<img src=x')
            );
        });
        assert.ok(safe);
        await v.evaluate((e) => e.loadSource('./examples/commerce.calm.json'));
        assert.equal(errors.length, 0, errors.join('\n'));
        assert.ok(
            requests.every(
                (url) => new URL(url).origin === new URL(page.url()).origin
            )
        );
        console.log(
            'PASS inspector: node controls, requirements, inline/reference configurations, absent controls, hover/focus leave selection unchanged, relationship click/Enter/Space selection, model immutability, safe text, no external fetches.'
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
