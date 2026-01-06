# Sprint 1.5.9: User Preferences & Settings Dialog

**Sprint-ID:** 1.5.9
**Version:** 1.3
**Erstellt:** 2026-01-06
**Status:** 🔄 IN PROGRESS - Core Features Complete, Working Days Mode Pending

---

## 1. Executive Summary

### Ziel
Implementierung eines vollständigen Settings-Systems mit User Preferences Dialog und erweiterten Project Settings. Dieses Sprint umfasst Feiertage, Arbeitstage-Berechnung, diverse View-Optionen und Quick-Toggle-Buttons in der Toolbar.

### Scope
- Preferences Dialog erweitern (Date Format, First Day of Week, Holiday Region)
- Neue Project Settings (Show Dependencies, Show Progress, Task Label Position, etc.)
- Feiertags-Darstellung und -Berechnung
- Arbeitstage-Berechnung (Working Days Mode)
- Toolbar Quick-Toggles für häufig verwendete Settings
- Urlaubs-System (Vorbereitungen für späteres Feature)

### Abhängigkeiten
- Sprint 1.5.9.1 UI Density (abgeschlossen) - Preferences Dialog existiert bereits
- SETTINGS_ARCHITECTURE.md - Two-Tier Storage Model

### Nicht im Scope
- Theme switching (Light/Dark/System) - V2.0
- Multi-Language Support - V2.0
- Custom holiday definitions - V1.2+
- Resource management / vacation tracking per resource - V2.0

---

## 2. Team-Diskussion

### 2.1 Teilnehmer
- **Product Owner (PO)**: Feature-Priorisierung, User Value
- **Project Manager (PM)**: Sprint-Planung, Dependencies
- **UX/UI Designer**: UI/UX Design, Toolbar Layout
- **Frontend Developer**: Technische Machbarkeit, State Management
- **Data Visualization Specialist**: Timeline-Darstellung, Working Days Berechnung
- **Backend Developer**: n/a (reine Frontend-Feature)
- **Software Architect**: Architektur-Review, Data Model Extensions
- **DevOps Engineer**: Build/Test-Pipeline
- **QA Tester**: Teststrategien, Edge Cases
- **Data Analyst**: Feature Tracking, Analytics Events

### 2.2 Diskussion: Settings-Kategorisierung

**Software Architect:**
> "Basierend auf SETTINGS_ARCHITECTURE.md haben wir ein klares Two-Tier-System. Neue Settings müssen kategorisiert werden."

**Kategorisierung der neuen Settings:**

| Setting | Kategorie | Begründung |
|---------|-----------|------------|
| Holiday Region | User Preference | Kulturelle Präferenz des Users (z.B. AT, DE, US) |
| First Day of Week | User Preference | Kulturelle Präferenz |
| Date Format | User Preference | Kulturelle Präferenz |
| Show Holidays | Project Setting | David teilt Projekte - Darstellung soll portabel sein |
| Show Today Marker | Project Setting | Bereits definiert in SETTINGS_ARCHITECTURE.md |
| Show Dependencies | Project Setting | Visuelle Darstellung pro Projekt |
| Show Progress Column | Project Setting | Spalte ein/ausblenden pro Projekt |
| Task Label Position | Project Setting | Visuelle Darstellung pro Projekt |
| Working Days Mode | Project Setting | Beeinflusst Task-Berechnungen pro Projekt |

**Team-Entscheidung:**
> "Die Kategorisierung ist korrekt. Holiday Region ist User-Pref (persönlich), aber ob Feiertage *angezeigt* werden, ist Project-Setting."

### 2.3 Diskussion: Toolbar Quick-Toggles

**UX/UI Designer:**
> "Welche Settings werden so häufig umgeschaltet, dass sie in die Toolbar gehören? Lasst uns das anhand unserer User Personas durchgehen."

---

#### Persona-Befragung: Quick Toggles

**Sarah (Freelance Designer, 28, Medium tech):**
> "Wenn ich meinem Kunden das Gantt zeige, will ich manchmal die Dependencies ausblenden - das sieht cleaner aus. Beim Arbeiten brauche ich sie aber. Also Dependencies wäre super als Quick Toggle."
>
> "Den Today Marker blende ich eigentlich nie aus - der hilft mir immer zu sehen wo wir sind."
>
> "Progress-Spalte? Die brauche ich eigentlich immer. Würde ich nicht oft togglen."

**Mike (Small Business Owner, 42, Low-Medium tech):**
> "Ich will nicht zu viele Buttons in der Toolbar. Das verwirrt mich nur. Wenn ich was ein/ausblenden will, gehe ich in die Settings."
>
> "Dependencies verstehe ich nicht ganz - ich benutze die sowieso kaum. Aber wenn es einen Button gibt, klicke ich vielleicht aus Versehen drauf und dann ist alles weg."
>
> "Progress ist wichtig für mich, aber ich ändere das nie während der Arbeit."

**David (Consultant, 35, High tech):**
> "Ich präsentiere oft beim Kunden. Da möchte ich schnell zwischen 'cleaner Ansicht' und 'Detail-Ansicht' wechseln können. Dependencies ein/aus ist dafür super."
>
> "Feiertage wären interessant - wenn ich internationale Projekte habe, zeige ich manchmal lokale Feiertage, manchmal nicht."
>
> "Today Marker brauche ich nur wenn das Chart aktuell ist. Bei historischen Projekten oder Planung für nächstes Jahr ist der nur störend. Quick Toggle wäre gut."
>
> "Task Labels ein/aus wäre auch nützlich für saubere Screenshots."

**Emma (University Student, 21, High tech):**
> "Ich kenne das von VS Code - da gibt es auch Mini-Buttons zum Togglen. Finde ich gut."
>
> "Dependencies würde ich oft togglen - manchmal will ich nur die Tasks sehen, manchmal die Zusammenhänge."
>
> "Progress brauche ich bei meinen Uni-Projekten nicht so oft. Kann weg."
>
> "Keyboard Shortcuts sind mir wichtiger als Buttons. Kann ich T/D/P einfach drücken?"

---

#### Analyse mit Persona-Gewichtung

| Setting | Sarah | Mike | David | Emma | Gewichtete Häufigkeit |
|---------|-------|------|-------|------|----------------------|
| **Show Dependencies** | ⭐⭐⭐ Oft | ⭐ Selten | ⭐⭐⭐ Oft | ⭐⭐⭐ Oft | **HOCH** |
| **Show Today Marker** | ⭐ Selten | ⭐ Selten | ⭐⭐ Manchmal | ⭐ Selten | MITTEL |
| **Show Progress Column** | ⭐ Selten | ⭐ Selten | ⭐ Selten | ⭐ Selten | NIEDRIG |
| **Show Holidays** | ⭐ Selten | ⭐ Selten | ⭐⭐ Manchmal | ⭐ Selten | NIEDRIG-MITTEL |
| **Task Label Position** | ⭐ Selten | ⭐ Selten | ⭐⭐ Manchmal | ⭐ Selten | NIEDRIG |
| **Show Weekends** | ⭐ Selten | ⭐ Selten | ⭐ Selten | ⭐ Selten | NIEDRIG |
| **Working Days Mode** | ⭐ Selten | ⭐ Selten | ⭐ Selten | ⭐ Selten | NIEDRIG |

**Legende:** ⭐ = Selten/Nie, ⭐⭐ = Manchmal, ⭐⭐⭐ = Oft

---

#### Team-Diskussion der Ergebnisse

**Product Owner:**
> "Dependencies ist der klare Gewinner. Drei von vier Personas würden das oft togglen."

**UX/UI Designer:**
> "Mike's Feedback ist wichtig - er will nicht zu viele Buttons. Wir sollten minimal anfangen."

**Frontend Developer:**
> "Technisch können wir beliebig viele Toggles hinzufügen. Die Frage ist UX, nicht Machbarkeit."

**Software Architect:**
> "Ich schlage einen gestaffelten Ansatz vor: Nur Dependencies als Quick Toggle starten. Wenn User weitere anfordern, können wir sie nachrüsten."

**QA Tester:**
> "Weniger Toggles = weniger Test-Kombinationen. Ich bin für den minimalen Ansatz."

---

#### Team-Entscheidung: Optionen

**Option A: Minimal (1 Toggle)**
- ✅ Show Dependencies nur

**Option B: Mittel (2-3 Toggles)**
- ✅ Show Dependencies
- ✅ Show Today Marker
- ❓ Show Progress Column (niedrige Nachfrage, aber logische Ergänzung)

**Option C: Vollständig (wie ursprünglich geplant)**
- ✅ Show Dependencies
- ✅ Show Today Marker
- ✅ Show Progress Column

---

**✅ ENTSCHEIDUNG GETROFFEN:**

**Option A gewählt:** Nur Dependencies als Quick Toggle in der Toolbar.

**Begründung:**
- Mike (Low-tech User) fühlt sich nicht überfordert
- Klare Funktion, kein Rätselraten was der Button tut
- Weniger visueller Clutter in der Toolbar
- Kann später bei Bedarf erweitert werden
- Keyboard Shortcuts (T/D/P/H) bieten Power-Usern trotzdem schnellen Zugriff

**Keyboard Shortcuts (unabhängig von Toolbar):**
Keyboard Shortcuts sollten für alle diese Settings implementiert werden, auch wenn sie keinen Toolbar-Button bekommen:
- `D` - Toggle Dependencies
- `T` - Toggle Today Marker
- `P` - Toggle Progress Column
- `H` - Toggle Holidays (optional)

### 2.4 Diskussion: Feiertags-Daten

**Frontend Developer:**
> "Woher bekommen wir Feiertags-Daten?"

**Recherche-Ergebnis (Web Search):**

| Library | Typ | Länder | Offline | Lizenz |
|---------|-----|--------|---------|--------|
| **date-holidays** | npm | 199 | Ja | CC BY-SA 3.0 |
| holidayapi | API | 230 | Nein | API Key |
| public-holidays | npm (Google Cal) | Limited | Nein | - |

**Data Analyst:**
> "`date-holidays` ist die beste Wahl - keine API-Abhängigkeit, 199 Länder mit Regionen, funktioniert offline."

**Team-Entscheidung:**
> "Wir verwenden `date-holidays` als npm-Dependency. Custom Holiday Build für reduzierte Bundle-Größe."

**Quellen:**
- [date-holidays auf npm](https://www.npmjs.com/package/date-holidays)
- [date-holidays auf GitHub](https://github.com/commenthol/date-holidays)

### 2.5 Diskussion: Working Days Berechnung

**Data Visualization Specialist:**
> "Working Days Mode ist komplex. Wie beeinflussen nicht-Arbeitstage die Balken?"

**Szenarien:**

```
Szenario 1: Task startet Mo 23.12., Duration 5 Tage (ohne Working Days)
→ Balken: Mo 23.12. - Fr 27.12. (5 Kalendertage)

Szenario 2: Task startet Mo 23.12., Duration 5 Arbeitstage (mit Working Days)
→ Feiertage: 24.12., 25.12., 26.12.
→ Wochenende: 28.12., 29.12.
→ Balken: Mo 23.12. - Mi 31.12. (nur 5 Arbeitstage zählen)
```

**Software Architect:**
> "Wir brauchen zwei separate Felder im Data Model:"

```typescript
interface Task {
  // ... existing fields
  duration: number;              // Immer in Kalendertagen (Balkenbreite)
  workingDays?: number;          // Berechnete Arbeitstage (optional, nur wenn Mode aktiv)
  durationMode?: 'calendar' | 'working';  // Wie wurde Duration eingegeben?
}
```

**Alternativer Ansatz (vereinfacht):**

```typescript
// Im ViewSettings (Project Setting)
interface ViewSettings {
  // ... existing
  workingDaysMode: boolean;      // Wenn true, werden non-working days übersprungen
  nonWorkingDays: {
    saturday: boolean;           // Default: true (nicht arbeiten)
    sunday: boolean;             // Default: true
    holidays: boolean;           // Default: true
  };
}
```

**QA Tester:**
> "Der vereinfachte Ansatz ist besser für MVP. Duration bleibt Duration, aber die Visualisierung passt sich an."

**Team-Entscheidung:**
> "MVP: Working Days Mode beeinflusst nur die Visualisierung. Die Task-Duration wird beim Verschieben automatisch erweitert wenn nicht-Arbeitstage dazwischen liegen. Keine Änderung am gespeicherten Duration-Feld."

### 2.6 Diskussion: Task Label Position

**UX/UI Designer:**
> "Wo soll der Task-Name angezeigt werden?"

**Optionen:**

| Position | Beschreibung | Verfügbar für |
|----------|--------------|---------------|
| `before` | Links vom Balken | Alle Task-Typen |
| `inside` | Im Balken zentriert | Nur `task` (nicht summary/milestone) |
| `after` | Rechts vom Balken | Alle Task-Typen |
| `none` | Kein Label im Chart | Alle Task-Typen |

**Einschränkung bei `inside`:**
- **Summary Tasks**: Balken zeigt Kindbereich, Text würde Struktur verdecken
- **Milestones**: Raute-Symbol ist zu klein für Text

**Team-Entscheidung:**
> "Wenn User 'inside' wählt, werden Summary und Milestone automatisch auf 'after' gesetzt."

### 2.7 Diskussion: Urlaubs-System (Vormerken)

**Product Owner:**
> "Wir sollten Urlaube gleich vormerken für V1.2+. Wie sieht das aus?"

**Software Architect:**
> "Urlaube sind projekt-spezifisch (Team-Urlaube) oder user-spezifisch (eigene Urlaube)."

**Vorgeschlagenes Data Model (für spätere Implementation):**

```typescript
interface ProjectSettings {
  // ... existing
  vacations?: Vacation[];        // Für V1.2+
}

interface Vacation {
  id: string;
  name: string;                  // z.B. "Betriebsurlaub", "Team Holiday"
  startDate: string;
  endDate: string;
  affectsWorkingDays: boolean;   // Soll dies Working Days beeinflussen?
  color?: string;                // Optional für Timeline-Hervorhebung
}
```

**Team-Entscheidung:**
> "Data Model wird vorbereitet, aber UI kommt erst in V1.2+. Working Days Berechnung berücksichtigt dann auch Vacations."

---

## 3. Feature-Spezifikation

### 3.1 User Preferences (localStorage) ✅ IMPLEMENTED

| Setting | Type | Default | UI Element | Status |
|---------|------|---------|------------|--------|
| `dateFormat` | `'DD/MM/YYYY' \| 'MM/DD/YYYY' \| 'YYYY-MM-DD'` | Browser Locale | Dropdown | ✅ |
| `firstDayOfWeek` | `'sunday' \| 'monday'` | Browser Locale | Radio Buttons | ✅ |
| `weekNumberingSystem` | `'iso' \| 'us'` | `'iso'` | Radio Buttons | ✅ |
| `uiDensity` | `'compact' \| 'normal' \| 'comfortable'` | `'normal'` | Radio Buttons | ✅ |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Radio Buttons | 🔜 V2.0 |

**Note:** `holidayRegion` was moved from User Preferences to Project Settings (chartSlice) during implementation - this makes more sense as projects may be for different regions.

### 3.2 Project Settings (in .ownchart file) ✅ MOSTLY IMPLEMENTED

| Setting | Type | Default | UI Element | Toolbar Toggle | Status |
|---------|------|---------|------------|----------------|--------|
| `showWeekends` | `boolean` | `true` | Checkbox | Nein | ✅ |
| `showTodayMarker` | `boolean` | `true` | Checkbox | Keyboard (T) | ✅ |
| `showHolidays` | `boolean` | `true` | Checkbox | Keyboard (H) | ✅ |
| `showDependencies` | `boolean` | `true` | Checkbox | **Ja** + Keyboard (D) | ✅ |
| `showProgress` | `boolean` | `true` | Checkbox | Keyboard (P) | ✅ |
| `taskLabelPosition` | `'before' \| 'inside' \| 'after' \| 'none'` | `'inside'` | Radio Buttons | Nein | ✅ |
| `holidayRegion` | `string` | `'AT'` | Dropdown | Nein | ✅ |
| `workingDaysMode` | `boolean` | `false` | Checkbox + Info | Nein | 🔜 Pending |
| `workingDaysConfig` | `object` | see below | Checkboxes | Nein | 🔜 Pending |

### 3.3 Preferences Dialog Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Preferences                                              [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Regional                                                       │
│  ─────────────────────────────────────────────                  │
│  Date Format:        [DD/MM/YYYY           ▼]                   │
│                      ○ DD/MM/YYYY (31/12/2026)                  │
│                      ○ MM/DD/YYYY (12/31/2026)                  │
│                      ○ YYYY-MM-DD (2026-12-31)                  │
│                                                                 │
│  First Day of Week:  ○ Sunday  ● Monday                         │
│                                                                 │
│  Holiday Region:     [Austria (AT)          ▼] [🔍]             │
│                      Popular: DE, AT, CH, US, UK                │
│                                                                 │
│  Appearance                                                     │
│  ─────────────────────────────────────────────                  │
│  UI Density:         ○ Compact  ● Normal  ○ Comfortable         │
│                                                                 │
│  Theme:              ○ Light  ○ Dark  ● System                  │
│                      (Coming in V2.0)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                           [Cancel]  [Save]      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Project Settings Dialog Design (Neuer Dialog)

**Zugang:** Menü → View → "Chart Settings..." oder Toolbar Gear Icon

```
┌─────────────────────────────────────────────────────────────────┐
│  Chart Settings                                           [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Timeline Display                                               │
│  ─────────────────────────────────────────────                  │
│  [✓] Show Today Marker                                          │
│  [✓] Show Weekend Highlighting                                  │
│  [✓] Show Holidays                                              │
│      └─ Uses holidays from: Austria (AT) [Change in Preferences]│
│  [✓] Show Dependencies                                          │
│                                                                 │
│  Task Display                                                   │
│  ─────────────────────────────────────────────                  │
│  [✓] Show Progress Column                                       │
│      └─ When disabled, tasks show as 100% complete              │
│                                                                 │
│  Task Label Position:                                           │
│      ○ Before bar    ● Inside bar    ○ After bar    ○ None      │
│      ℹ️ "Inside" not available for summary tasks & milestones   │
│                                                                 │
│  Working Days                                                   │
│  ─────────────────────────────────────────────                  │
│  [ ] Calculate with Working Days Only                           │
│      └─ When enabled, task durations automatically extend       │
│        to skip weekends and holidays                            │
│                                                                 │
│      Exclude from working days:                                 │
│      [✓] Saturdays                                              │
│      [✓] Sundays                                                │
│      [✓] Holidays (from: Austria)                               │
│      [ ] Custom dates... (V1.2 - Vacations)                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                           [Cancel]  [Apply]     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Toolbar Quick-Toggle Design

> ✅ **ENTSCHEIDUNG:** Option A - Nur Dependencies als Quick Toggle (siehe Sektion 2.3)

**Position:** Nach Zoom Controls, vor Help Button

```
┌────────────────────────────────────────────────────────────────────────────┐
│ OwnChart │ [New][Open][Save] │ [Undo][Redo] │ [+][-][100%] │ [⇢] │ [?]     │
└────────────────────────────────────────────────────────────────────────────┘
                                                               ↑
                                                    Quick Toggle:
                                                    Dependencies (flow-arrow icon)
```

**Toggle Button Design:**

| Button | Icon | Active State | Inactive State | Tooltip |
|--------|------|--------------|----------------|---------|
| Dependencies | `flow-arrow` (Lucide) | Blue background | Muted/Gray | "Show/Hide Dependencies (D)" |

**Icon:** Lucide `Workflow` oder `GitBranch` als Alternative falls `flow-arrow` nicht verfügbar.

**Keyboard Shortcuts (werden unabhängig von Toolbar implementiert):**
- `D` - Toggle Dependencies
- `T` - Toggle Today Marker
- `P` - Toggle Progress Column
- `H` - Toggle Holidays (optional)

### 3.6 Holiday Highlighting in Timeline

**Visual Design:**

```
Timeline Header:
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ Mo │ Di │ Mi │ Do │ Fr │ Sa │ So │ Mo │ Di │ Mi │
│ 23 │ 24 │ 25 │ 26 │ 27 │ 28 │ 29 │ 30 │ 31 │ 01 │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
          ⬆️   ⬆️   ⬆️             ⬆️
     Heiligabend|Weihn.|Stefani     Silvester
         (Holiday highlighting with tooltip)

Holiday Column Background: Light red/pink (#FEE2E2 / red-100)
Weekend Column Background: Light gray (#F3F4F6 / gray-100)
Holiday + Weekend: Light red (Holiday takes precedence)
```

**Holiday Tooltip:**
```
┌─────────────────────┐
│ 25.12.2026          │
│ Christtag           │
│ (Public Holiday)    │
└─────────────────────┘
```

### 3.7 Working Days Mode Behavior

**Scenario: Task mit 5 Arbeitstagen über Weihnachten**

```
Working Days Mode: OFF
─────────────────────
Mo 23 │ Di 24 │ Mi 25 │ Do 26 │ Fr 27 │ Sa 28 │ So 29 │ Mo 30
[████████████████████]                    (5 Kalendertage)

Working Days Mode: ON
─────────────────────
Mo 23 │ Di 24 │ Mi 25 │ Do 26 │ Fr 27 │ Sa 28 │ So 29 │ Mo 30 │ Di 31
[████   ░░░░░   ░░░░░   ░░░░░         ░░░░░   ░░░░░   ████   ████]
  ↑    Holiday Holiday Holiday         Weekend Weekend  ↑      ↑
  │                                                     │      │
  Tag 1 (Arbeitstag)                                   Tag 4  Tag 5

Balken überspringt automatisch nicht-Arbeitstage.
Visualisierung: Voller Balken nur an Arbeitstagen.
```

**Drag Behavior:**
- Beim Verschieben eines Tasks wird das End-Datum automatisch angepasst
- Duration bleibt "5 Arbeitstage", aber End-Datum ändert sich basierend auf Position

---

## 4. Technische Architektur

### 4.1 State Management Updates

**userPreferencesSlice.ts (erweitern):**

```typescript
interface UserPreferences {
  // Existing
  uiDensity: 'compact' | 'normal' | 'comfortable';

  // New
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  firstDayOfWeek: 'sunday' | 'monday';
  holidayRegion: string;  // ISO 3166-1 alpha-2 + optional region (e.g., 'AT', 'DE-BY')

  // Future (V2.0)
  theme: 'light' | 'dark' | 'system';
  language: string;
}

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  uiDensity: 'normal',
  dateFormat: detectLocaleDateFormat(),
  firstDayOfWeek: detectLocaleFirstDayOfWeek(),
  holidayRegion: detectLocaleHolidayRegion(),
  theme: 'system',
  language: navigator.language,
};

function detectLocaleHolidayRegion(): string {
  const locale = navigator.language;
  // 'de-AT' → 'AT', 'en-US' → 'US', 'de' → 'DE'
  const parts = locale.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase();
}
```

**chartSlice.ts (ViewSettings erweitern):**

```typescript
interface ViewSettings {
  // Existing
  zoom: number;
  panOffset: { x: number; y: number };
  showWeekends: boolean;
  taskTableWidth: number | null;
  columnWidths: Record<string, number>;
  exportSettings: ExportOptions | null;

  // New
  showTodayMarker: boolean;
  showHolidays: boolean;
  showDependencies: boolean;
  showProgressColumn: boolean;
  taskLabelPosition: 'before' | 'inside' | 'after' | 'none';
  workingDaysMode: boolean;
  workingDaysConfig: {
    excludeSaturday: boolean;
    excludeSunday: boolean;
    excludeHolidays: boolean;
  };
}

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  showWeekends: true,
  taskTableWidth: null,
  columnWidths: {},
  exportSettings: null,
  showTodayMarker: true,
  showHolidays: true,
  showDependencies: true,
  showProgressColumn: true,
  taskLabelPosition: 'inside',
  workingDaysMode: false,
  workingDaysConfig: {
    excludeSaturday: true,
    excludeSunday: true,
    excludeHolidays: true,
  },
};
```

### 4.2 Holiday Service

**src/services/holidayService.ts:**

```typescript
import Holidays from 'date-holidays';

interface HolidayInfo {
  date: Date;
  name: string;
  type: 'public' | 'bank' | 'school' | 'optional' | 'observance';
}

class HolidayService {
  private hd: Holidays;
  private cache: Map<string, HolidayInfo[]> = new Map();

  constructor() {
    this.hd = new Holidays();
  }

  /**
   * Set the active holiday region
   * @param country ISO 3166-1 alpha-2 code (e.g., 'AT', 'DE', 'US')
   * @param state Optional state/region code (e.g., 'BY' for Bavaria)
   */
  setRegion(country: string, state?: string): void {
    if (state) {
      this.hd.init(country, state);
    } else {
      this.hd.init(country);
    }
    this.cache.clear();
  }

  /**
   * Get all holidays for a year
   */
  getHolidaysForYear(year: number): HolidayInfo[] {
    const cacheKey = `${year}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const holidays = this.hd.getHolidays(year)
      .filter(h => h.type === 'public' || h.type === 'bank')
      .map(h => ({
        date: h.date,
        name: h.name,
        type: h.type as HolidayInfo['type'],
      }));

    this.cache.set(cacheKey, holidays);
    return holidays;
  }

  /**
   * Check if a specific date is a holiday
   */
  isHoliday(date: Date): HolidayInfo | null {
    const holidays = this.getHolidaysForYear(date.getFullYear());
    return holidays.find(h =>
      h.date.toDateString() === date.toDateString()
    ) || null;
  }

  /**
   * Get list of available countries
   */
  getAvailableCountries(): { code: string; name: string }[] {
    return this.hd.getCountries('en');
  }

  /**
   * Get list of available states for a country
   */
  getAvailableStates(country: string): { code: string; name: string }[] {
    return this.hd.getStates(country, 'en') || [];
  }
}

export const holidayService = new HolidayService();
```

### 4.3 Working Days Calculator

**src/utils/workingDaysCalculator.ts:**

```typescript
import { holidayService } from '../services/holidayService';

interface WorkingDaysConfig {
  excludeSaturday: boolean;
  excludeSunday: boolean;
  excludeHolidays: boolean;
}

/**
 * Calculate the end date given a start date and number of working days
 */
export function calculateEndDate(
  startDate: Date,
  workingDays: number,
  config: WorkingDaysConfig
): Date {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  // Start date counts as day 1 if it's a working day
  if (isWorkingDay(currentDate, config)) {
    daysAdded = 1;
  }

  while (daysAdded < workingDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isWorkingDay(currentDate, config)) {
      daysAdded++;
    }
  }

  return currentDate;
}

/**
 * Calculate number of working days between two dates
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  config: WorkingDaysConfig
): number {
  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, config)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date, config: WorkingDaysConfig): boolean {
  const dayOfWeek = date.getDay();

  // Check weekend
  if (config.excludeSaturday && dayOfWeek === 6) return false;
  if (config.excludeSunday && dayOfWeek === 0) return false;

  // Check holidays
  if (config.excludeHolidays && holidayService.isHoliday(date)) {
    return false;
  }

  return true;
}

/**
 * Get all non-working days in a date range
 */
export function getNonWorkingDays(
  startDate: Date,
  endDate: Date,
  config: WorkingDaysConfig
): Date[] {
  const nonWorkingDays: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!isWorkingDay(currentDate, config)) {
      nonWorkingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return nonWorkingDays;
}
```

### 4.4 Date Formatting Utility

**src/utils/dateFormatting.ts:**

```typescript
import { useUserPreferencesStore } from '../store/userPreferencesSlice';

export function formatDate(date: Date | string): string {
  const { dateFormat } = useUserPreferencesStore.getState().preferences;
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

export function parseDate(dateString: string): Date | null {
  const { dateFormat } = useUserPreferencesStore.getState().preferences;

  // Try to parse based on current format
  const parts = dateString.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  let day: number, month: number, year: number;

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      [day, month, year] = parts.map(Number);
      break;
    case 'MM/DD/YYYY':
      [month, day, year] = parts.map(Number);
      break;
    case 'YYYY-MM-DD':
    default:
      [year, month, day] = parts.map(Number);
  }

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}
```

### 4.5 Data Model Extensions

**Erweiterung von .ownchart File Format:**

```typescript
interface ViewSettings {
  // ... existing fields

  // New in V1.1
  showTodayMarker: boolean;
  showHolidays: boolean;
  showDependencies: boolean;
  showProgressColumn: boolean;
  taskLabelPosition: 'before' | 'inside' | 'after' | 'none';
  workingDaysMode: boolean;
  workingDaysConfig: {
    excludeSaturday: boolean;
    excludeSunday: boolean;
    excludeHolidays: boolean;
  };

  // Future V1.2
  vacations?: Vacation[];
}

// Migration: Add defaults for files without new fields
function migrateViewSettings(settings: Partial<ViewSettings>): ViewSettings {
  return {
    ...DEFAULT_VIEW_SETTINGS,
    ...settings,
  };
}
```

### 4.6 Component Architecture

```
src/components/
├── dialogs/
│   ├── PreferencesDialog.tsx        # User Preferences (erweitert)
│   └── ChartSettingsDialog.tsx      # Project Settings (NEU)
├── toolbar/
│   └── QuickToggles.tsx             # T/D/P Toggle Buttons (NEU)
├── timeline/
│   ├── HolidayHighlight.tsx         # Feiertags-Spalten-Highlighting (NEU)
│   └── TaskBar.tsx                  # Label Position Support (erweitert)
└── taskTable/
    └── TaskTable.tsx                # Progress Column Toggle (erweitert)
```

---

## 5. Implementation Plan

### 5.1 Sub-Sprints / Packages

| Package | Features | Schätzung | Status |
|---------|----------|-----------|--------|
| **5.1.1** | Holiday Service + Integration | 8h | ✅ COMPLETE |
| **5.1.2** | User Preferences erweitern | 6h | ✅ COMPLETE |
| **5.1.3** | Project Settings Dialog | 6h | ✅ COMPLETE |
| **5.1.4** | Toolbar Quick-Toggles | 4h | ✅ COMPLETE |
| **5.1.5** | Task Label Position | 4h | ✅ COMPLETE |
| **5.1.6** | Show/Hide Progress Column | 3h | ✅ COMPLETE |
| **5.1.7** | Working Days Mode | 12h | 🔜 PENDING |
| **5.1.8** | Testing & Polish | 8h | ✅ COMPLETE (786 tests) |
| **Total** | | **~51h** | **~39h complete** |

### 5.2 Detailed Task Breakdown

#### Package 5.1.1: Holiday Service (8h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | `npm install date-holidays` + types | 0.5h |
| 2 | HolidayService class implementieren | 2h |
| 3 | Holiday region selector component | 2h |
| 4 | Timeline holiday highlighting | 2h |
| 5 | Holiday tooltip | 1h |
| 6 | Unit tests | 0.5h |

#### Package 5.1.2: User Preferences erweitern (6h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | userPreferencesSlice erweitern | 1h |
| 2 | Date format selector + preview | 1.5h |
| 3 | First day of week selector | 0.5h |
| 4 | Holiday region selector integration | 1h |
| 5 | Locale detection utilities | 1h |
| 6 | Unit tests | 1h |

#### Package 5.1.3: Project Settings Dialog (6h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | ChartSettingsDialog component | 2h |
| 2 | ViewSettings state erweitern | 1h |
| 3 | Menu integration | 0.5h |
| 4 | File format migration | 1h |
| 5 | Unit tests | 1.5h |

#### Package 5.1.4: Toolbar Quick-Toggles (4h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | QuickToggles component | 1.5h |
| 2 | Keyboard shortcuts (T, D, P) | 1h |
| 3 | Toolbar integration | 0.5h |
| 4 | Tooltip & accessibility | 0.5h |
| 5 | Unit tests | 0.5h |

#### Package 5.1.5: Task Label Position (4h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | TaskBar label rendering logic | 2h |
| 2 | Summary/Milestone fallback logic | 1h |
| 3 | Unit tests | 1h |

#### Package 5.1.6: Show/Hide Progress Column (3h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | TaskTable column conditional render | 1h |
| 2 | TaskBar "100% look" when disabled | 1h |
| 3 | Unit tests | 1h |

#### Package 5.1.7: Working Days Mode (12h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | WorkingDaysCalculator utility | 3h |
| 2 | Timeline rendering with skipped days | 3h |
| 3 | Drag behavior mit Working Days | 3h |
| 4 | Duration display/editing | 2h |
| 5 | Unit tests (edge cases) | 1h |

#### Package 5.1.8: Testing & Polish (8h)

| # | Task | Schätzung |
|---|------|-----------|
| 1 | E2E tests für alle neuen Features | 3h |
| 2 | Integration tests | 2h |
| 3 | Edge case handling | 2h |
| 4 | Documentation update | 1h |

### 5.3 Implementation Order

```
Week 1:
├── Package 5.1.1: Holiday Service (Foundation)
├── Package 5.1.2: User Preferences
└── Package 5.1.3: Project Settings Dialog

Week 2:
├── Package 5.1.4: Toolbar Quick-Toggles
├── Package 5.1.5: Task Label Position
└── Package 5.1.6: Progress Column Toggle

Week 3:
├── Package 5.1.7: Working Days Mode (complex)
└── Package 5.1.8: Testing & Polish
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
describe('HolidayService', () => {
  it('should load holidays for Austria', () => {
    holidayService.setRegion('AT');
    const holidays = holidayService.getHolidaysForYear(2026);
    expect(holidays.length).toBeGreaterThan(10);
    expect(holidays.some(h => h.name.includes('Weihnacht'))).toBe(true);
  });

  it('should detect Christmas as holiday', () => {
    holidayService.setRegion('AT');
    const christmas = new Date(2026, 11, 25);
    expect(holidayService.isHoliday(christmas)).not.toBeNull();
  });
});

describe('WorkingDaysCalculator', () => {
  const config = { excludeSaturday: true, excludeSunday: true, excludeHolidays: true };

  it('should calculate end date skipping weekends', () => {
    // Monday Dec 21, 2026 + 5 working days = Monday Dec 28
    const start = new Date(2026, 11, 21);
    const end = calculateEndDate(start, 5, config);
    expect(end.toDateString()).toBe(new Date(2026, 11, 28).toDateString());
  });

  it('should calculate end date skipping holidays', () => {
    // Monday Dec 21, 2026 + 5 working days, with Dec 25, 26 as holidays
    holidayService.setRegion('AT');
    const start = new Date(2026, 11, 21);
    const end = calculateEndDate(start, 5, config);
    // Should skip Dec 25 (Fri holiday), Dec 26 (Sat), Dec 27 (Sun)
    expect(end.getDate()).toBeGreaterThan(28);
  });
});

describe('DateFormatting', () => {
  it.each([
    ['DD/MM/YYYY', '25/12/2026'],
    ['MM/DD/YYYY', '12/25/2026'],
    ['YYYY-MM-DD', '2026-12-25'],
  ])('should format date as %s', (format, expected) => {
    setDateFormat(format);
    const result = formatDate(new Date(2026, 11, 25));
    expect(result).toBe(expected);
  });
});
```

### 6.2 E2E Tests

```typescript
test('User can change holiday region', async ({ page }) => {
  // Open preferences
  await page.click('[aria-label="Preferences"]');

  // Search for Germany
  await page.fill('[placeholder="Search country..."]', 'Germany');
  await page.click('text=Germany (DE)');

  // Save
  await page.click('button:has-text("Save")');

  // Verify holidays updated in timeline
  await page.hover('[data-date="2026-12-25"]');
  await expect(page.locator('.tooltip')).toContainText('Weihnachtstag');
});

test('Quick toggles work correctly', async ({ page }) => {
  // Dependencies should be visible by default
  await expect(page.locator('.dependency-arrow')).toBeVisible();

  // Click D toggle
  await page.click('[aria-label="Toggle Dependencies"]');

  // Dependencies should be hidden
  await expect(page.locator('.dependency-arrow')).not.toBeVisible();

  // Keyboard shortcut should also work
  await page.keyboard.press('d');
  await expect(page.locator('.dependency-arrow')).toBeVisible();
});

test('Working days mode extends task duration', async ({ page }) => {
  // Enable working days mode
  await page.click('[aria-label="Chart Settings"]');
  await page.check('[name="workingDaysMode"]');
  await page.click('button:has-text("Apply")');

  // Create task starting Monday Dec 21, duration 5 days
  // With holidays Dec 25, task should extend past Dec 28
  const task = page.locator('.task-bar').first();
  const endX = await task.boundingBox().then(b => b!.x + b!.width);

  // Verify task extends further than 5 calendar days would
  expect(endX).toBeGreaterThan(expectedCalendarEndX);
});
```

### 6.3 Visual Regression Tests

- Holiday highlighting in verschiedenen Ländern
- Task label positions (before/inside/after/none)
- Quick toggle states (active/inactive)
- Working days mode task rendering

---

## 7. Migration Plan

### 7.1 File Format Migration

```typescript
// Migration von v0.0.12 auf v1.1.0
function migrateV0_0_12_to_V1_1_0(file: GanttFile): GanttFile {
  return {
    ...file,
    fileVersion: '1.1.0',
    chart: {
      ...file.chart,
      viewSettings: {
        ...file.chart.viewSettings,
        // Neue Felder mit Defaults
        showTodayMarker: file.chart.viewSettings.showTodayMarker ?? true,
        showHolidays: true,
        showDependencies: true,
        showProgressColumn: true,
        taskLabelPosition: 'inside',
        workingDaysMode: false,
        workingDaysConfig: {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: true,
        },
      },
    },
  };
}
```

### 7.2 User Preferences Migration

```typescript
// Bestehende User (vor V1.1) erhalten Locale-Defaults
function migrateUserPreferences(stored: Partial<UserPreferences>): UserPreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...stored,
    // Neue Felder mit Locale-Detection
    dateFormat: stored.dateFormat ?? detectLocaleDateFormat(),
    firstDayOfWeek: stored.firstDayOfWeek ?? detectLocaleFirstDayOfWeek(),
    holidayRegion: stored.holidayRegion ?? detectLocaleHolidayRegion(),
  };
}
```

---

## 8. Accessibility Considerations

### 8.1 WCAG Compliance

| Kriterium | Anforderung | Implementation |
|-----------|-------------|----------------|
| 1.4.1 Use of Color | Farbunabhängige Information | Holidays: Pattern overlay zusätzlich zu Farbe |
| 1.4.11 Non-text Contrast | 3:1 Kontrast für UI | Toggle buttons: Clear active/inactive states |
| 2.1.1 Keyboard | Alles per Tastatur erreichbar | T/D/P shortcuts, dialog navigation |
| 2.4.7 Focus Visible | Fokus sichtbar | Focus rings auf allen interaktiven Elementen |

### 8.2 Screen Reader Support

```tsx
// Quick Toggle mit ARIA
<button
  aria-pressed={showDependencies}
  aria-label={showDependencies ? 'Hide Dependencies' : 'Show Dependencies'}
  onClick={toggleDependencies}
>
  <DependenciesIcon />
</button>

// Holiday cell mit ARIA
<td
  role="gridcell"
  aria-label={`${formatDate(date)}${holiday ? `, ${holiday.name} (Holiday)` : ''}`}
>
  {/* content */}
</td>
```

---

## 9. Performance Considerations

### 9.1 Holiday Service Optimization

```typescript
// Lazy loading der Feiertags-Daten
// Nur Jahre laden, die im Viewport sind
function getVisibleYears(startDate: Date, endDate: Date): number[] {
  const years = new Set<number>();
  let current = new Date(startDate);
  while (current <= endDate) {
    years.add(current.getFullYear());
    current.setFullYear(current.getFullYear() + 1);
  }
  return Array.from(years);
}

// Caching im Service
private cache: Map<string, HolidayInfo[]> = new Map();
```

### 9.2 Working Days Calculation

```typescript
// Memoization für wiederholte Berechnungen
const workingDaysCache = new Map<string, number>();

function getCachedWorkingDays(start: string, end: string, config: WorkingDaysConfig): number {
  const key = `${start}-${end}-${JSON.stringify(config)}`;
  if (!workingDaysCache.has(key)) {
    workingDaysCache.set(key, calculateWorkingDays(new Date(start), new Date(end), config));
  }
  return workingDaysCache.get(key)!;
}

// Cache invalidieren bei Config-Änderung
function onWorkingDaysConfigChange() {
  workingDaysCache.clear();
}
```

---

## 10. Risiken & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| date-holidays Bundle-Größe | Mittel | Mittel | Custom build nur für benötigte Länder |
| Working Days Performance | Niedrig | Hoch | Caching, Web Worker für große Projekte |
| Komplexe Drag-Berechnung | Mittel | Hoch | Throttling, optimistische Updates |
| Inkonsistenz Date Format | Niedrig | Mittel | Zentrale formatDate() Utility |
| Holiday Data Accuracy | Niedrig | Niedrig | date-holidays ist gut gepflegt |

---

## 11. Abnahmekriterien

### 11.1 Definition of Done

- [x] User Preferences Dialog erweitert (Date Format, First Day, Holiday Region)
- [x] Project Settings Dialog implementiert (alle View-Optionen)
- [x] Holiday highlighting in Timeline
- [x] Holiday tooltips mit Namen
- [x] Toolbar Quick-Toggles (D) mit Keyboard Shortcuts (T, D, P, H)
- [x] Task Label Position (before/inside/after/none)
- [x] Progress Column ein/ausblendbar
- [ ] Working Days Mode funktional (PENDING)
- [x] Alle Settings persistent (localStorage / .ownchart)
- [x] File format migration getestet
- [x] Unit tests (>80% Coverage für neue Module) - 786 tests total, 120 new for Sprint 1.5.9
- [ ] E2E tests für kritische Flows
- [x] Accessibility: WCAG AA compliant
- [x] Documentation aktualisiert

### 11.2 Demo Checklist

1. **Preferences Dialog:**
   - Date format ändern → Alle Daten im neuen Format
   - First day of week ändern → Timeline-Header aktualisiert
   - Holiday region auf AT setzen → Österreichische Feiertage

2. **Chart Settings Dialog:**
   - Show Today Marker aus → Marker verschwindet
   - Show Dependencies aus → Pfeile verschwinden
   - Show Progress aus → Spalte weg, Tasks voll gefärbt
   - Task Label Position → Labels bewegen sich

3. **Toolbar Quick-Toggles:**
   - T klicken → Today Marker toggle
   - D klicken → Dependencies toggle
   - P klicken → Progress toggle
   - Keyboard shortcuts T, D, P funktionieren

4. **Working Days Mode:**
   - Aktivieren → Task über Weihnachten erstreckt sich weiter
   - Task verschieben → End-Datum passt sich an

5. **File Persistence:**
   - Projekt speichern → Settings in .ownchart
   - Projekt neu öffnen → Settings korrekt geladen
   - Anderer Browser/Tab → User Preferences erhalten

---

## 12. Appendix

### A. Holiday Region Codes (Beispiele)

| Code | Land/Region |
|------|-------------|
| AT | Österreich |
| AT-1 | Burgenland |
| AT-9 | Wien |
| DE | Deutschland |
| DE-BY | Bayern |
| DE-NW | Nordrhein-Westfalen |
| CH | Schweiz |
| CH-ZH | Zürich |
| US | United States |
| US-CA | California |
| GB | United Kingdom |

### B. Keyboard Shortcuts Summary

| Shortcut | Aktion |
|----------|--------|
| `T` | Toggle Today Marker |
| `D` | Toggle Dependencies |
| `P` | Toggle Progress Column |
| `Ctrl+,` | Open Preferences |
| `Ctrl+Shift+,` | Open Chart Settings |

### C. Related Documents

- [SETTINGS_ARCHITECTURE.md](../architecture/SETTINGS_ARCHITECTURE.md)
- [DATA_MODEL.md](../architecture/DATA_MODEL.md)
- [SPRINT_1.5.9.1_UI_DENSITY_CONCEPT.md](./SPRINT_1.5.9.1_UI_DENSITY_CONCEPT.md)
- [ROADMAP.md](../planning/ROADMAP.md)

### D. External Dependencies

| Package | Version | Zweck | Bundle Size |
|---------|---------|-------|-------------|
| date-holidays | ^3.x | Feiertags-Daten | ~500KB (full), ~50KB (custom) |

**Custom Build für reduzierte Bundle-Größe:**
```bash
# Nur ausgewählte Länder
npx holidays2json --pick AT,DE,CH,US,GB,FR,IT,ES --min
```

### E. Future Considerations (V1.2+)

1. **Custom Holidays**: User kann eigene Feiertage definieren
2. **Vacation System**: Team-Urlaube eintragen
3. **Resource Calendar**: Individuelle Arbeitszeiten pro Person
4. **Working Hours**: Halbtags-Feiertage (z.B. Heiligabend)

---

**Document Version:** 1.3
**Last Updated:** 2026-01-06
**Authors:** OwnChart Development Team
**Status:** 🔄 IN PROGRESS - Core Features Complete

**Changelog v1.3:**
- Updated status to reflect implementation progress
- Holiday Service implemented with date-holidays library (199 countries)
- Holiday region moved from User Preferences to Project Settings
- User Preferences: Date Format, First Day of Week, Week Numbering System
- Chart Settings Dialog with all view options
- Task Label Position (before/inside/after/none)
- Keyboard shortcuts (T, D, P, H) for view toggles
- Dependencies toggle in toolbar with FlowArrow icon
- Timeline header improvements: Calendar week visible at all zoom levels
- Comprehensive test coverage: 786 tests total, 120 new for Sprint 1.5.9
- Definition of Done updated with completion status
- Working Days Mode still pending

**Changelog v1.2:**
- Quick Toggle Entscheidung: Option A (nur Dependencies) mit flow-arrow Icon
- Toolbar-Design finalisiert (Sektion 3.5)

**Changelog v1.1:**
- Erweiterte Persona-Befragung zu Quick Toggles (Sektion 2.3)
- Team-Empfehlung: Option A (nur Dependencies) statt T/D/P
- Toolbar-Design aktualisiert mit allen Optionen (Sektion 3.5)
- Vacation-Feature in ROADMAP.md vermerkt für V1.2+
