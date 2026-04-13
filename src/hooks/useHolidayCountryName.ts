/**
 * Returns the display name for the currently selected holiday region.
 * Falls back to the raw region code when the code is not in the catalogue.
 */

import { useMemo } from "react";
import { useChartStore } from "@/store/slices/chartSlice";
import { holidayService } from "@/services/holidayService";

export function useHolidayCountryName(): string {
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  return useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    const country = countries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [holidayRegion]);
}
