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
                viewport: { width: 1500, height: 1150 },
            }),
            errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(process.env.VIEWER_URL || 'http://127.0.0.1:8773');
        await page.waitForFunction(
            () =>
                document.querySelector('calm-viewer')?.model?.nodes.length === 7
        );
        const v = page.locator('calm-viewer');
        const graph = () =>
            v.evaluate((e) => ({
                model: JSON.stringify(e.model),
                nodes: [...e.shadowRoot.querySelectorAll('.node')].map((g) => ({
                    transform: g.getAttribute('transform'),
                    rect: [
                        getComputedStyle(g.querySelector('rect')).fill,
                        getComputedStyle(g.querySelector('rect')).stroke,
                        g.querySelector('rect').getAttribute('width'),
                        g.querySelector('rect').getAttribute('height'),
                    ],
                    text: [...g.querySelectorAll('text')].map((t) => [
                        getComputedStyle(t).fill,
                        getComputedStyle(t).fontFamily,
                        getComputedStyle(t).fontSize,
                    ]),
                })),
                edges: [
                    ...e.shadowRoot.querySelectorAll('.edge .line,.edge text'),
                ].map((t) => [
                    getComputedStyle(t).stroke,
                    getComputedStyle(t).fill,
                    getComputedStyle(t).fontFamily,
                    getComputedStyle(t).fontSize,
                ]),
                canvas: getComputedStyle(e.$('.canvas')).backgroundColor,
            }));
        await v.locator('.node[data-id="api"]').click();
        const initial = await graph();
        await page.getByLabel('Widget theme').selectOption('dark');
        assert.deepEqual(await graph(), initial);
        assert.equal(
            await v
                .locator('.details')
                .evaluate((n) => getComputedStyle(n).backgroundColor),
            'rgb(23, 35, 45)'
        );
        assert.equal(
            await v
                .locator('.toolbar')
                .evaluate((n) => getComputedStyle(n).backgroundColor),
            'rgb(30, 47, 60)'
        );
        assert.equal(
            await v
                .locator('.control-card')
                .first()
                .evaluate((n) => getComputedStyle(n).backgroundColor),
            'rgb(33, 52, 65)'
        );
        assert.equal(
            await v
                .locator('pre')
                .first()
                .evaluate((n) => getComputedStyle(n).color),
            'rgb(197, 226, 238)'
        );
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-dark.png'
            ),
            fullPage: true,
        });
        await v.getByRole('button', { name: 'Open URL', exact: true }).click();
        assert.equal(
            await v
                .locator('.url-dialog')
                .evaluate((n) => getComputedStyle(n).backgroundColor),
            'rgb(23, 35, 45)'
        );
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-dark-dialog.png'
            ),
            fullPage: true,
        });
        await page.keyboard.press('Escape');
        await page.getByLabel('Widget theme').selectOption('compact');
        assert.deepEqual(await graph(), initial);
        assert.equal(
            await v.evaluate((e) => getComputedStyle(e).fontSize),
            '13px'
        );
        assert.equal(
            await v
                .locator('.toolbar')
                .evaluate((n) => getComputedStyle(n).paddingTop),
            '8px'
        );
        assert.equal(
            await v
                .locator('.open')
                .evaluate((n) => getComputedStyle(n).paddingLeft),
            '8px'
        );
        await v.evaluate((e) => {
            e.style.setProperty('--calm-font-family', 'Georgia, serif');
            e.style.setProperty('--calm-font-size', '18px');
            e.style.setProperty('--calm-text', '#112233');
            e.style.setProperty('--calm-button-background', '#334455');
            e.style.setProperty('--calm-button-text', '#ffffff');
            e.style.setProperty('--calm-gap', '17px');
            e.style.setProperty('--calm-panel-padding', '30px');
            e.style.setProperty('--calm-button-radius', '15px');
        });
        assert.deepEqual(await graph(), initial);
        assert.equal(
            await v
                .locator('.open')
                .evaluate((n) => getComputedStyle(n).backgroundColor),
            'rgb(51, 68, 85)'
        );
        assert.equal(
            await v
                .locator('.open')
                .evaluate((n) => getComputedStyle(n).borderRadius),
            '15px'
        );
        assert.equal(
            await v
                .locator('.toolbar')
                .evaluate((n) => getComputedStyle(n).gap),
            '17px'
        );
        assert.equal(
            await v
                .locator('.details')
                .evaluate((n) => getComputedStyle(n).padding),
            '30px'
        );
        assert.match(
            await v
                .locator('h3')
                .evaluate((n) => getComputedStyle(n).fontFamily),
            /Georgia/
        );
        const isolation = await page.evaluate(() => {
            const wrapper = document.createElement('div');
            wrapper.style.setProperty('--calm-text', '#123456');
            const one = document.createElement('calm-viewer'),
                two = document.createElement('calm-viewer');
            two.style.setProperty('--calm-text', '#abcdef');
            wrapper.append(one, two);
            document.body.append(wrapper);
            const values = [
                getComputedStyle(one).color,
                getComputedStyle(two).color,
            ];
            wrapper.remove();
            return values;
        });
        assert.deepEqual(isolation, ['rgb(18, 52, 86)', 'rgb(171, 205, 239)']);
        await v.evaluate((e) => {
            e.removeAttribute('style');
            e.dataset.theme = 'dark';
            e.fail(Error('Theme test error'));
        });
        assert.equal(
            await v
                .locator('.status')
                .evaluate((n) => getComputedStyle(n).color),
            'rgb(255, 182, 173)'
        );
        await v.evaluate((e) =>
            e.loadSource('./examples/commerce-plain.calm.json')
        );
        const plain = await graph();
        await v.evaluate((e) => (e.dataset.theme = 'compact'));
        assert.deepEqual(await graph(), plain);
        await page.setViewportSize({ width: 390, height: 1100 });
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            ),
            true
        );
        await v.getByRole('button', { name: 'Open URL', exact: true }).click();
        assert.ok(await v.locator('.url-input').isVisible());
        await page.screenshot({
            path: require('node:path').join(
                process.env.ARTIFACT_DIR,
                'calm-viewer-theme-mobile.png'
            ),
            fullPage: true,
        });
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log(
            'PASS theme: dark/compact/live CSS variables, fonts/buttons/spacing, panel/card/code/error/dialog colors, ancestor inheritance, instance isolation, mobile width and dialog, unchanged graph colors/typography/geometry/model including default nodes.'
        );
    } finally {
        await browser.close();
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
