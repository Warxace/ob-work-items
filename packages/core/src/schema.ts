import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { WorkItem, ValidationWarning } from './types.js';

interface TypeDefinition {
  description?: string;
  expected_fields?: string[];
  recommended_fields?: string[];
  transitions?: string[]; // allowed next statuses (advisory)
}

type SchemaDefinition = Partial<Record<string, TypeDefinition>>;

const SCHEMA_PATH = '.schema/types.yaml';

/**
 * Loads the schema from .schema/types.yaml in the repo.
 * Returns null if schema file doesn't exist.
 */
export async function loadSchema(repoPath: string): Promise<SchemaDefinition | null> {
  const filePath = path.join(repoPath, SCHEMA_PATH);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return yaml.load(content) as SchemaDefinition;
  } catch {
    return null;
  }
}

/**
 * Returns advisory warnings for a work item.
 * Never blocks creation/update — only informs.
 */
export async function validateWorkItem(
  repoPath: string,
  item: WorkItem,
): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = [];
  const schema = await loadSchema(repoPath);

  if (!schema) return warnings;

  const typeDef = schema[item.type];
  if (typeDef === undefined) {
    warnings.push({ field: 'type', message: `Unknown type "${item.type}", not defined in schema` });
    return warnings;
  }

  const itemRecord = item as unknown as Record<string, unknown>;

  // Check expected fields
  for (const field of typeDef.expected_fields ?? []) {
    const value = itemRecord[field];
    if (value === undefined || value === null || value === '') {
      warnings.push({ field, message: `Field "${field}" is expected for type "${item.type}"` });
    }
  }

  // Check recommended fields
  for (const field of typeDef.recommended_fields ?? []) {
    const value = itemRecord[field];
    if (value === undefined || value === null || value === '') {
      warnings.push({ field, message: `Field "${field}" is recommended for type "${item.type}"` });
    }
  }

  return warnings;
}

/**
 * Advisory check: warns if a status transition is not typical.
 * Never blocks the transition.
 */
export function checkTransition(
  schema: SchemaDefinition | null,
  type: string,
  fromStatus: string,
  toStatus: string,
): ValidationWarning[] {
  if (!schema) return [];
  const typeDef = schema[type];
  if (typeDef === undefined || typeDef.transitions === undefined) return [];

  // transitions is a list of "from->to" pairs
  const allowed = typeDef.transitions.map((t) => t.split('->').map((s) => s.trim()));
  const isAllowed = allowed.some(([f, t]) => f === fromStatus && t === toStatus);

  if (!isAllowed) {
    return [
      {
        field: 'status',
        message: `Transition "${fromStatus} → ${toStatus}" is not typical for type "${type}". Proceeding anyway.`,
      },
    ];
  }
  return [];
}

/**
 * Returns the default schema content for init.
 */
export function defaultSchemaYaml(): string {
  return `task:
  description: "Конкретное действие, которое можно взять и сделать"
  expected_fields: [type, status, priority]
  recommended_fields: [acceptance_criteria, estimate]
  transitions:
    - open -> in-progress
    - in-progress -> blocked
    - in-progress -> done
    - blocked -> in-progress
    - done -> open

issue:
  description: "Проблема, которую нужно проанализировать"
  expected_fields: [type, status, priority]
  recommended_fields: [symptoms, impact]
  transitions:
    - open -> in-progress
    - in-progress -> done
    - in-progress -> blocked

idea:
  description: "Идея для обсуждения или проработки"
  expected_fields: [type, status]
  recommended_fields: [context, next_step]

decision:
  description: "Принятое решение с обоснованием"
  expected_fields: [type, status]
  recommended_fields: [alternatives_considered, rationale]

question:
  description: "Открытый вопрос, требующий ответа"
  expected_fields: [type, status]
  recommended_fields: [context, addressed_to]
  transitions:
    - open -> done
`;
}
