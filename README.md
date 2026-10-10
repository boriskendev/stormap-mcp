# Stormap MCP server

A remote [MCP](https://modelcontextprotocol.io) server with research tools for AI agents. Connect it once and your agent can:

- **Run a first-pass vendor security review**: SOC 2 / ISO 27001 claims, whether the vendor trains AI on customer data (with the exact quote), subprocessors, DPA, data residency.
- **See what changed** on a company's pricing, terms, privacy and subprocessor pages, and when.
- **Check if an online store is ready for AI shopping agents** (ChatGPT Instant Checkout / ACP, Google AI Mode / UCP).
- **Research a company from its domain**: what it does, key pages, prices, tech stack.
- Audit how visible a site is to AI assistants, and read any page as clean Markdown.

Everything is built from the target's own public website, respects `robots.txt`, and never returns personal data about individuals.

- **MCP endpoint:** `https://stormap.ai/mcp` (Streamable HTTP, no install)
- **Docs, API keys and plans:** https://stormap.ai/developers
- **Official MCP Registry:** `io.github.boriskendev/stormap`

## Connect

**Claude Code**

```bash
claude mcp add --transport http stormap https://stormap.ai/mcp
```

**Claude (web / desktop):** Settings → Connectors → Add custom connector → `https://stormap.ai/mcp`

**Cursor, VS Code, Windsurf and other MCP clients**

```json
{
  "mcpServers": {
    "stormap": { "url": "https://stormap.ai/mcp" }
  }
}
```

Works without a key (free daily limit). Add `"headers": { "Authorization": "Bearer smk_..." }` with a free key from https://stormap.ai/developers for higher limits.

## Tools

| Tool | What it does | Pay-per-call (x402) |
|---|---|---|
| `vendor_trust_profile` | Vendor security & privacy profile from a domain: claimed certifications, AI-training stance with quote, subprocessors, DPA, residency, security features, transparency score | $0.25 |
| `company_changes` | Change history for pricing, terms, privacy and subprocessor pages (prices added/removed, free plan/trial changes, subprocessors added/removed) | $0.05 |
| `agentic_commerce_readiness` | Is a store ready for AI shopping agents? Bot access, Product structured data, policies, catalog, UCP/ACP discovery; score + fixes | $0.10 |
| `company_profile` | Company profile from a domain: what it does, key pages, socials, pricing signals, tech stack, role contact emails | $0.02 |
| `read_url` | Any public page as clean, LLM-ready Markdown with metadata | $0.01 |
| `ai_visibility_score` | 0-100 score for how well ChatGPT, Claude, Perplexity and Gemini can find and cite a page, with fixes | $0.01 |
| `check_ai_crawler_access` | Which AI crawlers a site's robots.txt allows or blocks | — |
| `generate_llms_txt` | Generate an llms.txt for a site | — |
| `generate_ai_robots_txt` | Generate robots.txt rules for AI crawlers | — |
| `search_guides` / `get_guide` | Search and read practical guides on building with AI agents | — |

## Example

> "Do a quick security review of notion.com and tell me if they train AI on our data."

The agent calls `vendor_trust_profile` and gets back structured JSON: certifications claimed (SOC 2 Type II, ISO 27001/27017/27018/27701, HIPAA…), the AI-training statement with a link to the page it came from, subprocessor list, DPA link and a transparency score.

## Pricing

- **No key:** free daily limit per IP.
- **Free key:** 500 calls/month. **Developer:** $9/month (2,000 calls). **Pro:** $29/month (15,000 calls).
- **Pay per call, no account:** agents with a USDC wallet on Base can pay per request with [x402](https://x402.org). Index: https://stormap.ai/x402/v1. Try it from a browser wallet: https://stormap.ai/developers/pay/

## Other ways to call it

- REST API + OpenAPI spec: https://stormap.ai/developers/openapi.json
- Server card: https://stormap.ai/.well-known/mcp.json
- llms.txt: https://stormap.ai/llms.txt

## Notes

- Tools read server-rendered HTML; pages that only render with JavaScript may return partial results (noted in the output).
- Certifications are what vendors claim publicly, not verified audit reports.
- This repository holds documentation and the registry manifest. The server is hosted at stormap.ai.

## License

Documentation in this repository is MIT licensed.
