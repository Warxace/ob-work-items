import { z } from 'zod';
import { getWorkItem } from '@warxace/ob-wi-core';

export const GetWorkItemSchema = z.object({
  id: z.string().regex(/^\d{8}-[0-9a-f]{4}$/, 'Invalid work item ID format (expected YYYYMMDD-xxxx)'),
});

export type GetWorkItemInput = z.infer<typeof GetWorkItemSchema>;

export async function handleGetWorkItem(input: GetWorkItemInput, repoPath: string) {
  return getWorkItem(repoPath, input.id);
}
