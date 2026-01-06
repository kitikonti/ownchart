# Extensibility & Future-Proofing Architecture

## 1. Executive Summary

This document outlines architectural decisions needed NOW to support future features without requiring a complete application rebuild. While we're starting with a focused MVP, the architecture must accommodate common features found in mature project management tools.

**Key Principle**: Design for extensibility from day one, implement features incrementally.

---

## 2. Common Features in Similar Applications

### 2.1 Feature Analysis

Based on analysis of established tools (MS Project, Asana, Monday.com, Smartsheet, TeamGantt):

| Feature Category | Examples | Priority for Architecture |
|-----------------|----------|--------------------------|
| **Resource Management** | Team members, assignments, workload | HIGH - affects data model |
| **Custom Fields** | User-defined metadata, forms | HIGH - affects data model |
| **Multiple Projects** | Portfolio view, cross-project | HIGH - affects storage |
| **Collaboration** | Comments, mentions, sharing | HIGH - affects data model |
| **Alternative Views** | Kanban, Calendar, List | MEDIUM - affects rendering |
| **Templates** | Project templates, task libraries | MEDIUM - affects file format |
| **Budgets/Costs** | Financial tracking, estimates | LOW - can be custom fields |
| **Time Tracking** | Actual vs planned hours | LOW - can be custom fields |
| **Notifications** | Reminders, alerts, subscriptions | LOW - separate service |
| **Integrations** | API, webhooks, third-party | MEDIUM - affects architecture |
| **Advanced Permissions** | Role-based access control | LOW - future with collaboration |
| **Recurring Tasks** | Repeating task patterns | MEDIUM - affects data model |
| **Baselines** | Planned vs actual comparison | LOW - separate feature |
| **AI/Smart Features** | Auto-scheduling, suggestions | LOW - future enhancement |

---

## 3. Critical Architectural Decisions

### 3.1 Extensible Data Model (REQUIRED NOW)

**Problem**: Adding new fields later breaks file compatibility.

**Solution**: Design-time extensibility system.

```typescript
// Task interface with extensibility built-in
interface Task {
  // ... core fields (id, name, dates, etc.) ...

  // CRITICAL: Custom fields support from day one
  customFields?: Record<string, CustomFieldValue>;

  // CRITICAL: Reserved for future features
  metadata?: Record<string, unknown>;

  // CRITICAL: Extensibility markers
  __extensions?: Record<string, unknown>;
}

interface CustomFieldValue {
  fieldId: string;
  value: any;  // string | number | boolean | Date | string[]
  type: CustomFieldType;
}

enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  USER = 'user',        // Future: assigned user
  TAGS = 'tags'
}

// Custom field definitions (stored in chart metadata)
interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];   // For dropdown
  defaultValue?: any;
  required: boolean;
  entityType: 'task' | 'milestone' | 'group';
}

// Chart extended for custom fields
interface Chart {
  // ... existing fields ...

  customFieldDefinitions?: CustomFieldDefinition[];
}
```

**File Format Impact**:
```json
{
  "fileVersion": "1.0.0",
  "chart": {
    "customFieldDefinitions": [
      {
        "id": "field-001",
        "name": "Priority",
        "type": "dropdown",
        "options": ["High", "Medium", "Low"],
        "defaultValue": "Medium",
        "required": false,
        "entityType": "task"
      }
    ],
    "tasks": [
      {
        "id": "task-001",
        "name": "Design mockups",
        "customFields": {
          "field-001": {
            "fieldId": "field-001",
            "value": "High",
            "type": "dropdown"
          }
        }
      }
    ]
  }
}
```

**Benefits**:
- Users can add custom fields without app updates
- Future features (resources, budgets) can use custom fields initially
- File format remains compatible
- No migration needed when adding new field types

**Implementation Timeline**: Phase 1 (MVP) - data model only, UI in V1.1+

---

### 3.2 Multi-Project/Chart Management (REQUIRED NOW)

**Problem**: Current design assumes single chart in browser.

**Solution**: Project context system.

```typescript
// Storage structure change
interface AppStorage {
  // CRITICAL: Multiple projects support
  projects: {
    [projectId: string]: {
      metadata: ProjectMetadata;
      lastOpened: string;
      autoSaveData?: GanttFile;
    }
  };

  // Current project
  currentProjectId?: string;

  // Recent projects
  recentProjects: string[];  // Project IDs in order

  // Global preferences
  preferences: UserPreferences;
}

interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  created: string;
  modified: string;
  fileSize: number;
  taskCount: number;
  thumbnail?: string;  // Base64 preview image
}

// Chart extended with project context
interface Chart {
  // ... existing fields ...

  projectId?: string;  // Links to project metadata
}
```

**UI Impact**:
- Add "Project Switcher" dropdown in toolbar (V1.1+)
- "Recent Projects" menu (V1.1+)
- Project management modal (V2.0)

**Storage Strategy**:
```typescript
// IndexedDB structure
const dbSchema = {
  name: 'GanttChartDB',
  version: 2,  // Bump for multi-project support
  stores: {
    projects: {
      keyPath: 'id',
      indexes: ['modified', 'name']
    },
    autoSave: {
      keyPath: 'projectId'  // Changed from 'current'
    },
    preferences: {
      keyPath: 'id'
    }
  }
};
```

**Benefits**:
- Users can manage multiple projects
- Foundation for portfolio view (V2.0)
- Cloud sync easier (each project separate)
- No rebuild needed for multi-project UI

**Implementation Timeline**:
- Phase 1 (MVP): Data model supports projectId (optional)
- V1.1: UI for project switching
- V2.0: Full project management

---

### 3.3 Collaboration Foundation (DESIGN NOW, IMPLEMENT LATER)

**Problem**: Adding collaboration later is extremely difficult.

**Solution**: Design data model with collaboration in mind, implement features later.

```typescript
// User identification (optional in MVP, required for collaboration)
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;  // For visual identification
}

// Task with collaboration fields (optional for now)
interface Task {
  // ... existing fields ...

  // CRITICAL: Support for future collaboration
  assignedTo?: string[];      // User IDs
  createdBy?: string;         // User ID
  lastModifiedBy?: string;    // User ID
  watchers?: string[];        // User IDs subscribed to updates

  // CRITICAL: Comments/discussions
  comments?: Comment[];
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[];  // User IDs mentioned
  replies?: Comment[];  // Threaded comments
}

// Change tracking with author
interface Change {
  // ... existing fields ...

  userId?: string;  // Who made this change
}

// Chart with collaboration
interface Chart {
  // ... existing fields ...

  // CRITICAL: Ownership and permissions
  ownerId?: string;
  collaborators?: ChartCollaborator[];
  shareSettings?: ShareSettings;
}

interface ChartCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
  addedBy: string;
}

interface ShareSettings {
  visibility: 'private' | 'link' | 'public';
  allowComments: boolean;
  allowExport: boolean;
  expiresAt?: string;
}
```

**Real-time Sync Strategy** (V2.0):
```typescript
// Operational Transformation (OT) or CRDT approach
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'task' | 'dependency' | 'milestone';
  entityId: string;
  field?: string;
  value?: any;
  userId: string;
  timestamp: number;
  version: number;  // For conflict resolution
}

// Conflict resolution
interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual';
  priority?: 'server' | 'client';
}
```

**Benefits**:
- Data model ready for collaboration
- No breaking changes when adding users
- Can add collaboration features incrementally
- Privacy maintained until users opt-in

**Implementation Timeline**:
- Phase 1 (MVP): Optional fields in data model (unused)
- V1.1: Basic user profiles (local only)
- V2.0: Full collaboration with backend

---

### 3.4 Plugin/Extension System (DESIGN NOW)

**Problem**: Can't support third-party extensions later.

**Solution**: Event-driven architecture with hooks.

```typescript
// Plugin interface
interface GanttPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;

  // Lifecycle hooks
  onLoad?: () => void;
  onUnload?: () => void;

  // Data hooks
  onTaskCreated?: (task: Task) => void | Promise<void>;
  onTaskUpdated?: (task: Task, changes: Partial<Task>) => void;
  onTaskDeleted?: (taskId: string) => void;

  // UI hooks
  renderTaskActions?: (task: Task) => React.ReactNode;
  renderToolbarButton?: () => React.ReactNode;
  renderSidebarPanel?: () => React.ReactNode;

  // Export hooks
  onBeforeExport?: (format: ExportFormat) => void;
  onAfterExport?: (blob: Blob) => void;

  // Custom commands
  commands?: PluginCommand[];
}

interface PluginCommand {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  execute: () => void | Promise<void>;
}

// Plugin manager
class PluginManager {
  private plugins: Map<string, GanttPlugin> = new Map();

  register(plugin: GanttPlugin): void {
    this.plugins.set(plugin.id, plugin);
    plugin.onLoad?.();
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    plugin?.onUnload?.();
    this.plugins.delete(pluginId);
  }

  emit(event: string, ...args: any[]): void {
    for (const plugin of this.plugins.values()) {
      const handler = plugin[`on${event}`];
      if (handler) {
        handler(...args);
      }
    }
  }
}

// Example plugin: Priority Color Coding
const priorityPlugin: GanttPlugin = {
  id: 'priority-colors',
  name: 'Priority Color Coding',
  version: '1.0.0',

  onTaskCreated(task) {
    // Auto-assign color based on priority custom field
    const priority = task.customFields?.['priority']?.value;
    if (priority === 'High') {
      task.color = '#ef4444';
    } else if (priority === 'Medium') {
      task.color = '#f59e0b';
    } else if (priority === 'Low') {
      task.color = '#10b981';
    }
  }
};
```

**Benefits**:
- Third-party extensions possible
- Users can customize without forking
- Ecosystem growth
- Advanced features without bloating core

**Implementation Timeline**:
- Phase 1 (MVP): Event system foundation
- V1.2: Basic plugin API
- V2.0: Full plugin marketplace

---

### 3.5 View Layer Abstraction (REQUIRED NOW)

**Problem**: Tight coupling between data and Gantt visualization.

**Solution**: View adapter pattern.

```typescript
// View abstraction
interface ChartView {
  id: string;
  type: ViewType;
  name: string;
  render(data: ChartViewData): React.ReactNode;
  exportable: boolean;
}

enum ViewType {
  GANTT = 'gantt',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
  LIST = 'list',
  TIMELINE = 'timeline',
  TABLE = 'table'
}

interface ChartViewData {
  tasks: Task[];
  dependencies: Dependency[];
  milestones: Milestone[];
  groups: TaskGroup[];
  settings: ViewSettings;
}

// Gantt view (default)
class GanttChartView implements ChartView {
  id = 'gantt-view';
  type = ViewType.GANTT;
  name = 'Gantt Chart';
  exportable = true;

  render(data: ChartViewData) {
    return <GanttCanvas data={data} />;
  }
}

// Kanban view (future)
class KanbanBoardView implements ChartView {
  id = 'kanban-view';
  type = ViewType.KANBAN;
  name = 'Kanban Board';
  exportable = true;

  render(data: ChartViewData) {
    // Group tasks by status custom field
    const columns = this.groupTasksByStatus(data.tasks);
    return <KanbanBoard columns={columns} />;
  }

  private groupTasksByStatus(tasks: Task[]) {
    // Implementation
  }
}

// View manager
class ViewManager {
  private views: Map<string, ChartView> = new Map();
  private activeView: string = 'gantt-view';

  registerView(view: ChartView): void {
    this.views.set(view.id, view);
  }

  setActiveView(viewId: string): void {
    if (this.views.has(viewId)) {
      this.activeView = viewId;
    }
  }

  render(data: ChartViewData): React.ReactNode {
    const view = this.views.get(this.activeView);
    return view?.render(data);
  }
}
```

**Benefits**:
- Easy to add new visualizations
- Same data, multiple views
- Testable view logic
- Plugin views possible

**Implementation Timeline**:
- Phase 1 (MVP): View abstraction in architecture
- V1.2: Second view (List or Calendar)
- V2.0: Full view suite (Kanban, Calendar, etc.)

---

### 3.6 Resource Management Foundation (DESIGN NOW)

**Problem**: Adding resources later affects task model significantly.

**Solution**: Optional resource fields from day one.

```typescript
// Resource definition
interface Resource {
  id: string;
  name: string;
  email?: string;
  role?: string;
  color: string;
  avatar?: string;
  capacity?: number;  // Hours per day/week
  cost?: number;      // Hourly rate
  calendar?: ResourceCalendar;
}

interface ResourceCalendar {
  workingDays: number[];  // 0-6 (Sunday-Saturday)
  workingHours: { start: string; end: string };  // "09:00", "17:00"
  holidays: string[];  // ISO dates
  timeOff: TimeOffPeriod[];
}

interface TimeOffPeriod {
  id: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'other';
}

// Task with resource assignments
interface Task {
  // ... existing fields ...

  // CRITICAL: Resource support
  assignedResources?: ResourceAssignment[];
  estimatedHours?: number;
  actualHours?: number;
}

interface ResourceAssignment {
  resourceId: string;
  allocation: number;  // Percentage (0-100)
  role?: string;       // Role on this task
  notes?: string;
}

// Chart with resources
interface Chart {
  // ... existing fields ...

  resources?: Resource[];
  resourcePools?: ResourcePool[];  // Groups of resources
}

interface ResourcePool {
  id: string;
  name: string;
  resourceIds: string[];
  description?: string;
}
```

**Resource View (Future V2.0)**:
```typescript
// Resource utilization view
interface ResourceUtilization {
  resourceId: string;
  date: string;
  allocatedHours: number;
  capacity: number;
  utilization: number;  // Percentage
  tasks: { taskId: string; hours: number }[];
}

// Resource leveling (auto-balance workload)
interface ResourceLevelingOptions {
  strategy: 'minimize-delay' | 'balance-workload';
  allowSplit: boolean;  // Split tasks across dates
  maxUtilization: number;  // Max % utilization
}
```

**Benefits**:
- Can add resource features incrementally
- Data model supports from day one
- No file format migration needed
- Optional until users need it

**Implementation Timeline**:
- Phase 1 (MVP): Data model fields (optional, unused)
- V1.2: Basic resource assignment UI
- V2.0: Resource management, leveling, utilization views

---

### 3.7 Import/Export Adapter System (DESIGN NOW)

**Problem**: Supporting multiple formats later is complex.

**Solution**: Adapter pattern with intermediate format.

```typescript
// Intermediate canonical format
interface CanonicalChart {
  metadata: {
    title: string;
    description?: string;
    created: Date;
    modified: Date;
  };
  tasks: CanonicalTask[];
  dependencies: CanonicalDependency[];
  milestones: CanonicalMilestone[];
  resources?: CanonicalResource[];
}

interface CanonicalTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress?: number;
  assignees?: string[];
  tags?: string[];
  customFields: Map<string, any>;
}

// Format adapter interface
interface FormatAdapter {
  id: string;
  name: string;
  extension: string;
  mimeType: string;

  canImport: boolean;
  canExport: boolean;

  // Convert from external format to canonical
  import(file: File): Promise<CanonicalChart>;

  // Convert from canonical to external format
  export(chart: CanonicalChart): Promise<Blob>;

  // Validate external file
  validate(file: File): Promise<ValidationResult>;
}

// Example: MS Project XML adapter
class MSProjectAdapter implements FormatAdapter {
  id = 'ms-project-xml';
  name = 'Microsoft Project XML';
  extension = '.xml';
  mimeType = 'application/xml';
  canImport = true;
  canExport = false;

  async import(file: File): Promise<CanonicalChart> {
    const xml = await file.text();
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    // Parse MS Project XML structure
    const tasks = this.parseTasks(doc);
    const dependencies = this.parseDependencies(doc);

    return {
      metadata: { /* ... */ },
      tasks,
      dependencies,
      milestones: []
    };
  }

  // Implementation details...
}

// CSV adapter
class CSVAdapter implements FormatAdapter {
  id = 'csv';
  name = 'CSV';
  extension = '.csv';
  mimeType = 'text/csv';
  canImport = true;
  canExport = true;

  async import(file: File): Promise<CanonicalChart> {
    const csv = await file.text();
    const rows = this.parseCSV(csv);

    return {
      tasks: rows.map(row => this.rowToTask(row)),
      dependencies: [],
      milestones: [],
      metadata: { /* ... */ }
    };
  }

  async export(chart: CanonicalChart): Promise<Blob> {
    const rows = chart.tasks.map(task => this.taskToRow(task));
    const csv = this.generateCSV(rows);
    return new Blob([csv], { type: 'text/csv' });
  }
}

// Format manager
class FormatManager {
  private adapters: Map<string, FormatAdapter> = new Map();

  registerAdapter(adapter: FormatAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  async import(file: File, adapterId: string): Promise<GanttFile> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter || !adapter.canImport) {
      throw new Error('Import not supported');
    }

    // Convert to canonical format
    const canonical = await adapter.import(file);

    // Convert canonical to our format
    return this.canonicalToGantt(canonical);
  }

  async export(chart: GanttFile, adapterId: string): Promise<Blob> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter || !adapter.canExport) {
      throw new Error('Export not supported');
    }

    // Convert our format to canonical
    const canonical = this.ownchartToCanonical(chart);

    // Convert canonical to target format
    return adapter.export(canonical);
  }
}
```

**Benefits**:
- Easy to add new formats
- Plugins can add format adapters
- Two-way transformations isolated
- Testable conversion logic

**Implementation Timeline**:
- Phase 1 (MVP): Adapter pattern infrastructure
- V1.1: CSV import/export
- V1.2: MS Project XML import
- V2.0: Full format support (MPP, Primavera, etc.)

---

### 3.8 Notification & Event System (DESIGN NOW)

**Problem**: Adding notifications later requires refactoring state management.

**Solution**: Event bus from day one.

```typescript
// Event system
type EventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'dependency.created'
  | 'milestone.created'
  | 'chart.saved'
  | 'chart.exported'
  | 'user.assigned'
  | 'comment.added';

interface Event {
  type: EventType;
  timestamp: number;
  userId?: string;
  data: any;
}

class EventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private history: Event[] = [];

  subscribe(event: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.unsubscribe(event, listener);
  }

  emit(event: EventType, data: any): void {
    const evt: Event = {
      type: event,
      timestamp: Date.now(),
      data
    };

    this.history.push(evt);

    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(evt));
    }
  }

  unsubscribe(event: EventType, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }
}

type EventListener = (event: Event) => void;

// Notification service (future)
class NotificationService {
  constructor(private eventBus: EventBus) {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen to relevant events
    this.eventBus.subscribe('task.updated', (event) => {
      const task = event.data.task;
      const watchers = task.watchers || [];

      // Notify watchers
      this.notify(watchers, {
        title: `Task updated: ${task.name}`,
        body: `${event.userId} updated ${task.name}`,
        type: 'task-update'
      });
    });

    this.eventBus.subscribe('user.assigned', (event) => {
      const { taskId, userId } = event.data;

      // Notify assigned user
      this.notify([userId], {
        title: 'New task assigned',
        body: `You were assigned to ${taskId}`,
        type: 'assignment'
      });
    });
  }

  private notify(userIds: string[], notification: Notification) {
    // Future: Send notifications
    // - In-app notifications
    // - Email
    // - Push notifications (PWA)
    // - Webhook
  }
}
```

**Benefits**:
- Decoupled notification logic
- Plugins can listen to events
- Easy to add notification types
- Foundation for webhooks/integrations

**Implementation Timeline**:
- Phase 1 (MVP): Event bus infrastructure
- V1.1: In-app notifications (toasts)
- V2.0: Email notifications, webhooks

---

## 4. File Format Versioning Strategy

### 4.1 Semantic Versioning for Files

```typescript
interface GanttFile {
  // CRITICAL: Explicit version
  fileVersion: string;  // e.g., "1.2.0"

  // CRITICAL: Schema version separate from file version
  schemaVersion: number;  // e.g., 3

  // Feature flags
  features?: {
    hasCustomFields?: boolean;
    hasResources?: boolean;
    hasComments?: boolean;
    hasMultipleViews?: boolean;
  };

  // Migration hints
  migrations?: {
    appliedMigrations: string[];  // e.g., ["v1-to-v2", "v2-to-v3"]
    originalVersion?: string;
  };
}
```

### 4.2 Forward Compatibility

```typescript
// Unknown field preservation
interface UnknownFieldHandler {
  // Preserve unknown fields when reading
  preserveUnknownFields: boolean;

  // Warn when unknown fields detected
  warnOnUnknownFields: boolean;

  // Storage for unknown data
  unknownFields?: Record<string, unknown>;
}

// Safe file loading
async function loadGanttFile(file: File): Promise<GanttFile> {
  const content = await file.text();
  const data = JSON.parse(content);

  // Check version compatibility
  if (!isVersionCompatible(data.fileVersion, APP_VERSION)) {
    // Attempt migration
    data = await migrateFile(data);
  }

  // Preserve unknown fields
  const knownFields = new Set([...KNOWN_FIELDS]);
  const unknownFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!knownFields.has(key)) {
      unknownFields[key] = value;
      console.warn(`Unknown field: ${key} (preserving for future version)`);
    }
  }

  return {
    ...data,
    __unknownFields: unknownFields
  };
}
```

---

## 5. API & Integration Foundation

### 5.1 REST API Design (Future)

Even though MVP is client-only, design API shape now:

```typescript
// API endpoints (future when backend added)
interface GanttAPI {
  // Charts
  'GET /api/charts': () => Promise<ChartSummary[]>;
  'POST /api/charts': (chart: GanttFile) => Promise<Chart>;
  'GET /api/charts/:id': (id: string) => Promise<GanttFile>;
  'PUT /api/charts/:id': (id: string, chart: GanttFile) => Promise<void>;
  'DELETE /api/charts/:id': (id: string) => Promise<void>;

  // Collaboration
  'GET /api/charts/:id/collaborators': (id: string) => Promise<User[]>;
  'POST /api/charts/:id/share': (id: string, settings: ShareSettings) => Promise<ShareLink>;

  // Comments
  'GET /api/tasks/:id/comments': (id: string) => Promise<Comment[]>;
  'POST /api/tasks/:id/comments': (id: string, comment: Comment) => Promise<Comment>;

  // Sync
  'WS /api/charts/:id/sync': WebSocket;  // Real-time sync
}

// Client-side API adapter
interface StorageAdapter {
  getCharts(): Promise<ChartSummary[]>;
  getChart(id: string): Promise<GanttFile>;
  saveChart(chart: GanttFile): Promise<void>;
  deleteChart(id: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  // IndexedDB implementation
}

class CloudStorageAdapter implements StorageAdapter {
  // REST API implementation (future)
}

// App uses adapter interface, can swap implementations
const storage: StorageAdapter =
  USE_CLOUD ? new CloudStorageAdapter() : new LocalStorageAdapter();
```

### 5.2 Webhook Support (Future)

```typescript
interface Webhook {
  id: string;
  url: string;
  events: EventType[];
  secret?: string;  // For HMAC signature
  active: boolean;
  createdAt: string;
}

interface WebhookPayload {
  event: EventType;
  timestamp: number;
  chartId: string;
  data: any;
  signature?: string;  // HMAC-SHA256
}
```

---

## 6. Testing Strategy for Extensibility

### 6.1 Contract Testing

```typescript
// Test that plugins work with core
describe('Plugin Contract', () => {
  it('should call plugin lifecycle hooks', () => {
    const plugin = mockPlugin();
    pluginManager.register(plugin);

    expect(plugin.onLoad).toHaveBeenCalled();
  });

  it('should emit events to plugins', () => {
    const plugin = mockPlugin();
    pluginManager.register(plugin);

    eventBus.emit('task.created', { task: mockTask() });

    expect(plugin.onTaskCreated).toHaveBeenCalled();
  });
});

// Test file format compatibility
describe('File Format Compatibility', () => {
  it('should load v1.0 files in v2.0', async () => {
    const v1File = loadFixture('chart-v1.0.ownchart');
    const loaded = await loadGanttFile(v1File);

    expect(loaded.tasks).toBeDefined();
    expect(loaded.fileVersion).toBe('2.0.0');  // Migrated
  });

  it('should preserve unknown fields', async () => {
    const futureFile = loadFixture('chart-v3.0.ownchart');
    const loaded = await loadGanttFile(futureFile);

    expect(loaded.__unknownFields).toBeDefined();
  });
});
```

---

## 7. Performance Considerations

### 7.1 Lazy Loading

```typescript
// Lazy load plugins
const pluginLoader = {
  async loadPlugin(pluginId: string): Promise<GanttPlugin> {
    const module = await import(`./plugins/${pluginId}`);
    return module.default;
  }
};

// Lazy load views
const viewLoader = {
  async loadView(viewType: ViewType): Promise<ChartView> {
    switch (viewType) {
      case ViewType.KANBAN:
        return (await import('./views/KanbanView')).default;
      case ViewType.CALENDAR:
        return (await import('./views/CalendarView')).default;
      default:
        return new GanttChartView();
    }
  }
};
```

### 7.2 Code Splitting

```typescript
// Vite/Webpack code splitting
const ResourceManagement = lazy(() => import('./features/ResourceManagement'));
const Collaboration = lazy(() => import('./features/Collaboration'));
const AdvancedExport = lazy(() => import('./features/AdvancedExport'));

// Load only when needed
function App() {
  return (
    <Suspense fallback={<Loading />}>
      {features.resources && <ResourceManagement />}
      {features.collaboration && <Collaboration />}
      {features.export && <AdvancedExport />}
    </Suspense>
  );
}
```

---

## 8. Implementation Checklist

### Phase 1 (MVP) - Architecture Foundations
- [x] Concept documentation complete
- [ ] Custom fields in data model (optional)
- [ ] Multi-project support in data model (optional)
- [ ] Collaboration fields in data model (optional, unused)
- [ ] Event bus system
- [ ] View abstraction layer
- [ ] Plugin system foundation
- [ ] Resource fields in data model (optional, unused)
- [ ] File versioning system
- [ ] Unknown field preservation
- [ ] Storage adapter pattern

### V1.1 - First Extensions
- [ ] Custom fields UI
- [ ] Project switcher
- [ ] Basic plugins support
- [ ] Second view (List or Calendar)
- [ ] CSV import/export adapter

### V1.2 - Advanced Features
- [ ] Resource assignment UI
- [ ] Plugin marketplace
- [ ] Third view (Kanban)
- [ ] MS Project import

### V2.0 - Full Platform
- [ ] Collaboration features
- [ ] Backend API
- [ ] Real-time sync
- [ ] Full resource management
- [ ] Webhooks
- [ ] Mobile app

---

## 9. Acceptance Criteria

**MVP must include**:
- ✅ Data model supports custom fields (even if UI doesn't exist yet)
- ✅ File format has version field
- ✅ Multi-project IDs in data model
- ✅ Event bus emits core events
- ✅ Plugin registration API exists (even if no plugins yet)
- ✅ View abstraction present (even with only Gantt view)
- ✅ Unknown fields preserved when loading files

**This ensures**:
- No file format breaking changes needed
- Features can be added incrementally
- No full rebuild required
- Users' data remains compatible

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Architecture Blueprint
**Next Review**: After Phase 0 (Risk Validation)
