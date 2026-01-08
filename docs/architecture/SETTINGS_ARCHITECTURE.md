# Settings Architecture

## Overview

This document defines the settings storage architecture for OwnChart, based on a team discussion (2026-01-05) that analyzed user personas, future features, and industry best practices.

**Key Decision:** Two-tier system with clear separation - NO override logic needed.

---

## Storage Locations

### 1. User Preferences (localStorage)

**Storage Key:** `ownchart-preferences`

**Purpose:** Personal settings that apply across ALL projects. These never change per-project.

**UI Access:** Menu → "Preferences..." dialog

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `dateFormat` | `'DD/MM/YYYY' \| 'MM/DD/YYYY' \| 'YYYY-MM-DD'` | Browser locale | Cultural preference |
| `firstDayOfWeek` | `'sunday' \| 'monday'` | Browser locale | Cultural preference |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Personal preference |
| `uiDensity` | `'compact' \| 'normal' \| 'comfortable'` | `'normal'` | Personal preference |
| `language` | `string` (ISO code) | Browser locale | V2.0 feature |

### 2. Project Settings (in .ownchart file)

**Storage:** Embedded in project file under `chart.viewSettings`

**Purpose:** Project-specific state that should be portable when sharing files.

**UI Access:** Toolbar toggles, direct interaction

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `zoom` | `number` | `1.0` | Timeline zoom level |
| `panOffset` | `{x: number, y: number}` | `{x: 0, y: 0}` | Scroll position |
| `showWeekends` | `boolean` | `true` | Weekend highlighting |
| `showTodayMarker` | `boolean` | `true` | Today line |
| `taskTableWidth` | `number \| null` | `null` | Left panel width |
| `columnWidths` | `Record<string, number>` | `{}` | Individual column widths |
| `exportSettings` | `ExportSettings` | `null` | Last used export options for THIS project |

**Export Settings Structure:**
```typescript
interface ExportSettings {
  lastFormat: 'png' | 'pdf' | 'svg';
  png?: PngExportOptions;
  pdf?: PdfExportOptions;
  svg?: SvgExportOptions;
}
```

---

## Why This Architecture?

### User Persona Analysis

| Persona | Key Insight |
|---------|-------------|
| **Sarah (Designer)** | Shares projects with clients - project must look identical when opened |
| **Mike (Business Owner)** | Wants simplicity - one place for settings, not two |
| **Emma (Student)** | Knows VS Code pattern but prefers simplicity for MVP |
| **David (Consultant)** | Shares projects but always exports the same way personally |

### Key Findings

1. **Date Format, First Day of Week, Theme, UI Density** → Always User-Pref
   - These are cultural/personal, never project-specific

2. **Show Weekends, Show Today Marker, Zoom** → Always Project
   - David shares projects; they must be portable

3. **Export Options** → Project-only
   - Stored in project file
   - No user-level defaults needed
   - Simple: use project settings or dialog defaults

### Industry Patterns Reviewed

| App | Pattern | Our Approach |
|-----|---------|--------------|
| MS Project | Two separate dialogs | Similar - Preferences vs Toolbar |
| VS Code | User + Workspace with indicators | Simpler - no overlap, no indicators needed |
| Figma | Account + File Settings | Similar philosophy |

---

## Implementation Guide

### Phase 1: MVP (Current)

**No changes needed.** Current implementation works:
- View settings in project file
- Welcome/tour flags in localStorage
- Multi-tab state in localStorage

### Phase 2: V1.1 (When Date Format/UI Density is added)

1. **Create `userPreferencesSlice.ts`:**

```typescript
interface UserPreferences {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  firstDayOfWeek: 'sunday' | 'monday';
  theme: 'light' | 'dark' | 'system';
  uiDensity: 'compact' | 'normal' | 'comfortable';
}

const STORAGE_KEY = 'ownchart-preferences';

const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: getDefaultPreferences(),

      setDateFormat: (format) => set((state) => ({
        preferences: { ...state.preferences, dateFormat: format }
      })),

      // ... other setters
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

2. **Create Preferences Dialog Component:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Preferences                                              [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Regional                                                       │
│  ─────────────────────────────────────────────                  │
│  Date Format:        [DD/MM/YYYY ▼]                             │
│  First Day of Week:  [Monday ▼]                                 │
│                                                                 │
│  Appearance                                                     │
│  ─────────────────────────────────────────────                  │
│  Theme:              ○ Light  ○ Dark  ● System                  │
│  UI Density:         ○ Compact  ● Normal  ○ Comfortable         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                           [Cancel]  [Save]      │
└─────────────────────────────────────────────────────────────────┘
```

3. **Add Menu Item:**

```typescript
// In FileMenu or new SettingsMenu
<MenuItem onClick={openPreferencesDialog}>
  Preferences...
  <span className="text-gray-400 ml-auto">Ctrl+,</span>
</MenuItem>
```

### Phase 3: V2.0 (Theme & Language)

1. Add `language` to UserPreferences
2. Implement theme switching (CSS variables or Tailwind dark mode)
3. Add i18n infrastructure

---

## Data Flow

### Loading a Project

```
1. App starts
   └─> Load User Preferences from localStorage
   └─> Apply theme, date format, UI density globally

2. User opens .ownchart file
   └─> Load project settings from file
   └─> Apply showWeekends, showTodayMarker, zoom, pan
   └─> Task table renders with file's column widths

3. User exports
   └─> Check: Does project have exportSettings?
       ├─> Yes: Use project's export settings as initial values
       └─> No: Use dialog defaults
```

### Saving a Project

```
1. User clicks Save
   └─> Serialize current view state to file:
       - zoom, panOffset
       - showWeekends, showTodayMarker
       - columnWidths, taskTableWidth
       - exportSettings (if user exported during this session)

   └─> User Preferences are NOT saved to file!
```

---

## Migration Notes

### From MVP to V1.1

No migration needed for existing files. User Preferences are new localStorage data.

### Detecting Locale Defaults

```typescript
function getDefaultPreferences(): UserPreferences {
  const locale = navigator.language;

  return {
    dateFormat: locale.startsWith('en-US') ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
    firstDayOfWeek: ['en-US', 'en-CA', 'ja', 'ko'].some(l => locale.startsWith(l))
      ? 'sunday'
      : 'monday',
    theme: 'system',
    uiDensity: 'normal',
  };
}
```

---

## What NOT to Do

1. **No Override Logic:** User Prefs and Project Settings are separate domains. No "file overrides user pref" complexity.

2. **No "Sync Settings to File":** User preferences never get saved into project files.

3. **No Per-Project Theme:** Theme is always global. If users want project-specific colors, that's a future "Color Theme for Tasks" feature, not app theme.

4. **No Settings Indicators:** Unlike VS Code, we don't show "this setting comes from X". Keep it simple.

---

## Open Questions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Where does Color Theme go? | User-Pref | Mike (low-tech) would be confused by per-project themes |
| Where does showWeekends go? | Project | David shares projects; must be portable |
| Do we need override logic? | No | Clear separation eliminates need for override |
| Separate Settings dialog? | Yes, for V1.1 | When Date Format / UI Density is added |

---

## Related Documents

- [DATA_MODEL.md](./DATA_MODEL.md) - File format and `viewSettings` structure
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - State management with Zustand
- [User Stories](../planning/USER_STORIES.md) - Stories 5.6-5.11 for settings features
- [Roadmap](../planning/ROADMAP.md) - V1.1 sprints for settings implementation
- [Sprint 1.5.5 PDF Export](../sprints/SPRINT_1.5.5_PDF_EXPORT_CONCEPT.md) - PDF/SVG export settings structure

---

**Document Version:** 1.1
**Created:** 2026-01-05
**Updated:** 2026-01-08
**Status:** Approved for V1.1 implementation
**Decision Makers:** Team discussion with user persona validation

**Changelog:**
- v1.1 (2026-01-08): Removed "Save as default" pattern, updated export settings structure for PNG/PDF/SVG
