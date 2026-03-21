import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SimpleGit } from 'simple-git';
import type { Config } from './config.js';

import { CreateWorkItemSchema, handleCreateWorkItem } from './tools/create.js';
import { GetWorkItemSchema, handleGetWorkItem } from './tools/get.js';
import { ListWorkItemsSchema, handleListWorkItems } from './tools/list.js';
import { UpdateWorkItemSchema, handleUpdateWorkItem } from './tools/update.js';
import { SearchWorkItemsSchema, handleSearchWorkItems } from './tools/search.js';
import { ValidateWorkItemSchema, handleValidateWorkItem } from './tools/validate.js';

export function createServer(config: Config, git: SimpleGit): McpServer {
  const server = new McpServer({
    name: 'ob-wi-mcp',
    version: '0.1.0',
  });

  const repo = config.workItemsPath;

  server.tool(
    'create_work_item',
    'Create a new work item (task, issue, idea, decision, or question)',
    CreateWorkItemSchema.shape,
    async (input) => {
      const result = await handleCreateWorkItem(input as never, repo, git, config);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'get_work_item',
    'Get a work item by ID',
    GetWorkItemSchema.shape,
    async (input) => {
      const result = await handleGetWorkItem(input as never, repo);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'list_work_items',
    'List work items with optional filters (type, status, priority, tags, agent, machine)',
    ListWorkItemsSchema.shape,
    async (input) => {
      const result = await handleListWorkItems(input as never, repo);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'update_work_item',
    'Update fields and/or body of an existing work item',
    UpdateWorkItemSchema.shape,
    async (input) => {
      const result = await handleUpdateWorkItem(input as never, repo, git, config);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'search_work_items',
    'Full-text search across work item titles and bodies',
    SearchWorkItemsSchema.shape,
    async (input) => {
      const result = await handleSearchWorkItems(input as never, repo);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'validate_work_item',
    'Validate a work item against the schema, returns advisory warnings',
    ValidateWorkItemSchema.shape,
    async (input) => {
      const result = await handleValidateWorkItem(input as never, repo);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}
