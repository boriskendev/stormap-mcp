#!/usr/bin/env node
// Stormap MCP server (stdio).
//
// Speaks MCP over stdin/stdout (newline-delimited JSON-RPC) for clients that only run local
// servers, and answers every request by calling the hosted Stormap server
// (https://stormap.ai/mcp, Streamable HTTP). The tools themselves run on stormap.ai, so this
// stays small and always exposes the current tool list.
//
// Environment:
//   STORMAP_API_KEY   optional Stormap API key (smk_...) for higher limits
//   STORMAP_MCP_URL   optional endpoint override (default https://stormap.ai/mcp)
//   STORMAP_TIMEOUT_MS optional per-request timeout (default 120000)
'use strict';

const readline = require('node:readline');
const { version } = require('../package.json');

const ENDPOINT = process.env.STORMAP_MCP_URL || 'https://stormap.ai/mcp';
const API_KEY = (process.env.STORMAP_API_KEY || '').trim();
const TIMEOUT_MS = Number(process.env.STORMAP_TIMEOUT_MS) || 120000;

let sessionId = null;
let protocolVersion = null;

function log(...args) {
  // stdout carries the protocol; diagnostics go to stderr.
  process.stderr.write(`[stormap-mcp] ${args.join(' ')}\n`);
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function errorReply(id, code, message) {
  return { jsonrpc: '2.0', id: id === undefined ? null : id, error: { code, message } };
}

function headers() {
  const h = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'user-agent': `stormap-mcp-stdio/${version}`
  };
  if (API_KEY) h.authorization = `Bearer ${API_KEY}`;
  if (sessionId) h['mcp-session-id'] = sessionId;
  if (protocolVersion) h['mcp-protocol-version'] = protocolVersion;
  return h;
}

// A Streamable HTTP response is either JSON or a short SSE stream; collect the JSON-RPC
// messages from either form.
function parseBody(contentType, text) {
  if (!text.trim()) return [];
  if (/text\/event-stream/i.test(contentType)) {
    const out = [];
    for (const block of text.split(/\r?\n\r?\n/)) {
      const data = block.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('\n');
      if (data) { try { out.push(JSON.parse(data)); } catch (_) { /* skip keep-alives */ } }
    }
    return out;
  }
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function forward(message) {
  const ids = (Array.isArray(message) ? message : [message]).filter((m) => m && m.id !== undefined && m.id !== null).map((m) => m.id);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: headers(), body: JSON.stringify(message), signal: ctrl.signal });
    const sid = res.headers.get('mcp-session-id');
    if (sid) sessionId = sid;
    const text = await res.text();
    if (res.status === 202 || (!text.trim() && res.ok)) return; // notification accepted
    let replies;
    try { replies = parseBody(res.headers.get('content-type') || '', text); }
    catch (_) { replies = null; }
    if (!replies || !replies.length) {
      const msg = res.ok ? 'Empty or unreadable response from Stormap' : `Stormap returned HTTP ${res.status}`;
      ids.forEach((id) => send(errorReply(id, -32603, msg)));
      return;
    }
    for (const r of replies) {
      if (r && r.result && r.result.protocolVersion) protocolVersion = r.result.protocolVersion;
      send(r);
    }
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Stormap did not answer in time' : `Could not reach Stormap: ${err.message}`;
    log(msg);
    ids.forEach((id) => send(errorReply(id, -32603, msg)));
  } finally {
    clearTimeout(timer);
  }
}

function main() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let pending = 0;
  let closed = false;
  const maybeExit = () => { if (closed && pending === 0) process.exit(0); };

  rl.on('line', (line) => {
    if (!line.trim()) return;
    let message;
    try { message = JSON.parse(line); }
    catch (_) { send(errorReply(null, -32700, 'Parse error')); return; }
    pending++;
    forward(message).finally(() => { pending--; maybeExit(); });
  });
  rl.on('close', () => { closed = true; maybeExit(); });
  log(`ready, forwarding to ${ENDPOINT}${API_KEY ? ' with API key' : ''}`);
}

if (require.main === module) main();

module.exports = { parseBody, forward, headers };
