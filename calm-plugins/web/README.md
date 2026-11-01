<!--
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
-->

# CALM Web Viewer

A framework-independent, read-only `<calm-viewer>` component for CALM 1.2.
It supports local files, explicit streamed URL loading, draggable nodes,
click-based inspection, controls and interface themes. No browser extension,
backend or runtime CDN is required.

## Build and run

From the repository root, using Node 26:

```sh
npm ci
npm run build:web
PORT=8767 npm run serve --workspace calm-plugins/web
```

Open the printed localhost address. The static output is in `calm-plugins/web/dist/`.
Do not open the demo through `file://`; serve it over HTTP(S).

The workspace stays private pending a publication decision. Its runtime remains
native JavaScript, with a public TypeScript declaration file; no host framework
is required. The build compiles the pinned `calm-schema-1.2` package with Ajv and
bundles the component with esbuild. The browser does not compile or fetch schemas.

## Embed

Copy the generated `dist/` assets to your site:

```html
<script type="module" src="/assets/calm-viewer.js"></script>
<calm-viewer src="/models/calm.json" style="height: 680px"></calm-viewer>
```

The bundle registers the element and exports `CalmViewer`. `src` accepts same-origin
HTTP(S) URLs. Use **Open JSON** or drag/drop for local files; use **Open URL** for a
raw HTTP(S) JSON endpoint that permits CORS. The URL action is an explicit opt-in
for cross-origin requests. It omits credentials/referrers, rejects redirects,
limits downloads to 5 MiB and supports cancellation and a 30-second timeout.

```js
const viewer = document.querySelector('calm-viewer');
viewer.load(architectureObject); // validates, clones and returns a boolean
await viewer.loadSource('/models/calm.json'); // same origin
await viewer.loadURL('https://models.example.com/calm.json'); // requires CORS
viewer.cancelLoad();
viewer.addEventListener('calm-select', (event) => console.log(event.detail));
viewer.addEventListener('calm-error', (event) =>
    console.error(event.detail.message)
);
```

Wait for `customElements.whenDefined('calm-viewer')` if accessing the element before
the module finishes loading. See [USAGE.md](USAGE.md) for API and interaction details.

## Themes and model metadata

[STYLING.md](STYLING.md) lists the public `--calm-*` interface variables. The demo
has optional Dark and Compact presets. Interface themes do not change graph
colors, typography or geometry.

Node `metadata["building-block-style"].background/text` supplies exact colors.
Root `metadata._layout[node-id]` supplies x/y/w/h. The alternative per-node
`metadata["calm-viewer"]` convention is also supported. Dragging affects the current
view only; Reset restores the supplied layout. Source files are never written.

## Checks

From the repository root:

```sh
npm run lint --workspace calm-plugins/web
npm test --workspace calm-plugins/web -- --coverage
npm run build:web
npm exec --workspace calm-plugins/web -- playwright install chromium
npm run test:browser --workspace calm-plugins/web
```

Browser tests start their own loopback servers. They use installed Playwright
Chromium by default. Set `CHROME_PATH` to an existing Chrome executable to use it
instead. Screenshots and coverage go to the ignored `sandbox/web-integration/`.

## Limits

CALM 1.2 only: 500 nodes, 1,500 relationships and 4,000 expanded edges. Controls
are displayed, not evaluated. External schema/control/interface/ADR references
are never fetched. Containment uses dashed links rather than nested containers.
Layout has no collision avoidance or persistence. There is no editing, export,
proxy, authenticated URL loader or automatic external resource resolution.

The precompiled validator needs no runtime `eval`. The widget still uses inline
Shadow DOM styles, so the hosting site's style CSP must permit them. No full
strict-CSP compatibility claim is made. See [THIRD_PARTY.md](THIRD_PARTY.md).
