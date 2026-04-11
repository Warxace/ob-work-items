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

Git-native work item tracker. Powered by [ob-work-items](https://github.com/Warxace/ob-work-items).

## Usage

Work items are markdown files with YAML frontmatter.
Access via MCP server \`ob-wi-mcp\` or the web dashboard \`ob-wi-serve\`.

## File format

\`\`\`
WI-YYYYMMDD-XXXX.md
\`\`\`

## MCP server (opencode config)

\`\`\`jsonc
{
  "mcp": {
    "work-items": {
      "type": "stdio",
      "command": ["ob-wi-mcp", "--path", "${abs}"]
    }
  }
}
\`\`\`

## Web dashboard

\`\`\`bash
ob-wi-serve --path ${abs}
# open http://localhost:3847
\`\`\`
`;
}
