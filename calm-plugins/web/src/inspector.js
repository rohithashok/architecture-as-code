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
import { presentation } from './presentation.js';
// All model values are rendered as text, never markup or automatically fetched links.
function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
}
function field(parent, label, value) {
    if (value === undefined) return;
    const row = document.createElement('div');
    row.className = 'detail-field';
    row.append(
        text('dt', label),
        text('dd', typeof value === 'string' ? value : JSON.stringify(value))
    );
    parent.append(row);
}
function json(parent, label, value) {
    const section = document.createElement('details');
    section.append(
        text('summary', label),
        text('pre', JSON.stringify(value, null, 2))
    );
    parent.append(section);
}
function controls(parent, value) {
    const section = document.createElement('section');
    section.className = 'controls';
    section.setAttribute('aria-label', 'Attached controls');
    const items =
        value && typeof value === 'object' ? Object.entries(value) : [];
    section.append(text('h4', `Controls (${items.length})`));
    if (!items.length)
        section.append(text('p', 'No controls attached.', 'muted'));
    for (const [id, control] of items) {
        const card = document.createElement('article');
        card.className = 'control-card';
        card.append(text('h5', id));
        if (control && typeof control === 'object') {
            if (control.description)
                card.append(text('p', control.description));
            const requirements = Array.isArray(control.requirements)
                ? control.requirements
                : [];
            if (!requirements.length)
                card.append(text('p', 'No requirements supplied.', 'muted'));
            requirements.forEach((requirement, i) => {
                const block = document.createElement('div');
                block.className = 'requirement';
                block.append(text('h6', `Requirement ${i + 1}`));
                const list = document.createElement('dl');
                field(
                    list,
                    'Requirement reference',
                    requirement['requirement-url']
                );
                field(
                    list,
                    'Configuration reference',
                    requirement['config-url']
                );
                block.append(list);
                if (Object.hasOwn(requirement, 'config'))
                    block.append(
                        text('div', 'Inline configuration', 'eyebrow'),
                        text('pre', JSON.stringify(requirement.config, null, 2))
                    );
                card.append(block);
            });
        } else card.append(text('pre', JSON.stringify(control, null, 2)));
        section.append(card);
    }
    parent.append(section);
}
// Normalize supported CSS colors to sRGB hex, retaining non-opaque alpha.
function hexColor(value) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { colorSpace: 'srgb' });
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const rgba = [...context.getImageData(0, 0, 1, 1).data];
    return (
        '#' +
        rgba
            .slice(0, rgba[3] === 255 ? 3 : 4)
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    );
}
export function renderInspector(aside, item, type, model) {
    aside.replaceChildren();
    aside.scrollTop = 0;
    aside.append(text('div', type, 'eyebrow'));
    aside.append(
        text('h3', item.name || item['unique-id'] || 'Model details'),
        text('p', item.description || 'No description provided.')
    );
    const fields = document.createElement('dl');
    field(fields, 'ID', item['unique-id']);
    field(fields, 'Node type', item['node-type']);
    if (item['node-type']) {
        const colors = presentation(item, model.metadata);
        field(
            fields,
            'Background color',
            hexColor(colors.color ?? '#ffffff') +
                (colors.color ? '' : ' (default)')
        );
        field(
            fields,
            'Text color',
            hexColor(colors.textColor ?? '#203f47') +
                (colors.textColor ? '' : ' (default)')
        );
    }

    if (item['relationship-type']) {
        const [kind, data] = Object.entries(item['relationship-type']).find(
            ([key]) =>
                [
                    'connects',
                    'interacts',
                    'composed-of',
                    'deployed-in',
                    'options',
                ].includes(key)
        );
        field(fields, 'Relationship type', kind);
        field(fields, 'Protocol', item.protocol);
        const label = (id) => {
            const node = model.nodes.find((n) => n['unique-id'] === id);
            return node ? `${node.name} (${id})` : id;
        };
        if (kind === 'connects') {
            field(fields, 'Source', label(data.source.node));
            field(fields, 'Destination', label(data.destination.node));
            if (data.source.interfaces?.length)
                field(
                    fields,
                    'Source interfaces',
                    data.source.interfaces.join(', ')
                );
            if (data.destination.interfaces?.length)
                field(
                    fields,
                    'Destination interfaces',
                    data.destination.interfaces.join(', ')
                );
        } else if (kind === 'interacts') {
            field(fields, 'Actor', label(data.actor));
            field(fields, 'Targets', data.nodes.map(label).join('; '));
        } else if (kind === 'composed-of' || kind === 'deployed-in') {
            field(fields, 'Container', label(data.container));
            field(fields, 'Members', data.nodes.map(label).join('; '));
        } else field(fields, 'Options', data);
    }
    aside.append(fields);
    controls(aside, item.controls);
    if (item.interfaces?.length) {
        aside.append(text('h4', `Interfaces (${item.interfaces.length})`));
        for (const value of item.interfaces)
            json(aside, value['unique-id'], value);
    }
    if (item.metadata) json(aside, 'Metadata', item.metadata);
    json(aside, 'Full definition (JSON)', item);
}
