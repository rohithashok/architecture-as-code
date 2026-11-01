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
import { describe, it, expect } from 'vitest';
import fixture from '../../examples/commerce.calm.json';
import { readModel, positions, MAX_BYTES } from '../../src/model.js';

const copy = () => structuredClone(fixture);
describe('CALM architecture validation', () => {
    it('validates a synthetic architecture without changing input', () => {
        const input = copy();
        const before = JSON.stringify(input);
        const result = readModel(input);
        expect(result.edges).toHaveLength(11);
        expect(result.model).not.toBe(input);
        expect(JSON.stringify(input)).toBe(before);
        expect(MAX_BYTES).toBe(5 * 1024 * 1024);
    });
    it.each([null, [], 'text'])('rejects non-object input %s', (value) =>
        expect(() => readModel(value)).toThrow()
    );
    it('rejects unsupported versions and missing arrays', () => {
        const model = copy();
        model.$schema = 'other';
        expect(() => readModel(model)).toThrow(/1.2/);
        model.$schema = fixture.$schema;
        delete model.nodes;
        expect(() => readModel(model)).toThrow(/arrays/);
    });
    it('uses full schema validation for required node fields and protocols', () => {
        const model = copy();
        delete model.nodes[0].description;
        expect(() => readModel(model)).toThrow(/validation failed/);
        model.nodes[0].description = '';
        model.relationships[1].protocol = 'invalid';
        expect(() => readModel(model)).toThrow(/validation failed/);
    });
    it('rejects duplicate and empty IDs', () => {
        const model = copy();
        model.nodes[1]['unique-id'] = model.nodes[0]['unique-id'];
        expect(() => readModel(model)).toThrow(/duplicate/);
        model.nodes[1]['unique-id'] = '';
        expect(() => readModel(model)).toThrow(/Empty/);
    });
    it('checks node, interface and flow references', () => {
        const model = copy();
        const endpoint =
            model.relationships[1]['relationship-type'].connects.source;
        endpoint.node = 'missing';
        expect(() => readModel(model)).toThrow(/node reference/);
        endpoint.node = 'web';
        endpoint.interfaces = ['missing'];
        expect(() => readModel(model)).toThrow(/interface reference/);
        delete endpoint.interfaces;
        model.flows[0].transitions[0]['relationship-unique-id'] = 'missing';
        expect(() => readModel(model)).toThrow(/flow relationship/);
    });
    it('accepts valid interfaces and rejects duplicate interfaces', () => {
        const model = copy();
        model.nodes[2].interfaces = [{ 'unique-id': 'https' }];
        model.relationships[1]['relationship-type'].connects.source.interfaces =
            ['https'];
        expect(readModel(model).edges).toHaveLength(11);
        model.nodes[2].interfaces.push({ 'unique-id': 'https' });
        expect(() => readModel(model)).toThrow(/Duplicate interface/);
    });
    it('checks relationship options without inventing edges', () => {
        const model = copy();
        model.relationships.push({
            'unique-id': 'choice',
            'relationship-type': {
                options: [
                    {
                        description: 'Alternative',
                        nodes: ['api'],
                        relationships: ['web-api'],
                    },
                ],
            },
        });
        expect(readModel(model).edges).toHaveLength(11);
        model.relationships.at(-1)[
            'relationship-type'
        ].options[0].relationships = ['missing'];
        expect(() => readModel(model)).toThrow(/option relationship/);
    });
    it('bounds node, relationship and expanded-edge counts', () => {
        const model = copy();
        model.nodes = Array.from({ length: 501 }, (_, i) => ({
            ...model.nodes[0],
            'unique-id': String(i),
        }));
        expect(() => readModel(model)).toThrow(/500 nodes/);
        model.nodes = copy().nodes;
        model.relationships = Array(1501).fill(model.relationships[0]);
        expect(() => readModel(model)).toThrow(/1,500/);
        model.relationships = [
            {
                'unique-id': 'many',
                'relationship-type': {
                    interacts: {
                        actor: 'visitor',
                        nodes: Array(4001).fill('web'),
                    },
                },
            },
        ];
        delete model.flows;
        expect(() => readModel(model)).toThrow(/4,000/);
    });
});
describe('automatic layout', () => {
    it('handles topology, isolated nodes, cycles and empty models', () => {
        const { model, edges } = readModel(copy());
        const layout = positions(model.nodes, edges);
        expect(layout.get('web').x).toBeGreaterThan(layout.get('visitor').x);
        expect(layout.get('store').y).toBeGreaterThan(layout.get('visitor').y);
        expect(positions([]).size).toBe(0);
        const cycle = positions(model.nodes, [
            ...edges,
            { source: 'api', target: 'visitor', type: 'connects' },
        ]);
        for (const point of cycle.values())
            expect(Number.isFinite(point.x + point.y)).toBe(true);
    });
});
