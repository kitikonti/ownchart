/**
 * HolidayRegionPopover - Searchable country dropdown for holiday region selection.
 * Triggered by gear icon next to Holidays toggle in View tab.
 */

import { useMemo } from "react";
import { Globe, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { Input } from "../common/Input";
import { useChartStore } from "../../store/slices/chartSlice";
import { holidayService } from "../../services/holidayService";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { TOOLBAR_TOKENS } from "../Toolbar/ToolbarPrimitives";
import { useState } from "react";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

/**
 * Popular countries to show at the top of the list
 */
const POPULAR_COUNTRIES = [
  "AT",
  "DE",
  "CH",
  "US",
  "GB",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
];

export function HolidayRegionPopover(): JSX.Element {
  const [countrySearch, setCountrySearch] = useState("");

  const { isOpen, toggle, close, containerRef } = useDropdown({
    onClose: () => setCountrySearch(""),
  });

  const holidayRegion = useChartStore((state) => state.holidayRegion);
  const setHolidayRegion = useChartStore((state) => state.setHolidayRegion);

  // Get all available countries
  const allCountries = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    return countries.sort((a, b) => {
      const aPopular = POPULAR_COUNTRIES.indexOf(a.code);
      const bPopular = POPULAR_COUNTRIES.indexOf(b.code);
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries;
    const search = countrySearch.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search)
    );
  }, [allCountries, countrySearch]);

  // Get current country name
  const currentCountryName = useMemo(() => {
    const country = allCountries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [allCountries, holidayRegion]);

  const handleCountrySelect = (code: string): void => {
    setHolidayRegion(code);
    close();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Gear icon trigger - custom (not DropdownTrigger) */}
      <button
        type="button"
        onClick={toggle}
        title={`Holiday Region: ${currentCountryName} (${holidayRegion})`}
        aria-label="Holiday Region settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`dropdown-trigger inline-flex items-center justify-center h-7 w-7 p-1 border-none rounded cursor-pointer text-neutral-700 transition-[background] duration-100`}
      >
        <Gear size={ICON_SIZE} weight="light" />
      </button>

      {/* Popover panel */}
      {isOpen && (
        <DropdownPanel align="right" width="320px">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-900">
                Holiday Region
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Current: {currentCountryName} ({holidayRegion})
            </p>
          </div>

          {/* Search input */}
          <div className="p-2 border-b border-neutral-200">
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                variant="figma"
                className="!pl-8 !pr-3 !py-1.5"
                /* eslint-disable-next-line jsx-a11y/no-autofocus -- intentional autofocus for search field in popover */
                autoFocus
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country.code)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                    country.code === holidayRegion
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-800"
                  }`}
                >
                  <span className="font-medium">{country.name}</span>
                  <span className="text-neutral-500">({country.code})</span>
                </button>
              ))
            )}
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
