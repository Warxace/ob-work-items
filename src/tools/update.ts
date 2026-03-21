import { z } from 'zod';
import { getWorkItem, updateWorkItem } from '../core/work-item.js';
import { loadSchema, validateWorkItem, checkTransition } from '../core/schema.js';
import type { SimpleGit } from 'simple-git';
import type { Config } from '../config.js';
import { afterMutation } from '../git/sync.js';

export const UpdateWorkItemSchema = z.object({
  id: z.string().regex(/^\d{8}-[0-9a-f]{4}$/, 'Invalid work item ID format'),
  type: z.enum(['task', 'issue', 'idea', 'decision', 'question']).optional(),
  status: z.enum(['open', 'in-progress', 'blocked', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  source: z.object({
    agent: z.string().optional(),
    context: z.string().optional(),
    machine: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
});

export type UpdateWorkItemInput = z.infer<typeof UpdateWorkItemSchema>;

export async function handleUpdateWorkItem(
  input: UpdateWorkItemInput,
  repoPath: string,
  git: SimpleGit,
  config: Config,
) {
  const { id, ...patch } = input;

  const warnings: { field: string; message: string }[] = [];

  // Advisory transition check
  if (patch.status) {
    const existing = await getWorkItem(repoPath, id);
    const schema = await loadSchema(repoPath);
    const transitionWarnings = checkTransition(schema, existing.type, existing.status, patch.status);
    warnings.push(...transitionWarnings);
  }

  const item = await updateWorkItem(repoPath, id, patch);
  const validationWarnings = await validateWorkItem(repoPath, item);
  warnings.push(...validationWarnings);

  await afterMutation(git, config, `wi: update ${item.id} — ${item.title}`);

  return { item, warnings };
}
