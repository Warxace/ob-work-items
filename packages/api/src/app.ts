import { Hono } from 'hono';
import { workItemsRoutes } from './routes/work-items.js';
import { metaRoutes } from './routes/meta.js';

export interface AppConfig {
  /** Absolute path to the work-items git repository. */
  repoPath: string;
}

/**
 * Creates and configures the Hono application.
 * Exported separately from index.ts so tests can instantiate it without
 * starting a real HTTP server.
 */
export function createApp(config: AppConfig): Hono {
  const app = new Hono();

  app.route('/api/items', workItemsRoutes(config));
  app.route('/api/meta', metaRoutes(config));

  return app;
}
