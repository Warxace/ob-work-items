export type WorkItemType = 'task' | 'issue' | 'idea' | 'decision' | 'question';
export type WorkItemStatus = 'open' | 'in-progress' | 'blocked' | 'done' | 'cancelled';
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkItemSource {
  agent?: string;
  context?: string;
  machine?: string;
}

export interface WorkItem {
  id: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  title: string;
  body: string;
  created: string;
  updated: string;
  source?: WorkItemSource;
  tags?: string[];
  links?: string[];
}

export interface ListResponse {
  items: WorkItem[];
  total: number;
}

export interface MetaStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface ListParams {
  type?: WorkItemType;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  tags?: string;
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
