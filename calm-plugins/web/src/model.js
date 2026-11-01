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
import validate from './generated/validate.cjs';
export const SCHEMA = 'https://calm.finos.org/release/1.2/meta/calm.json';
export const MAX_BYTES = 5 * 1024 * 1024;
export function readModel(input) {
    const model = structuredClone(input);
    if (!model || typeof model !== 'object' || Array.isArray(model))
        throw Error('Expected a CALM architecture object.');
    if (model.$schema !== SCHEMA)
        throw Error(
            'This viewer supports CALM 1.2 only. Set $schema to ' +
                SCHEMA +
                ' after validating your model version.'
        );
    if (!Array.isArray(model.nodes) || !Array.isArray(model.relationships))
        throw Error(
            'An architecture must contain nodes and relationships arrays.'
        );
    if (model.nodes.length > 500 || model.relationships.length > 1500)
        throw Error('Viewer limit: 500 nodes and 1,500 relationships.');
    if (!validate(model))
        throw Error(
            'CALM 1.2 validation failed: ' +
                validate.errors
                    .slice(0, 6)
                    .map((e) => `${e.instancePath || '/'} ${e.message}`)
                    .join('; ')
        );
    const ids = new Set();
    for (const item of [
        ...model.nodes,
        ...model.relationships,
        ...(model.flows || []),
    ]) {
        if (!item['unique-id'] || ids.has(item['unique-id']))
            throw Error('Empty or duplicate ID: ' + item['unique-id']);
        ids.add(item['unique-id']);
    }
    const nodes = new Map(model.nodes.map((n) => [n['unique-id'], n]));
    const relations = new Map(
        model.relationships.map((r) => [r['unique-id'], r])
    );
    const requireNode = (id) => {
        if (!nodes.has(id)) throw Error('Unknown node reference: ' + id);
    };
    const edges = [];
    for (const r of model.relationships) {
        const [type, data] = Object.entries(r['relationship-type']).find(
            ([k]) =>
                [
                    'connects',
                    'interacts',
                    'composed-of',
                    'deployed-in',
                    'options',
                ].includes(k)
        );
        let pairs = [];
        if (type === 'connects') {
            for (const endpoint of [data.source, data.destination]) {
                requireNode(endpoint.node);
                for (const id of endpoint.interfaces || [])
                    if (
                        !(nodes.get(endpoint.node).interfaces || []).some(
                            (i) => i['unique-id'] === id
                        )
                    )
                        throw Error('Unknown interface reference: ' + id);
            }
            pairs = [[data.source.node, data.destination.node]];
        } else if (type === 'interacts')
            pairs = data.nodes.map((id) => [data.actor, id]);
        else if (type === 'composed-of' || type === 'deployed-in')
            pairs = data.nodes.map((id) => [data.container, id]);
        else
            for (const option of data) {
                option.nodes.forEach(requireNode);
                for (const id of option.relationships)
                    if (!relations.has(id))
                        throw Error('Unknown option relationship: ' + id);
            }
        for (const [source, target] of pairs) {
            requireNode(source);
            requireNode(target);
            if (edges.length >= 4000)
                throw Error('Viewer limit: 4,000 expanded relationship edges.');
            edges.push({ source, target, type, relationship: r });
        }
    }
    for (const n of model.nodes) {
        const seen = new Set();
        for (const i of n.interfaces || []) {
            if (seen.has(i['unique-id']))
                throw Error('Duplicate interface ID in ' + n['unique-id']);
            seen.add(i['unique-id']);
        }
    }
    for (const flow of model.flows || [])
        for (const t of flow.transitions)
            if (!relations.has(t['relationship-unique-id']))
                throw Error(
                    'Unknown flow relationship: ' + t['relationship-unique-id']
                );
    return { model, edges };
}
export function positions(nodes, edges = []) {
    const incoming = new Map(nodes.map((n) => [n['unique-id'], 0]));
    const outgoing = new Map(nodes.map((n) => [n['unique-id'], []]));
    const connected = new Set();
    for (const e of edges.filter((e) =>
        ['connects', 'interacts'].includes(e.type)
    )) {
        outgoing.get(e.source).push(e.target);
        incoming.set(e.target, incoming.get(e.target) + 1);
        connected.add(e.source);
        connected.add(e.target);
    }
    const levels = new Map(),
        queue = [...incoming]
            .filter(([id, n]) => n === 0 && connected.has(id))
            .map(([id]) => id);
    queue.forEach((id) => levels.set(id, 0));
    for (let i = 0; i < queue.length; i++) {
        const id = queue[i];
        for (const target of outgoing.get(id)) {
            levels.set(
                target,
                Math.max(levels.get(target) || 0, levels.get(id) + 1)
            );
            incoming.set(target, incoming.get(target) - 1);
            if (incoming.get(target) === 0) queue.push(target);
        }
    }
    const columns = new Map(),
        points = new Map();
    let isolated = 0;
    const depth = Math.min(5, Math.max(0, ...levels.values()));
    for (const n of nodes) {
        const id = n['unique-id'];
        if (!connected.has(id)) continue;
        const col = Math.min(5, levels.get(id) ?? depth);
        const row = columns.get(col) || 0;
        columns.set(col, row + 1);
        points.set(id, { x: 80 + col * 290, y: 70 + row * 160 });
    }
    const bottom = 70 + Math.max(1, ...columns.values()) * 160;
    const cols = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(nodes.length))));
    for (const n of nodes) {
        const id = n['unique-id'];
        if (points.has(id)) continue;
        points.set(id, {
            x: 80 + (isolated % cols) * 290,
            y: bottom + Math.floor(isolated / cols) * 160,
        });
        isolated++;
    }
    return points;
}
