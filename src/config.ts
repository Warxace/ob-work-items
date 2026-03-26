export type PushStrategy = 'periodic' | 'on-commit' | 'manual';

export interface Config {
  workItemsPath: string;
  push: {
    strategy: PushStrategy;
    intervalSeconds: number;
  };
}

/**
 * Loads configuration from CLI args and/or environment variables.
 *
 * Priority: CLI args > env vars > defaults
 *
 * CLI usage:
 *   node dist/index.js --path /path/to/work-items --push-strategy periodic --push-interval 30
 *
 * Env vars:
 *   WI_PATH, WI_PUSH_STRATEGY, WI_PUSH_INTERVAL
 */
export function loadConfig(): Config {
  const args = parseArgs(process.argv.slice(2));

  const cliPath = args['path'];
  const envPath = process.env['WI_PATH'];
  const workItemsPath = cliPath || envPath;

  if (!workItemsPath) {
    throw new Error(
      'Work items path is required. ' +
      'Provide --path /path/to/work-items or set WI_PATH env variable.',
    );
  }

  const cliStrategy = args['push-strategy'];
  const envStrategy = process.env['WI_PUSH_STRATEGY'];
  const strategy = (cliStrategy || envStrategy || 'periodic') as PushStrategy;

  const cliInterval = args['push-interval'];
  const envInterval = process.env['WI_PUSH_INTERVAL'];
  const intervalSeconds = Number(cliInterval || envInterval || 30);

  return {
    workItemsPath,
    push: { strategy, intervalSeconds },
  };
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = 'true';
      }
    }
  }
  return result;
}
