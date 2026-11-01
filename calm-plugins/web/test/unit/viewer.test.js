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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../examples/commerce.calm.json';
import { CalmViewer } from '../../src/calm-viewer.js';

let viewer;
const response = (value) =>
    new Response(typeof value === 'string' ? value : JSON.stringify(value));
beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => true });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        fillRect() {},
        getImageData: () => ({
            data: new Uint8ClampedArray([22, 123, 116, 255]),
        }),
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
        configurable: true,
        value() {
            this.open = true;
        },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
        configurable: true,
        value() {
            this.open = false;
        },
    });
    viewer = new CalmViewer();
    document.body.append(viewer);
    expect(viewer.load(fixture)).toBe(true);
});
afterEach(() => {
    viewer?.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('read-only viewer interactions', () => {
    it('renders geometry and gives independent model copies', () => {
        expect(viewer.shadowRoot.querySelectorAll('.node')).toHaveLength(7);
        const value = viewer.model;
        value.nodes[0].name = 'Changed';
        expect(viewer.model.nodes[0].name).toBe('Customer');
        viewer.model = fixture;
        expect(viewer.points.get('api').h).toBe(33);
    });
    it('shows controls, configurations, metadata and full definitions', () => {
        viewer.inspect(
            viewer.data.nodes.find((node) => node['unique-id'] === 'api'),
            'service'
        );
        const panel = viewer.$('.details');
        expect(panel.textContent).toContain('access-control');
        expect(panel.textContent).toContain('orders-authorization');
        expect(panel.textContent).toContain('Inline configuration');
        expect(panel.textContent).toContain('Background color');
        viewer.inspect(viewer.data.relationships[1], 'Relationship');
        expect(panel.textContent).toContain('Storefront (web)');
        expect(panel.textContent).toContain('HTTPS');
        for (const relation of viewer.data.relationships)
            viewer.inspect(relation, 'Relationship');
        viewer.inspect(viewer.data, 'Architecture');
        expect(panel.textContent).toContain('Full definition');
    });
    it('keeps model text inert and shows interfaces/options', () => {
        const value = structuredClone(fixture);
        value.nodes[0].name = '<img src=x onerror=alert(1)>';
        value.nodes[0].interfaces = [{ 'unique-id': 'browser' }];
        value.relationships.push({
            'unique-id': 'alternative',
            'relationship-type': {
                options: [
                    {
                        description: 'Choice',
                        nodes: ['api'],
                        relationships: ['web-api'],
                    },
                ],
            },
        });
        expect(viewer.load(value)).toBe(true);
        viewer.inspect(viewer.data.nodes[0], 'actor');
        expect(viewer.$('.details').querySelector('img')).toBeNull();
        expect(viewer.$('.details').textContent).toContain('browser');
        viewer.inspect(viewer.data.relationships.at(-1), 'Relationship');
        expect(viewer.$('.details').textContent).toContain('Options');
    });
    it('filters nodes and highlights flows without changing the model', () => {
        const original = viewer.model;
        viewer.$('input').value = 'database';
        viewer.$('input').dispatchEvent(new Event('input'));
        expect(
            viewer.shadowRoot.querySelectorAll('.node:not(.dim)')
        ).toHaveLength(1);
        viewer.$('input').value = '';
        viewer.$('select').value = '1';
        viewer.$('select').dispatchEvent(new Event('change'));
        expect(
            viewer.shadowRoot.querySelectorAll('.edge:not(.dim)')
        ).toHaveLength(4);
        expect(viewer.model).toEqual(original);
    });
    it('uses keyboard activation and temporary node movement', () => {
        const id = 'api',
            node = viewer.nodeEls.get(id),
            original = viewer.model;
        viewer.key({ key: 'Enter', target: node, preventDefault() {} });
        expect(viewer.selected).toBe(id);
        const initial = viewer.points.get(id).x;
        viewer.key({
            key: 'ArrowRight',
            shiftKey: true,
            target: node,
            preventDefault() {},
        });
        expect(viewer.points.get(id).x).toBe(initial + 40);
        for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowDown', '+', '-'])
            viewer.key({ key, target: node, preventDefault() {} });
        viewer.$('.reset').click();
        expect(viewer.points.get(id).x).toBe(initial);
        viewer.key({
            key: ' ',
            target: viewer.edgeEls[0],
            preventDefault() {},
        });
        expect(viewer.selected).toBe('customer-storefront');
        expect(viewer.model).toEqual(original);
    });
    it('fits and zooms and renders a self-relationship', () => {
        const originalWidth = viewer.view.w;
        viewer.zoom(2);
        expect(viewer.view.w).toBeGreaterThan(originalWidth);
        viewer.$('.fit').click();
        expect(viewer.view.w).toBe(originalWidth);
        const model = structuredClone(fixture);
        model.relationships.push({
            'unique-id': 'self',
            'relationship-type': {
                connects: {
                    source: { node: 'api' },
                    destination: { node: 'api' },
                },
            },
        });
        expect(viewer.load(model)).toBe(true);
        expect(
            viewer.edgeEls.at(-1).querySelector('path').getAttribute('d')
        ).toContain('C');
    });
    it('does not replace the panel on relationship hover or focus', () => {
        viewer.inspect(viewer.data.nodes[3], 'service');
        const selected = viewer.selected;
        viewer.edgeEls[0].dispatchEvent(new Event('pointerenter'));
        viewer.edgeEls[0].focus();
        expect(viewer.selected).toBe(selected);
    });
});

describe('local and URL loading', () => {
    it('clears active drag state when a model is replaced or fails', () => {
        viewer.drag = { id: 'api' };
        viewer.load(fixture);
        expect(viewer.drag).toBeNull();
        viewer.drag = { id: 'api' };
        viewer.load({});
        expect(viewer.drag).toBeNull();
    });

    it('loads local files and rejects malformed or oversized ones', async () => {
        await viewer.loadFile({
            size: 20,
            text: async () => JSON.stringify(fixture),
        });
        expect(viewer.model.nodes).toHaveLength(7);
        await viewer.loadFile({ size: 20, text: async () => 'invalid' });
        expect(viewer.model).toBeNull();
        await viewer.loadFile({ size: 6 * 1024 * 1024 });
        expect(viewer.$('.status').textContent).toContain('5 MiB');
    });
    it('streams successful sources while omitting credentials and referrer', async () => {
        const fetch = vi.fn(async () => response(fixture));
        vi.stubGlobal('fetch', fetch);
        expect(await viewer.loadSource('./example.json')).toBe(true);
        expect(fetch).toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({
                credentials: 'omit',
                redirect: 'error',
                referrerPolicy: 'no-referrer',
            })
        );
        expect(await viewer.loadURL('https://example.com/model.json')).toBe(
            true
        );
        expect(viewer.getAttribute('aria-busy')).toBe('false');
    });
    it('rejects schemes, embedded credentials and automatic cross-origin sources', async () => {
        expect(
            await viewer.loadSource('https://other.example/model.json')
        ).toBe(false);
        expect(await viewer.loadURL('file:///model.json')).toBe(false);
        expect(
            await viewer.loadURL('https://user:pass@example.com/model.json')
        ).toBe(false);
    });
    it('reports HTTP, empty body, oversized and CORS/network errors', async () => {
        for (const data of [
            new Response('', { status: 404 }),
            new Response(null),
            new Response(' ', {
                headers: { 'Content-Length': String(6 * 1024 * 1024) },
            }),
            new Response(' '.repeat(6 * 1024 * 1024)),
        ]) {
            vi.stubGlobal(
                'fetch',
                vi.fn(async () => data)
            );
            expect(await viewer.loadURL('https://example.com/model.json')).toBe(
                false
            );
        }
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new TypeError('Network');
            })
        );
        expect(await viewer.loadURL('https://example.com/model.json')).toBe(
            false
        );
        expect(viewer.$('.status').textContent).toContain('CORS');
    });
    it('cancels pending loads and ignores their late results', async () => {
        let complete;
        vi.stubGlobal(
            'fetch',
            () =>
                new Promise((resolve) => {
                    complete = resolve;
                })
        );
        const pending = viewer.loadURL('https://example.com/model.json');
        viewer.cancelLoad();
        expect(viewer.model.nodes[0].name).toBe('Customer');
        complete(response({ ...fixture, nodes: [] }));
        await pending;
        expect(viewer.model.nodes[0].name).toBe('Customer');
    });
    it('times out stalled requests', async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'fetch',
            (_url, { signal }) =>
                new Promise((_resolve, reject) =>
                    signal.addEventListener('abort', () =>
                        reject(new DOMException('Aborted', 'AbortError'))
                    )
                )
        );
        const pending = viewer.loadURL('https://example.com/model.json');
        await vi.advanceTimersByTimeAsync(30001);
        expect(await pending).toBe(false);
        expect(viewer.$('.status').textContent).toContain('timed out');
    });
    it('opens and dismisses the URL dialog without requesting a file', () => {
        viewer.$('.open-url').click();
        expect(viewer.$('.url-dialog').open).toBe(true);
        viewer.$('.url-dismiss').click();
        expect(viewer.$('.url-dialog').open).toBe(false);
    });
});
