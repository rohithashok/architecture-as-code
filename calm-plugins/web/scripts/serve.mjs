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
import { startServer } from './server.mjs';
const { server, url } = await startServer(Number(process.env.PORT || 8766));
console.log(`CALM web viewer: ${url}`);
process.on('SIGINT', () => server.close());
