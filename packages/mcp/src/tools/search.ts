import { z } from 'zod';
import { searchWorkItems } from '@warxace/ob-wi-core';

export const SearchWorkItemsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

export type SearchWorkItemsInput = z.infer<typeof SearchWorkItemsSchema>;

export async function handleSearchWorkItems(input: SearchWorkItemsInput, repoPath: string) {
  return searchWorkItems(repoPath, input.query);
}
