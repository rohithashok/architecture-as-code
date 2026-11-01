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
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1080 },
    });
    const errors = [],
        requests = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => requests.push(r.url()));
    await page.goto(process.env.VIEWER_URL || 'http://127.0.0.1:8765');
    await page.waitForFunction(
        () => document.querySelector('calm-viewer')?.model?.nodes.length === 7
    );
    await page
        .locator('calm-viewer')
        .evaluate((e) => e.loadSource('./examples/commerce-plain.calm.json'));
    const v = page.locator('calm-viewer');
    assert.equal(await v.locator('.node').count(), 7);
    assert.equal(await v.locator('.edge').count(), 11);
    const before = await v.evaluate((e) => JSON.stringify(e.model));
    await v.locator('.node').first().click();
    assert.match(await v.locator('.details').innerText(), /Customer/);
    const node = v.locator('.node').first();
    const transform = await node.getAttribute('transform');
    const box = await node.boundingBox();
    await page.mouse.move(box.x + 30, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 });
    await page.mouse.up();
    assert.notEqual(await node.getAttribute('transform'), transform);
    assert.equal(await v.evaluate((e) => JSON.stringify(e.model)), before);
    await node.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await v.evaluate((e) => JSON.stringify(e.model)), before);
    await v.locator('input[aria-label="Search nodes"]').fill('database');
    assert.equal(await v.locator('.node:not(.dim)').count(), 1);
    await v.locator('input[aria-label="Search nodes"]').fill('');
    await v.locator('select').selectOption('1');
    assert.equal(await v.locator('.edge:not(.dim)').count(), 4);
    await v.locator('select').selectOption('');
    await v.locator('.fit').click();
    await v.locator('.reset').click();
    await v.locator('.edge .hit').first().click({ force: true });
    assert.match(
        await v.locator('.details').innerText(),
        /customer-storefront/
    );
    await v.locator('.edge').first().focus();
    await page.keyboard.press('Enter');
    assert.match(
        await v.locator('.details').innerText(),
        /customer-storefront/
    );
    await page.screenshot({
        path:
            process.env.SCREENSHOT_PATH ||
            require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-desktop.png'
            ),
        fullPage: true,
    });
    const results = await v.evaluate(async (e) => {
        const original = e.model;
        const result = {};
        const clone = () => structuredClone(original);
        let m = clone();
        delete m.nodes[0].description;
        result.required = !e.load(m);
        m = clone();
        m.nodes[1]['unique-id'] = m.nodes[0]['unique-id'];
        result.duplicate = !e.load(m);
        m = clone();
        m.relationships[1]['relationship-type'].connects.source.node =
            'missing';
        result.reference = !e.load(m);
        m = clone();
        m.$schema = 'https://calm.finos.org/release/1.0/meta/calm.json';
        result.version = !e.load(m);
        m = clone();
        m.relationships[1]['relationship-type'].connects.source.interfaces = [
            'missing',
        ];
        result.interface = !e.load(m);
        m = clone();
        m.flows[0].transitions[0]['relationship-unique-id'] = 'missing';
        result.flow = !e.load(m);
        m = clone();
        m.nodes[0].name = '<img src=x onerror=alert(1)>';
        result.safeText = e.load(m) && !e.shadowRoot.querySelector('img');
        result.copy = e.model !== m;
        m.nodes[0].name = 'Changed';
        result.immutable = e.model.nodes[0].name !== 'Changed';
        await e.loadFile(new File(['invalid JSON'], 'invalid.json'));
        result.parse = e.model === null;
        await e.loadFile(
            new File([' '.repeat(5 * 1024 * 1024 + 1)], 'huge.json')
        );
        result.size = e.model === null;
        await e.loadSource('https://example.com/private.json');
        result.remote = e.model === null;
        e.load(original);
        return result;
    });
    for (const [name, passed] of Object.entries(results))
        assert.ok(passed, name);
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.screenshot({
        path: require('node:path').join(
            process.env.ARTIFACT_DIR,
            'calm-viewer-mobile.png'
        ),
        fullPage: true,
    });
    assert.equal(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        ),
        true
    );
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.ok(
        requests.every(
            (url) => new URL(url).origin === new URL(page.url()).origin
        ),
        requests.join('\n')
    );
    console.log(
        'PASS: rendering, click inspection, pointer dragging, keyboard movement, immutable model, search, flow highlighting, reset, schema required fields, duplicate IDs, dangling node/interface/flow references, version rejection, safe text, JSON/size limits, external URL rejection, mobile layout, no external network requests.'
    );
    await browser.close();
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
