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
  created: string;       // ISO 8601
  updated: string;       // ISO 8601
  source?: WorkItemSource;
  tags?: string[];
  links?: string[];
}

export interface WorkItemFilter {
  type?: WorkItemType;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  tags?: string[];
  agent?: string;
  machine?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}
