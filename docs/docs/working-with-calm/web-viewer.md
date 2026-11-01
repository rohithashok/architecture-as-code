---
id: web-viewer
title: Web Viewer
---

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

# Web Viewer

The `calm-plugins/web` package provides an embeddable, read-only CALM 1.2 viewer.
Visitors can select local JSON or explicitly open a remote HTTP(S) JSON URL
whose server permits CORS. No browser extension is required.

Build from the repository root with `npm run build:web`, then serve or copy
`calm-plugins/web/dist/` to your website:

```html
<script type="module" src="/assets/calm-viewer.js"></script>
<calm-viewer src="/models/calm.json"></calm-viewer>
```

Click nodes and relationships to inspect controls, configurations and protocols.
Drag nodes to arrange the view without changing the source file. Model-defined
colors and geometry remain separate from the interface's `--calm-*` CSS theme
variables.

The built-in `src` loader is same-origin. Open URL is the explicit remote route,
with a 5 MiB cap, cancellation and a 30-second timeout. External references are
not fetched and controls are not evaluated for compliance.

See the [package README](https://github.com/finos/architecture-as-code/tree/main/calm-plugins/web)
for build commands, API details, limits and themes.
