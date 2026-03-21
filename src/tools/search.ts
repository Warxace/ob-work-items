import { z } from 'zod';
import { searchWorkItems } from '../core/work-item.js';

export const SearchWorkItemsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

export type SearchWorkItemsInput = z.infer<typeof SearchWorkItemsSchema>;

export async function handleSearchWorkItems(input: SearchWorkItemsInput, repoPath: string) {
  return searchWorkItems(repoPath, input.query);
}
