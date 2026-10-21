// Regression test: the admin SPA is served as an inline <script>. If its
// source has a syntax error (e.g. a template-literal escape silently
// mangling a backslash), login silently falls back to a native form GET
// and the admin tool appears dead. This test parses the rendered script.
import { buildAdminApp } from '../src/adminApp.js';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const html = buildAdminApp();
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('admin page has no inline script');

// Check syntax without executing: wrap in a function body via new Function.
new Function(m[1]);
console.log('ok — admin SPA script parses (' + m[1].length + ' chars)');
