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
import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['dist/**', 'src/generated/**'] },
    js.configs.recommended,
    {
        files: ['src/**/*.js', 'test/unit/**/*.js', 'scripts/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
        },
        rules: { 'object-curly-spacing': ['error', 'always'] },
    },
];
