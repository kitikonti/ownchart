# Code Review Progress — OwnChart

> Systematic, file-by-file code review tracking document (Issue #44).
> 193 source files / ~37,000 LOC (excluding font data files).

## Git Worktree Setup (vor dem ersten Review)

```bash
# Worktree erstellen
git worktree add ../app-gantt-review cleanup/code-review

# In den Worktree wechseln
cd ../app-gantt-review
```

Alle Review-Arbeiten passieren im Worktree. Der `main`-Branch bleibt sauber.
Etappenweise in `main` mergen (z.B. nach jeder Priority-Gruppe oder thematisch zusammenhaengenden Fixes).

### Etappenweises Mergen
```bash
# Im Hauptprojekt
cd ../app-gantt
git merge cleanup/code-review
git push

# Danach im Worktree weiterarbeiten
cd ../app-gantt-review
```

## Workflow

### Eine Datei reviewen
1. Neue Session im Worktree-Verzeichnis starten
2. CODE_REVIEW.md lesen (Cross-Cutting Concerns + Decisions beachten)
3. `/review src/path/to/file.ts` ausfuehren (Full Review)
   - Oder `/review <category> src/path/to/file.ts` fuer fokussiertes Review
4. Findings lesen, Fixes implementieren
5. `npm run ci:local` — Tests muessen gruen sein
6. Atomic Commit(s) mit Conventional Commits
7. CODE_REVIEW.md aktualisieren:
   - Checkbox abhaken + Kurzfassung in der Index-Zeile (1 Zeile)
   - Neue Cross-Cutting Concerns ergaenzen (Patterns die mehrere Dateien betreffen)
   - Neue Decisions ergaenzen (Praezedenzfaelle fuer zukuenftige Reviews)
   - **KEINE Detail-Findings pro Datei** — die sind in der Git-History

### Mehrere Dateien in einer Session
- `/review src/file1.ts src/file2.ts` fuer zusammenhaengende Dateien
- Sinnvoll bei kleinen Dateien im gleichen Verzeichnis

### Kategorien fuer fokussiertes Review
- `/review architecture` — Architektur & Design Patterns
- `/review code-quality` — TypeScript Strict, Code Smells, Dead Code
- `/review refactoring` — Hardcoded Values, DRY, Extraktion
- `/review security` — Input Validation, XSS, Lizenzen, GDPR
- `/review performance` — React Performance, Algorithmen, Bundle Size
- `/review a11y` — Semantisches HTML, Keyboard, Screen Reader
- `/review testing` — Coverage, Error Handling, Best Practices
- `/review docs` — Kommentare, Naming, Help Content
- `/review ownchart` — Zustand Patterns, File Format, Undo/Redo

---

## File Review Index

### Already reviewed (9 Dateien)
- [x] `src/store/slices/taskSlice.ts`
- [x] `src/store/slices/groupingActions.ts`
- [x] `src/store/slices/indentOutdentActions.ts`
- [x] `src/store/slices/insertionActions.ts`
- [x] `src/store/slices/taskSliceHelpers.ts`
- [x] `src/store/slices/columnActions.ts`
- [x] `src/store/slices/expansionActions.ts`
- [x] `src/store/slices/selectionActions.ts`
- [x] `src/store/slices/historySlice.ts`

### Priority: HIGH — Store Slices (Kern-Zustandslogik)
- [x] `src/store/slices/chartSlice.ts` (984 LOC) — Spread→Object.assign (5×), magic numbers→constants, SettableViewFields type, console.error entfernt, +34 neue Tests
- [x] `src/store/slices/clipboardSlice.ts` (552 LOC) — Redundanten null-Check in canPasteCell entfernt, fehlenden Test fuer pasteCell-Guard ergaenzt
- [ ] `src/store/slices/dependencySlice.ts` (341 LOC)
- [ ] `src/store/slices/uiSlice.ts` (279 LOC)
- [ ] `src/store/slices/userPreferencesSlice.ts` (274 LOC)
- [ ] `src/store/slices/fileSlice.ts` (82 LOC)

### Priority: HIGH — Core Types & Config
- [ ] `src/types/command.types.ts` (~250 LOC)
- [ ] `src/types/preferences.types.ts` (196 LOC)
- [ ] `src/types/dependency.types.ts` (100 LOC)
- [ ] `src/types/colorMode.types.ts` (84 LOC)
- [ ] `src/types/chart.types.ts` (59 LOC)
- [ ] `src/types/launchQueue.d.ts` (12 LOC)
- [ ] `src/config/tableColumns.ts` (221 LOC)
- [ ] `src/styles/design-tokens.ts` (231 LOC)

### Priority: HIGH — File Operations (kritischer Pfad)
- [ ] `src/utils/fileOperations/validate.ts` (299 LOC)
- [ ] `src/utils/fileOperations/deserialize.ts` (233 LOC)
- [ ] `src/utils/fileOperations/fileDialog.ts` (215 LOC)
- [ ] `src/utils/fileOperations/types.ts` (192 LOC)
- [ ] `src/utils/fileOperations/serialize.ts` (159 LOC)
- [ ] `src/utils/fileOperations/loadFromFile.ts` (115 LOC)
- [ ] `src/utils/fileOperations/migrate.ts` (102 LOC)
- [ ] `src/utils/fileOperations/sanitize.ts` (79 LOC)
- [ ] `src/utils/fileOperations/index.ts` (12 LOC)

### Priority: MEDIUM — GanttChart Komponenten
- [ ] `src/components/GanttChart/TaskBar.tsx` (573 LOC) — 6 Hex-Werte
- [ ] `src/components/GanttChart/ChartCanvas.tsx` (466 LOC)
- [ ] `src/components/GanttChart/GridLines.tsx` (267 LOC) — 5 Hex-Werte
- [ ] `src/components/GanttChart/TimelineHeader.tsx` (263 LOC) — 3 Hex-Werte
- [ ] `src/components/GanttChart/ConnectionHandles.tsx` (192 LOC) — 8 Hex-Werte
- [ ] `src/components/GanttChart/DependencyArrows.tsx` (173 LOC)
- [ ] `src/components/GanttChart/DependencyArrow.tsx` (120 LOC) — 2 Hex-Werte
- [ ] `src/components/GanttChart/DependencyDragPreview.tsx` (59 LOC) — 1 Hex-Wert
- [ ] `src/components/GanttChart/SelectionHighlight.tsx` (53 LOC)
- [ ] `src/components/GanttChart/TodayMarker.tsx` (41 LOC)
- [ ] `src/components/GanttChart/index.ts` (10 LOC)

### Priority: MEDIUM — TaskList Komponenten
- [ ] `src/components/TaskList/Cell.tsx` (496 LOC) — 1 Hex-Wert (BRAND_COLOR)
- [ ] `src/components/TaskList/CellEditors/ColorPickerPopover.tsx` (452 LOC) — 2 Hex-Werte
- [ ] `src/components/TaskList/RowNumberCell.tsx` (399 LOC) — 6 Hex-Werte
- [ ] `src/components/TaskList/TaskTable.tsx` (339 LOC)
- [ ] `src/components/TaskList/TaskDataCells.tsx` (333 LOC)
- [ ] `src/components/TaskList/NewTaskPlaceholderRow.tsx` (315 LOC) — 4 Hex-Werte
- [ ] `src/components/TaskList/TaskTableRow.tsx` (261 LOC)
- [ ] `src/components/TaskList/TaskTableHeader.tsx` (176 LOC)
- [ ] `src/components/TaskList/HiddenRowIndicator.tsx` (138 LOC)
- [ ] `src/components/TaskList/ColumnResizer.tsx` (133 LOC)
- [ ] `src/components/TaskList/CellEditors/ColorCellEditor.tsx` (130 LOC)
- [ ] `src/components/TaskList/TaskTypeIcon.tsx` (62 LOC)

### Priority: MEDIUM — Layout & Export
- [ ] `src/components/Export/ExportRenderer.tsx` (655 LOC) — 1 Hex-Wert
- [ ] `src/components/Layout/GanttLayout.tsx` (549 LOC)
- [ ] `src/components/Export/ExportDialog.tsx` (505 LOC)
- [ ] `src/components/Export/PdfPreview.tsx` (348 LOC)
- [ ] `src/components/Export/PdfExportOptions.tsx` (338 LOC)
- [ ] `src/components/Export/SharedExportOptions.tsx` (273 LOC)
- [ ] `src/components/Export/ZoomModeSelector.tsx` (255 LOC)
- [ ] `src/components/Export/ChartPreview.tsx` (212 LOC) — 1 Hex-Wert
- [ ] `src/components/Layout/SplitPane.tsx` (186 LOC)
- [ ] `src/components/Export/ExportFormatSelector.tsx` (105 LOC)
- [ ] `src/components/Layout/SplitPaneDivider.tsx` (85 LOC)
- [ ] `src/components/Export/ExportPreview.tsx` (71 LOC)
- [ ] `src/components/Export/PngScaleOptions.tsx` (33 LOC)
- [ ] `src/components/Export/SvgExportOptions.tsx` (22 LOC)
- [ ] `src/components/Export/index.ts` (19 LOC)
- [ ] `src/components/Layout/index.ts` (1 LOC)

### Priority: MEDIUM — Ribbon
- [ ] `src/components/Ribbon/ColorDropdown.tsx` (500 LOC)
- [ ] `src/components/Ribbon/HomeTabContent.tsx` (291 LOC)
- [ ] `src/components/Ribbon/ViewTabContent.tsx` (219 LOC)
- [ ] `src/components/Ribbon/Ribbon.tsx` (218 LOC) — 2 Hex-Werte
- [ ] `src/components/Ribbon/HolidayRegionPopover.tsx` (158 LOC)
- [ ] `src/components/Ribbon/ZoomDropdown.tsx` (138 LOC)
- [ ] `src/components/Ribbon/FormatTabContent.tsx` (135 LOC)
- [ ] `src/components/Ribbon/WorkingDaysDropdown.tsx` (125 LOC)
- [ ] `src/components/Ribbon/InlineProjectTitle.tsx` (99 LOC)
- [ ] `src/components/Ribbon/FileMenu.tsx` (88 LOC)
- [ ] `src/components/Ribbon/RibbonCollapseContext.tsx` (34 LOC)
- [ ] `src/components/Ribbon/index.ts` (1 LOC)

### Priority: MEDIUM — Hooks
- [ ] `src/hooks/useTaskBarInteraction.ts` (478 LOC)
- [ ] `src/hooks/useKeyboardShortcuts.ts` (406 LOC)
- [ ] `src/hooks/useComputedTaskColor.ts` (393 LOC)
- [ ] `src/hooks/useExportPreview.ts` (349 LOC)
- [ ] `src/hooks/useHeaderDateSelection.ts` (269 LOC)
- [ ] `src/hooks/useMultiTabPersistence.ts` (265 LOC)
- [ ] `src/hooks/useDependencyDrag.ts` (261 LOC)
- [ ] `src/hooks/useFileOperations.ts` (250 LOC)
- [ ] `src/hooks/useMarqueeSelection.ts` (249 LOC)
- [ ] `src/hooks/useClipboardOperations.ts` (235 LOC)
- [ ] `src/hooks/contextMenuItemBuilders.ts` (230 LOC)
- [ ] `src/hooks/useZoom.ts` (217 LOC)
- [ ] `src/hooks/useFullTaskContextMenuItems.ts` (200 LOC)
- [ ] `src/hooks/useHideOperations.ts` (173 LOC)
- [ ] `src/hooks/useLocalStoragePersistence.ts` (158 LOC)
- [ ] `src/hooks/useTableHeaderContextMenu.ts` (134 LOC)
- [ ] `src/hooks/useTimelineAreaContextMenu.ts` (124 LOC)
- [ ] `src/hooks/useProgressDrag.ts` (117 LOC)
- [ ] `src/hooks/useRibbonCollapse.ts` (111 LOC)
- [ ] `src/hooks/useDropdown.ts` (110 LOC)
- [ ] `src/hooks/useAutoColumnWidth.ts` (82 LOC)
- [ ] `src/hooks/useHelpSearch.ts` (74 LOC)
- [ ] `src/hooks/useCellNavigation.ts` (70 LOC)
- [ ] `src/hooks/useDeviceDetection.ts` (63 LOC)
- [ ] `src/hooks/useProjectColors.ts` (62 LOC)
- [ ] `src/hooks/useTaskTableRowContextMenu.ts` (61 LOC)
- [ ] `src/hooks/useTimelineBarContextMenu.ts` (61 LOC)
- [ ] `src/hooks/useFlattenedTasks.ts` (57 LOC)
- [ ] `src/hooks/useTableDimensions.ts` (55 LOC)
- [ ] `src/hooks/useLaunchQueue.ts` (31 LOC)
- [ ] `src/hooks/useDocumentTitle.ts` (26 LOC)
- [ ] `src/hooks/useUnsavedChanges.ts` (25 LOC)

### Priority: MEDIUM — Utils
- [ ] `src/utils/colorPalettes.ts` (540 LOC) — Datendatei
- [ ] `src/utils/hierarchy.ts` (430 LOC)
- [ ] `src/utils/timelineUtils.ts` (424 LOC)
- [ ] `src/utils/colorUtils.ts` (332 LOC)
- [ ] `src/utils/multiTabStorage.ts` (318 LOC)
- [ ] `src/utils/validation.ts` (236 LOC)
- [ ] `src/utils/textMeasurement.ts` (217 LOC)
- [ ] `src/utils/workingDaysCalculator.ts` (208 LOC)
- [ ] `src/utils/localeDetection.ts` (183 LOC)
- [ ] `src/utils/dateUtils.ts` (123 LOC)
- [ ] `src/utils/dragValidation.ts` (67 LOC)
- [ ] `src/utils/svgUtils.ts` (21 LOC)

### Priority: MEDIUM — Clipboard Utils
- [ ] `src/utils/clipboard/systemClipboard.ts` (165 LOC)
- [ ] `src/utils/clipboard/validation.ts` (87 LOC)
- [ ] `src/utils/clipboard/collectTasks.ts` (76 LOC)
- [ ] `src/utils/clipboard/insertPosition.ts` (69 LOC)
- [ ] `src/utils/clipboard/remapIds.ts` (66 LOC)
- [ ] `src/utils/clipboard/collectDependencies.ts` (26 LOC)
- [ ] `src/utils/clipboard/index.ts` (26 LOC)

### Priority: MEDIUM — Graph Utils
- [ ] `src/utils/arrowPath/bezierPath.ts` (341 LOC)
- [ ] `src/utils/graph/topologicalSort.ts` (154 LOC)
- [ ] `src/utils/graph/cycleDetection.ts` (115 LOC)
- [ ] `src/utils/arrowPath/index.ts` (10 LOC)
- [ ] `src/utils/graph/index.ts` (12 LOC)

### Priority: MEDIUM — Export Utils
- [ ] `src/utils/export/pdfExport.ts` (518 LOC)
- [ ] `src/utils/export/taskTableRenderer.ts` (421 LOC)
- [ ] `src/utils/export/svgExport.ts` (378 LOC)
- [ ] `src/utils/export/renderConstants.ts` (373 LOC)
- [ ] `src/utils/export/types.ts` (344 LOC)
- [ ] `src/utils/export/pdfLayout.ts` (317 LOC)
- [ ] `src/utils/export/calculations.ts` (294 LOC)
- [ ] `src/utils/export/captureChart.ts` (171 LOC)
- [ ] `src/utils/export/helpers.ts` (156 LOC)
- [ ] `src/utils/export/index.ts` (110 LOC)
- [ ] `src/utils/export/downloadPng.ts` (75 LOC)
- [ ] `src/utils/export/dpi.ts` (67 LOC)
- [ ] `src/utils/export/constants.ts` (60 LOC)
- [ ] `src/utils/export/sanitizeFilename.ts` (36 LOC)
- [ ] `src/utils/export/interFont.ts` (27 LOC)
- SKIP `src/utils/export/fonts/inter*FontData.ts` — base64 Daten, NICHT OEFFNEN

### Priority: LOW — UI Components
- [ ] `src/components/Toolbar/ToolbarPrimitives.tsx` (254 LOC)
- [ ] `src/components/StatusBar/StatusBar.tsx` (201 LOC)
- [ ] `src/components/ContextMenu/ContextMenu.tsx` (198 LOC)
- [ ] `src/components/common/Modal.tsx` (192 LOC)
- [ ] `src/components/Help/HelpDialog.tsx` (131 LOC)
- [ ] `src/components/Help/WelcomeTour.tsx` (128 LOC)
- [ ] `src/components/Help/AboutDialog.tsx` (127 LOC)
- [ ] `src/components/common/Button.tsx` (124 LOC)
- [ ] `src/components/StatusBar/ZoomDialog.tsx` (113 LOC)
- [ ] `src/components/Toolbar/DropdownItem.tsx` (110 LOC)
- [ ] `src/components/Help/HelpTopicCard.tsx` (99 LOC)
- [ ] `src/components/Toolbar/DropdownTrigger.tsx` (92 LOC)
- [ ] `src/components/Toolbar/ToolbarDropdown.tsx` (88 LOC)
- [ ] `src/components/common/Alert.tsx` (84 LOC)
- [ ] `src/components/Help/GettingStartedTab.tsx` (80 LOC)
- [ ] `src/components/Help/HelpSectionList.tsx` (80 LOC)
- [ ] `src/components/common/RadioOptionCard.tsx` (75 LOC)
- [ ] `src/components/common/Radio.tsx` (72 LOC)
- [ ] `src/components/common/Checkbox.tsx` (68 LOC)
- [ ] `src/components/MobileBlockScreen.tsx` (62 LOC)
- [ ] `src/components/Toolbar/DropdownPanel.tsx` (62 LOC)
- [ ] `src/components/common/LabeledCheckbox.tsx` (61 LOC)
- [ ] `src/components/common/Input.tsx` (61 LOC)
- [ ] `src/components/common/SectionHeader.tsx` (56 LOC)
- [ ] `src/components/Help/HelpSearchInput.tsx` (55 LOC)
- [ ] `src/components/common/Select.tsx` (50 LOC)
- [ ] `src/components/common/CollapsibleSection.tsx` (48 LOC)
- [ ] `src/components/common/CheckboxGroup.tsx` (43 LOC)
- [ ] `src/components/Help/index.ts` (7 LOC)
- [ ] `src/components/common/index.ts` (5 LOC)
- [ ] `src/components/StatusBar/index.ts` (2 LOC)

### Priority: LOW — Config & Services
- [ ] `src/config/helpContent.ts` (1109 LOC) — Datendatei
- [ ] `src/services/holidayService.ts` (209 LOC)
- [ ] `src/config/preferencesOptions.ts` (113 LOC)
- [ ] `src/config/appConfig.ts` (14 LOC)
- [ ] `src/config/version.ts` (5 LOC)

### Priority: LOW — App Entry & Type Declarations
- [ ] `src/App.tsx` (112 LOC) — 5 Hex-Werte (Toast)
- [ ] `src/main.tsx` (10 LOC)
- [ ] `src/vite-env.d.ts` (9 LOC)

---

## Cross-Cutting Concerns

Patterns die mehrere Dateien betreffen. Beim Review jeder Datei pruefen ob sie betroffen ist.

- **Hardcoded Hex-Farben** (38 Stueck in 10 .tsx-Dateien): `design-tokens.ts` existiert, wird aber von SVG-Komponenten nicht genutzt. Brand-Farbe `#0F6CBD` in 4+ Komponenten als Raw-String. Betroffene Dateien sind im Index markiert.
- **`toISODateString()` nicht ueberall genutzt**: Utility existiert in `dateUtils.ts`. ~18 weitere `toISOString().split("T")[0]` in: insertionActions, hierarchy, calculations, Cell, HomeTabContent, NewTaskPlaceholderRow, SharedExportOptions. Bei Review dieser Dateien umstellen.
- **Zirkulaere Imports zwischen Store-Slices**: chartSlice ↔ taskSlice und chartSlice ↔ historySlice importieren sich gegenseitig. Runtime-sicher, da alle Cross-Store-Zugriffe ueber `getState()` in Action-Handlern erfolgen (nicht bei Module-Initialisierung). Pattern ist korrekt fuer Zustand Cross-Store-Kommunikation, aber bei neuen Slices beachten: KEIN module-level Zugriff auf andere Stores.

---

## Decisions & Precedents

Entscheidungen aus bisherigen Reviews die fuer zukuenftige Dateien gelten.

- **Relative Imports sind OK**: Max Tiefe ist `../../`. Absolute Imports wuerden tsconfig paths + vite alias + vitest config brauchen — kein Gewinn.
- **Methoden 50-100 LOC sind akzeptabel** wenn die Logik kohaesiv ist und weitere Aufspaltung die Lesbarkeit verschlechtern wuerde (z.B. deleteTask, deleteSelectedTasks).
- **Cross-Store-Zugriff via `getState()` AUSSERHALB von Immer `set()`**: Korrekte Pattern. Innerhalb von `set()` ist ein Anti-Pattern.
- **Immer-Idiome**: `Object.assign(draft, updates)` statt Spread `{...draft, ...updates}`. Direkte Draft-Mutation ist korrekt und gewollt.
- **`structuredClone` vs `current()` vs Shallow Clone**: Innerhalb Immer `set()` → `current()`. Ausserhalb (von `get()`) → `{ ...obj }` reicht (frozen objects, shallow clone genuegt fuer flache Task-Objekte).
- **recordCommand aussen, nicht innen**: Undo/Redo-Recording nach `set()`, nicht innerhalb. Ermoeglicht saubere Trennung von State-Mutation und History-Tracking.
- **Frozen-Object-Safety bei getState()**: Tasks aus `getState().tasks` sind Immer-frozen. Vor Mutation IMMER `.map(t => ({...t}))` oder `.filter().map()` verwenden. Nur `.filter()` allein reicht NICHT — die Elemente bleiben frozen.
- **Handler-Extraction fuer grosse Switch-Statements**: Bei >50 LOC pro Switch-Case jeden Case in benannte Funktion extrahieren. Switch bleibt als duenner Dispatcher. Shared Patterns (Map-Build, Snapshot-Apply) als Helpers.
- **Toggle/Setter Boilerplate akzeptabel**: Einfache <5 LOC Methoden mit semantischen Namen (toggleWeekends, setShowWeekends etc.) nicht in generischen Helper abstrahieren — Lesbarkeit und Typsicherheit ueberwiegen DRY. (chartSlice Finding #8)
- **Grosse Slice-Dateien splitten erst bei Wachstum**: chartSlice.ts (~990 LOC) ist gross aber kohaesiv. Split analog taskSlice→groupingActions erst wenn die Datei weiter waechst. (chartSlice Finding #9)

---

## Progress

- Reviewed: 11 / 193 Dateien
- Offene Issues: 38 Hex-Farben, ~18 toISODateString-Umstellungen
- Test-Coverage: 80%+
