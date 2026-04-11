# ob-work-items

Git-native work item tracker for AI agents. Part of the Open Brain project.

Work items are Markdown files with YAML frontmatter stored in a git repository. Multiple entry points provide access to this data.

## Packages

| Package | Description |
|---|---|
| [`@warxace/ob-wi-core`](packages/core/README.md) | Core types, parsing, CRUD, search |
| [`@warxace/ob-wi-git`](packages/git/README.md) | Git sync layer (commit, pull, push) |
| [`@warxace/ob-wi-mcp`](packages/mcp/README.md) | MCP stdio server for AI agent clients |
| `@warxace/ob-wi-api` | HTTP API *(coming soon)* |
| `@warxace/ob-wi-ui` | Web dashboard *(coming soon)* |

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
npm test        # runs all tests
npm run lint    # lints all packages
```

## Architecture

```
packages/
  core/   — filesystem-based CRUD, no transport dependency
  git/    — simple-git wrapper for commit/push/pull
  mcp/    — MCP stdio server (uses core + git)
  api/    — HTTP API for UI (uses core + git)
  ui/     — React + Vite web dashboard (talks to api)
```

Dependency graph:

```
ui ──HTTP──> api ──import──> core + git
mcp ──import──> core + git
```
