# Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Product Name
**TBD** (to be determined)

### 1.2 Product Vision
A web-based Gantt chart creator that makes timeline visualization effortless, beautiful, and accessible to everyone - no account required, no server dependency, just instant productivity.

### 1.3 Problem Statement
Existing Gantt chart tools are either:
- Too complex (enterprise PM tools with resource planning, billing, etc.)
- Require accounts and subscriptions
- Store data on servers (privacy/security concerns)
- Slow to create simple visualizations
- Produce ugly charts that need extensive styling

### 1.4 Solution
A client-side web application that:
- Works immediately without registration
- Creates beautiful charts by default
- Saves/loads from single portable files
- Includes full version history with time-travel UI
- Exports to multiple formats for sharing

---

## 2. Goals and Objectives

### 2.1 Primary Goals
1. **Speed**: Create a basic Gantt chart in under 2 minutes
2. **Beauty**: Professional appearance with zero styling effort
3. **Simplicity**: Intuitive interface requiring no training
4. **Privacy**: Zero server storage, complete client-side operation
5. **Portability**: Single-file format for easy backup and sharing

### 2.2 Success Metrics
- Time to first chart: < 2 minutes for new users
- User satisfaction with default styling: > 80% positive feedback
- File format adoption: Ability to open files across different browsers/devices
- Export quality: Professional-grade PDF/SVG/PNG output

---

## 3. Target Audience

### 3.1 Primary Users
- **Freelancers**: Visualizing project timelines for clients
- **Small Team Leads**: Planning sprints and project phases
- **Students**: Academic project planning and presentations
- **Consultants**: Creating timeline proposals and reports

### 3.2 User Characteristics
- Varying technical expertise (from beginner to advanced)
- Need quick results without learning curve
- Value aesthetics and presentation quality
- Privacy-conscious (prefer not sharing data with servers)
- Work primarily on desktop/laptop computers

---

## 4. Core Requirements

### 4.1 Functional Requirements

#### 4.1.1 Chart Creation (MUST HAVE)
- **FR-001**: Users can create new blank Gantt charts instantly
- **FR-002**: Users can add tasks with name, start date, end date
- **FR-003**: Users can edit task properties inline
- **FR-004**: Users can delete tasks
- **FR-005**: Users can reorder tasks (drag and drop)
- **FR-006**: Users can create task dependencies with visual arrows and offset (lag days)
- **FR-007**: Users can add milestones (zero-duration markers)
- **FR-008**: Charts automatically calculate and display timeline scale
- **FR-009**: Users can copy and paste tasks (with dependencies if multi-select)
- **FR-009a**: Users can multi-select tasks for bulk operations
- **FR-009b**: Users can organize tasks into collapsible groups/phases with optional summary bars

#### 4.1.2 File Operations (MUST HAVE)
- **FR-010**: Users can save current chart to local file
- **FR-011**: Users can open/import previously saved files
- **FR-012**: File format preserves all chart data including history
- **FR-013**: Files are human-readable (JSON-based)
- **FR-014**: Files include metadata (created date, modified date, version)

#### 4.1.3 Version History (MUST HAVE)
- **FR-020**: System automatically saves every change to history
- **FR-021**: Users can navigate history with timeline slider
- **FR-022**: Visual preview updates in real-time while scrubbing timeline
- **FR-023**: Users can create named snapshots at important points
- **FR-024**: Snapshots appear as markers on timeline slider
- **FR-025**: Users can restore to any point in history

#### 4.1.4 Export Functionality (MUST HAVE)
- **FR-030**: Users can export chart to PDF format with multiple customization options
- **FR-031**: Users can export chart to SVG format with multiple customization options
- **FR-032**: Users can export chart to PNG format with multiple customization options
- **FR-033**: Export settings include: page size, orientation, resolution, date range, background
- **FR-034**: Export maintains visual quality and styling

#### 4.1.5 Customization (SHOULD HAVE)
- **FR-040**: Users can adjust color scheme/theme
- **FR-041**: Users can customize task colors individually
- **FR-042**: Users can adjust timeline view (days/weeks/months)
- **FR-043**: Users can zoom in/out on timeline with fit-to-screen reset button
- **FR-044**: Users can show/hide weekends
- **FR-045**: Users can adjust UI density/compactness (compact/normal/comfortable)
- **FR-046**: Users can add custom labels/notes to tasks
- **FR-047**: Users can set preferred date format
- **FR-048**: Users can set first day of week (Sunday/Monday)
- **FR-049**: Users can configure task name display position (in bar/above/below/smart)
- **FR-050**: Users can optionally show/hide history timeline slider
- **FR-051**: Users can optionally show timeline at both top and bottom of chart

#### 4.1.6 Validation and Auto-features (SHOULD HAVE)
- **FR-060**: System validates date logic (end after start)
- **FR-061**: System auto-adjusts dependent tasks when parent changes
- **FR-062**: System displays vertical line showing today's date on timeline
- **FR-063**: System warns about circular dependencies
- **FR-064**: System auto-saves to browser storage (recovery)
- **FR-065**: Timeline labels automatically adjust based on zoom level (years→months→weeks→days)
- **FR-066**: System can collapse dependent tasks for compact visualization

### 4.2 Non-Functional Requirements

#### 4.2.1 Performance
- **NFR-001**: Chart renders in < 500ms for up to 100 tasks
- **NFR-002**: Chart renders in < 2s for up to 1000 tasks
- **NFR-003**: History navigation responds in < 100ms
- **NFR-004**: File save/load completes in < 1s for typical charts

#### 4.2.2 Usability
- **NFR-010**: Zero learning curve for basic operations
- **NFR-011**: All features discoverable through UI
- **NFR-012**: Keyboard shortcuts for common operations
- **NFR-013**: Undo/redo support for all actions
- **NFR-014**: Responsive design for laptop/desktop screens (1280px+)

#### 4.2.3 Compatibility
- **NFR-020**: Works in Chrome, Firefox, Safari, Edge (latest 2 versions)
- **NFR-021**: Files compatible across all browsers
- **NFR-022**: No server/backend required
- **NFR-023**: Works offline after initial load

#### 4.2.4 Security & Privacy
- **NFR-030**: No data transmitted to servers
- **NFR-031**: No tracking or analytics without explicit consent
- **NFR-032**: All processing happens client-side
- **NFR-033**: No authentication/login required

#### 4.2.5 Accessibility
- **NFR-040**: Keyboard navigation for all features
- **NFR-041**: Screen reader compatible (WCAG 2.1 AA)
- **NFR-042**: Sufficient color contrast ratios
- **NFR-043**: Resizable text without breaking layout

---

## 5. Feature Prioritization

### 5.1 MoSCoW Method

**MUST HAVE (MVP)**
- Basic task creation/editing/deletion
- Task dependencies with visual arrows and offset
- Copy/paste tasks with multi-select
- Task groups/phases with collapsible sections
- Save/load to JSON file
- Version history with timeline slider
- Export to PNG
- Today marker (vertical line)
- Zoom and pan timeline with fit button
- Beautiful default styling
- Offline capability

**SHOULD HAVE (V1.0)**
- Export to PDF and SVG with customization options
- Named snapshots
- Color customization
- Milestones
- Keyboard shortcuts
- Undo/redo
- UI density/compactness settings
- Date format and first day of week settings
- Task name position configuration
- Show/hide history timeline option
- Optional duplicate timeline at bottom
- Collapse dependent tasks optimization

**COULD HAVE (Future)**
- Templates (pre-built chart styles)
- Multiple chart views (list view, calendar view)
- Task notes/descriptions
- File attachments per task
- Print optimization
- Import from other formats (MS Project, CSV)
- Mobile-responsive version

**WON'T HAVE (Initially, but possible future)**
- Login/authentication (future: for sharing features)
- Server-side storage (future: for collaboration)
- Real-time collaboration (future: with login)
- Share charts with/without edit access (future: with login)
- Mobile native app (future: maybe)

**WON'T HAVE (Out of Scope Permanently)**
- Resource management
- Cost/budget tracking
- Time tracking
- Team management

---

## 6. User Interface Requirements

### 6.1 Main Interface Sections
1. **Top Toolbar**: File operations, export, undo/redo, view controls
2. **Left Panel**: Task list with inline editing
3. **Main Canvas**: Visual Gantt chart with timeline
4. **Bottom Timeline Slider**: History navigation
5. **Right Panel** (collapsible): Styling and customization options

### 6.2 Key Interactions
- Click to select tasks
- Double-click to edit task name
- Drag task bars to adjust dates
- Drag task ends to resize duration
- Drag between tasks to create dependencies
- Drag on timeline background to pan/navigate the project timeline
- Right-click for context menus
- Scroll to pan timeline horizontally
- Zoom with mouse wheel/pinch gesture
- Fit button to reset zoom and display entire project

---

## 7. Data Requirements

### 7.1 File Format
- **Format**: JSON
- **Extension**: `.gantt` or `.ganttflow`
- **Encoding**: UTF-8
- **Compression**: Optional (gzip for large files)

### 7.2 Data to Store

**Project-Specific Settings** (stored in project file):
- Chart metadata (name, created date, modified date)
- Task list (name, start, end, color, dependencies, groups)
- Task groups/phases with hierarchy
- Milestones
- Complete change history
- Named snapshots
- Project view settings (zoom level, visible date range)
- Application version (for format compatibility)

**Application Settings** (stored in browser only):
- UI density/compactness preference
- Default color palette
- Date format preference
- First day of week
- Task name display position
- Show/hide history timeline
- Show timeline at top and/or bottom
- Theme preference
- Keyboard shortcuts (if customizable)

---

## 8. Technical Constraints

### 8.1 Architecture Constraints
- Client-side only (no backend)
- Single-page application (SPA)
- No external data storage
- No user authentication

### 8.2 Technology Constraints
- Must work in modern browsers (ES6+)
- Must not require installation
- Must be hostable as static files

### 8.3 Scalability Constraints
- Support up to 1000 tasks per chart (performance target)
- File size reasonable (< 5MB for typical charts)
- History limited to last 1000 changes (configurable)

---

## 9. Dependencies and Assumptions

### 9.1 Dependencies
- Modern web browser with JavaScript enabled
- Local file system access (for save/open)
- Canvas/SVG support for rendering

### 9.2 Assumptions
- Users have basic computer literacy
- Users understand Gantt chart concepts
- Users work primarily on desktop/laptop devices
- Users have stable browsers (not ancient IE)

---

## 10. Future Considerations & Extensibility

**See [EXTENSIBILITY_ARCHITECTURE.md](./EXTENSIBILITY_ARCHITECTURE.md) for complete architectural details.**

### 10.1 Features Enabled by Extensible Architecture

The MVP architecture includes extensibility foundations that enable future features without breaking changes:

**Immediate Benefits (V1.1)**:
- **Custom Fields**: Users can add their own metadata fields to tasks (Priority, Status, Client, etc.)
- **Multi-Project Management**: Switch between multiple Gantt charts with project switcher
- **Import/Export Adapters**: CSV, MS Project XML import/export capabilities

**Mid-Term Features (V1.2-V1.5)**:
- **Alternative Views**: Kanban board, Calendar view, List view (same data, different visualizations)
- **Resource Management**: Assign team members, track workload, balance resources
- **Plugin System**: Community plugins for custom features
- **Advanced Dependencies**: Start-to-Start, Finish-to-Finish, Start-to-Finish relationships

**Long-Term Features (V2.0)**:
- **Collaboration**: Real-time editing, comments, mentions (optional cloud backend)
- **Advanced Integrations**: Webhooks, REST API, third-party tool integrations
- **Mobile Editing**: Full touch-based editing on tablets and phones

### 10.2 Architectural Decisions Made for Extensibility

**Data Model Extensibility**:
- Task interface includes `customFields` map for user-defined metadata
- Optional fields for collaboration: `assignedTo`, `createdBy`, `lastModifiedBy`
- Optional fields for resources: `estimatedHours`, `actualHours`
- All extensibility fields are optional and backward compatible

**File Format Versioning**:
- Explicit `fileVersion` and `schemaVersion` fields for migration tracking
- Unknown fields preserved when loading files from future versions
- Migration system for upgrading old files to new formats

**Plugin Architecture**:
- Event bus for subscribing to application events
- Plugin registration API for third-party extensions
- View abstraction layer for alternative visualizations

**Storage Flexibility**:
- Multi-project IDs in data model
- Storage adapter pattern (can swap IndexedDB → Cloud Storage)
- Per-project auto-save and metadata

### 10.3 Avoiding Common Pitfalls

**What we're doing RIGHT**:
- ✅ Designing extensible data model from day one
- ✅ File format versioning and migration system
- ✅ Event-driven architecture for plugins
- ✅ View layer decoupled from data
- ✅ Unknown field preservation for forward compatibility

**What we're avoiding**:
- ❌ Tight coupling between data and UI that prevents alternative views
- ❌ Hard-coded task fields that can't be extended
- ❌ File format with no version tracking (breaks compatibility)
- ❌ Monolithic architecture that can't support plugins
- ❌ Single-project assumption baked into storage

### 10.4 Implementation Timeline

| Phase | Extensibility Milestone | Features Unlocked |
|-------|------------------------|-------------------|
| **Phase 1 (MVP)** | Data model includes all extensibility fields | Foundation ready |
| **V1.1** | Custom fields UI, Multi-project UI | Users can extend tasks |
| **V1.2** | Plugin API, CSV adapter | Community extensions |
| **V1.5** | Alternative views (List, Calendar) | Multiple visualizations |
| **V2.0** | Collaboration backend, Full plugin system | Real-time collaboration, marketplace |

---

## 11. Open Questions

1. **File Format Details**: Should we support import from other formats (MS Project, CSV)? → Defer to V2.0
2. **Export Settings**: What customization options for PDF/SVG/PNG exports? → ✓ Resolved: Multiple options (see FR-033)
3. **Collaboration**: Should read-only sharing be in MVP or later? → Defer to future with login feature
4. **Templates**: Should we include sample/starter templates? → Defer to V1.x
5. **Localization**: Multi-language support priority? → Defer to V2.0
6. **Auto-backup**: Frequency and management of browser-based auto-saves? → Default 30 seconds, configurable
7. **Group Summary Bar Display**: Should summary bars be shown by default or user-toggleable? → User-toggleable setting
8. **Collapsed Dependencies**: When should dependent tasks collapse automatically? → Manual collapse only, not automatic
9. **History Timeline**: Shown by default or hidden? → Shown by default, user can hide via setting
10. **Export Date Range**: Should we support exporting only a portion of the timeline? → Yes, include in export options

---

## 12. Success Criteria

The product will be considered successful when:

1. A non-technical user can create a presentable Gantt chart in under 5 minutes
2. Users prefer the default styling over custom styling 70%+ of the time
3. File format is stable and forward-compatible
4. Export quality matches or exceeds commercial tools
5. Zero critical bugs related to data loss
6. Positive user feedback on simplicity and speed

---

## 13. Timeline and Milestones

See [ROADMAP.md](./ROADMAP.md) for detailed development phases.

**Target Milestones**:
- Concept completion: 2 weeks
- MVP development: 8-12 weeks
- Beta testing: 2-4 weeks
- V1.0 release: 3-4 months from start

---

**Document Version**: 1.2
**Last Updated**: 2025-12-12
**Owner**: Product Concept Team
**Status**: Draft - Updated with extensibility and future considerations

**Recent Updates (v1.2)**:
- Added Section 10: Future Considerations & Extensibility
- Outlined architectural decisions for extensibility
- Mapped features enabled by extensible architecture
- Added implementation timeline for extensibility features
- Reference to EXTENSIBILITY_ARCHITECTURE.md for technical details

**Previous Updates (v1.1)**:
- Updated with additional features (copy/paste, grouping, compactness, settings)
