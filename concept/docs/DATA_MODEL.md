# Data Model Specification

## 1. Overview

This document defines the complete data model for the Gantt Chart application, including all data structures, file format specifications, and validation rules.

---

## 2. Core Data Structures

### 2.1 Task

A task represents a single work item or activity with a defined duration.

```typescript
interface Task {
  // Identity
  id: string;                    // UUID v4
  name: string;                  // Display name (max 200 chars)

  // Timing
  startDate: string;             // ISO 8601 date string (YYYY-MM-DD)
  endDate: string;               // ISO 8601 date string (YYYY-MM-DD)
  duration: number;              // Calculated: days between start and end

  // Visual
  color: string;                 // Hex color (#RRGGBB)
  order: number;                 // Display order (0-based index)

  // Grouping
  groupId?: string;              // Parent group ID (if task belongs to a group)

  // Optional
  description?: string;          // Extended description (max 2000 chars)
  progress?: number;             // 0-100 percentage
  tags?: string[];               // Categorization tags

  // Extensibility (See EXTENSIBILITY_ARCHITECTURE.md)
  customFields?: Record<string, CustomFieldValue>;  // User-defined fields
  assignedTo?: string[];         // Future: User IDs (collaboration)
  createdBy?: string;            // Future: User ID (collaboration)
  lastModifiedBy?: string;       // Future: User ID (collaboration)
  estimatedHours?: number;       // Future: Resource management
  actualHours?: number;          // Future: Time tracking
  metadata?: Record<string, unknown>;  // Reserved for future features

  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Design mockups",
  "startDate": "2025-12-15",
  "endDate": "2025-12-22",
  "duration": 7,
  "color": "#3b82f6",
  "order": 0,
  "description": "Create initial UI mockups for all main screens",
  "progress": 60,
  "tags": ["design", "phase-1"],
  "createdAt": "2025-12-11T10:30:00.000Z",
  "updatedAt": "2025-12-11T14:45:00.000Z"
}
```

### 2.2 Dependency

Represents a relationship between two tasks where one must complete before another can start.

```typescript
interface Dependency {
  id: string;                    // UUID v4
  fromTaskId: string;            // Source task (predecessor)
  toTaskId: string;              // Target task (successor)
  type: DependencyType;          // Relationship type
  lag?: number;                  // Delay in days (can be negative)

  createdAt: string;             // ISO 8601 timestamp
}

enum DependencyType {
  FINISH_TO_START = 'FS',        // Most common: A finishes, then B starts
  START_TO_START = 'SS',         // A starts, then B can start
  FINISH_TO_FINISH = 'FF',       // A finishes, then B can finish
  START_TO_FINISH = 'SF'         // Rare: A starts, then B can finish
}
```

**Example**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "fromTaskId": "550e8400-e29b-41d4-a716-446655440000",
  "toTaskId": "550e8400-e29b-41d4-a716-446655440002",
  "type": "FS",
  "lag": 2,
  "createdAt": "2025-12-11T11:00:00.000Z"
}
```

### 2.3 Milestone

A milestone is a zero-duration marker for important dates or events.

```typescript
interface Milestone {
  id: string;                    // UUID v4
  name: string;                  // Display name (max 200 chars)
  date: string;                  // ISO 8601 date string (YYYY-MM-DD)
  color: string;                 // Hex color (#RRGGBB)
  icon?: string;                 // Icon identifier (optional)
  description?: string;          // Extended description
  order: number;                 // Display order

  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440003",
  "name": "Project Kickoff",
  "date": "2025-12-01",
  "color": "#ef4444",
  "icon": "flag",
  "description": "Official project start date",
  "order": 0,
  "createdAt": "2025-12-11T09:00:00.000Z",
  "updatedAt": "2025-12-11T09:00:00.000Z"
}
```

### 2.4 Custom Fields

Custom fields allow users to extend tasks with their own metadata without modifying the core schema.

```typescript
interface CustomFieldValue {
  fieldId: string;               // Reference to field definition
  value: any;                    // string | number | boolean | Date | string[]
  type: CustomFieldType;         // Type of the field
}

enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  TAGS = 'tags',
  USER = 'user'                  // Future: Reference to user
}

interface CustomFieldDefinition {
  id: string;                    // UUID v4
  name: string;                  // Display name (e.g., "Priority")
  type: CustomFieldType;         // Field type
  options?: string[];            // For dropdown type
  defaultValue?: any;            // Default when creating tasks
  required: boolean;             // Whether field is required
  entityType: 'task' | 'milestone' | 'group';  // Which entities can have this field
  order: number;                 // Display order in UI

  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "id": "field-priority",
  "name": "Priority",
  "type": "dropdown",
  "options": ["High", "Medium", "Low"],
  "defaultValue": "Medium",
  "required": false,
  "entityType": "task",
  "order": 0,
  "createdAt": "2025-12-11T10:00:00.000Z",
  "updatedAt": "2025-12-11T10:00:00.000Z"
}
```

**Notes**:
- Custom fields are stored in task.customFields map
- Field definitions stored in chart.customFieldDefinitions
- UI for custom fields in V1.1+
- Provides foundation for future features (resources, budgets, etc.)

---

### 2.5 TaskGroup

A task group (or phase) provides hierarchical organization of tasks.

```typescript
interface TaskGroup {
  id: string;                    // UUID v4
  name: string;                  // Group name (max 200 chars)
  description?: string;          // Group description
  color: string;                 // Hex color for summary bar (#RRGGBB)

  // Hierarchy
  parentGroupId?: string;        // Parent group ID (for nested groups)
  order: number;                 // Display order among siblings

  // Display
  collapsed: boolean;            // Whether group is collapsed
  showSummaryBar: boolean;       // Whether to show summary bar for this group

  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "name": "Phase 1: Design",
  "description": "All design-related tasks",
  "color": "#3b82f6",
  "parentGroupId": null,
  "order": 0,
  "collapsed": false,
  "showSummaryBar": true,
  "createdAt": "2025-12-11T09:00:00.000Z",
  "updatedAt": "2025-12-11T09:00:00.000Z"
}
```

**Notes**:
- Groups are organizational only - independent of dependencies
- Tasks can belong to one group (or none)
- Groups can be nested (sub-groups)
- Summary bar spans from earliest task start to latest task end in group
- Collapsed groups hide child tasks but show summary bar

---

### 2.5 Chart

The top-level container for all chart data.

```typescript
interface Chart {
  id: string;                    // UUID v4
  name: string;                  // Chart title (max 200 chars)
  description?: string;          // Chart description

  // Data
  tasks: Task[];
  dependencies: Dependency[];
  milestones: Milestone[];
  groups: TaskGroup[];

  // Extensibility
  customFieldDefinitions?: CustomFieldDefinition[];  // User-defined field schemas
  projectId?: string;            // Future: Multi-project support
  resources?: Resource[];        // Future: Resource management
  ownerId?: string;              // Future: Collaboration
  collaborators?: ChartCollaborator[];  // Future: Collaboration

  // View settings
  viewSettings: ViewSettings;

  // Metadata
  metadata: ChartMetadata;
}

interface ViewSettings {
  startDate: string;             // Viewport start (auto-calculated if null)
  endDate: string;               // Viewport end (auto-calculated if null)
  zoom: number;                  // Zoom level (0.5 to 5.0)
  viewMode: 'day' | 'week' | 'month';
  showWeekends: boolean;
  showToday: boolean;
  theme: string;                 // Theme identifier
}

interface ChartMetadata {
  version: string;               // Semantic version (e.g., "1.0.0")
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  createdBy?: string;            // Optional user identifier
  lastModifiedBy?: string;       // Optional user identifier
  tags?: string[];               // Chart categorization
}
```

---

## 3. History System

### 3.1 History Entry

Each change to the chart is recorded as a history entry.

```typescript
interface HistoryEntry {
  id: string;                    // UUID v4
  timestamp: string;             // ISO 8601 timestamp
  type: HistoryEntryType;        // Type of change
  description: string;           // Human-readable description

  // Change data
  changes: Change[];             // List of atomic changes

  // Optional snapshot
  snapshot?: ChartSnapshot;      // Full state snapshot (every 50 entries)
}

enum HistoryEntryType {
  TASK_ADDED = 'task_added',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_MOVED = 'task_moved',
  DEPENDENCY_ADDED = 'dependency_added',
  DEPENDENCY_DELETED = 'dependency_deleted',
  MILESTONE_ADDED = 'milestone_added',
  MILESTONE_UPDATED = 'milestone_updated',
  MILESTONE_DELETED = 'milestone_deleted',
  BULK_CHANGE = 'bulk_change',
  SNAPSHOT_CREATED = 'snapshot_created'
}

interface Change {
  entityType: 'task' | 'dependency' | 'milestone' | 'chart';
  entityId: string;
  field?: string;                // Which field changed (if applicable)
  oldValue?: any;                // Previous value
  newValue?: any;                // New value
  operation: 'create' | 'update' | 'delete';
}
```

**Example**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "timestamp": "2025-12-11T14:30:00.000Z",
  "type": "task_updated",
  "description": "Updated task: Design mockups",
  "changes": [
    {
      "entityType": "task",
      "entityId": "550e8400-e29b-41d4-a716-446655440000",
      "field": "endDate",
      "oldValue": "2025-12-20",
      "newValue": "2025-12-22",
      "operation": "update"
    }
  ]
}
```

### 3.2 Snapshot

Named snapshots allow users to bookmark important chart states.

```typescript
interface Snapshot {
  id: string;                    // UUID v4
  name: string;                  // User-given name
  description?: string;          // Optional description
  timestamp: string;             // ISO 8601 timestamp
  historyIndex: number;          // Position in history array
  chartState: ChartSnapshot;     // Full chart state at this point
}

interface ChartSnapshot {
  tasks: Task[];
  dependencies: Dependency[];
  milestones: Milestone[];
  viewSettings: ViewSettings;
}
```

---

## 4. File Format

### 4.1 .gantt File Format

The `.gantt` file is a JSON file containing the complete chart and its history.

```typescript
interface GanttFile {
  // Format identification
  fileVersion: string;           // File format version (e.g., "1.0.0")
  appVersion: string;            // App version that created it
  schemaVersion?: number;        // Schema version (for migration tracking)

  // Chart data
  chart: Chart;

  // History
  history: {
    entries: HistoryEntry[];
    maxEntries: number;          // History limit
    snapshots: Snapshot[];       // Named snapshots
  };

  // User preferences (UI state)
  preferences: UserPreferences;

  // File metadata
  metadata: {
    created: string;             // ISO 8601 timestamp
    modified: string;            // ISO 8601 timestamp
    fileSize?: number;           // Bytes (calculated on save)
    checksum?: string;           // SHA-256 hash (optional integrity check)
  };

  // Extensibility
  features?: {                   // Feature flags for compatibility
    hasCustomFields?: boolean;
    hasResources?: boolean;
    hasCollaboration?: boolean;
  };
  migrations?: {                 // Migration tracking
    appliedMigrations?: string[];
    originalVersion?: string;
  };
  __unknownFields?: Record<string, unknown>;  // Preserve future fields
}
```

**Complete Example**:
```json
{
  "fileVersion": "1.0.0",
  "appVersion": "1.0.0",
  "chart": {
    "id": "chart-001",
    "name": "Website Redesign Project",
    "description": "Q1 2025 website overhaul",
    "tasks": [
      {
        "id": "task-001",
        "name": "Design mockups",
        "startDate": "2025-12-15",
        "endDate": "2025-12-22",
        "duration": 7,
        "color": "#3b82f6",
        "order": 0,
        "createdAt": "2025-12-11T10:30:00.000Z",
        "updatedAt": "2025-12-11T10:30:00.000Z"
      },
      {
        "id": "task-002",
        "name": "Frontend development",
        "startDate": "2025-12-23",
        "endDate": "2026-01-15",
        "duration": 23,
        "color": "#10b981",
        "order": 1,
        "createdAt": "2025-12-11T10:35:00.000Z",
        "updatedAt": "2025-12-11T10:35:00.000Z"
      }
    ],
    "dependencies": [
      {
        "id": "dep-001",
        "fromTaskId": "task-001",
        "toTaskId": "task-002",
        "type": "FS",
        "createdAt": "2025-12-11T10:40:00.000Z"
      }
    ],
    "milestones": [
      {
        "id": "milestone-001",
        "name": "Project Kickoff",
        "date": "2025-12-15",
        "color": "#ef4444",
        "order": 0,
        "createdAt": "2025-12-11T10:30:00.000Z",
        "updatedAt": "2025-12-11T10:30:00.000Z"
      }
    ],
    "viewSettings": {
      "startDate": "2025-12-01",
      "endDate": "2026-02-01",
      "zoom": 1.0,
      "viewMode": "week",
      "showWeekends": true,
      "showToday": true,
      "theme": "default"
    },
    "metadata": {
      "version": "1.0.0",
      "createdAt": "2025-12-11T10:30:00.000Z",
      "updatedAt": "2025-12-11T14:45:00.000Z",
      "tags": ["web-development", "q1-2025"]
    }
  },
  "history": {
    "entries": [
      {
        "id": "hist-001",
        "timestamp": "2025-12-11T10:30:00.000Z",
        "type": "task_added",
        "description": "Added task: Design mockups",
        "changes": [
          {
            "entityType": "task",
            "entityId": "task-001",
            "operation": "create",
            "newValue": { "name": "Design mockups", "..." }
          }
        ]
      }
    ],
    "maxEntries": 1000,
    "snapshots": [
      {
        "id": "snap-001",
        "name": "Initial planning complete",
        "description": "All tasks defined, ready for execution",
        "timestamp": "2025-12-11T14:00:00.000Z",
        "historyIndex": 15,
        "chartState": { "tasks": [], "dependencies": [], "milestones": [] }
      }
    ]
  },
  "preferences": {
    "colorPalette": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
    "dateFormat": "YYYY-MM-DD",
    "autoSave": true,
    "autoSaveInterval": 30000
  },
  "metadata": {
    "created": "2025-12-11T10:30:00.000Z",
    "modified": "2025-12-11T14:45:00.000Z",
    "fileSize": 45678,
    "checksum": "abc123..."
  }
}
```

### 4.2 File Compression (Optional)

For large charts, the file can be gzip-compressed:

**File Extension**: `.gantt.gz`

**Detection**: Check for gzip magic bytes (1f 8b) at file start

**Decompression**: Use browser's DecompressionStream API:
```typescript
const decompressed = await response.blob()
  .then(blob => blob.stream())
  .then(stream => stream.pipeThrough(new DecompressionStream('gzip')))
  .then(stream => new Response(stream).text());
```

---

## 5. Validation Rules

### 5.1 Task Validation

```typescript
const taskValidation = {
  id: {
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    errorMessage: "Invalid UUID format"
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 200,
    errorMessage: "Task name must be 1-200 characters"
  },
  startDate: {
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    validate: (date: string) => !isNaN(Date.parse(date)),
    errorMessage: "Invalid date format (must be YYYY-MM-DD)"
  },
  endDate: {
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    validate: (endDate: string, task: Task) => {
      return new Date(endDate) >= new Date(task.startDate);
    },
    errorMessage: "End date must be after start date"
  },
  color: {
    required: true,
    pattern: /^#[0-9A-F]{6}$/i,
    errorMessage: "Color must be hex format (#RRGGBB)"
  },
  progress: {
    required: false,
    min: 0,
    max: 100,
    errorMessage: "Progress must be between 0 and 100"
  }
};
```

### 5.2 Dependency Validation

```typescript
const dependencyValidation = {
  // No self-dependencies
  validateNoCycle: (dep: Dependency, allDeps: Dependency[]) => {
    return !createsCycle(dep, allDeps);
  },

  // Both tasks must exist
  validateTasksExist: (dep: Dependency, tasks: Task[]) => {
    return tasks.some(t => t.id === dep.fromTaskId) &&
           tasks.some(t => t.id === dep.toTaskId);
  },

  // No duplicate dependencies
  validateUnique: (dep: Dependency, allDeps: Dependency[]) => {
    return !allDeps.some(d =>
      d.fromTaskId === dep.fromTaskId &&
      d.toTaskId === dep.toTaskId &&
      d.id !== dep.id
    );
  }
};
```

### 5.3 File Validation

```typescript
const fileValidation = {
  // Version compatibility
  validateVersion: (fileVersion: string, appVersion: string) => {
    const [fileMajor] = fileVersion.split('.');
    const [appMajor] = appVersion.split('.');
    return fileMajor === appMajor; // Major version must match
  },

  // Required fields
  validateStructure: (file: any) => {
    return file.fileVersion &&
           file.chart &&
           file.chart.id &&
           file.chart.tasks &&
           Array.isArray(file.chart.tasks);
  },

  // File size limits
  validateSize: (fileSize: number) => {
    return fileSize < 50 * 1024 * 1024; // 50MB max
  }
};
```

---

## 6. JSON Schema Definition

### 6.1 Complete JSON Schema for .gantt Files

The following JSON Schema defines the complete structure and validation rules for `.gantt` files. Use this schema for strict validation during file import.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ganttchart.app/schemas/gantt-file-v1.schema.json",
  "title": "Gantt Chart File Format",
  "description": "JSON schema for .gantt file format version 1.x",
  "type": "object",
  "required": ["fileVersion", "appVersion", "chart", "history", "metadata"],
  "additionalProperties": false,
  "properties": {
    "fileVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version of file format (e.g., '1.0.0')"
    },
    "appVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Version of app that created this file"
    },
    "chart": {
      "type": "object",
      "required": ["id", "name", "tasks", "dependencies", "milestones", "groups", "viewSettings", "metadata"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "description": {
          "type": "string",
          "maxLength": 2000
        },
        "tasks": {
          "type": "array",
          "maxItems": 1000,
          "items": { "$ref": "#/definitions/task" }
        },
        "dependencies": {
          "type": "array",
          "maxItems": 5000,
          "items": { "$ref": "#/definitions/dependency" }
        },
        "milestones": {
          "type": "array",
          "maxItems": 100,
          "items": { "$ref": "#/definitions/milestone" }
        },
        "groups": {
          "type": "array",
          "maxItems": 200,
          "items": { "$ref": "#/definitions/taskGroup" }
        },
        "viewSettings": { "$ref": "#/definitions/viewSettings" },
        "metadata": { "$ref": "#/definitions/chartMetadata" }
      }
    },
    "history": {
      "type": "object",
      "required": ["entries", "maxEntries", "snapshots"],
      "properties": {
        "entries": {
          "type": "array",
          "maxItems": 1000,
          "items": { "$ref": "#/definitions/historyEntry" }
        },
        "maxEntries": {
          "type": "integer",
          "minimum": 100,
          "maximum": 10000
        },
        "snapshots": {
          "type": "array",
          "maxItems": 50,
          "items": { "$ref": "#/definitions/snapshot" }
        }
      }
    },
    "preferences": { "$ref": "#/definitions/userPreferences" },
    "metadata": {
      "type": "object",
      "required": ["created", "modified"],
      "properties": {
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "modified": {
          "type": "string",
          "format": "date-time"
        },
        "fileSize": {
          "type": "integer",
          "minimum": 0
        },
        "checksum": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        }
      }
    }
  },
  "definitions": {
    "task": {
      "type": "object",
      "required": ["id", "name", "startDate", "endDate", "duration", "color", "order", "createdAt", "updatedAt"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string", "minLength": 1, "maxLength": 200 },
        "startDate": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "endDate": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "duration": { "type": "integer", "minimum": 0 },
        "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "order": { "type": "integer", "minimum": 0 },
        "groupId": { "type": "string", "format": "uuid" },
        "description": { "type": "string", "maxLength": 2000 },
        "progress": { "type": "integer", "minimum": 0, "maximum": 100 },
        "tags": {
          "type": "array",
          "maxItems": 10,
          "items": { "type": "string", "maxLength": 50 }
        },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      }
    },
    "dependency": {
      "type": "object",
      "required": ["id", "fromTaskId", "toTaskId", "type", "createdAt"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "fromTaskId": { "type": "string", "format": "uuid" },
        "toTaskId": { "type": "string", "format": "uuid" },
        "type": { "enum": ["FS", "SS", "FF", "SF"] },
        "lag": { "type": "integer", "minimum": -365, "maximum": 365 },
        "createdAt": { "type": "string", "format": "date-time" }
      }
    },
    "milestone": {
      "type": "object",
      "required": ["id", "name", "date", "color", "order", "createdAt", "updatedAt"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string", "minLength": 1, "maxLength": 200 },
        "date": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "icon": { "type": "string", "maxLength": 20 },
        "description": { "type": "string", "maxLength": 2000 },
        "order": { "type": "integer", "minimum": 0 },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      }
    },
    "taskGroup": {
      "type": "object",
      "required": ["id", "name", "color", "order", "collapsed", "showSummaryBar", "createdAt", "updatedAt"],
      "additionalProperties": false,
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string", "minLength": 1, "maxLength": 200 },
        "description": { "type": "string", "maxLength": 2000 },
        "color": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "parentGroupId": { "type": "string", "format": "uuid" },
        "order": { "type": "integer", "minimum": 0 },
        "collapsed": { "type": "boolean" },
        "showSummaryBar": { "type": "boolean" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      }
    },
    "viewSettings": {
      "type": "object",
      "required": ["zoom", "viewMode", "showWeekends", "showToday", "theme"],
      "properties": {
        "startDate": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "endDate": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "zoom": { "type": "number", "minimum": 0.5, "maximum": 5.0 },
        "viewMode": { "enum": ["day", "week", "month"] },
        "showWeekends": { "type": "boolean" },
        "showToday": { "type": "boolean" },
        "theme": { "type": "string", "maxLength": 50 }
      }
    },
    "chartMetadata": {
      "type": "object",
      "required": ["version", "createdAt", "updatedAt"],
      "properties": {
        "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "createdBy": { "type": "string", "maxLength": 100 },
        "lastModifiedBy": { "type": "string", "maxLength": 100 },
        "tags": {
          "type": "array",
          "maxItems": 10,
          "items": { "type": "string", "maxLength": 50 }
        }
      }
    },
    "historyEntry": {
      "type": "object",
      "required": ["id", "timestamp", "type", "description", "changes"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "timestamp": { "type": "string", "format": "date-time" },
        "type": {
          "enum": ["task_added", "task_updated", "task_deleted", "task_moved",
                   "dependency_added", "dependency_deleted",
                   "milestone_added", "milestone_updated", "milestone_deleted",
                   "bulk_change", "snapshot_created"]
        },
        "description": { "type": "string", "maxLength": 500 },
        "changes": {
          "type": "array",
          "items": { "$ref": "#/definitions/change" }
        },
        "snapshot": { "$ref": "#/definitions/chartSnapshot" }
      }
    },
    "change": {
      "type": "object",
      "required": ["entityType", "entityId", "operation"],
      "properties": {
        "entityType": { "enum": ["task", "dependency", "milestone", "chart"] },
        "entityId": { "type": "string" },
        "field": { "type": "string" },
        "oldValue": {},
        "newValue": {},
        "operation": { "enum": ["create", "update", "delete"] }
      }
    },
    "chartSnapshot": {
      "type": "object",
      "required": ["tasks", "dependencies", "milestones", "viewSettings"],
      "properties": {
        "tasks": { "type": "array" },
        "dependencies": { "type": "array" },
        "milestones": { "type": "array" },
        "viewSettings": { "$ref": "#/definitions/viewSettings" }
      }
    },
    "snapshot": {
      "type": "object",
      "required": ["id", "name", "timestamp", "historyIndex", "chartState"],
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "name": { "type": "string", "minLength": 1, "maxLength": 200 },
        "description": { "type": "string", "maxLength": 2000 },
        "timestamp": { "type": "string", "format": "date-time" },
        "historyIndex": { "type": "integer", "minimum": 0 },
        "chartState": { "$ref": "#/definitions/chartSnapshot" }
      }
    },
    "userPreferences": {
      "type": "object",
      "properties": {
        "theme": { "type": "string" },
        "colorPalette": {
          "type": "array",
          "items": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" }
        },
        "uiDensity": { "enum": ["compact", "normal", "comfortable"] },
        "taskNamePosition": { "enum": ["inside", "above", "below", "smart"] },
        "dateFormat": { "type": "string" },
        "firstDayOfWeek": { "enum": [0, 1] },
        "showHistoryTimeline": { "type": "boolean" },
        "showTimelineBottom": { "type": "boolean" },
        "showSummaryBars": { "type": "boolean" },
        "recentFiles": {
          "type": "array",
          "maxItems": 10,
          "items": { "type": "string" }
        },
        "autoSave": { "type": "boolean" },
        "autoSaveInterval": { "type": "integer", "minimum": 5000 }
      }
    }
  }
}
```

### 6.2 Validation Implementation

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ganttSchema from './gantt-file.schema.json';

// Initialize validator
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  removeAdditional: false // Reject files with unknown fields
});
addFormats(ajv);

const validateGanttFile = ajv.compile(ganttSchema);

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: string[];
}

interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

/**
 * Validate .gantt file against JSON Schema
 * Run this in a Web Worker for large files
 */
async function validateFile(fileContent: string): Promise<ValidationResult> {
  let data: any;

  // Step 1: Parse JSON (with error handling)
  try {
    data = JSON.parse(fileContent);
  } catch (e) {
    return {
      valid: false,
      errors: [{
        path: '$',
        message: 'Invalid JSON format: ' + e.message
      }]
    };
  }

  // Step 2: Schema validation
  const valid = validateGanttFile(data);

  if (!valid) {
    return {
      valid: false,
      errors: validateGanttFile.errors?.map(err => ({
        path: err.instancePath || err.schemaPath,
        message: err.message || 'Validation error',
        value: err.data
      }))
    };
  }

  // Step 3: Semantic validation (beyond schema)
  const warnings: string[] = [];

  // Check version compatibility
  const [fileMajor] = data.fileVersion.split('.');
  const [appMajor] = APP_VERSION.split('.');

  if (fileMajor !== appMajor) {
    return {
      valid: false,
      errors: [{
        path: '$.fileVersion',
        message: `Incompatible major version. File: ${data.fileVersion}, App: ${APP_VERSION}`
      }]
    };
  }

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(data.chart.dependencies);
  if (circularDeps.length > 0) {
    return {
      valid: false,
      errors: [{
        path: '$.chart.dependencies',
        message: `Circular dependencies detected: ${circularDeps.join(', ')}`
      }]
    };
  }

  // Check date logic
  for (const task of data.chart.tasks) {
    if (new Date(task.endDate) < new Date(task.startDate)) {
      return {
        valid: false,
        errors: [{
          path: `$.chart.tasks[${task.id}]`,
          message: `Task "${task.name}": end date before start date`
        }]
      };
    }
  }

  // Check references (tasks referenced in dependencies exist)
  const taskIds = new Set(data.chart.tasks.map(t => t.id));
  for (const dep of data.chart.dependencies) {
    if (!taskIds.has(dep.fromTaskId)) {
      return {
        valid: false,
        errors: [{
          path: `$.chart.dependencies[${dep.id}]`,
          message: `Dependency references non-existent task: ${dep.fromTaskId}`
        }]
      };
    }
    if (!taskIds.has(dep.toTaskId)) {
      return {
        valid: false,
        errors: [{
          path: `$.chart.dependencies[${dep.id}]`,
          message: `Dependency references non-existent task: ${dep.toTaskId}`
        }]
      };
    }
  }

  // Warnings (non-fatal)
  if (data.chart.tasks.length > 500) {
    warnings.push(`Large file: ${data.chart.tasks.length} tasks may impact performance`);
  }

  if (data.history.entries.length > 800) {
    warnings.push(`Long history: ${data.history.entries.length} entries (will be pruned)`);
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(dependencies: Dependency[]): string[] {
  const graph = new Map<string, string[]>();

  // Build adjacency list
  for (const dep of dependencies) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[] = [];

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart).concat(neighbor);
        cycles.push(cycle.join(' → '));
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

export { validateFile, type ValidationResult, type ValidationError };
```

### 6.3 Usage in File Load Flow

```typescript
// In file open handler (run in Web Worker for large files)
async function openGanttFile(file: File): Promise<void> {
  // Step 1: Size check
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`);
  }

  // Step 2: Read file
  const content = await file.text();

  // Step 3: Validate (in worker if file > 1MB)
  let validationResult: ValidationResult;

  if (file.size > 1024 * 1024) {
    // Use Web Worker for large files
    validationResult = await validateInWorker(content);
  } else {
    validationResult = await validateFile(content);
  }

  // Step 4: Handle validation result
  if (!validationResult.valid) {
    showValidationErrorDialog(validationResult.errors!);
    return;
  }

  if (validationResult.warnings) {
    showValidationWarnings(validationResult.warnings);
  }

  // Step 5: Safe to load
  const data = JSON.parse(content);
  loadChartData(data);
}
```

---

## 7. Default Values

### 7.1 New Task Defaults

```typescript
const defaultTask: Partial<Task> = {
  name: "New Task",
  startDate: new Date().toISOString().split('T')[0], // Today
  endDate: addDays(new Date(), 7).toISOString().split('T')[0], // +7 days
  duration: 7,
  color: "#3b82f6", // Blue
  progress: 0,
  tags: []
};
```

### 7.2 New Chart Defaults

```typescript
const defaultChart: Partial<Chart> = {
  name: "Untitled Chart",
  tasks: [],
  dependencies: [],
  milestones: [],
  viewSettings: {
    zoom: 1.0,
    viewMode: 'week',
    showWeekends: true,
    showToday: true,
    theme: 'default'
  }
};
```

### 7.3 Color Palettes

```typescript
const colorPalettes = {
  default: [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Orange
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16"  // Lime
  ],
  pastel: [
    "#93c5fd", // Light blue
    "#6ee7b7", // Light green
    "#fcd34d", // Light yellow
    "#fca5a5", // Light red
    "#c4b5fd", // Light purple
    "#f9a8d4", // Light pink
    "#67e8f9", // Light cyan
    "#bef264"  // Light lime
  ],
  monochrome: [
    "#1f2937", // Gray 800
    "#374151", // Gray 700
    "#4b5563", // Gray 600
    "#6b7280", // Gray 500
    "#9ca3af", // Gray 400
    "#d1d5db", // Gray 300
    "#e5e7eb", // Gray 200
    "#f3f4f6"  // Gray 100
  ]
};
```

---

## 8. Storage

### 8.1 Browser Storage (Auto-save)

**IndexedDB** for auto-save recovery:

```typescript
interface AutoSaveRecord {
  id: 'current';              // Single record key
  chartData: GanttFile;       // Full file data
  lastSaved: string;          // ISO 8601 timestamp
  dirty: boolean;             // Has unsaved changes
}

// Database structure
const dbSchema = {
  name: 'GanttChartDB',
  version: 1,
  stores: {
    autoSave: {
      keyPath: 'id',
      indexes: []
    }
  }
};
```

**Local Storage** for preferences:

```typescript
interface UserPreferences {
  // Appearance
  theme: string;                          // Theme identifier
  colorPalette: string[];                 // Default color palette
  uiDensity: 'compact' | 'normal' | 'comfortable';  // UI compactness level
  taskNamePosition: 'inside' | 'above' | 'below' | 'smart';  // Task name display

  // Localization
  dateFormat: string;                     // Date format (MM/DD/YYYY, DD/MM/YYYY, etc.)
  firstDayOfWeek: 0 | 1;                 // 0 = Sunday, 1 = Monday

  // UI Behavior
  showHistoryTimeline: boolean;           // Show/hide history timeline slider
  showTimelineBottom: boolean;            // Duplicate timeline at bottom
  showSummaryBars: boolean;               // Global setting for group summary bars

  // File Management
  recentFiles: string[];                  // File paths (max 10)
  autoSave: boolean;                      // Enable auto-save to browser storage
  autoSaveInterval: number;               // Auto-save frequency in milliseconds
}

// Storage key
const PREFS_KEY = 'ganttchart_preferences';

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'default',
  colorPalette: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  uiDensity: 'normal',
  taskNamePosition: 'smart',
  dateFormat: 'YYYY-MM-DD',
  firstDayOfWeek: 1,
  showHistoryTimeline: true,
  showTimelineBottom: false,
  showSummaryBars: true,
  recentFiles: [],
  autoSave: true,
  autoSaveInterval: 30000
};
```

### 8.2 Storage Quota Management

```typescript
// Check available quota
async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
    percentUsed: (estimate.usage / estimate.quota) * 100
  };
}

// Warning thresholds
const STORAGE_WARNING_THRESHOLD = 80; // 80% full
const STORAGE_ERROR_THRESHOLD = 95;   // 95% full
```

---

## 9. Data Migration

### 9.1 Version Migration Strategy

When file format changes between versions:

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (oldData: any) => GanttFile;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: (oldData) => {
      // Example: Add new field with default value
      return {
        ...oldData,
        preferences: {
          ...oldData.preferences,
          newField: defaultValue
        }
      };
    }
  }
];

// Apply migrations sequentially
function migrateFile(file: any): GanttFile {
  let currentVersion = file.fileVersion;
  let currentData = file;

  while (currentVersion !== CURRENT_VERSION) {
    const migration = migrations.find(m => m.fromVersion === currentVersion);
    if (!migration) {
      throw new Error(`No migration path from ${currentVersion}`);
    }
    currentData = migration.migrate(currentData);
    currentVersion = migration.toVersion;
  }

  return currentData;
}
```

---

## 10. Performance Considerations

### 10.1 Data Size Estimates

| Chart Size | Tasks | History Entries | File Size (approx) |
|------------|-------|-----------------|-------------------|
| Small      | 10    | 100             | 20 KB             |
| Medium     | 50    | 500             | 100 KB            |
| Large      | 200   | 1000            | 500 KB            |
| Very Large | 1000  | 1000            | 2 MB              |

### 10.2 Optimization Strategies

1. **History Pruning**: Limit to last 1000 entries, compress older ones
2. **Lazy Loading**: Load history on-demand when scrubbing
3. **Diff Storage**: Store changes instead of full snapshots where possible
4. **Compression**: Optional gzip for files > 1MB

---

## 11. API Types Summary

```typescript
// Re-export all types for easy import
export type {
  Task,
  Dependency,
  DependencyType,
  Milestone,
  Chart,
  ViewSettings,
  ChartMetadata,
  HistoryEntry,
  HistoryEntryType,
  Change,
  Snapshot,
  ChartSnapshot,
  GanttFile,
  UserPreferences,
  AutoSaveRecord
};
```

---

**Document Version**: 1.4
**Last Updated**: 2025-12-12
**Status**: Draft

**Recent Updates (v1.4)** - Extensibility & Future-Proofing:
- Added Section 2.4: Custom Fields with CustomFieldValue and CustomFieldDefinition interfaces
- Extended Task interface with extensibility fields: customFields, assignedTo, createdBy, lastModifiedBy, estimatedHours, actualHours, metadata
- Extended Chart interface with extensibility fields: customFieldDefinitions, projectId, resources, ownerId, collaborators
- Extended GanttFile interface with: schemaVersion, features flags, migrations tracking, __unknownFields
- Added references to EXTENSIBILITY_ARCHITECTURE.md for detailed patterns
- All extensibility fields are optional and backward compatible

**Previous Updates (v1.3)** - Based on Second Professional Review:
- Added complete JSON Schema definition (Section 6)
- Added validation implementation with circular dependency detection
- Added secure file load flow with multi-layer validation
- Added usage examples for file validation in Web Workers

**Previous Updates (v1.1)**:
- Updated with TaskGroup structure and enhanced UserPreferences
