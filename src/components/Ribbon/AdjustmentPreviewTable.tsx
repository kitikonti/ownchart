/**
 * Scrollable table showing task date adjustments for preview before applying.
 * Used by WorkingDaysRecalcDialog to show which tasks will move.
 */

import { useMemo } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { formatDate } from "@/utils/dateUtils";
import type { DateAdjustment } from "@/types/dependency.types";

interface AdjustmentPreviewTableProps {
  adjustments: DateAdjustment[];
}

export function AdjustmentPreviewTable({
  adjustments,
}: AdjustmentPreviewTableProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      map.set(t.id, t.name || "(unnamed)");
    }
    return map;
  }, [tasks]);

  const fmt = (d: string): string => formatDate(d, "MMM dd, yyyy");

  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0">
          <tr className="text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Task</th>
            <th className="px-3 py-1.5 font-medium">Start</th>
            <th className="px-3 py-1.5 font-medium">End</th>
          </tr>
        </thead>
        <tbody>
          {adjustments.map((adj) => (
            <tr key={adj.taskId} className="border-t border-slate-100">
              <td className="px-3 py-1.5 text-slate-700 truncate max-w-[160px]">
                {nameMap.get(adj.taskId) ?? adj.taskId}
              </td>
              <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                {adj.oldStartDate === adj.newStartDate ? (
                  fmt(adj.oldStartDate)
                ) : (
                  <>
                    <span className="line-through text-slate-400">
                      {fmt(adj.oldStartDate)}
                    </span>
                    {" \u2192 "}
                    {fmt(adj.newStartDate)}
                  </>
                )}
              </td>
              <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                {adj.oldEndDate === adj.newEndDate ? (
                  fmt(adj.oldEndDate)
                ) : (
                  <>
                    <span className="line-through text-slate-400">
                      {fmt(adj.oldEndDate)}
                    </span>
                    {" \u2192 "}
                    {fmt(adj.newEndDate)}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
