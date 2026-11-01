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
import style from './styles.js';
import { readModel, MAX_BYTES } from './model.js';
import { initialLayout } from './presentation.js';
import { renderInspector } from './inspector.js';
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
};
export class CalmViewer extends HTMLElement {
    static observedAttributes = ['src'];
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.version = 0;
        this.shadowRoot.innerHTML = `<style>${style}</style><div class="shell"><div class="toolbar"><span class="title">Architecture explorer</span><span class="tag">READ ONLY · LOCAL</span><input aria-label="Search nodes" placeholder="Find a component…"><select aria-label="Flow"><option value="">All flows</option></select><button class="open">Open JSON</button><button class="open-url">Open URL</button><button class="cancel-load" hidden>Cancel loading</button><input class="file" type="file" accept=".json,application/json" hidden><button class="fit">Fit</button><button class="reset">Reset layout</button></div><dialog class="url-dialog" aria-labelledby="url-heading"><form class="url-form"><h2 id="url-heading">Open a CALM URL</h2><p>Enter a direct HTTP(S) link to a CALM 1.2 JSON file. Remote servers must allow browser access (CORS). Maximum 5 MiB.</p><label for="model-url">JSON URL</label><input id="model-url" class="url-input" type="url" required placeholder="https://example.com/calm.json" autocomplete="off" spellcheck="false"><div class="url-error" role="alert"></div><div class="url-actions"><button type="button" class="url-dismiss">Cancel</button><button type="submit">Load architecture</button></div></form></dialog><div class="body"><div class="canvas"><svg tabindex="0" aria-label="Architecture diagram. Tab to inspect elements. Arrow keys move focused nodes; plus and minus zoom." role="group"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#789b97"/></marker></defs><g class="edges"></g><g class="nodes"></g></svg><div class="empty">Open a CALM 1.2 architecture<br>or drop a JSON file here.</div><div class="legend">— Communication <span>┄ Composition / deployment</span></div></div><aside class="details" aria-label="Component details"></aside></div><div class="status" role="status" aria-live="polite">Ready · CALM 1.2 · No model loaded</div></div>`;
        const $ = (s) => this.shadowRoot.querySelector(s);
        this.$ = $;
        this.svg = $('svg');
        $('.open').onclick = () => $('.file').click();
        $('.open-url').onclick = () => {
            $('.url-error').textContent = '';
            $('.url-dialog').showModal();
            $('.url-input').focus();
        };
        $('.url-dismiss').onclick = () => $('.url-dialog').close();
        $('.url-form').onsubmit = (event) => {
            event.preventDefault();
            const value = $('.url-input').value.trim();
            try {
                this.sourceURL(value, true);
            } catch (error) {
                $('.url-error').textContent = error.message;
                return;
            }
            $('.url-dialog').close();
            this.loadURL(value);
        };
        $('.cancel-load').onclick = () => this.cancelLoad();
        $('.file').onchange = () => {
            const f = $('.file').files[0];
            if (f) this.loadFile(f);
            $('.file').value = '';
        };
        $('.fit').onclick = () => this.fit();
        $('.reset').onclick = () => {
            if (this.data) {
                this.points = initialLayout(
                    this.data.nodes,
                    this.edges,
                    this.data.metadata
                );
                this.draw();
                this.fit();
            }
        };
        $('input').oninput = () => this.filter();
        $('select').onchange = () => {
            this.filter();
            if (this.$('select').value)
                this.inspect(
                    this.data.flows[Number(this.$('select').value) - 1],
                    'Flow'
                );
        };
        this.svg.addEventListener('pointerdown', (e) => this.pointerDown(e));
        this.svg.addEventListener('pointermove', (e) => this.pointerMove(e));
        this.svg.addEventListener('pointerup', (e) => this.pointerUp(e));
        this.svg.addEventListener('pointercancel', () => (this.drag = null));
        this.svg.addEventListener(
            'wheel',
            (e) => {
                e.preventDefault();
                this.zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12);
            },
            { passive: false }
        );
        this.svg.addEventListener('keydown', (e) => this.key(e));
        this.shadowRoot.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        this.shadowRoot.addEventListener('drop', (e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) this.loadFile(f);
        });
        this.detailsHint();
        this.view = { x: 0, y: 0, w: 1100, h: 650 };
        this.setView();
    }
    connectedCallback() {
        if (this.getAttribute('src')) this.loadSource(this.getAttribute('src'));
    }
    disconnectedCallback() {
        this.version++;
        this.stopRequest();
        this.$('.url-dialog').close();
    }
    attributeChangedCallback(name, old, value) {
        if (old !== value && this.isConnected) {
            if (value) this.loadSource(value);
            else {
                this.version++;
                this.stopRequest();
            }
        }
    }
    get model() {
        return this.data ? structuredClone(this.data) : null;
    }
    set model(value) {
        this.load(value);
    }
    load(model) {
        this.version++;
        this.stopRequest();
        return this.apply(model);
    }
    apply(model) {
        this.drag = null;
        this.moved = false;
        try {
            const result = readModel(model);
            this.data = result.model;
            this.edges = result.edges;
            this.points = initialLayout(
                this.data.nodes,
                this.edges,
                this.data.metadata
            );
            this.selected = null;
            this.$('input').value = '';
            const select = this.$('select');
            select.replaceChildren(new Option('All flows', ''));
            (this.data.flows || []).forEach((f, i) =>
                select.add(new Option(f.name, String(i + 1)))
            );
            this.draw();
            this.fit();
            this.detailsHint();
            this.$('.empty').hidden = true;
            this.status(
                `${this.data.nodes.length} nodes · ${this.data.relationships.length} relationships · CALM 1.2 vocabulary validated · External definitions not fetched`
            );
            this.dispatchEvent(
                new CustomEvent('calm-load', {
                    detail: {
                        nodes: this.data.nodes.length,
                        relationships: this.data.relationships.length,
                    },
                })
            );
            return true;
        } catch (error) {
            this.fail(error);
            return false;
        }
    }
    async loadFile(file) {
        const version = ++this.version;
        this.stopRequest();
        try {
            if (file.size > MAX_BYTES)
                throw Error('File exceeds the 5 MiB limit.');
            const text = await file.text();
            if (version === this.version) this.apply(JSON.parse(text));
        } catch (e) {
            if (version === this.version) this.fail(e);
        }
    }
    sourceURL(src, allowRemote) {
        const url = allowRemote ? new URL(src) : new URL(src, document.baseURI);
        if (!['http:', 'https:'].includes(url.protocol))
            throw Error('Use an HTTP(S) URL. For local files, use Open JSON.');
        if (url.username || url.password)
            throw Error(
                'URLs containing usernames or passwords are not supported.'
            );
        if (!allowRemote && url.origin !== location.origin)
            throw Error(
                'src must be a same-origin HTTP(S) URL. Use Open URL for a remote file.'
            );
        return url;
    }
    setLoading(loading) {
        this.$('.cancel-load').hidden = !loading;
        this.setAttribute('aria-busy', String(loading));
    }
    stopRequest() {
        this.abort?.abort();
        this.setLoading(false);
    }
    cancelLoad() {
        this.version++;
        this.stopRequest();
        this.status('Loading canceled.');
    }
    loadSource(src) {
        return this.fetchSource(src, false);
    }
    loadURL(url) {
        return this.fetchSource(url, true);
    }
    async fetchSource(src, allowRemote) {
        const version = ++this.version;
        this.stopRequest();
        const controller = new AbortController();
        this.abort = controller;
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, 30000);
        try {
            const url = this.sourceURL(src, allowRemote);
            this.setLoading(true);
            this.status('Downloading architecture… 0 KiB / 5 MiB maximum');
            const response = await fetch(url, {
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit',
                redirect: 'error',
                referrerPolicy: 'no-referrer',
            });
            if (!response.ok)
                throw Error(
                    `Could not load architecture (HTTP ${response.status}).`
                );
            const length = Number(response.headers.get('Content-Length'));
            if (Number.isFinite(length) && length > MAX_BYTES) {
                await response.body?.cancel();
                throw Error('File exceeds the 5 MiB limit.');
            }
            if (!response.body) throw Error('The response has no JSON body.');
            const reader = response.body.getReader();
            const chunks = [];
            let size = 0;
            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > MAX_BYTES) {
                    await reader.cancel();
                    throw Error('File exceeds the 5 MiB limit.');
                }
                chunks.push(value);
                if (version === this.version)
                    this.status(
                        `Downloading architecture… ${(size / 1024).toFixed(0)} KiB / 5 MiB maximum`
                    );
            }
            const input = await new Blob(chunks).text();
            if (version === this.version) return this.apply(JSON.parse(input));
        } catch (error) {
            if (version === this.version) {
                if (timedOut)
                    this.fail(Error('Download timed out after 30 seconds.'));
                else if (error.name !== 'AbortError')
                    this.fail(
                        error instanceof TypeError
                            ? Error(
                                  'Could not download the JSON file. Check the URL, network access, CORS permission and redirects.'
                              )
                            : error
                    );
            }
        } finally {
            clearTimeout(timer);
            if (version === this.version) {
                this.abort = null;
                this.setLoading(false);
            }
        }
        return false;
    }
    fail(error) {
        this.drag = null;
        this.selected = null;
        this.data = null;
        this.edges = [];
        this.points = new Map();
        this.$('.nodes').replaceChildren();
        this.$('.edges').replaceChildren();
        this.$('select').replaceChildren(new Option('All flows', ''));
        this.$('.empty').hidden = false;
        this.detailsHint();
        this.status(error.message, true);
        this.dispatchEvent(
            new CustomEvent('calm-error', {
                detail: { message: error.message },
            })
        );
    }
    status(text, error = false) {
        this.$('.status').textContent = text;
        this.$('.status').classList.toggle('error', error);
    }
    detailsHint() {
        this.$('.details').replaceChildren();
        const a = document.createElement('div');
        a.className = 'eyebrow';
        a.textContent = 'Explore the model';
        const p = document.createElement('p');
        p.textContent =
            'Click a node to view its attached controls. Click a relationship to view its details here. Drag nodes to arrange the view.';
        this.$('.details').append(a, p);
        if (this.data) {
            const b = document.createElement('button');
            b.textContent = 'Model details';
            b.onclick = () => this.inspect(this.data, 'Architecture');
            this.$('.details').append(b);
        }
    }
    inspect(item, type) {
        this.selected = item['unique-id'];
        renderInspector(this.$('.details'), item, type, this.data);
        this.filter();
        this.dispatchEvent(
            new CustomEvent('calm-select', {
                detail: { type, element: structuredClone(item) },
            })
        );
    }
    draw() {
        const layer = this.$('.nodes');
        layer.replaceChildren();
        this.nodeEls = new Map();
        for (const n of this.data.nodes) {
            const id = n['unique-id'];
            const g = el('g', {
                class: 'node',
                tabindex: 0,
                role: 'button',
                'aria-label': `${n.name}, ${n['node-type']}. Enter to inspect; arrows to move.`,
            });
            g.dataset.id = id;
            const hint = this.points.get(id),
                compact = hint.h < 56 || hint.w < 100,
                padding = hint.w < 100 ? 6 : 16,
                fontSize = hint.w < 100 ? 11 : 14,
                limit = Math.max(
                    1,
                    Math.floor((hint.w - padding * 2) / (fontSize * 0.6))
                );
            if (hint.color) g.style.setProperty('--node-fill', hint.color);
            if (hint.textColor)
                g.style.setProperty('--node-text', hint.textColor);
            g.append(
                el('rect', { width: hint.w, height: hint.h, rx: 10 }),
                el(
                    'text',
                    {
                        x: padding,
                        y: hint.h / 2 - 14,
                        class: 'kind',
                        display: compact ? 'none' : 'inline',
                    },
                    n['node-type'].toUpperCase()
                ),
                el(
                    'text',
                    {
                        x: padding,
                        y: hint.h / 2 + (compact ? 4 : 12),
                        class: 'name',
                        style: `font-size:${fontSize}px`,
                    },
                    n.name.length > limit
                        ? n.name.slice(0, limit - 1) + '…'
                        : n.name
                ),
                el('title', {}, n.name)
            );
            layer.append(g);
            this.nodeEls.set(id, g);
        }
        const edges = this.$('.edges');
        edges.replaceChildren();
        this.edgeEls = [];
        this.edges.forEach((edge, i) => {
            const containment = ['composed-of', 'deployed-in'].includes(
                edge.type
            );
            const g = el('g', {
                class: 'edge' + (containment ? ' containment' : ''),
                tabindex: 0,
                role: 'button',
                'aria-label': `${edge.type}: ${edge.source} to ${edge.target}`,
            });
            g.dataset.edge = i;
            g.append(
                el('path', { class: 'hit' }),
                el('path', {
                    class: 'line',
                    'marker-end': containment ? '' : 'url(#arrow)',
                }),
                el(
                    'text',
                    { 'text-anchor': 'middle' },
                    containment
                        ? edge.type
                        : edge.relationship.protocol || edge.type
                )
            );
            edges.append(g);
            this.edgeEls.push(g);
        });
        this.updateGeometry();
        this.filter();
    }
    updateGeometry() {
        if (!this.data) return;
        for (const [id, g] of this.nodeEls) {
            const p = this.points.get(id);
            g.setAttribute('transform', `translate(${p.x},${p.y})`);
        }
        this.edges.forEach((e, i) => {
            const a = this.points.get(e.source),
                b = this.points.get(e.target),
                g = this.edgeEls[i];
            let path, mx, my;
            if (e.source === e.target) {
                path = `M ${a.x + a.w * 0.78} ${a.y} C ${a.x + a.w + 62} ${a.y - 90} ${a.x - 60} ${a.y - 90} ${a.x + a.w * 0.2} ${a.y}`;
                mx = a.x + a.w / 2;
                my = a.y - 55;
            } else {
                const ax = a.x + a.w / 2,
                    ay = a.y + a.h / 2,
                    bx = b.x + b.w / 2,
                    by = b.y + b.h / 2,
                    dx = bx - ax,
                    dy = by - ay;
                const t1 =
                        1 /
                        Math.max(
                            Math.abs(dx) / (a.w / 2 + 2),
                            Math.abs(dy) / (a.h / 2 + 2),
                            1
                        ),
                    t2 =
                        1 /
                        Math.max(
                            Math.abs(dx) / (b.w / 2 + 2),
                            Math.abs(dy) / (b.h / 2 + 2),
                            1
                        );
                const sx = ax + dx * t1,
                    sy = ay + dy * t1,
                    tx = bx - dx * t2,
                    ty = by - dy * t2;
                const bend = ((i % 3) - 1) * 17;
                path = `M ${sx} ${sy} Q ${(sx + tx) / 2 + bend} ${(sy + ty) / 2 + bend} ${tx} ${ty}`;
                mx = (sx + tx) / 2 + bend / 2;
                my = (sy + ty) / 2 + bend / 2 - 7;
            }
            g.querySelectorAll('path').forEach((p) =>
                p.setAttribute('d', path)
            );
            g.querySelector('text').setAttribute('x', mx);
            g.querySelector('text').setAttribute('y', my);
        });
    }
    filter() {
        if (!this.data) return;
        const query = this.$('input').value.toLowerCase();
        const f = this.$('select').value;
        const flow = f ? this.data.flows[Number(f) - 1] : null;
        const rels = flow
            ? new Set(flow.transitions.map((t) => t['relationship-unique-id']))
            : null;
        const flowNodes = rels
            ? new Set(
                  this.edges
                      .filter((e) => rels.has(e.relationship['unique-id']))
                      .flatMap((e) => [e.source, e.target])
              )
            : null;
        for (const n of this.data.nodes) {
            const id = n['unique-id'],
                g = this.nodeEls.get(id);
            g.classList.toggle(
                'dim',
                !(n.name + ' ' + id + ' ' + n['node-type'])
                    .toLowerCase()
                    .includes(query) ||
                    (flowNodes && !flowNodes.has(id))
            );
            g.classList.toggle('selected', this.selected === id);
        }
        this.edges.forEach((e, i) => {
            const g = this.edgeEls[i];
            g.classList.toggle(
                'dim',
                !!(rels && !rels.has(e.relationship['unique-id'])) ||
                    this.nodeEls.get(e.source).classList.contains('dim') ||
                    this.nodeEls.get(e.target).classList.contains('dim')
            );
            g.classList.toggle(
                'selected',
                this.selected === e.relationship['unique-id']
            );
        });
    }
    fit() {
        if (!this.data?.nodes.length) return;
        const ps = [...this.points.values()];
        const x = Math.min(...ps.map((p) => p.x)) - 65,
            y = Math.min(...ps.map((p) => p.y)) - 90;
        this.view = {
            x,
            y,
            w: Math.max(...ps.map((p) => p.x + p.w)) + 67 - x,
            h: Math.max(...ps.map((p) => p.y + p.h)) + 72 - y,
        };
        this.setView();
    }
    setView() {
        const v = this.view;
        this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    }
    zoom(factor) {
        const v = this.view;
        const w = Math.max(180, Math.min(30000, v.w * factor)),
            h = (v.h * w) / v.w;
        this.view = { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
        this.setView();
    }
    point(e) {
        return new DOMPoint(e.clientX, e.clientY).matrixTransform(
            this.svg.getScreenCTM().inverse()
        );
    }
    pointerDown(e) {
        if (e.button !== 0 || !this.data) return;
        const node = e.target.closest('.node');
        this.moved = false;
        const p = this.point(e);
        this.drag = {
            id: node?.dataset.id,
            edge: e.target.closest('.edge')?.dataset.edge,
            start: p,
            origin: node
                ? { ...this.points.get(node.dataset.id) }
                : { ...this.view },
            clientX: e.clientX,
            clientY: e.clientY,
        };
        this.svg.setPointerCapture(e.pointerId);
    }
    pointerMove(e) {
        if (!this.drag) return;
        const d = this.drag;
        this.moved ||=
            Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) > 4;
        if (!this.moved) return;
        const p = this.point(e),
            dx = p.x - d.start.x,
            dy = p.y - d.start.y;
        if (d.id) {
            this.points.set(d.id, {
                ...d.origin,
                x: d.origin.x + dx,
                y: d.origin.y + dy,
            });
            this.updateGeometry();
        } else {
            this.view.x -= dx;
            this.view.y -= dy;
            this.setView();
        }
    }
    pointerUp(e) {
        if (!this.drag) return;
        const { id, edge } = this.drag;
        this.drag = null;
        this.svg.releasePointerCapture(e.pointerId);
        if (!this.moved && id)
            this.inspect(
                this.data.nodes.find((n) => n['unique-id'] === id),
                this.data.nodes.find((n) => n['unique-id'] === id)['node-type']
            );
        else if (!this.moved && edge !== undefined)
            this.inspect(this.edges[Number(edge)].relationship, 'Relationship');
    }
    key(e) {
        const g = e.target.closest('.node,.edge');
        if ((e.key === 'Enter' || e.key === ' ') && g) {
            e.preventDefault();
            if (g.dataset.id)
                this.inspect(
                    this.data.nodes.find(
                        (n) => n['unique-id'] === g.dataset.id
                    ),
                    'Component'
                );
            else
                this.inspect(
                    this.edges[Number(g.dataset.edge)].relationship,
                    'Relationship'
                );
        } else if (
            g?.dataset.id &&
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
        ) {
            e.preventDefault();
            const p = this.points.get(g.dataset.id),
                step = e.shiftKey ? 40 : 10;
            p.x +=
                e.key === 'ArrowLeft'
                    ? -step
                    : e.key === 'ArrowRight'
                      ? step
                      : 0;
            p.y +=
                e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
            this.updateGeometry();
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            this.zoom(1 / 1.15);
        } else if (e.key === '-') {
            e.preventDefault();
            this.zoom(1.15);
        }
    }
}
if (!customElements.get('calm-viewer'))
    customElements.define('calm-viewer', CalmViewer);
