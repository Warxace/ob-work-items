# @warxace/ob-wi-mcp

MCP (Model Context Protocol) server for the **ob-work-items** git-native work item tracker.

Exposes 6 tools over stdio transport for use in AI agent environments (e.g. opencode).

## Tools

| Tool | Description |
|---|---|
| `create_work_item` | Create a new work item (task, issue, idea, decision, question) |
| `get_work_item` | Get a work item by ID |
| `list_work_items` | List work items with optional filters (type, status, priority, tags, agent, machine) |
| `update_work_item` | Update fields and/or body of an existing work item |
| `search_work_items` | Full-text search across titles and bodies |
| `validate_work_item` | Advisory schema validation — returns warnings, never blocks |

## Usage

```bash
npx @warxace/ob-wi-mcp --path /path/to/work-items
```

### Options

| Flag | Env var | Default | Description |
|---|---|---|---|
| `--path` | `WI_PATH` | required | Path to the work-items git repository |
| `--push-strategy` | `WI_PUSH_STRATEGY` | `periodic` | `periodic`, `on-commit`, or `manual` |
| `--push-interval` | `WI_PUSH_INTERVAL` | `30` | Push interval in seconds (for `periodic` strategy) |

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

## Init a new repository

```bash
npx @warxace/ob-wi-mcp init /path/to/new-repo
```

Creates a new git repository with `.schema/types.yaml` and `README.md`.
