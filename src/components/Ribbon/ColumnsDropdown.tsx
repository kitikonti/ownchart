/**
 * ColumnsDropdown - Dropdown for toggling visibility of date/duration columns.
 * Only columns marked as `hideable` in tableColumns config can be toggled.
 */

import { Columns } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { Checkbox } from "../common/Checkbox";
import { TOOLBAR } from "../../styles/design-tokens";
import { getHideableColumns } from "../../config/tableColumns";

const HIDEABLE_COLUMNS = getHideableColumns();

interface ColumnsDropdownProps {
  labelPriority?: number;
}

export function ColumnsDropdown({
  labelPriority,
}: ColumnsDropdownProps = {}): JSX.Element {
  const { isOpen, toggle, containerRef } = useDropdown();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const toggleColumnVisibility = useChartStore(
    (state) => state.toggleColumnVisibility
  );

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Columns size={TOOLBAR.iconSize} weight="light" />}
        label="Columns"
        aria-label="Column visibility"
        aria-haspopup="listbox"
        title="Show/Hide table columns"
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel width="220px">
          <div className="px-4 py-3 space-y-3">
            {HIDEABLE_COLUMNS.map((col) => {
              const isVisible = !hiddenColumns.includes(col.id);
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox
                    checked={isVisible}
                    onChange={() => toggleColumnVisibility(col.id)}
                    aria-label={`${isVisible ? "Hide" : "Show"} ${col.label}`}
                  />
                  <span className="text-sm text-neutral-700">{col.label}</span>
                </label>
              );
            })}
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
