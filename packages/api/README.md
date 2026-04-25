# @warxace/ob-wi-api

HTTP API server for **ob-work-items** — read-mostly REST layer over the git-native work item store.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List items with optional filters, search, sort |
| GET | `/api/items/:id` | Get single item |
| PATCH | `/api/items/:id` | Update `status` and/or `tags` |
| GET | `/api/meta/tags` | All unique tags, sorted |
| GET | `/api/meta/stats` | Counts by type, status, priority |

### GET /api/items

Query parameters (all optional):

| Param | Type | Description |
|---|---|---|
| `type` | string | Filter by type: `task`, `issue`, `idea`, `decision`, `question` |
| `status` | string | Filter by status: `open`, `in-progress`, `blocked`, `done`, `cancelled` |
| `priority` | string | Filter by priority: `low`, `medium`, `high`, `critical` |
| `tags` | string | Comma-separated tags (all must match) |
| `agent` | string | Filter by source agent |
| `machine` | string | Filter by source machine |
| `q` | string | Full-text search in title, body, and ID |
| `sort` | string | Sort field: `created` (default), `updated`, `title`, `status`, `priority`, `type` |
| `order` | string | `asc` (default) or `desc` |

Response: `{ items: WorkItem[], total: number }`

### PATCH /api/items/:id

Body: `{ status?: WorkItemStatus, tags?: string[] }`

Response: updated `WorkItem`

No git commit is triggered — this is a UI-layer write for immediate feedback.
For durable commits use the MCP server.

## Usage

```bash
ob-wi-serve --path /path/to/work-items [--port 3847]
```

Environment variables: `WI_PATH`, `WI_PORT`
