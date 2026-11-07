# Stormap MCP server over stdio (src/index.js). It answers each MCP request by calling the
# hosted server at https://stormap.ai/mcp, where the tools run. No dependencies beyond Node.
# Optional: -e STORMAP_API_KEY=smk_... for higher limits.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
USER node
ENTRYPOINT ["node", "src/index.js"]
