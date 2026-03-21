#!/usr/bin/env node
/**
 * ob-wi-mcp init <path>
 * Creates a new work-items repository with initial structure.
 */
import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { defaultSchemaYaml } from './core/schema.js';

async function init(targetPath: string) {
  const abs = path.resolve(targetPath);

  // Create directories
  await fs.mkdir(path.join(abs, '.schema'), { recursive: true });

  // Write .schema/types.yaml
  await fs.writeFile(path.join(abs, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');

  // Write README.md
  // Note: paths are WSL-style (/mnt/c/...) since the server runs in WSL
  const readme = `# work-items

Git-native work item tracker. Part of [Open Brain](https://github.com/NateBJones-Projects/OB1).

## Usage

Work items are markdown files with YAML frontmatter.
Access via MCP server \`ob-wi-mcp\`.

## File format

\`\`\`
WI-YYYYMMDD-XXXX.md
\`\`\`

## MCP server (opencode config)

Paths use WSL format (/mnt/c/...) — the server runs in WSL.

\`\`\`jsonc
{
  "mcp": {
    "work-items": {
      "type": "stdio",
      "command": "node",
      "args": ["/mnt/c/Users/Mi/source/Kashtan/ob-wi-mcp/dist/index.js"],
      "env": { "WI_PATH": "${abs}" }
    }
  }
}
\`\`\`
`;
  await fs.writeFile(path.join(abs, 'README.md'), readme, 'utf8');

  // Write .gitignore
  await fs.writeFile(path.join(abs, '.gitignore'), '.DS_Store\nThumbs.db\n', 'utf8');

  // Git init
  const git = simpleGit(abs);
  await git.init();
  await git.add('.');
  await git.commit('chore: initial work-items repository structure');

  console.log(`✓ Initialized work-items repository at: ${abs}`);
  console.log(`  Configure your MCP client to use WI_PATH=${abs}`);
}

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Usage: ob-wi-mcp-init <path>');
  process.exit(1);
}

init(targetPath).catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
