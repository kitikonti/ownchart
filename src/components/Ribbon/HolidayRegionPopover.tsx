/**
 * HolidayRegionPopover - Searchable country dropdown for holiday region selection.
 * Triggered by gear icon next to Holidays toggle in View tab.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Globe, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { Input } from "@/components/common/Input";
import { useChartStore } from "@/store/slices/chartSlice";
import {
  holidayService,
  POPULAR_COUNTRY_CODES,
} from "@/services/holidayService";
import { useDropdown } from "@/hooks/useDropdown";
import { useWorkingDaysConfigChange } from "@/hooks/useWorkingDaysConfigChange";
import { useHolidayCountryName } from "@/hooks/useHolidayCountryName";
import { DropdownPanel } from "@/components/Toolbar/DropdownPanel";
import { WorkingDaysRecalcDialog } from "@/components/Ribbon/WorkingDaysRecalcDialog";
import { TOOLBAR } from "@/styles/design-tokens";

const ICON_SIZE = TOOLBAR.iconSize;

/** Sorted country list — computed once at module load (static data). */
const ALL_COUNTRIES = holidayService.getAvailableCountries().sort((a, b) => {
  const aPopular = POPULAR_COUNTRY_CODES.indexOf(a.code);
  const bPopular = POPULAR_COUNTRY_CODES.indexOf(b.code);
  if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
  if (aPopular !== -1) return -1;
  if (bPopular !== -1) return 1;
  return a.name.localeCompare(b.name);
});

export function HolidayRegionPopover(): JSX.Element {
  const [countrySearch, setCountrySearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown({
    onClose: () => {
      setCountrySearch("");
      setActiveIndex(-1);
    },
  });

  const {
    proposeHolidayRegionChange,
    draftConfig,
    updateDraftConfig,
    isDialogOpen,
    previewResult,
    selectedMode,
    setSelectedMode,
    isAutoSchedulingOff,
    taskCount,
    computePreview,
    applyChange,
    cancelChange,
  } = useWorkingDaysConfigChange();

  const holidayRegion = useChartStore((state) => state.holidayRegion);
  const currentCountryName = useHolidayCountryName();

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return ALL_COUNTRIES;
    const search = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  const handleCountrySelect = useCallback(
    (code: string): void => {
      proposeHolidayRegionChange(code);
      close(true);
    },
    [proposeHolidayRegionChange, close]
  );

  /** Scroll the active option into view */
  const scrollActiveIntoView = useCallback((index: number): void => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll<HTMLElement>("[role='option']");
    items[index]?.scrollIntoView({ block: "nearest" });
  }, []);

  /** Keyboard navigation for the listbox */
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const count = filteredCountries.length;
      if (count === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = activeIndex < count - 1 ? activeIndex + 1 : 0;
          setActiveIndex(next);
          scrollActiveIntoView(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = activeIndex > 0 ? activeIndex - 1 : count - 1;
          setActiveIndex(prev);
          scrollActiveIntoView(prev);
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < count) {
            handleCountrySelect(filteredCountries[activeIndex].code);
          }
          break;
        }
        case "Home": {
          e.preventDefault();
          setActiveIndex(0);
          scrollActiveIntoView(0);
          break;
        }
        case "End": {
          e.preventDefault();
          setActiveIndex(count - 1);
          scrollActiveIntoView(count - 1);
          break;
        }
      }
    },
    [filteredCountries, activeIndex, handleCountrySelect, scrollActiveIntoView]
  );

  const activeId =
    activeIndex >= 0 && activeIndex < filteredCountries.length
      ? `holiday-option-${filteredCountries[activeIndex].code}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      {/* Gear icon trigger - custom (not DropdownTrigger) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        title={`Holiday Region: ${currentCountryName} (${holidayRegion})`}
        aria-label="Holiday Region settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="dropdown-trigger inline-flex items-center justify-center h-7 w-7 p-1 border-none rounded cursor-pointer text-slate-700 transition-[background] duration-100"
      >
        <Gear size={ICON_SIZE} weight="light" />
      </button>

      {/* Popover panel */}
      {isOpen && (
        <DropdownPanel align="right" width="320px">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-300">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">
                Holiday Region
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Current: {currentCountryName} ({holidayRegion})
            </p>
          </div>

          {/* Search input */}
          <div className="p-2 border-b border-slate-300">
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleListKeyDown}
                placeholder="Search countries..."
                variant="figma"
                className="!pl-8 !pr-3 !py-1.5"
                role="combobox"
                aria-expanded={true}
                aria-controls="holiday-region-listbox"
                aria-activedescendant={activeId}
                /* eslint-disable-next-line jsx-a11y/no-autofocus -- intentional autofocus for search field in popover */
                autoFocus
              />
            </div>
          </div>

          {/* Country list */}
          <div
            ref={listRef}
            id="holiday-region-listbox"
            className="max-h-56 overflow-y-auto scrollbar-thin"
            role="listbox"
            aria-label="Holiday region"
          >
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country, index) => {
                const isSelected = country.code === holidayRegion;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={country.code}
                    id={`holiday-option-${country.code}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      isSelected
                        ? "bg-slate-100 text-slate-900"
                        : isActive
                          ? "bg-slate-50 text-slate-900"
                          : "text-slate-800"
                    }`}
                  >
                    <span className="font-medium">{country.name}</span>
                    <span className="text-slate-500">({country.code})</span>
                  </button>
                );
              })
            )}
          </div>
        </DropdownPanel>
      )}

      {draftConfig && (
        <WorkingDaysRecalcDialog
          isOpen={isDialogOpen}
          onClose={cancelChange}
          onApply={applyChange}
          onPreview={computePreview}
          draftConfig={draftConfig}
          onDraftConfigChange={updateDraftConfig}
          holidayCountryName={currentCountryName}
          previewResult={previewResult}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          isAutoSchedulingOff={isAutoSchedulingOff}
          taskCount={taskCount}
        />
      )}
    </div>
  );
}
