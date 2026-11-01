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
        await page.goto(process.env.VIEWER_URL || 'http://127.0.0.1:8768');
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer')?.model?.metadata?._layout
        );
        const v = page.locator('calm-viewer');
        const result = await v.evaluate((e) => {
            const original = e.model,
                before = JSON.stringify(original),
                results = {};
            results.everyNode = e.data.nodes.every((n) => {
                const p = e.points.get(n['unique-id']),
                    r = e.nodeEls.get(n['unique-id']).querySelector('rect'),
                    hint = original.metadata._layout[n['unique-id']],
                    style = n.metadata['building-block-style'];
                return (
                    ['x', 'y', 'w', 'h'].every((k) => p[k] === hint[k]) &&
                    r.getAttribute('width') === String(hint.w) &&
                    r.getAttribute('height') === String(hint.h) &&
                    e.nodeEls
                        .get(n['unique-id'])
                        .style.getPropertyValue('--node-fill') ===
                        style.background &&
                    e.nodeEls
                        .get(n['unique-id'])
                        .style.getPropertyValue('--node-text') === style.text
                );
            });
            const actor = e.nodeEls.get('visitor');
            results.photoColors =
                getComputedStyle(actor.querySelector('rect')).fill ===
                    'rgb(73, 162, 123)' &&
                getComputedStyle(actor.querySelector('.name')).fill ===
                    'rgb(85, 170, 118)';
            const api = e.nodeEls.get('api');
            results.compact =
                getComputedStyle(api.querySelector('.kind')).display ===
                    'none' &&
                api.querySelector('rect').getAttribute('height') === '33' &&
                actor.querySelector('rect').getAttribute('width') === '59';
            results.fit = [...e.points.values()].every(
                (p) =>
                    p.x >= e.view.x &&
                    p.y >= e.view.y &&
                    p.x + p.w <= e.view.x + e.view.w &&
                    p.y + p.h <= e.view.y + e.view.h
            );
            e.points.get('api').x += 50;
            e.updateGeometry();
            e.$('.reset').click();
            results.reset =
                e.points.get('api').x === 147 &&
                e.points.get('api').y === 302 &&
                e.points.get('api').h === 33;
            e.inspect(e.data.nodes[0], 'actor');
            results.selected =
                getComputedStyle(e.nodeEls.get('visitor').querySelector('rect'))
                    .fill === 'rgb(73, 162, 123)';
            results.unchanged = JSON.stringify(e.model) === before;
            const m = structuredClone(original);
            m.nodes[0].metadata['calm-viewer'] = {
                color: '#123456',
                location: { x: 12, w: 80 },
            };
            e.load(m);
            results.precedence =
                e.points.get('visitor').x === 12 &&
                e.points.get('visitor').y === 145 &&
                e.points.get('visitor').w === 80 &&
                e.points.get('visitor').h === 63 &&
                getComputedStyle(e.nodeEls.get('visitor').querySelector('rect'))
                    .fill === 'rgb(18, 52, 86)';
            m.metadata = [{ key: '_layout', value: original.metadata._layout }];
            m.nodes[0].metadata = [
                {
                    key: 'building-block-style',
                    value: { background: '#49a27b', text: '#55aa76' },
                },
            ];
            e.load(m);
            results.array =
                e.points.get('visitor').x === 224 &&
                getComputedStyle(e.nodeEls.get('visitor').querySelector('rect'))
                    .fill === 'rgb(73, 162, 123)';
            e.load(original);
            return results;
        });
        for (const [name, passed] of Object.entries(result))
            assert.ok(passed, name);
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-photo-sample.png'
            ),
            fullPage: true,
        });
        assert.equal(errors.length, 0, errors.join('\n'));
        assert.ok(
            requests.every(
                (url) => new URL(url).origin === new URL(page.url()).origin
            )
        );
        console.log(
            'PASS photo sample:',
            Object.keys(result).join(', '),
            'no browser errors or external requests.'
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
