import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { defaultSchemaYaml } from '@warxace/ob-wi-core';

export async function initWorkItemsRepo(targetPath: string): Promise<void> {
  const abs = path.resolve(targetPath);

  await fs.mkdir(path.join(abs, '.schema'), { recursive: true });
  await fs.writeFile(path.join(abs, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');
  await fs.writeFile(path.join(abs, 'README.md'), renderReadme(abs), 'utf8');
  await fs.writeFile(path.join(abs, '.gitignore'), '.DS_Store\nThumbs.db\n', 'utf8');

  const git = simpleGit(abs);
  await git.init();
  await git.add('.');
  await git.commit('chore: initial work-items repository structure');

  console.log(`✓ Initialized work-items repository at: ${abs}`);
  console.log(`  Configure your MCP client to use WI_PATH=${abs}`);
}

function renderReadme(abs: string): string {
  return `# work-items

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
}
