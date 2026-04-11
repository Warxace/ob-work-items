import { z } from 'zod';
import { listWorkItems } from '@warxace/ob-wi-core';

export const ListWorkItemsSchema = z.object({
  type: z.enum(['task', 'issue', 'idea', 'decision', 'question']).optional(),
  status: z.enum(['open', 'in-progress', 'blocked', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  tags: z.array(z.string()).optional(),
  agent: z.string().optional(),
  machine: z.string().optional(),
});

export type ListWorkItemsInput = z.infer<typeof ListWorkItemsSchema>;

export async function handleListWorkItems(input: ListWorkItemsInput, repoPath: string) {
  return listWorkItems(repoPath, input);
}
