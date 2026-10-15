# Local stdio bridge to the hosted Stormap MCP server (https://stormap.ai/mcp).
# The tools run on stormap.ai; this image lets stdio-only clients and registries
# (e.g. Glama) start the server locally. mcp-remote is pinned to a release that is
# a few weeks old rather than the newest one.
FROM node:22-alpine
RUN npm install -g mcp-remote@0.14.3 && npm cache clean --force
ENTRYPOINT ["mcp-remote", "https://stormap.ai/mcp", "--transport", "http-only"]
