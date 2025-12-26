# Sprint 1.16: Hierarchie Indent/Outdent Funktionalität

**Datum:** 2025-12-26
**Status:** Planning
**Ziel:** UI-Buttons und Keyboard Shortcuts zum Verschieben von Tasks in der Hierarchie (eine Ebene höher/tiefer)

---

## Kontext

Die Hierarchie-Funktionalität ist im Datenmodell bereits vollständig implementiert (SVAR Pattern, `parent` Property, max 3 Ebenen), aber in der UI gibt es aktuell keine Möglichkeit, Tasks zwischen Hierarchie-Ebenen zu verschieben. Benutzer können nur via Drag & Drop die Reihenfolge ändern, aber nicht die Hierarchie-Ebene.

**Aktuelle Situation:**
- ✅ Hierarchie im Datenmodell implementiert (`parent`, max 3 levels)
- ✅ `moveTaskToParent()` Funktion existiert im Store
- ✅ Validierung vorhanden (keine Zirkel, max depth, milestones können keine children haben)
- ❌ Keine UI-Controls zum Ändern der Hierarchie-Ebene
- ❌ Keine Keyboard Shortcuts für Hierarchie-Navigation

---

## Ziele

1. **Indent Button (→)**: Verschiebt selektierte Tasks eine Ebene tiefer (macht vorherigen Sibling zum Parent)
2. **Outdent Button (←)**: Verschiebt selektierte Tasks eine Ebene höher (macht Task zum Sibling des Parents)
3. **Keyboard Shortcuts**: `Ctrl+]` für Indent, `Ctrl+[` für Outdent
4. **Multi-Selection Support**: Bulk-Operation für mehrere selektierte Tasks
5. **Smart Validation**: Buttons disabled wenn Operation nicht valid ist

---

## UI-Design

### Button-Platzierung

Neue Button-Gruppe im TaskTable Header, links neben den "Add Task" / "Add Summary" Buttons:

```
┌─────────────────────────────────────────────────────────┐
│ [←Outdent] [→Indent]  │  [+ Add Task] [+ Add Summary]  │
│ (disabled when invalid)│                                 │
└─────────────────────────────────────────────────────────┘
```

### Button-Spezifikation

**Outdent Button:**
- Icon: `ChevronLeft` (←)
- Label: "Outdent"
- Tooltip: "Move left (outdent) - Ctrl+["
- Disabled wenn: keine Selektion ODER alle selektierten Tasks sind auf root-level

**Indent Button:**
- Icon: `ChevronRight` (→)
- Label: "Indent"
- Tooltip: "Move right (indent) - Ctrl+]"
- Disabled wenn: keine Selektion ODER Operation würde Validierung verletzen

### Visual States

- **Enabled**: `bg-white border-gray-300 hover:bg-gray-50 text-gray-700`
- **Disabled**: `bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`
- **Active**: Kurzer highlight effect während Operation

---

## Funktionale Logik

### INDENT Operation (→) - Eine Ebene tiefer

**Konzept:** Markierte Tasks werden zu Children des **vorherigen Siblings** auf der gleichen Ebene

**Algorithmus:**

```typescript
function indentSelectedTasks(selectedIds: string[]) {
  const flatList = buildFlattenedTaskList(tasks, collapsedIds);

  for (const taskId of selectedIds) {
    const currentIndex = flatList.findIndex(t => t.task.id === taskId);
    const currentLevel = flatList[currentIndex].level;

    // Finde vorherigen Sibling (gleiche Ebene)
    let newParentIndex = -1;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (flatList[i].level === currentLevel) {
        newParentIndex = i;
        break;
      }
      if (flatList[i].level < currentLevel) break; // Kein Sibling gefunden
    }

    if (newParentIndex >= 0) {
      const newParent = flatList[newParentIndex].task;

      // Validierung
      if (canHaveChildren(newParent) &&
          currentLevel < 2 && // Max 3 levels (0,1,2)
          !wouldCreateCircularHierarchy(tasks, newParent.id, taskId)) {

        moveTaskToParent(taskId, newParent.id);

        // Auto-expand parent wenn collapsed
        if (newParent.open === false) {
          expandTask(newParent.id);
        }
      }
    }
  }
}
```

**Validierungsregeln:**
1. ✅ Es muss einen vorherigen Sibling geben (nicht der erste Task auf dieser Ebene)
2. ✅ Der neue Parent muss children erlauben (nicht milestone)
3. ✅ Neue Tiefe darf nicht > 2 sein (Max 3 Ebenen: 0, 1, 2)
4. ✅ Keine zirkulären Hierarchien
5. ✅ Bei Multi-Selection: Jeder Task wird einzeln validiert

**Beispiel:**

```
Vorher:
  Task A (level 0)
  Task B (level 0)  ← Wird Parent
  Task C (level 0)  ← INDENT auf Task C

Nachher:
  Task A (level 0)
  Task B (level 0)
    └─ Task C (level 1)  ← Jetzt child von B
```

---

### OUTDENT Operation (←) - Eine Ebene höher

**Konzept:** Markierte Tasks werden zu Siblings ihres aktuellen **Parents**

**Algorithmus:**

```typescript
function outdentSelectedTasks(selectedIds: string[]) {
  for (const taskId of selectedIds) {
    const task = tasks.find(t => t.id === taskId);

    if (!task?.parent) continue; // Schon auf root-level

    const parent = tasks.find(t => t.id === task.parent);
    const grandParent = parent?.parent; // undefined = root level

    // Setze task als sibling von parent
    moveTaskToParent(taskId, grandParent || null);

    // Setze order: direkt nach parent
    const parentOrder = parent.order;
    updateTask(taskId, { order: parentOrder + 0.5 });

    // Reorder alle nachfolgenden Tasks
    reorderTasks(); // Normalisiert order values
  }
}
```

**Validierungsregeln:**
1. ✅ Task darf nicht bereits auf root-level sein (parent === null/undefined)
2. ✅ Bei Multi-Selection: Alle Tasks mit parent werden outdented

**Beispiel:**

```
Vorher:
  Task A (level 0)
    └─ Task B (level 1)
       └─ Task C (level 2)  ← OUTDENT auf Task C

Nachher:
  Task A (level 0)
    ├─ Task B (level 1)
    └─ Task C (level 1)  ← Jetzt sibling von B
```

---

## Multi-Selection Verhalten

### Strategie: Sequential Processing mit Conflict Resolution

```typescript
function processMultipleIndent(selectedIds: string[]) {
  // Sortiere nach Reihenfolge in der Flat List (top-to-bottom)
  const sortedIds = sortByDisplayOrder(selectedIds);

  const successful: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const id of sortedIds) {
    try {
      const result = indentTask(id);
      if (result.success) {
        successful.push(id);
      } else {
        failed.push({ id, reason: result.error });
      }
    } catch (error) {
      failed.push({ id, reason: error.message });
    }
  }

  // Optional: Toast notification
  if (failed.length > 0) {
    showToast(`${successful.length} tasks moved, ${failed.length} failed`);
  }
}
```

### Edge Cases

**1. Mehrere consecutive Tasks selektiert:**

```
Task A
Task B ✓ selected
Task C ✓ selected
```

→ Beide werden children von A (wenn valid)

**2. Parent + Child beide selektiert:**

```
Task A ✓
  └─ Task B ✓
```

→ Nur Parent wird indented (Child folgt automatisch)
→ Oder: Skip child wenn parent selektiert (Warnung)

**3. Tasks auf verschiedenen Ebenen:**

→ Jeder Task wird individuell validiert
→ Erfolg/Fehler pro Task

---

## Keyboard Shortcuts

### Implementierung: Globaler Event Listener in TaskTable

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && selectedTaskIds.length > 0) {
      if (e.key === ']') {
        e.preventDefault();
        indentSelectedTasks();
      }
      if (e.key === '[') {
        e.preventDefault();
        outdentSelectedTasks();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedTaskIds]);
```

### Shortcuts

- `Ctrl+]` (Windows/Linux) / `Cmd+]` (Mac): Indent
- `Ctrl+[` (Windows/Linux) / `Cmd+[` (Mac): Outdent

---

## Store Actions (Neue Funktionen)

**Datei:** `src/store/slices/taskSlice.ts`

### Neue Actions

```typescript
interface TaskStore {
  // ... existing ...

  // Neue Actions
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  canIndentSelection: () => boolean;   // Für button disabled state
  canOutdentSelection: () => boolean;  // Für button disabled state
}
```

### Implementation

```typescript
const useTaskStore = create<TaskStore>()(
  immer((set, get) => ({
    // ... existing ...

    indentSelectedTasks: () => {
      const { tasks, selectedTaskIds } = get();
      const flatList = buildFlattenedTaskList(tasks, []);

      // Sortiere selection nach display order
      const sortedIds = selectedTaskIds.sort((a, b) => {
        const indexA = flatList.findIndex(t => t.task.id === a);
        const indexB = flatList.findIndex(t => t.task.id === b);
        return indexA - indexB;
      });

      sortedIds.forEach(taskId => {
        const task = tasks.find(t => t.id === taskId);
        const index = flatList.findIndex(t => t.task.id === taskId);
        const level = flatList[index].level;

        // Finde previous sibling
        let newParentId: string | null = null;
        for (let i = index - 1; i >= 0; i--) {
          if (flatList[i].level === level) {
            newParentId = flatList[i].task.id;
            break;
          }
          if (flatList[i].level < level) break;
        }

        if (newParentId) {
          const newParent = tasks.find(t => t.id === newParentId);

          // Validation
          if (canHaveChildren(newParent) &&
              level < 2 &&
              !wouldCreateCircularHierarchy(tasks, newParentId, taskId)) {

            set(state => {
              const task = state.tasks.find(t => t.id === taskId);
              if (task) task.parent = newParentId;

              // Auto-expand parent
              const parent = state.tasks.find(t => t.id === newParentId);
              if (parent && parent.open === false) {
                parent.open = true;
              }
            });
          }
        }
      });
    },

    outdentSelectedTasks: () => {
      const { selectedTaskIds } = get();

      selectedTaskIds.forEach(taskId => {
        set(state => {
          const task = state.tasks.find(t => t.id === taskId);
          if (!task?.parent) return;

          const parent = state.tasks.find(t => t.id === task.parent);
          task.parent = parent?.parent || undefined;
        });
      });
    },

    canIndentSelection: () => {
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return false;

      const flatList = buildFlattenedTaskList(tasks, []);

      return selectedTaskIds.some(taskId => {
        const index = flatList.findIndex(t => t.task.id === taskId);
        const level = flatList[index].level;

        // Check if there's a previous sibling
        for (let i = index - 1; i >= 0; i--) {
          if (flatList[i].level === level) {
            const potentialParent = flatList[i].task;
            return canHaveChildren(potentialParent) && level < 2;
          }
          if (flatList[i].level < level) break;
        }
        return false;
      });
    },

    canOutdentSelection: () => {
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return false;

      return selectedTaskIds.some(taskId => {
        const task = tasks.find(t => t.id === taskId);
        return task?.parent !== undefined && task?.parent !== null;
      });
    },
  }))
);
```

---

## UI-Komponente (Button Group)

**Neue Datei:** `src/components/TaskList/HierarchyButtons.tsx`

```typescript
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTaskStore } from '@/store/slices/taskSlice';

export function HierarchyButtons() {
  const indentSelectedTasks = useTaskStore(state => state.indentSelectedTasks);
  const outdentSelectedTasks = useTaskStore(state => state.outdentSelectedTasks);
  const canIndent = useTaskStore(state => state.canIndentSelection());
  const canOutdent = useTaskStore(state => state.canOutdentSelection());

  return (
    <div className="flex gap-1 border-r border-gray-300 pr-3 mr-3">
      <button
        onClick={outdentSelectedTasks}
        disabled={!canOutdent}
        title="Move left (outdent) - Ctrl+["
        className={`
          px-2 py-1 rounded border flex items-center gap-1
          ${canOutdent
            ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="text-sm">Outdent</span>
      </button>

      <button
        onClick={indentSelectedTasks}
        disabled={!canIndent}
        title="Move right (indent) - Ctrl+]"
        className={`
          px-2 py-1 rounded border flex items-center gap-1
          ${canIndent
            ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-sm">Indent</span>
      </button>
    </div>
  );
}
```

### Integration in TaskTable.tsx

```typescript
// In TaskTable Header
<div className="flex items-center gap-2 p-2 border-b">
  <HierarchyButtons />  {/* NEU */}
  <button onClick={addTask}>+ Add Task</button>
  <button onClick={addSummary}>+ Add Summary</button>
</div>
```

---

## Implementierungs-Schritte

### Phase 1: Store Logic ✅

1. ✅ Implementiere `indentSelectedTasks()` in taskSlice
2. ✅ Implementiere `outdentSelectedTasks()` in taskSlice
3. ✅ Implementiere `canIndentSelection()` validator
4. ✅ Implementiere `canOutdentSelection()` validator
5. ✅ Schreibe Unit Tests für edge cases

### Phase 2: UI Components 🎨

6. 🔲 Erstelle `HierarchyButtons.tsx` component
7. 🔲 Integriere in `TaskTable.tsx` header
8. 🔲 Füge Keyboard Shortcuts hinzu (Ctrl+] / Ctrl+[)
9. 🔲 Style buttons mit disabled states

### Phase 3: UX Polish ✨

10. 🔲 Füge Toast notifications für bulk operations hinzu (optional)
11. 🔲 Füge Animation/Transition für hierarchy changes hinzu (optional)
12. 🔲 Visual feedback während operation (loading state) (optional)
13. 🔲 Teste mit verschiedenen selection scenarios

### Phase 4: Documentation 📝

14. 🔲 Update README mit neuen keyboard shortcuts
15. 🔲 Füge tooltips/help text hinzu
16. 🔲 Erstelle User Guide für hierarchie operations (optional)

---

## Testing Scenarios

### Test Cases

```typescript
describe('Indent/Outdent Operations', () => {
  test('Indent: macht previous sibling zum parent', () => {
    // Task A, Task B, Task C
    // Select C → Indent
    // Expect: C ist child von B
  });

  test('Indent: disabled bei erstem task', () => {
    // Task A ist selected
    // canIndent() should return false
  });

  test('Indent: respektiert max 3 levels', () => {
    // Task auf level 2
    // Indent sollte fehlschlagen
  });

  test('Outdent: macht task zum sibling von parent', () => {
    // A → B → C
    // Select C → Outdent
    // Expect: C ist sibling von B
  });

  test('Outdent: disabled bei root level', () => {
    // Task A (root) selected
    // canOutdent() should return false
  });

  test('Multi-select: processed sequentially', () => {
    // Tasks B, C selected
    // Both indented
    // Expect: beide children von A
  });

  test('Parent+Child selected: skip child', () => {
    // A, B selected (B child of A)
    // Only A indented
  });

  test('Auto-expand parent beim indent', () => {
    // Parent collapsed
    // Indent child
    // Expect: parent expanded
  });
});
```

---

## Vorteile dieses Ansatzes

✅ **Intuitiv**: Funktioniert wie in Excel/Outlook/andere hierarchische Listen
✅ **Keyboard-first**: Shortcuts für Power-User
✅ **Visual Feedback**: Disabled states zeigen validity
✅ **Robust**: Umfassende Validierung verhindert invalid states
✅ **Bulk-friendly**: Multi-selection wird unterstützt
✅ **Consistent**: Nutzt existierende `moveTaskToParent()` logic
✅ **Testable**: Klare Separation of Concerns (Store → UI)

---

## Referenzen

### Wichtigste betroffene Dateien

1. **Datenmodell**: `src/types/chart.types.ts`
2. **State Management**: `src/store/slices/taskSlice.ts` (neu: 4 actions)
3. **Hierarchie-Logik**: `src/utils/hierarchy.ts` (existierend, wird genutzt)
4. **UI-Container**: `src/components/TaskList/TaskTable.tsx` (integration)
5. **Row-Renderer**: `src/components/TaskList/TaskTableRow.tsx` (keine Änderung)
6. **Neue Komponente**: `src/components/TaskList/HierarchyButtons.tsx` (neu)
7. **Validierung**: `src/utils/validation.ts` (existierend, wird genutzt)

### Verwandte Dokumentation

- `concept/docs/DATA_MODEL.md` - SVAR Pattern Hierarchie-Design
- `concept/docs/SPRINT_1.15_TASK_GROUPS.md` - Task Groups (ähnliche Hierarchie-Features)
- `concept/docs/TECHNICAL_ARCHITECTURE.md` - Zustand Store Architecture

---

## Zusammenfassung

Dieses Feature fügt **zwei Buttons** (`Indent` / `Outdent`) mit entsprechenden **Keyboard Shortcuts** (`Ctrl+]` / `Ctrl+[`) hinzu, um markierte Tasks in der Hierarchie zu verschieben:

- **Indent (→)**: Task wird child des vorherigen siblings
- **Outdent (←)**: Task wird sibling seines parents

Die Implementierung nutzt die **existierende** `moveTaskToParent()` Funktion und fügt **4 neue Store Actions** hinzu:

1. `indentSelectedTasks()` - Verschiebt Tasks eine Ebene tiefer
2. `outdentSelectedTasks()` - Verschiebt Tasks eine Ebene höher
3. `canIndentSelection()` - Validator für button disabled state
4. `canOutdentSelection()` - Validator für button disabled state

**Geschätzter Aufwand:** 4-6 Stunden (2h Store Logic + Tests, 2h UI Components, 1-2h Polish & Testing)

**Priorität:** Hoch (Core UX Feature für Hierarchie-Management)
