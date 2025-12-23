# Icon System

**Status:** Proposed
**Created:** 2025-12-23
**Decision:** Use Heroicons as unified icon system

---

## Overview

This document defines the icon system for the Gantt Chart application. We use **Heroicons** from Tailwind Labs as our unified icon library.

---

## Why Heroicons?

### Reasons for Choice

1. **Perfect Tailwind Integration**
   - Made by Tailwind Labs (same team as TailwindCSS)
   - Designed specifically for Tailwind projects
   - Consistent with Tailwind's design philosophy

2. **Developer Experience**
   - React components out-of-the-box
   - TypeScript support included
   - Tree-shakeable (only imports used icons)
   - Zero configuration needed

3. **Design Quality**
   - Consistent design system
   - Two styles: Outline (24x24) and Solid (20x20)
   - Professional, modern appearance
   - Extensive icon set (200+ icons)

4. **License & Maintenance**
   - MIT License (free, open-source)
   - Actively maintained by Tailwind Labs
   - Regular updates and new icons

5. **Bundle Size**
   - Lightweight (~4KB for typical usage)
   - Only includes imported icons
   - No bloat from unused icons

---

## Installation

```bash
npm install @heroicons/react
```

**Current Status:** Not yet installed (planned for Sprint 1.15)

---

## Usage

### Basic Import

```tsx
// Outline icons (24x24) - default style
import { FolderIcon, DocumentIcon, FlagIcon } from '@heroicons/react/24/outline';

// Solid icons (20x20) - filled style
import { FolderIcon, DocumentIcon, FlagIcon } from '@heroicons/react/24/solid';
```

### Example Component

```tsx
import { FolderIcon } from '@heroicons/react/24/outline';

function SummaryTask() {
  return (
    <div className="flex items-center gap-2">
      <FolderIcon className="w-5 h-5 text-blue-600" />
      <span className="font-semibold">Phase 1: Design</span>
    </div>
  );
}
```

### Styling Icons

Heroicons work seamlessly with Tailwind:

```tsx
// Size
<FolderIcon className="w-4 h-4" />  // 16x16px
<FolderIcon className="w-5 h-5" />  // 20x20px (recommended)
<FolderIcon className="w-6 h-6" />  // 24x24px

// Color
<FolderIcon className="text-blue-600" />
<FolderIcon className="text-gray-500" />

// Hover state
<FolderIcon className="text-gray-500 hover:text-blue-600" />

// Flex alignment
<FolderIcon className="flex-shrink-0" />  // Prevent icon from shrinking
```

---

## Icon Catalog

### Task Type Icons

| Type | Icon | Component | Color | Usage |
|------|------|-----------|-------|-------|
| Summary | 📁 | `FolderIcon` | `text-blue-600` | Parent/container tasks |
| Task | 📄 | `DocumentIcon` | `text-gray-500` | Regular tasks |
| Milestone | 🚩 | `FlagIcon` | `text-purple-600` | Zero-duration markers |

**Implementation:** See `src/components/TaskList/TaskTypeIcon.tsx`

### UI Control Icons

| Action | Icon | Component | Usage |
|--------|------|-----------|-------|
| Delete | 🗑️ | `TrashIcon` | Delete task button |
| Add | ➕ | `PlusIcon` | Add task/summary buttons |
| Edit | ✏️ | `PencilIcon` | Edit mode indicator |
| Drag Handle | ⋮⋮ | `Bars3Icon` | Drag and drop handle |
| Close | ✕ | `XMarkIcon` | Close modal/dialog |
| Menu | ≡ | `Bars3Icon` | Context menu trigger |
| Settings | ⚙️ | `Cog6ToothIcon` | Settings panel |
| Save | 💾 | `ArrowDownTrayIcon` | Save file |
| Open | 📂 | `FolderOpenIcon` | Open file |
| Export | 📤 | `ArrowUpTrayIcon` | Export chart |

### Status & Feedback Icons

| Status | Icon | Component | Usage |
|--------|------|-----------|-------|
| Info | ℹ️ | `InformationCircleIcon` | Info messages |
| Success | ✓ | `CheckCircleIcon` | Success messages |
| Warning | ⚠️ | `ExclamationTriangleIcon` | Warning messages |
| Error | ✕ | `XCircleIcon` | Error messages |
| Loading | ⟳ | Custom spinner | Loading state |

---

## Migration Plan

### Current State (Before Sprint 1.15)

Currently using **inline SVGs**:

```tsx
// ❌ Old: Inline SVG
<svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6..." />
</svg>

// ❌ Old: Delete button
<svg className="w-4 h-4" fill="none" stroke="currentColor" ...>
  <path strokeLinecap="round" ... d="M19 7l-.867 12.142..." />
</svg>
```

### After Migration (Sprint 1.15+)

Replace with **Heroicons**:

```tsx
// ✅ New: Heroicons
import { Bars3Icon, TrashIcon } from '@heroicons/react/24/outline';

// Drag handle
<Bars3Icon className="w-4 h-4 text-gray-400" />

// Delete button
<TrashIcon className="w-4 h-4 text-red-600" />
```

### Migration Tasks

**Phase 1 (Sprint 1.15):**
- [ ] Install Heroicons
- [ ] Create TaskTypeIcon component
- [ ] Add task type icons to TaskTableRow

**Phase 2 (Sprint 1.2):**
- [ ] Replace drag handle SVG with Bars3Icon
- [ ] Replace delete button SVG with TrashIcon
- [ ] Add other UI control icons as needed

**Phase 3 (Future Sprints):**
- [ ] Add toolbar icons (Add, Save, Open, Export)
- [ ] Add status/feedback icons for notifications
- [ ] Add context menu icons

---

## Best Practices

### 1. Consistent Sizing

Use standard sizes across the app:

```tsx
// ✅ Good: Consistent sizes
const ICON_SIZE_SM = "w-4 h-4";   // 16px - inline text
const ICON_SIZE_MD = "w-5 h-5";   // 20px - default (recommended)
const ICON_SIZE_LG = "w-6 h-6";   // 24px - emphasis

// ❌ Bad: Random sizes
<FolderIcon className="w-7 h-7" />
<DocumentIcon className="w-3 h-3" />
```

### 2. Semantic Colors

Match icon colors to their purpose:

```tsx
// ✅ Good: Semantic colors
<TrashIcon className="text-red-600" />      // Destructive action
<CheckIcon className="text-green-600" />    // Success
<ExclamationTriangleIcon className="text-yellow-600" /> // Warning

// ❌ Bad: Random colors
<TrashIcon className="text-pink-500" />
```

### 3. Accessibility

Always provide accessible labels:

```tsx
// ✅ Good: Accessible
<button aria-label="Delete task">
  <TrashIcon className="w-4 h-4" />
</button>

// ❌ Bad: No label
<button>
  <TrashIcon className="w-4 h-4" />
</button>
```

### 4. Flex Behavior

Prevent icons from shrinking in flex containers:

```tsx
// ✅ Good: flex-shrink-0
<div className="flex items-center gap-2">
  <FolderIcon className="w-5 h-5 flex-shrink-0" />
  <span className="truncate">Very long task name...</span>
</div>

// ❌ Bad: Icon gets squished
<div className="flex items-center gap-2">
  <FolderIcon className="w-5 h-5" />
  <span className="truncate">Very long task name...</span>
</div>
```

### 5. Import Strategy

Group imports by feature:

```tsx
// ✅ Good: Grouped imports
import {
  FolderIcon,
  DocumentIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

// ❌ Bad: Scattered imports
import { FolderIcon } from '@heroicons/react/24/outline';
// ... 50 lines later ...
import { DocumentIcon } from '@heroicons/react/24/outline';
```

---

## Alternatives Considered

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| **Heroicons** | Perfect Tailwind fit, lightweight, maintained | Limited icon set (200+) | ✅ **CHOSEN** |
| Lucide React | Huge icon set (1000+), popular | Not Tailwind-specific | ❌ Not needed |
| Phosphor Icons | Beautiful design, comprehensive | Larger bundle | ❌ Overkill |
| Tabler Icons | Clean design, many icons | Not React-first | ❌ Less convenient |
| Font Awesome | Industry standard, huge set | Heavy bundle, paid features | ❌ Too heavy |
| Custom SVGs | Full control | Inconsistent, maintenance burden | ❌ Not scalable |

**Conclusion:** Heroicons provides the best balance for a Tailwind-based React project.

---

## Future Considerations

### Custom Icons

If we need custom icons (e.g., Gantt-specific icons):

1. **Option A:** Create SVG components matching Heroicons style
   ```tsx
   // src/components/icons/GanttChartIcon.tsx
   export function GanttChartIcon({ className }: { className?: string }) {
     return (
       <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
       </svg>
     );
   }
   ```

2. **Option B:** Contribute to Heroicons
   - Submit PR to add new icons
   - Benefit entire community

### Icon Animations

For interactive icons (hover, active states):

```tsx
// Smooth transitions
<TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-600 transition-colors duration-200" />

// Scale on hover
<PlusIcon className="w-5 h-5 hover:scale-110 transition-transform" />
```

---

## Documentation Links

- **Heroicons Website:** https://heroicons.com/
- **GitHub Repository:** https://github.com/tailwindlabs/heroicons
- **Tailwind Labs:** https://tailwindcss.com/
- **Icon Browser:** https://heroicons.com/ (browse all icons)

---

## Related Documents

- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Overall tech stack
- [SPRINT_1.15_TASK_GROUPS.md](./SPRINT_1.15_TASK_GROUPS.md) - First usage of icon system
- [UI_STYLE_GUIDE.md](./UI_STYLE_GUIDE.md) - *(future)* Complete UI guidelines

---

**Status:** Ready for implementation in Sprint 1.15
**Next Steps:** Install Heroicons and create TaskTypeIcon component
