'use strict';
// Runs the stdio server against a local stand-in for stormap.ai/mcp.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

function fakeStormap() {
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const msg = JSON.parse(body);
      seen.push({ msg, auth: req.headers.authorization || null });
      if (msg.id === undefined) { res.writeHead(202).end(); return; }
      if (msg.method === 'initialize') {
        res.writeHead(200, { 'content-type': 'application/json', 'mcp-session-id': 's1' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'stormap', version: 'x' } } }));
        return;
      }
      if (msg.method === 'tools/list') {
        // Answer as an SSE stream to cover that response form too.
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: [{ name: 'package_check' }] } })}\n\n`);
        return;
      }
      res.writeHead(500).end('boom');
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, seen, url: `http://127.0.0.1:${server.address().port}/mcp` })));
}

function run(url, lines, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'index.js')], { env: { ...process.env, STORMAP_MCP_URL: url, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.on('error', reject);
    child.on('exit', () => resolve(out.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))));
    for (const l of lines) child.stdin.write(l + '\n');
    child.stdin.end();
  });
}

test('forwards initialize, notifications and tools/list; reports upstream errors', async () => {
  const s = await fakeStormap();
  try {
    const out = await run(s.url, [
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
      JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'x' } }),
      'not json'
    ], { STORMAP_API_KEY: 'smk_test' });
    const byId = Object.fromEntries(out.filter((m) => m.id !== null).map((m) => [m.id, m]));
    assert.equal(byId[1].result.serverInfo.name, 'stormap');
    assert.equal(byId[2].result.tools[0].name, 'package_check');
    assert.match(byId[3].error.message, /HTTP 500/);
    assert.ok(out.some((m) => m.id === null && m.error.code === -32700), 'parse error reported');
    assert.equal(out.length, 4, 'no reply for the notification');
    assert.ok(s.seen.every((x) => x.auth === 'Bearer smk_test'), 'API key sent');
  } finally { s.server.close(); }
});
