# ob-wi-mcp

MCP server for a git-native work item tracker used by OpenCode and other MCP clients.

## What it does

- Stores work items as Markdown files with YAML frontmatter
- Exposes CRUD, search, and validation tools over MCP stdio
- Commits changes to git and can sync with a remote repository

## Install

### Global package install

```bash
npm install -g @warxace/ob-wi-mcp
```

This installs these commands:

- `ob-wi-mcp` - MCP server entrypoint
- `ob-wi-mcp init <path>` - initialize a new work-items repository
- `ob-wi-mcp-init` - compatibility alias for repository initialization
- `ob-wi-mcp-setup-machine` - configure a machine for OpenCode usage
- `ob-wi-mcp-launcher` - launcher used by install scripts

### Setup a machine for OpenCode

```bash
ob-wi-mcp-setup-machine
```

The setup script:

- configures `~/.npmrc` for GitHub Packages
- installs or updates the package globally
- installs a stable launcher in `~/.local/bin/ob-work-items-mcp-server`
- clones or updates the `work-items` git repository
- updates `~/.config/opencode/opencode.json`

## Manual OpenCode config

If you do not want to use the setup script, point OpenCode at the launcher or server binary directly.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "work-items": {
      "type": "local",
      "command": [
        "/home/user/.local/bin/ob-work-items-mcp-server",
        "--path",
        "/home/user/work-items"
      ],
      "enabled": true
    }
  }
}
```

You can also run the server entrypoint directly:

```bash
ob-wi-mcp --path /home/user/work-items
```

## Initialize a work-items repository

```bash
ob-wi-mcp init /home/user/work-items
```

Compatibility alias:

```bash
ob-wi-mcp-init /home/user/work-items
```

This creates:

- `.schema/types.yaml`
- `README.md`
- `.gitignore`
- an initial git commit

## Configuration

Server configuration is passed through CLI flags or environment variables.

```bash
ob-wi-mcp --path /home/user/work-items --push-strategy periodic --push-interval 30
```

Supported inputs:

- `--path` or `WI_PATH`
- `--push-strategy` or `WI_PUSH_STRATEGY`
- `--push-interval` or `WI_PUSH_INTERVAL`

## Development

```bash
npm install
npm run lint
npm run build
npm test
```

For manual MCP inspection:

```bash
npm run inspector
```
