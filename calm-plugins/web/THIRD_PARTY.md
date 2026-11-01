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

# Third-party code

The browser build includes the CALM 1.2 schema from the repository's pinned
`calm-schema-1.2` alias (`@finos/calm-schema`, Apache-2.0), a generated validator,
and any required Ajv runtime helpers (MIT). Dependencies are resolved by the root lockfile.
No schema, validator or theme is downloaded at runtime.

- CALM schema: https://github.com/finos/calm-schema
- Ajv: https://github.com/ajv-validator/ajv

Keep this notice, the repository Apache-2.0 license and generated license comments
with the distributed assets. The build copies the full Ajv and CALM schema license texts into `dist/licenses/` and the repository NOTICE into `dist/`.
