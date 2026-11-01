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
import { positions } from './model.js';

// Viewer conventions, not standardized CALM fields. Ignore invalid optional hints.
const object = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
function entries(metadata) {
    const result = Object.create(null);
    for (const item of Array.isArray(metadata) ? metadata : [metadata]) {
        if (!object(item)) continue;
        if (typeof item.key === 'string' && Object.hasOwn(item, 'value'))
            result[item.key] = item.value;
        else
            for (const [key, value] of Object.entries(item))
                result[key] = value;
    }
    return result;
}
function color(value) {
    if (typeof value !== 'string' || value.length > 128) return;
    const text = value.trim();
    // SVG fill also accepts paint-server URLs. Permit only literal CSS colors.
    if (
        !text ||
        /url|var\s*\(|env\s*\(|currentcolor|inherit|initial|unset|revert|context-/i.test(
            text
        )
    )
        return;
    if (CSS.supports('color', text)) return text;
}
const number = (value, min, max) =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
        ? value
        : undefined;
export function presentation(node, architectureMetadata) {
    const metadata = entries(node.metadata);
    const layout = entries(architectureMetadata)._layout;
    const saved =
        object(layout) &&
        Object.hasOwn(layout, node['unique-id']) &&
        object(layout[node['unique-id']])
            ? layout[node['unique-id']]
            : {};
    const block = object(metadata['building-block-style'])
        ? metadata['building-block-style']
        : {};
    const hints = object(metadata['calm-viewer'])
        ? metadata['calm-viewer']
        : metadata;
    const location = object(hints.location)
        ? hints.location
        : object(hints.position)
          ? hints.position
          : hints;
    const size = object(hints.size) ? hints.size : location;
    return {
        color: color(hints.color) ?? color(block.background),
        textColor:
            color(hints['text-color'] ?? hints.textColor) ?? color(block.text),
        x:
            number(location.x, -100000, 100000) ??
            number(saved.x, -100000, 100000),
        y:
            number(location.y, -100000, 100000) ??
            number(saved.y, -100000, 100000),
        w: number(size.w, 32, 2000) ?? number(saved.w, 32, 2000) ?? 218,
        h: number(size.h, 24, 2000) ?? number(saved.h, 24, 2000) ?? 78,
    };
}
export function initialLayout(nodes, edges, architectureMetadata) {
    const points = positions(nodes, edges);
    for (const node of nodes) {
        const id = node['unique-id'],
            base = points.get(id),
            hint = presentation(node, architectureMetadata);
        points.set(id, { ...hint, x: hint.x ?? base.x, y: hint.y ?? base.y });
    }
    return points;
}
