/** Supported work item types. */
export type WorkItemType = 'task' | 'issue' | 'idea' | 'decision' | 'question';

/** Lifecycle status of a work item. */
export type WorkItemStatus = 'open' | 'in-progress' | 'blocked' | 'done' | 'cancelled';

/** Priority level of a work item. */
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical';

/** Metadata about which agent/machine created or last modified a work item. */
export interface WorkItemSource {
  agent?: string;
  context?: string;
  machine?: string;
}

/** Full work item as stored on disk. */
export interface WorkItem {
  /** Unique ID in YYYYMMDD-xxxx format. */
  id: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  title: string;
  /** Markdown body content (below the frontmatter). */
  body: string;
  /** ISO 8601 creation timestamp. */
  created: string;
  /** ISO 8601 last-updated timestamp. */
  updated: string;
  source?: WorkItemSource;
  tags?: string[];
  /** Related IDs or external URLs. */
  links?: string[];
}

/** Filter parameters for listWorkItems. All fields are optional and ANDed together. */
export interface WorkItemFilter {
  type?: WorkItemType;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  /** All specified tags must be present on the item. */
  tags?: string[];
  agent?: string;
  machine?: string;
}

/** An advisory validation warning — never blocks create/update. */
export interface ValidationWarning {
  field: string;
  message: string;
}
