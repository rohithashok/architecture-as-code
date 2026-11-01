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
                viewport: { width: 1500, height: 1100 },
            }),
            requests = [],
            errors = [];
        page.on('request', (r) => requests.push(r.url()));
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(process.env.VIEWER_URL || 'http://127.0.0.1:8767');
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer')?.model?.nodes.length === 7
        );
        await page
            .locator('calm-viewer')
            .evaluate((e) =>
                e.loadSource('./examples/commerce-plain.calm.json')
            );
        const result = await page.locator('calm-viewer').evaluate(async (e) => {
            const original = e.model,
                clone = () => structuredClone(original),
                id = original.nodes[0]['unique-id'];
            const node = () => e.nodeEls.get(id),
                fill = () =>
                    getComputedStyle(node().querySelector('rect')).fill;
            const text = () =>
                getComputedStyle(node().querySelector('.name')).fill;
            const results = {};
            let m = clone();
            m.nodes[0].metadata = {
                'calm-viewer': {
                    color: '#123456',
                    'text-color': 'white',
                    location: { x: 0, y: -100, z: 20, w: 400, h: 160 },
                },
            };
            const raw = JSON.stringify(m);
            results.load = e.load(m);
            const p = e.points.get(id);
            results.geometry =
                p.x === 0 && p.y === -100 && p.w === 400 && p.h === 160;
            results.colors =
                fill() === 'rgb(18, 52, 86)' &&
                text() === 'rgb(255, 255, 255)' &&
                getComputedStyle(node().querySelector('.kind')).fill ===
                    'rgb(255, 255, 255)';
            results.size =
                node().querySelector('rect').getAttribute('width') === '400' &&
                node().querySelector('rect').getAttribute('height') === '160';
            e.inspect(e.data.nodes[0], 'Component');
            results.selected = fill() === 'rgb(18, 52, 86)';
            e.points.get(id).x = 900;
            e.points.get(id).y = 1000;
            e.updateGeometry();
            e.$('.reset').click();
            results.reset =
                e.points.get(id).x === 0 &&
                e.points.get(id).y === -100 &&
                e.points.get(id).w === 400;
            results.immutable =
                JSON.stringify(e.model) === raw && JSON.stringify(m) === raw;
            const v = e.view;
            results.fit =
                e.points.get(id).x >= v.x &&
                e.points.get(id).y >= v.y &&
                e.points.get(id).x + 400 <= v.x + v.w &&
                e.points.get(id).y + 160 <= v.y + v.h;
            m = clone();
            m.nodes[0].metadata = [
                { key: 'color', value: 'rebeccapurple' },
                { key: 'text-color', value: '#abcdef' },
                { key: 'location', value: { x: 321, y: 456, z: -5, h: 100 } },
            ];
            e.load(m);
            results.array =
                fill() === 'rgb(102, 51, 153)' &&
                e.points.get(id).x === 321 &&
                e.points.get(id).h === 100;
            m = clone();
            m.nodes[0].metadata = {
                color: 'rgb(10, 20, 30)',
                textColor: 'hsl(0, 0%, 100%)',
                position: { x: 5 },
                size: { w: 500, h: 150 },
            };
            e.load(m);
            results.partial =
                e.points.get(id).x === 5 &&
                e.points.get(id).y === 70 &&
                e.points.get(id).w === 500 &&
                text() === 'rgb(255, 255, 255)';
            for (const bad of [
                'url(https://example.com/paint.svg#x)',
                'var(--attack)',
                'inherit',
                'red; stroke: blue',
                'not-a-color',
                42,
                null,
            ]) {
                m = clone();
                m.nodes[0].metadata = {
                    color: bad,
                    'text-color': bad,
                    location: { x: '12', y: Infinity, z: NaN, w: -10, h: 1 },
                };
                if (!e.load(m))
                    throw Error('Bad optional hints rejected model');
                if (
                    fill() !== 'rgb(255, 255, 255)' ||
                    e.points.get(id).w !== 218 ||
                    e.points.get(id).h !== 78 ||
                    e.points.get(id).y !== 70
                )
                    throw Error('Invalid hint did not fall back');
            }
            results.invalid = true;
            m = clone();
            m.nodes[0].metadata = {
                location: { x: 100001, y: -100001, z: 10001, w: 2001, h: 2001 },
            };
            e.load(m);
            results.bounds =
                e.points.get(id).x === 80 &&
                e.points.get(id).y === 70 &&
                e.points.get(id).w === 218;
            e.load(original);
            results.defaults =
                fill() === 'rgb(255, 255, 255)' &&
                e.points.get(id).w === 218 &&
                e.points.get(id).h === 78;
            return results;
        });
        for (const [name, passed] of Object.entries(result))
            assert.ok(passed, name);
        await page.getByRole('button', { name: 'Try larger nodes' }).click();
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer').points.get('visitor')
                    .color === '#273c53'
        );
        const v = page.locator('calm-viewer'),
            n = v.locator('.node[data-id="api"]');
        const before = await v.evaluate((e) => JSON.stringify(e.model));
        const rect = await n.boundingBox();
        await page.mouse.move(rect.x + 30, rect.y + 30);
        await page.mouse.down();
        await page.mouse.move(rect.x + 70, rect.y + 60, { steps: 4 });
        await page.mouse.up();
        assert.equal(await n.locator('rect').getAttribute('width'), '270');
        assert.equal(await v.evaluate((e) => JSON.stringify(e.model)), before);
        await v.locator('.reset').click();
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-metadata.png'
            ),
            fullPage: true,
        });
        assert.equal(errors.length, 0, errors.join('\n'));
        assert.ok(
            requests.every(
                (r) => new URL(r).origin === new URL(page.url()).origin
            )
        );
        console.log(
            'PASS metadata:',
            Object.keys(result).join(', '),
            'and dimension-preserving drag, styled example, no external requests.'
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
