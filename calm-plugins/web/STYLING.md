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

# Colors and styles

The viewer preserves model-supplied colors exactly. No automatic recoloring or contrast correction. The same styling rules apply to local files and remotely loaded models. These are viewer-specific metadata conventions, not extra CALM schema properties.

## Theme the widget interface

The widget exposes **CSS custom properties on `<calm-viewer>`** for its toolbar, inputs, buttons, side panel, control cards, JSON blocks, status messages and Open URL dialog. Set them in your host stylesheet; they inherit through Shadow DOM and update immediately without reloading a model. They also work when inherited from an ancestor. Each widget can have its own values.

```html
<script type="module" src="./calm-viewer.js"></script>
<style>
    calm-viewer.company-theme {
        --calm-font-family: Arial, sans-serif;
        --calm-font-size: 15px;
        --calm-background: #17232d;
        --calm-toolbar-background: #1e2f3c;
        --calm-text: #e6eff5;
        --calm-muted-text: #a6bdca;
        --calm-border: #3b5262;
        --calm-control-background: #263c4b;
        --calm-button-background: #254e57;
        --calm-button-text: #ffffff;
        --calm-button-hover-background: #316570;
        --calm-gap: 10px;
        --calm-control-padding: 8px 12px;
        --calm-panel-padding: 24px;
        --calm-radius: 10px;
    }
</style>
<calm-viewer class="company-theme" src="./calm.json"></calm-viewer>
```

Set any subset; omitted properties retain their current light-theme defaults. Supply matching surface/text colors for a complete dark theme. `themes.css` contains complete optional Dark and Compact presets used by the demo's **Widget theme** selector:

```html
<link rel="stylesheet" href="./themes.css" />
<calm-viewer data-theme="dark" src="./calm.json"></calm-viewer>
```

`data-theme` is a convention implemented by that optional host stylesheet, not an attribute interpreted by widget JavaScript. You can instead use your own classes, ancestor styles, media queries or inline custom properties. Theme changes are not persisted across reloads.

### Public CSS variables

Defaults below describe the interface's existing light design. Where a property falls back through another token, overriding the shared token supplies its children unless they are separately overridden.

| Variable                         | Meaning / default                                                        |
| -------------------------------- | ------------------------------------------------------------------------ |
| `--calm-font-family`             | UI font family; `system-ui, sans-serif`                                  |
| `--calm-font-size`               | UI base font size; `14px`; headings/labels scale proportionally          |
| `--calm-line-height`             | UI line height; `1.5`                                                    |
| `--calm-mono-font-family`        | JSON/configuration font; `ui-monospace, monospace`                       |
| `--calm-color-scheme`            | Native control/scrollbar color scheme; `light`; use `dark` for a dark UI |
| `--calm-text`                    | Main UI text; `#243b47`                                                  |
| `--calm-muted-text`              | Secondary labels/status text; existing muted green/gray palette          |
| `--calm-placeholder-text`        | Input placeholders; `#757575`                                            |
| `--calm-background`              | Shared widget surface; `#fff`                                            |
| `--calm-toolbar-background`      | Toolbar; falls back to shared background                                 |
| `--calm-panel-background`        | Inspector; falls back to shared background                               |
| `--calm-dialog-background`       | URL dialog; falls back to shared background                              |
| `--calm-status-background`       | Status strip; falls back to shared background                            |
| `--calm-legend-background`       | Legend box; shared background or translucent white                       |
| `--calm-card-background`         | Control cards; `#f8fbf9`                                                 |
| `--calm-code-background`         | JSON/configuration blocks; `#f3f7f5`                                     |
| `--calm-code-text`               | JSON/configuration text; falls back to main UI text                      |
| `--calm-border`                  | Shared UI borders; existing pale green/gray palette                      |
| `--calm-accent`                  | Badge text and optional focus fallback; muted green by default           |
| `--calm-focus`                   | UI focus outline; falls back to accent or `#5fb7ac`                      |
| `--calm-badge-background`        | Read-only badge; `#edf5f2`                                               |
| `--calm-error-text`              | Error text; `#9b302b`                                                    |
| `--calm-error-background`        | Error status surface; `#fff4f0`                                          |
| `--calm-dialog-backdrop`         | Modal overlay; `#203f4755`                                               |
| `--calm-control-background`      | Inputs/selects and button fallback; `#fff`                               |
| `--calm-control-text`            | Input/select text and button fallback; main UI text                      |
| `--calm-control-border`          | Input/select border and button fallback; shared border                   |
| `--calm-control-radius`          | Controls, cards/code/legend corner fallback; existing 6–8px defaults     |
| `--calm-control-padding`         | Input/select and button fallback padding; `8px 11px`                     |
| `--calm-button-background`       | Button fill; falls back to control background                            |
| `--calm-button-text`             | Button text; falls back to control text                                  |
| `--calm-button-border`           | Button border; falls back to control border                              |
| `--calm-button-radius`           | Button corners; falls back to control radius                             |
| `--calm-button-padding`          | Button spacing; falls back to control padding                            |
| `--calm-button-font-weight`      | Button font weight; `400`                                                |
| `--calm-button-hover-background` | Button hover fill; `#edf5f2`                                             |
| `--calm-button-hover-text`       | Button hover text; button/main UI text                                   |
| `--calm-gap`                     | Toolbar and dialog button spacing; `8px`                                 |
| `--calm-toolbar-padding`         | Toolbar padding; `13px 16px`, `9px` on narrow screens                    |
| `--calm-panel-padding`           | Inspector padding; `22px`, `14px` on narrow screens                      |
| `--calm-card-padding`            | Control card and code block padding; `12px`                              |
| `--calm-dialog-padding`          | URL dialog padding; `24px`                                               |
| `--calm-status-padding`          | Status strip padding; `9px 16px`                                         |
| `--calm-section-gap`             | Inspector section heading top spacing; `22px`                            |
| `--calm-radius`                  | Widget/dialog outer corner radius; `12px`                                |
| `--calm-panel-width`             | Desktop inspector width; `320px`                                         |
| `--calm-mobile-panel-height`     | Inspector height on narrow screens; `205px`                              |

The existing responsive breakpoint is 650px viewport width. The panel moves below the diagram and retains a full-width layout on narrow screens; `--calm-panel-width` applies to desktop only. Host pages can still set the widget's overall height/width using ordinary CSS. Oversized typography or spacing may require a taller widget.

Theme variables are trusted host-page CSS, with normal browser CSS parsing and cascading. They are not taken from model metadata. The demo page surrounding the widget (heading, description, sample/theme chooser) has its own stylesheet and does not change when selecting a widget theme.

### Diagram colors remain independent

The `--calm-*` variables do not change SVG node backgrounds/text, node borders, relationship strokes/labels, graph typography, canvas background or saved geometry. Custom model colors remain exact; graph defaults also remain the same when switching interface themes. The legend's box/text follow the interface theme, while its relationship key color remains fixed.

Implementation: [src/styles.js](src/styles.js) contains interface tokens and isolated graph rules. The build bundles it into `dist/calm-viewer.js`; distribute the generated assets rather than individual source modules. Optional `themes.css` is needed only for its preset selectors. Avoid targeting private `--node-*` properties; those are rendering details, not part of the theme API.

## Reference-file metadata

The following metadata conventions are supported:

```json
{
    "unique-id": "orders-api",
    "node-type": "service",
    "name": "Orders API",
    "description": "Accepts orders.",
    "metadata": {
        "building-block-style": {
            "background": "#167b74",
            "text": "#ffffff"
        }
    }
}
```

At the architecture root:

```json
"metadata": {
  "_layout": {
    "orders-api": { "x": 147, "y": 302, "w": 216, "h": 33 }
  }
}
```

Use this convention when exchanging files that already use `building-block-style` and `_layout`. Retain existing metadata; the viewer reads it without modifying it.

## Alternative viewer-specific convention

```json
"metadata": {
  "calm-viewer": {
    "color": "#167b74",
    "text-color": "#ffffff",
    "location": { "x": 147, "y": 302, "w": 216, "h": 33 }
  }
}
```

Flat equivalents and metadata arrays/key-value entries remain supported; see [USAGE.md](USAGE.md). Prefer one convention per file unless deliberately overriding an existing style.

## How values are chosen

| Property                | First choice                             | Next choice                             | Fallback                        |
| ----------------------- | ---------------------------------------- | --------------------------------------- | ------------------------------- |
| Background              | Valid node `calm-viewer.color`           | Valid `building-block-style.background` | White                           |
| Text                    | Valid node `calm-viewer.text-color`      | Valid `building-block-style.text`       | Default name/type palette       |
| Position and dimensions | Valid node `calm-viewer.location` fields | Root `_layout[node-id]` fields          | Automatic position, 218×78 size |

If a `calm-viewer` object exists, it supplies the viewer-specific hints; otherwise flat node metadata supplies those hints. Invalid values fall through individually to the next valid source. The node object remains unchanged.

Custom text colors apply to both the name and type label. When no custom text color is present, names use `#203F47` and type labels `#567B73`. The side panel reports the background and name text colors in normalized sRGB hex, with alpha when translucent; baseline fallbacks are marked `(default)`. Normalization changes only their textual representation, not the color applied to the SVG.

Literal CSS colors supported by the browser are accepted, including hex, named colors, RGB/HSL and transparency. CSS variables, inherited/contextual colors and URL paint servers are ignored. The viewer does not execute model-supplied CSS, load external styles/fonts/images or fetch style references. Unrecognized style keys are available in the raw metadata but have no rendering effect.

## Selection, layout and readability

- Selection uses a stronger border and retains any supplied background/text colors. An unstyled selected node receives a temporary pale selection fill; its inspector reports the baseline white default.
- Low-contrast combinations remain exactly as authored, including the sample's `#49A27B` background and `#55AA76` text.
- x/y are top-left canvas coordinates. Width/height affect labels, edge attachment and Fit bounds. Bounds: x/y ±100,000; width 32–2,000; height 24–2,000. Invalid values use fallbacks.
- Compact boxes show the name alone; full names/types remain available through inspection and titles. Layout does not automatically avoid overlaps created by chosen coordinates.
- Dragging and keyboard movement change only the current display. Reset restores supplied geometry plus defaults. No file or metadata is saved or rewritten.

Model styling is limited to node background/text and geometry. Shapes, graph fonts, graph border styles and relationship colors/dashes retain the built-in design. Interface customization uses the independent CSS variables documented above; arbitrary metadata CSS injection is not supported.

No automatic readability mode or relationship style metadata schema is enabled by the interface theme API.
