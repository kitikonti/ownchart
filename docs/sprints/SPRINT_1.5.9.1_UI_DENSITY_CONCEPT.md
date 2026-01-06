# Sprint 1.5.9.1: UI Density - Compact/Normal/Comfortable

**Sprint-ID:** 1.5.9.1
**Parent Sprint:** 1.5.9 (User Preferences & Settings Dialog)
**Version:** 1.1
**Erstellt:** 2026-01-05
**Abgeschlossen:** 2026-01-06
**Status:** ✅ Abgeschlossen

---

## 1. Executive Summary

### Ziel
Implementierung einer UI-Density-Einstellung mit drei Modi (Compact/Normal/Comfortable), die es Benutzern ermöglicht, die visuelle Dichte der Anwendung an ihre Bildschirmgröße und persönlichen Präferenzen anzupassen.

### Scope
- Drei Density-Modi mit unterschiedlichen Zeilenhöhen, Abständen und Schriftgrößen
- Einstellung als User Preference (localStorage)
- Sofortige Anwendung ohne Page Reload
- **Nur Task Table + Gantt Chart betroffen** - mehr Zeilen auf verfügbarem Raum

### Nicht betroffen (bleiben unverändert)
- **Toolbar** (AppToolbar) - fixe Höhe
- **Timeline Header** - fixe Höhe (48px)
- **Split Pane Divider** - fixe Breite
- **Dialoge** (Export, Preferences, etc.)
- **Help Panel / Welcome Tour**
- **Toasts / Notifications**

**Kernziel:** Maximierung der sichtbaren Task-Zeilen im verfügbaren vertikalen Raum.

### Aktueller Status
**Die aktuelle Implementierung verwendet "Comfortable" (44px Zeilen)** - dies wurde im Team als Startpunkt für die Analyse identifiziert.

### Konkreter Nutzen (Beispielrechnung)

**Annahme:** Viewport-Höhe 900px, Toolbar 60px, Timeline Header 48px
→ Verfügbarer Raum für Task-Zeilen: **792px**

| Modus | Row Height | Sichtbare Zeilen | Verbesserung vs. Comfortable |
|-------|-----------|------------------|------------------------------|
| Comfortable | 44px | 18 Zeilen | - |
| Normal | 36px | 22 Zeilen | +22% |
| **Compact** | 28px | **28 Zeilen** | **+56%** |

→ Mit Compact sieht man **10 zusätzliche Tasks** ohne zu scrollen!

---

## 2. Team-Diskussion

### 2.1 Teilnehmer
- **Product Owner (PO)**: Priorisierung und User Stories
- **Project Manager (PM)**: Timeline und Dependencies
- **UX/UI Designer**: Visuelle Spezifikationen
- **Frontend Developer**: Technische Machbarkeit
- **Data Visualization Specialist**: Chart-Integration
- **Backend Developer**: n/a (reine Frontend-Feature)
- **Software Architect**: Architektur-Review
- **DevOps Engineer**: Build/Test-Pipeline
- **QA Tester**: Teststrategien
- **Data Analyst**: Metriken und Analytics

### 2.2 Diskussion: Welcher Modus ist die aktuelle Ansicht?

**Analyse-Ergebnis (Frontend Developer):**

```
Aktuelle Werte im Code:
- Row Height: 44px (h-[44px] in Cell.tsx)
- Task Bar Height: 32px (timelineUtils.ts)
- Cell Padding: py-2 (8px) px-3 (12px)
- Header Padding: py-4 (16px)
- Timeline Row Height: 44px (getTaskBarGeometry)
```

**Vergleich mit UI/UX Spec (UI_UX_SPECIFICATIONS.md):**
- Compact: 28px rows
- Normal: 36px rows
- **Comfortable: 44px rows** ← CURRENT

**Team-Entscheidung:**
> "Die aktuelle Implementierung entspricht dem **Comfortable**-Modus. Dies war eine bewusste Design-Entscheidung für die MVP-Phase, um eine großzügige, gut lesbare UI zu gewährleisten. Für V1.1 fügen wir die anderen Modi hinzu."

### 2.3 Diskussion: Default-Modus für neue Benutzer

**UX/UI Designer:**
> "Normal sollte der Default sein - es ist der beste Kompromiss zwischen Informationsdichte und Lesbarkeit."

**Product Owner:**
> "Einverstanden. Comfortable war für MVP gut, aber Normal sollte der Standard für die breite Nutzerbasis sein."

**Data Analyst:**
> "Wir sollten Analytics einbauen, um zu sehen, welchen Modus die User bevorzugen. Das hilft bei zukünftigen Default-Entscheidungen."

**Team-Entscheidung:**
> Default-Modus: **Normal** (36px). Analytics-Event beim Ändern der Density-Einstellung (optional für V1.1).

---

## 3. Feature-Spezifikation

### 3.1 Density-Modi im Detail

| Eigenschaft | Compact | Normal | Comfortable |
|-------------|---------|--------|-------------|
| **Row Height** | 28px | 36px | 44px |
| **Task Bar Height** | 20px | 26px | 32px |
| **Task Bar Y-Offset** | 4px | 5px | 6px |
| **Cell Padding Y** | 4px (py-1) | 6px (py-1.5) | 8px (py-2) |
| **Cell Padding X** | 8px (px-2) | 10px (px-2.5) | 12px (px-3) |
| **Header Padding Y** | 8px (py-2) | 12px (py-3) | 16px (py-4) |
| **Font Size (cells)** | 12px | 13px | 14px |
| **Font Size (task bar)** | 10px | 11px | 12px |
| **Font Size (header)** | 10px | 11px | 12px |
| **Icon Size** | 14px | 16px | 18px |
| **Checkbox Size** | 14px | 16px | 18px |
| **Indent Size** | 16px | 18px | 20px |

### 3.2 CSS Custom Properties

```css
:root {
  /* Default: Normal */
  --density-row-height: 36px;
  --density-task-bar-height: 26px;
  --density-task-bar-offset: 5px;
  --density-cell-padding-y: 6px;
  --density-cell-padding-x: 10px;
  --density-header-padding-y: 12px;
  --density-font-size-cell: 13px;
  --density-font-size-bar: 11px;
  --density-font-size-header: 11px;
  --density-icon-size: 16px;
  --density-checkbox-size: 16px;
  --density-indent-size: 18px;
}

.density-compact {
  --density-row-height: 28px;
  --density-task-bar-height: 20px;
  --density-task-bar-offset: 4px;
  --density-cell-padding-y: 4px;
  --density-cell-padding-x: 8px;
  --density-header-padding-y: 8px;
  --density-font-size-cell: 12px;
  --density-font-size-bar: 10px;
  --density-font-size-header: 10px;
  --density-icon-size: 14px;
  --density-checkbox-size: 14px;
  --density-indent-size: 16px;
}

.density-comfortable {
  --density-row-height: 44px;
  --density-task-bar-height: 32px;
  --density-task-bar-offset: 6px;
  --density-cell-padding-y: 8px;
  --density-cell-padding-x: 12px;
  --density-header-padding-y: 16px;
  --density-font-size-cell: 14px;
  --density-font-size-bar: 12px;
  --density-font-size-header: 12px;
  --density-icon-size: 18px;
  --density-checkbox-size: 18px;
  --density-indent-size: 20px;
}
```

### 3.3 UI/UX Design

**Preferences Dialog (Ausschnitt):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Preferences                                              [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Appearance                                                     │
│  ─────────────────────────────────────────────                  │
│  Theme:              ○ Light  ○ Dark  ● System                  │
│                                                                 │
│  UI Density:         ○ Compact  ● Normal  ○ Comfortable         │
│                      ↳ Shows more tasks  ↳ Balanced  ↳ Easier to read
│                                                                 │
│  [Live Preview] ← Änderungen sofort sichtbar im Hintergrund     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                           [Cancel]  [Save]      │
└─────────────────────────────────────────────────────────────────┘
```

**Radio Button Group mit Beschreibungen:**
- **Compact**: "Shows more tasks on screen"
- **Normal**: "Balanced view (recommended)"
- **Comfortable**: "Easier to read, more spacing"

---

## 4. Technische Architektur

### 4.1 State Management

**userPreferencesSlice.ts (neu):**

```typescript
interface UserPreferences {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  firstDayOfWeek: 'sunday' | 'monday';
  theme: 'light' | 'dark' | 'system';
  uiDensity: 'compact' | 'normal' | 'comfortable';  // NEW
  defaultExportOptions: ExportOptions | null;
}

// Slice mit Zustand persist middleware
const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: getDefaultPreferences(),

      setUiDensity: (density: UiDensity) => {
        set((state) => ({
          preferences: { ...state.preferences, uiDensity: density }
        }));
        // CSS-Klasse auf <html> element setzen
        applyDensityClass(density);
      },
    }),
    {
      name: 'ownchart-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 4.2 CSS Application

**applyDensityClass Utility:**

```typescript
export function applyDensityClass(density: UiDensity): void {
  const html = document.documentElement;

  // Remove all density classes
  html.classList.remove('density-compact', 'density-normal', 'density-comfortable');

  // Apply new class (normal doesn't need a class - it's the default)
  if (density !== 'normal') {
    html.classList.add(`density-${density}`);
  }
}
```

### 4.3 Component Updates

**Betroffene Komponenten (nur Task-Zeilen):**

| Komponente | Änderungen |
|------------|------------|
| `Cell.tsx` | Row height, padding, font-size |
| `TaskTableRow.tsx` | Row height, indent-size |
| `TaskTableHeader.tsx` | **NICHT betroffen** - fixe Höhe bleibt |
| `TaskBar.tsx` | Bar height, y-position, font-size |
| `timelineUtils.ts` | `getTaskBarGeometry` mit dynamischer rowHeight |
| `NewTaskPlaceholderRow.tsx` | Row height |
| `GanttLayout.tsx` | Density-Config Provider |

**NICHT betroffene Komponenten:**

| Komponente | Grund |
|------------|-------|
| `AppToolbar.tsx` | App-Level UI, keine Zeilen |
| `TimelineHeader.tsx` | Fixe 48px für Lesbarkeit der Zeitskala |
| `SplitPane.tsx` / `SplitPaneDivider.tsx` | Layout-Container |
| `ExportDialog.tsx` / `Modal.tsx` | Dialog-UI |
| `HelpPanel.tsx` / `WelcomeTour.tsx` | Overlay-UI |
| `ZoomToolbar.tsx` / `ZoomIndicator.tsx` | Chart-Controls |

### 4.4 Gantt Chart Integration

**Problem:** `getTaskBarGeometry` ist eine Pure Function mit hardcoded `rowHeight = 44`.

**Lösung 1: Hook mit CSS Variable Reading (empfohlen):**

```typescript
function useDensityValues() {
  const [values, setValues] = useState(getDensityValues());

  useEffect(() => {
    // Re-read CSS vars when density changes
    const observer = new MutationObserver(() => {
      setValues(getDensityValues());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  return values;
}

function getDensityValues() {
  const style = getComputedStyle(document.documentElement);
  return {
    rowHeight: parseInt(style.getPropertyValue('--density-row-height')) || 36,
    taskBarHeight: parseInt(style.getPropertyValue('--density-task-bar-height')) || 26,
    taskBarOffset: parseInt(style.getPropertyValue('--density-task-bar-offset')) || 5,
  };
}
```

**Lösung 2: Zustand Store (alternative):**

```typescript
// In chartSlice oder userPreferencesSlice
const densityConfig = {
  compact: { rowHeight: 28, taskBarHeight: 20, taskBarOffset: 4 },
  normal: { rowHeight: 36, taskBarHeight: 26, taskBarOffset: 5 },
  comfortable: { rowHeight: 44, taskBarHeight: 32, taskBarOffset: 6 },
};
```

**Team-Entscheidung:** Lösung 2 (Zustand Store) für Performance, da keine DOM-Reads nötig sind.

---

## 5. Implementation Plan

### 5.1 Tasks Breakdown

| # | Task | Schätzung | Abhängigkeiten |
|---|------|-----------|----------------|
| 1 | CSS Custom Properties definieren | 1h | - |
| 2 | userPreferencesSlice erstellen | 2h | - |
| 3 | applyDensityClass Utility | 0.5h | #2 |
| 4 | Density Config in Store | 1h | #2 |
| 5 | Cell.tsx refactoring | 1.5h | #1, #4 |
| 6 | TaskTableRow.tsx refactoring | 1h | #1, #4 |
| 7 | TaskTableHeader.tsx refactoring | 0.5h | #1, #4 |
| 8 | NewTaskPlaceholderRow.tsx refactoring | 0.5h | #1, #4 |
| 9 | timelineUtils.ts anpassen | 1h | #4 |
| 10 | TaskBar.tsx refactoring | 1h | #4, #9 |
| 11 | ChartCanvas.tsx integration | 1h | #9, #10 |
| 12 | Preferences Dialog Component | 2h | #2 |
| 13 | Density Radio Group UI | 1h | #12 |
| 14 | Integration & Testing | 2h | alle |
| 15 | Unit Tests | 2h | alle |
| 16 | E2E Tests | 1h | alle |
| **Total** | | **~18h** | |

### 5.2 Implementation Order

```
Phase 1: Foundation (4h)
├── #1 CSS Custom Properties
├── #2 userPreferencesSlice
├── #3 applyDensityClass
└── #4 Density Config

Phase 2: Component Refactoring (6h)
├── #5 Cell.tsx
├── #6 TaskTableRow.tsx
├── #7 TaskTableHeader.tsx
├── #8 NewTaskPlaceholderRow.tsx
├── #9 timelineUtils.ts
├── #10 TaskBar.tsx
└── #11 ChartCanvas.tsx

Phase 3: UI & Testing (8h)
├── #12 Preferences Dialog
├── #13 Density Radio Group
├── #14 Integration Testing
├── #15 Unit Tests
└── #16 E2E Tests
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
describe('UI Density', () => {
  describe('userPreferencesSlice', () => {
    it('should default to normal density', () => {
      const { preferences } = useUserPreferencesStore.getState();
      expect(preferences.uiDensity).toBe('normal');
    });

    it('should persist density to localStorage', () => {
      const { setUiDensity } = useUserPreferencesStore.getState();
      setUiDensity('compact');

      const stored = JSON.parse(localStorage.getItem('ownchart-preferences')!);
      expect(stored.state.preferences.uiDensity).toBe('compact');
    });

    it('should apply CSS class to document', () => {
      const { setUiDensity } = useUserPreferencesStore.getState();
      setUiDensity('comfortable');

      expect(document.documentElement.classList.contains('density-comfortable')).toBe(true);
    });
  });

  describe('Density Config', () => {
    it.each([
      ['compact', 28],
      ['normal', 36],
      ['comfortable', 44],
    ])('%s density has row height %ipx', (density, expectedHeight) => {
      expect(DENSITY_CONFIG[density].rowHeight).toBe(expectedHeight);
    });
  });

  describe('getTaskBarGeometry', () => {
    it('should use density-specific row height', () => {
      const geometry = getTaskBarGeometry(mockTask, mockScale, 0, 28, 0);
      expect(geometry.y).toBe(4); // compact offset
    });
  });
});
```

### 6.2 E2E Tests

```typescript
test('UI Density switching', async ({ page }) => {
  // Open preferences
  await page.click('[aria-label="Preferences"]');

  // Select compact mode
  await page.click('input[value="compact"]');

  // Verify visual change
  const row = page.locator('.task-table-row').first();
  await expect(row).toHaveCSS('height', '28px');

  // Verify persistence
  await page.reload();
  const density = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ownchart-preferences')!).state.preferences.uiDensity
  );
  expect(density).toBe('compact');
});
```

### 6.3 Visual Regression Tests

- Screenshot-Vergleiche für alle drei Modi
- Verschiedene Task-Anzahlen (5, 20, 50 Tasks)
- Verschiedene Viewport-Größen (1280px, 1920px)

---

## 7. Migration Plan

### 7.1 Breaking Changes

**Aktuelle → Neue Defaults:**
- Row Height: 44px → 36px (Normal)
- Task Bar Height: 32px → 26px
- Diverse Padding-Werte

### 7.2 Migration für bestehende User

```typescript
// In userPreferencesSlice initialization
function migratePreferences(stored: unknown): UserPreferences {
  // V1.0 users have no uiDensity preference
  if (!stored?.uiDensity) {
    // Keep their current experience (comfortable)
    return { ...DEFAULT_PREFERENCES, uiDensity: 'comfortable' };
  }
  return stored as UserPreferences;
}
```

**Team-Entscheidung:**
> Bestehende User (vor V1.1) erhalten automatisch "Comfortable" als Migrationswert, um ihr gewohntes UI beizubehalten. Neue User erhalten "Normal" als Default.

---

## 8. Accessibility Considerations

### 8.1 WCAG Compliance

| Kriterium | Anforderung | Implementation |
|-----------|-------------|----------------|
| 1.4.4 Resize Text | Text auf 200% skalierbar | Font-sizes in rem, nicht px |
| 1.4.10 Reflow | Kein horizontaler Scroll bei 320px | n/a (min 1280px supported) |
| 2.5.5 Target Size | Min 44x44px touch targets | Comfortable erfüllt, Compact mit Warnung |

### 8.2 Compact Mode Warning

**UX Designer:**
> "Compact Mode kann für Touch-User problematisch sein. Wir sollten einen Hinweis anzeigen."

**Implementation:**
```tsx
{density === 'compact' && isTouchDevice && (
  <p className="text-xs text-amber-600 mt-1">
    Compact mode may be difficult to use on touch devices.
  </p>
)}
```

---

## 9. Analytics & Success Metrics

### 9.1 Tracking Events (optional für V1.1)

```typescript
// Event: density_changed
{
  event: 'density_changed',
  previous_density: 'normal',
  new_density: 'compact',
  trigger: 'preferences_dialog'
}
```

### 9.2 Success Criteria

| Metrik | Ziel | Messung |
|--------|------|---------|
| Feature Adoption | >20% nutzen nicht-default | Analytics |
| Setting Retention | >90% behalten gewählte Einstellung | Analytics |
| Support Tickets | 0 kritische Bugs | Support Dashboard |
| Performance | <50ms Umschaltzeit | Lighthouse |

---

## 10. Risiken & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Layout-Bugs bei Mode-Wechsel | Mittel | Mittel | Umfangreiche Tests, CSS var Fallbacks |
| Performance bei vielen Tasks | Niedrig | Hoch | CSS-only Changes, kein Re-render |
| Inkonsistenz Task Table ↔ Chart | Mittel | Hoch | Shared Config, Integration Tests |
| User Confusion | Niedrig | Niedrig | Klare Labels, Live Preview |

---

## 11. Abnahmekriterien

### 11.1 Definition of Done

- [ ] Alle drei Density-Modi implementiert (Compact/Normal/Comfortable)
- [ ] Preferences Dialog mit Radio-Button-Gruppe
- [ ] Live Preview beim Umschalten
- [ ] Persistenz in localStorage
- [ ] Task Table Zeilen passen sich an (Zeilenhöhe, Padding, Font)
- [ ] Gantt Chart Zeilen passen sich an (Task Bar Position/Größe)
- [ ] Synchronisierte Darstellung (Table Row Height = Chart Row Height)
- [ ] **Toolbar, Timeline Header, Dialoge UNVERÄNDERT**
- [ ] Migration für bestehende User (→ Comfortable)
- [ ] Default für neue User (→ Normal)
- [ ] Unit Tests (>90% Coverage für neue Module)
- [ ] E2E Tests (Switching, Persistence)
- [ ] Accessibility: Touch-Warnung für Compact
- [ ] Performance: <50ms Umschaltzeit
- [ ] Dokumentation aktualisiert

### 11.2 Demo Checklist

1. Neuer User → Normal als Default
2. Preferences öffnen → Radio Group sichtbar
3. Compact wählen → Sofortige UI-Änderung
4. Browser schließen/öffnen → Einstellung erhalten
5. Bestehende .ownchart-Datei öffnen → Korrekte Darstellung
6. 50 Tasks → Performance akzeptabel in allen Modi

---

## 12. Appendix

### A. Referenz-Implementierungen

- **MS Project**: View → Zoom → Timeline Options
- **SVAR React Gantt**: Keine UI Density, fixe Größen
- **Notion**: Compact/Comfortable Toggle in Database Views
- **VS Code**: Editor: Font Size + Line Height

### B. Related Documents

- [SETTINGS_ARCHITECTURE.md](../architecture/SETTINGS_ARCHITECTURE.md)
- [UI_UX_SPECIFICATIONS.md](../design/UI_UX_SPECIFICATIONS.md)
- [USER_STORIES.md](../planning/USER_STORIES.md) - Story 5.6
- [ROADMAP.md](../planning/ROADMAP.md) - Sprint 1.5.9

### C. Open Questions (Resolved)

| Frage | Entscheidung |
|-------|--------------|
| Welcher Modus ist aktuell? | Comfortable (44px) |
| Was ist der Default für neue User? | Normal (36px) |
| Migration für bestehende User? | Auto-set zu Comfortable |
| CSS vars oder Store? | Store (Performance) |
| Touch-Warnung für Compact? | Ja, als Info-Text |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Authors:** OwnChart Development Team
**Status:** Ready for Implementation
