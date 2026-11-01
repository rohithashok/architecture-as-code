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
export interface CalmElement {
    'unique-id': string;
    name?: string;
    description?: string;
    [key: string]: unknown;
}
export interface CalmArchitecture {
    $schema: 'https://calm.finos.org/release/1.2/meta/calm.json';
    nodes: CalmElement[];
    relationships: CalmElement[];
    [key: string]: unknown;
}
export class CalmViewer extends HTMLElement {
    model: CalmArchitecture | null;
    load(model: unknown): boolean;
    loadFile(file: File): Promise<void>;
    loadSource(src: string): Promise<boolean>;
    loadURL(url: string): Promise<boolean>;
    cancelLoad(): void;
    fit(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'calm-viewer': CalmViewer;
    }
}
