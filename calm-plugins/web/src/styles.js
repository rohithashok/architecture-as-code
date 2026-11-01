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
// Public --calm-* properties style the interface only. Diagram rules stay independent.
export default `
:host {
  display:block; height:680px; min-height:440px;
  color:var(--calm-text,#243b47);
  font:var(--calm-font-size,14px)/var(--calm-line-height,1.5) var(--calm-font-family,system-ui,sans-serif);
  color-scheme:var(--calm-color-scheme,light);
}
* { box-sizing:border-box }
button,input,select { font:inherit; color:var(--calm-control-text,var(--calm-text,#243b47)); border:1px solid var(--calm-control-border,var(--calm-border,#cbd9d9)); border-radius:var(--calm-control-radius,7px); padding:var(--calm-control-padding,8px 11px); background:var(--calm-control-background,#fff) }
button,select { cursor:pointer }
button { color:var(--calm-button-text,var(--calm-control-text,var(--calm-text,#243b47))); background:var(--calm-button-background,var(--calm-control-background,#fff)); border-color:var(--calm-button-border,var(--calm-control-border,var(--calm-border,#cbd9d9))); border-radius:var(--calm-button-radius,var(--calm-control-radius,7px)); padding:var(--calm-button-padding,var(--calm-control-padding,8px 11px)); font-weight:var(--calm-button-font-weight,400) }
button:hover { background:var(--calm-button-hover-background,#edf5f2); color:var(--calm-button-hover-text,var(--calm-button-text,var(--calm-text,#243b47))) }
input::placeholder { color:var(--calm-placeholder-text,#757575); opacity:1 }
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible { outline:3px solid var(--calm-focus,var(--calm-accent,#5fb7ac)); outline-offset:2px }
.shell { height:100%; display:flex; flex-direction:column; border:1px solid var(--calm-border,#cedddb); border-radius:var(--calm-radius,12px); overflow:hidden; background:var(--calm-background,#fff) }
.toolbar { display:flex; gap:var(--calm-gap,8px); align-items:center; padding:var(--calm-toolbar-padding,13px 16px); border-bottom:1px solid var(--calm-border,#dde7e4); flex-wrap:wrap; background:var(--calm-toolbar-background,var(--calm-background,#fff)) }
.title { font-weight:650; margin-right:auto }
.tag { font-size:.785714em; letter-spacing:.08em; background:var(--calm-badge-background,#edf5f2); padding:4px 8px; border-radius:20px; color:var(--calm-accent,#34665c) }
input { width:160px }
.body { display:flex; flex:1; min-height:0 }
.canvas { flex:1; min-width:0; position:relative; background:#f7faf8; background-image:radial-gradient(#ccdcd6 .8px,transparent .8px); background-size:20px 20px }
/* Pin diagram typography as well as its colors; interface themes cannot restyle it. */
svg { width:100%; height:100%; display:block; touch-action:none; outline-offset:-4px; font:14px/1.5 system-ui,sans-serif; color-scheme:light }
.empty { position:absolute; inset:30%; text-align:center; pointer-events:none; color:#697d82 }
.details { width:var(--calm-panel-width,320px); flex-shrink:0; padding:var(--calm-panel-padding,22px); border-left:1px solid var(--calm-border,#dce6e3); overflow:auto; background:var(--calm-panel-background,var(--calm-background,#fff)) }
h3 { font-size:1.285714em; margin:6px 0 12px; overflow-wrap:anywhere }
h4 { font-size:1em; margin:var(--calm-section-gap,22px) 0 10px }
h5 { font-size:.928571em; margin:0 0 8px; overflow-wrap:anywhere }
h6 { font-size:.857143em; margin:0 0 8px }
.control-card { border:1px solid var(--calm-border,#dce6e3); border-radius:var(--calm-control-radius,8px); padding:var(--calm-card-padding,12px); margin:10px 0; background:var(--calm-card-background,#f8fbf9) }
.control-card p { margin:8px 0 }
.requirement { border-top:1px solid var(--calm-border,#dce6e3); margin-top:12px; padding-top:12px }
.detail-field { margin:10px 0 }
dt { font-size:.785714em; color:var(--calm-muted-text,#607b72) }
dd { margin:3px 0; overflow-wrap:anywhere; font-size:.857143em }
.muted { color:var(--calm-muted-text,#6b827f); font-size:.857143em }
summary { cursor:pointer; font-size:.857143em; overflow-wrap:anywhere }
details { margin:14px 0 }
.eyebrow { color:var(--calm-muted-text,#6b827f); font-size:.785714em; letter-spacing:.13em; text-transform:uppercase }
pre { white-space:pre-wrap; overflow-wrap:anywhere; font:.785714em/1.7 var(--calm-mono-font-family,ui-monospace,monospace); color:var(--calm-code-text,var(--calm-text,#243b47)); background:var(--calm-code-background,#f3f7f5); padding:var(--calm-card-padding,12px); border-radius:var(--calm-control-radius,7px) }
p { overflow-wrap:anywhere }
.status { padding:var(--calm-status-padding,9px 16px); border-top:1px solid var(--calm-border,#dde7e4); background:var(--calm-status-background,var(--calm-background,#fff)); font-size:.857143em; color:var(--calm-muted-text,#58716c); white-space:pre-wrap; max-height:110px; overflow:auto }
.status.error { color:var(--calm-error-text,#9b302b); background:var(--calm-error-background,#fff4f0) }
.legend { position:absolute; bottom:14px; left:14px; font-size:.785714em; color:var(--calm-text,#243b47); background:var(--calm-legend-background,var(--calm-background,#fffffff0)); padding:7px 10px; border:1px solid var(--calm-border,#dde7e4); border-radius:var(--calm-control-radius,6px); pointer-events:none }
.legend span { color:#8b80a8; margin-left:12px }
.url-dialog { font:inherit; border:1px solid var(--calm-border,#cbd9d9); border-radius:var(--calm-radius,12px); padding:var(--calm-dialog-padding,24px); width:480px; max-width:calc(100vw - 32px); color:var(--calm-text,#243b47); background:var(--calm-dialog-background,var(--calm-background,#fff)) }
.url-dialog::backdrop { background:var(--calm-dialog-backdrop,#203f4755) }
.url-dialog h2 { font-size:1.428571em; margin:0 0 12px }
.url-dialog label { display:block; margin:16px 0 6px }
.url-dialog input { width:100% }
.url-actions { display:flex; justify-content:flex-end; gap:var(--calm-gap,8px); margin-top:20px }
.url-error { color:var(--calm-error-text,#9b302b); font-size:.857143em; min-height:18px }
.cancel-load[hidden] { display:none }
@media(max-width:650px) {
  .toolbar { padding:var(--calm-toolbar-padding,9px) }
  .tag { display:none }
  .body { flex-direction:column }
  .details { width:100%; height:var(--calm-mobile-panel-height,205px); padding:var(--calm-panel-padding,14px); border-left:0; border-top:1px solid var(--calm-border,#dde7e4) }
  .canvas { min-height:210px }
  input { width:125px }
}
.node{cursor:grab}.node:active{cursor:grabbing}.node rect{fill:var(--node-fill,#fff);stroke:#a5c5bf;stroke-width:1.5}.node.selected rect{stroke:#087f75;stroke-width:3;fill:var(--node-fill,#edf8f4)}.node.dim,.edge.dim{opacity:.12}.node:focus rect,.edge:focus .line{stroke:#087f75;stroke-width:3}.node text{pointer-events:none;fill:var(--node-text,#203f47)}.node .kind{font-size:11px;fill:var(--node-text,#567b73)}.node .name{font-size:14px;font-weight:600}.edge{cursor:pointer;outline:none}.edge .line{fill:none;stroke:#789b97;stroke-width:1.5}.edge .hit{fill:none;stroke:transparent;stroke-width:18}.edge.containment .line{stroke:#a2a4ba;stroke-dasharray:6 5}.edge.selected .line{stroke:#087f75;stroke-width:3}.edge text{font:10px system-ui;fill:#597670;paint-order:stroke;stroke:#f7faf8;stroke-width:4px}
`;
