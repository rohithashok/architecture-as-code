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

# Usage

## Local JSON

Build and serve the demo as described in [README.md](README.md). Click **Open JSON**
or drop a file into the widget. The file is read in browser memory and is not
uploaded. You can select a file outside the served directory.

For a file served next to your host page:

```html
<script type="module" src="./calm-viewer.js"></script>
<calm-viewer src="./calm.json"></calm-viewer>
```

For another folder on the same server, use `src="./models/calm.json"`. Paths are
web URLs, not arbitrary filesystem paths. `index.html?src=...` is not implemented.
The demo's sample buttons replace the current view with their included fixtures.

## Remote JSON

Click **Open URL**, enter the final raw JSON HTTP(S) endpoint and submit. The server
must allow your page's origin through CORS. Repository preview pages and login
pages are HTML, not raw models. Redirects and embedded URL credentials are rejected.
An HTTPS host page is subject to the browser's mixed-content restrictions.

The status strip shows progress. **Cancel loading** retains the previous model.
An error clears the diagram and shows a message. A newer load supersedes an older
one. Validation/rendering starts after the complete JSON arrives; partial JSON is
not rendered. The limit is 5 MiB, with a 30-second timeout.

Programmatic entry points:

| Method                            | Behavior                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| `load(object)` / `model = object` | Validate and clone an object; `load()` returns a boolean                 |
| `model` getter                    | Independent clone of the current model, or null                          |
| `loadFile(file)`                  | Read a local/downloaded File; async, reports errors through `calm-error` |
| `loadSource(url)` / `src`         | Same-origin HTTP(S), relative or absolute                                |
| `loadURL(url)`                    | Explicit cross-origin-capable HTTP(S), absolute URL, requires CORS       |
| `cancelLoad()`                    | Cancel pending loading, retain existing model                            |
| `fit()`                           | Frame the current diagram                                                |

Both URL methods return an async success boolean. Requests omit credentials and
referrers. They do not send selected local files to the remote server. No proxy
is included. If CORS is denied, use Open JSON or an endpoint your application
controls. The host's CSP must also allow connections to that endpoint.

`calm-load` reports node/relationship counts; `calm-select` reports `{type, element}`;
`calm-error` reports `{message}`. Register listeners directly on the element.

## Inspect and navigate

- Click a node for ID, type, hex colors, controls, requirements and configurations.
- Click a relationship for protocol, endpoints, controls and metadata. Hover and
  focus alone do not replace the side panel.
- Drag nodes to rearrange them; drag the background to pan; wheel or +/- zooms.
- Search dims unrelated nodes. The flow selector highlights membership and lists
  the full transitions; it does not animate execution.
- Tab focuses elements; Enter/Space inspects. Arrow keys move a focused node;
  Shift uses larger steps. Reset restores metadata geometry plus default layout.

The inspector moves below the diagram on narrow screens. Metadata and full JSON
remain available in expandable sections. Controls are shown as supplied; their
presence is not a compliance verdict. No display action changes source bytes.

## Model requirements

Declare `$schema: "https://calm.finos.org/release/1.2/meta/calm.json"` and provide
valid CALM 1.2 nodes/relationships. Do not relabel another version without migrating.
Validation uses the pinned release's core vocabulary and checks references/IDs;
it does not validate external interface configuration schemas or custom patterns.

Common errors: use HTTP rather than file://; check paths for 404s; use a raw JSON
endpoint rather than HTML; use Open URL instead of cross-origin `src`; configure
CORS at the JSON server. Files are not watched automatically: reload/reselect after
editing. See [STYLING.md](STYLING.md) for optional colors, geometry and UI themes.
