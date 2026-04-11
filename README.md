# ob-work-items

Git-native work item tracker for AI agents. Part of the Open Brain project.

Work items are Markdown files with YAML frontmatter stored in a git repository. Multiple entry points provide access to this data.

## Packages

| Package | Description |
|---|---|
| [`@warxace/ob-wi-core`](packages/core/README.md) | Core types, parsing, CRUD, search |
| [`@warxace/ob-wi-git`](packages/git/README.md) | Git sync layer (commit, pull, push) |
| [`@warxace/ob-wi-mcp`](packages/mcp/README.md) | MCP stdio server for AI agent clients |
| [`@warxace/ob-wi-api`](packages/api/README.md) | HTTP API (Hono, read-mostly REST) |
| `@warxace/ob-wi-ui` | React + Vite web dashboard (served via api) |

## Quick start (Web UI)

Build everything, then start the combined API + UI server:

```bash
npm install
npm run build
node packages/api/dist/index.js --path /path/to/work-items
```

Open [http://localhost:3847](http://localhost:3847).

Options:

| Flag | Env var | Default | Description |
|---|---|---|---|
| `--path` | `WI_PATH` | required | Path to the work-items git repository |
| `--port` | `WI_PORT` | `3847` | HTTP port |

Features:

- Filter by type, status, priority, tags, free-text search
- Sortable table, URL-addressable filters (`?type=issue&status=open`)
- Master-Detail layout with rendered Markdown body
- Keyboard navigation (↑↓ rows, Esc close)
- Copy ID / title / markdown body to clipboard
- Inline status editing

## Quick start (MCP)

```bash
# Install MCP server
npm install -g @warxace/ob-wi-mcp

# Initialize a work-items repository
ob-wi-mcp init /path/to/work-items

# Start the MCP server
ob-wi-mcp --path /path/to/work-items
```

### opencode config

```jsonc
{
  "mcp": {
    "work-items": {
      "type": "stdio",
      "command": ["ob-wi-mcp", "--path", "/path/to/work-items"]
    }
  }
}
```

## Development

```bash
npm install
npm run build   # builds all packages
npm test        # runs all tests (77 tests, node + jsdom)
npm run lint    # lints all packages
```

## Architecture

```
packages/
  core/   — filesystem-based CRUD, no transport dependency
  git/    — simple-git wrapper for commit/push/pull
  mcp/    — MCP stdio server (uses core + git)
  api/    — HTTP API + serves UI static build (uses core + git)
  ui/     — React + Vite web dashboard (talks to api over HTTP)
```

Dependency graph:

```
ui ──HTTP──> api ──import──> core + git
mcp ──import──> core + git
```
