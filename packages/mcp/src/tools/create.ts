import { z } from 'zod';
import { createWorkItem } from '@warxace/ob-wi-core';
import { validateWorkItem } from '@warxace/ob-wi-core';
import type { SimpleGit } from 'simple-git';
import type { Config } from '../config.js';
import { afterMutation } from '@warxace/ob-wi-git';

export const CreateWorkItemSchema = z.object({
  type: z.enum(['task', 'issue', 'idea', 'decision', 'question']),
  status: z.enum(['open', 'in-progress', 'blocked', 'done', 'cancelled']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().default(''),
  source: z.object({
    agent: z.string().optional(),
    context: z.string().optional(),
    machine: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
});

export type CreateWorkItemInput = z.infer<typeof CreateWorkItemSchema>;

export async function handleCreateWorkItem(
  input: CreateWorkItemInput,
  repoPath: string,
  git: SimpleGit,
  config: Config,
) {
  const item = await createWorkItem(repoPath, input);
  const warnings = await validateWorkItem(repoPath, item);

  await afterMutation(git, config, `wi: create ${item.id} — ${item.title}`);

  return { item, warnings };
}
