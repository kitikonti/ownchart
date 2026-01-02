# Week Numbering System Configuration

## Current Implementation

**Standard**: ISO 8601 (European standard)
- **Week start**: Monday (`weekStartsOn: 1`)
- **Week 1 rule**: First week contains the first Thursday of the year (`firstWeekContainsDate: 4`)

**Location**: `src/utils/timelineUtils.ts`
```typescript
export const WEEK_START_DAY = 1; // Monday
export const FIRST_WEEK_CONTAINS_DATE = 4; // Thursday
```

## Common Week Numbering Systems

### 1. ISO 8601 (European/International) ✓ CURRENT
- **Week start**: Monday
- **Week 1**: First week with Thursday
- **Used in**: Europe, most of the world
- **Settings**: `weekStartsOn: 1, firstWeekContainsDate: 4`

### 2. US System
- **Week start**: Sunday
- **Week 1**: Week containing January 1st
- **Used in**: United States, Canada
- **Settings**: `weekStartsOn: 0, firstWeekContainsDate: 1`

### 3. Middle East System
- **Week start**: Saturday
- **Week 1**: Week containing January 1st
- **Used in**: Middle East countries
- **Settings**: `weekStartsOn: 6, firstWeekContainsDate: 1`

## Future Configuration

### User Settings (TODO)

Add to application settings:
```typescript
interface WeekSettings {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  firstWeekContainsDate: 1 | 4; // 1 = Jan 1st, 4 = First Thursday
}
```

### Implementation Steps

1. **Store Configuration**
   - Add `weekSettings` to Zustand chartSlice
   - Persist in localStorage

2. **Update Timeline Utils**
   - Replace constants with settings from store
   - Update `getWeek()`, `endOfWeek()`, `addWeeks()` calls

3. **Settings UI**
   - Add to settings panel/modal
   - Preset options: "European (ISO 8601)", "US", "Middle East"
   - Custom option for advanced users

4. **Affected Functions**
   - `getScaleConfig()` - Week number formatting
   - `getUnitEnd()` - Week end calculation
   - `generateScaleCells()` - Timeline header week cells

## References

- ISO 8601: https://en.wikipedia.org/wiki/ISO_week_date
- date-fns options: https://date-fns.org/docs/Options

## Notes

- Currently hardcoded to ISO 8601 (European standard)
- Most users in Europe expect Monday as week start
- Consider regional detection (browser locale) for smart defaults
- Important for project planning: Week numbers affect milestone dates
