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
import { beforeAll, describe, expect, it, vi } from 'vitest';
import fixture from '../../examples/commerce.calm.json';
import { presentation, initialLayout } from '../../src/presentation.js';
import { readModel } from '../../src/model.js';

beforeAll(() =>
    vi.stubGlobal('CSS', {
        supports: (_, value) => {
            const style = document.createElement('span').style;
            style.color = value;
            return style.color !== '';
        },
    })
);
describe('presentation hints', () => {
    it('reads the reference photo styles and root geometry exactly', () => {
        const node = fixture.nodes[0];
        const result = presentation(node, fixture.metadata);
        expect(result).toEqual({
            color: '#49a27b',
            textColor: '#55aa76',
            x: 224,
            y: 145,
            w: 59,
            h: 63,
        });
    });
    it('supports namespaced hints, aliases and field-wise fallbacks', () => {
        const node = structuredClone(fixture.nodes[0]);
        node.metadata['calm-viewer'] = {
            color: '#123456',
            textColor: '#ffffff',
            position: { x: 0, y: -4 },
            size: { w: 400, h: 90 },
        };
        expect(presentation(node, fixture.metadata)).toMatchObject({
            color: '#123456',
            textColor: '#ffffff',
            x: 0,
            y: -4,
            w: 400,
            h: 90,
        });
        node.metadata['calm-viewer'].color =
            'url(https://example.invalid/paint)';
        expect(presentation(node).color).toBe('#49a27b');
    });
    it('reads object/array/key-value metadata with later keys winning', () => {
        const node = {
            'unique-id': 'node',
            metadata: [
                { color: 'red' },
                { key: 'color', value: 'blue' },
                { key: 'location', value: { x: 0, y: 0, w: 180, h: 60 } },
                null,
            ],
        };
        expect(presentation(node)).toMatchObject({
            color: 'blue',
            x: 0,
            y: 0,
            w: 180,
            h: 60,
        });
    });
    it.each([
        'var(--color)',
        'inherit',
        'currentColor',
        'url(x)',
        'not-a-color',
        null,
        42,
    ])('rejects unsafe or invalid color %s', (color) => {
        expect(presentation({ metadata: { color } }).color).toBeUndefined();
    });
    it('rejects nonnumeric/out-of-range geometry and supplies defaults', () => {
        expect(
            presentation({ metadata: { x: '5', y: Infinity, w: -1, h: 2001 } })
        ).toMatchObject({ x: undefined, y: undefined, w: 218, h: 78 });
    });
    it('applies hints to topology positions without modifying the model', () => {
        const { model, edges } = readModel(fixture);
        const before = JSON.stringify(model);
        expect(
            initialLayout(model.nodes, edges, model.metadata).get('api')
        ).toMatchObject({ x: 147, y: 302, w: 216, h: 33 });
        expect(JSON.stringify(model)).toBe(before);
    });
});
