// Assemblage déterministe : aucune dépendance téléchargée.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const {version} = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/airports.json'), 'utf8'));
if (new Set(data.map(a => a.code)).size !== data.length) throw Error('Codes OACI dupliqués');
const files = ['banner.js', 'clock.js', 'selector.js', 'boards.js', 'card.js'];
// Catalogue compressé sans perte, décompressé localement par le navigateur.
const catalog = zlib.gzipSync(JSON.stringify(data), {level: 9}).toString('base64');
const bundle = '/* Oasis Flightradar Card v'+version+'\n * SPDX-License-Identifier: GPL-3.0-only\n * Copyright (c) 2026 JustKidding49 and contributors.\n * Distributed WITHOUT ANY WARRANTY; see LICENSE and NOTICE.md.\n * Third-party notices are retained below.\n */\n(async () => {\n"use strict";\nconst catalogBytes = Uint8Array.from(atob('+JSON.stringify(catalog)+'), c => c.charCodeAt(0));\nconst OASIS_AIRPORTS = await new Response(new Blob([catalogBytes]).stream().pipeThrough(new DecompressionStream("gzip"))).json();\n'+files.map(f => fs.readFileSync(path.join(root,'src',f),'utf8')).join('\n')+'\n})();\n';
fs.mkdirSync(path.join(root,'dist'), {recursive:true});
fs.writeFileSync(path.join(root,'dist/oasis-flightradar-card.js'), bundle);
console.log('Bundle autonome : '+Buffer.byteLength(bundle)+' octets, '+data.length+' aéroports.');
