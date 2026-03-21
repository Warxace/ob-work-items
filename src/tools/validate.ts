import { z } from 'zod';
import { getWorkItem } from '../core/work-item.js';
import { validateWorkItem } from '../core/schema.js';

export const ValidateWorkItemSchema = z.object({
  id: z.string().regex(/^\d{8}-[0-9a-f]{4}$/, 'Invalid work item ID format'),
});

export type ValidateWorkItemInput = z.infer<typeof ValidateWorkItemSchema>;

export async function handleValidateWorkItem(input: ValidateWorkItemInput, repoPath: string) {
  const item = await getWorkItem(repoPath, input.id);
  const warnings = await validateWorkItem(repoPath, item);
  return { item, warnings, valid: warnings.length === 0 };
}
